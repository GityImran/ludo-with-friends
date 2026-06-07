import { create } from "zustand";
import { Player, PlayerColor, Piece } from "@/game/types";
import { createPlayers } from "@/game/engine";
import { rollDice, getValidMoves } from "@/game/rules";
import { getPieceCoordinate } from "@/game/helpers";
import { START_INDEX, SAFE_CELLS } from "@/game/constants";
import confetti from "canvas-confetti";

export interface ConnectedPlayer {
  id: string;
  color: PlayerColor;
  isOwner: boolean;
}

interface GameState {
  // Game state
  players: Player[];
  currentTurn: PlayerColor;
  diceValue: number;
  diceState: "idle" | "rolling" | "rolled";
  gameMode: "menu" | "local" | "friends" | "online";
  winner: PlayerColor | null;
  rollCount: number; // consecutive 6s
  history: string[];
  gameStarted: boolean;
  isMovingPiece: boolean; // Locks controls during step-by-step animations

  // Multiplayer fields
  roomCode: string | null;
  myColor: PlayerColor | null; // Null in local play
  myId: string | null;
  roomOwnerId: string | null;
  connectedPlayers: ConnectedPlayer[]; // Connected players list in multiplayer
  onlineQueueState: "idle" | "searching" | "matched";

  // Actions
  initGame: (mode: "local" | "friends" | "online") => void;
  connectRoom: (code: string) => Promise<void>;
  createFriendRoom: () => Promise<void>;
  joinFriendRoom: (code: string) => Promise<void>;
  chooseColor: (color: PlayerColor) => void;
  startGame: () => void;
  roll: (forcedValue?: number) => void;
  movePiece: (pieceId: string, isRemote?: boolean) => Promise<void>;
  resetGame: () => void;
  disconnectSocket: () => void; // Keeps compatibility with existing interfaces
  addLog: (log: string) => void;
}

// Module-level variables for PeerJS connection state (non-serializable state)
let peerInstance: any = null;
let clientConnections: { color: PlayerColor; conn: any; peerId: string }[] = [];
let hostConnection: any = null;

function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getNextActiveTurn(
  current: PlayerColor,
  gameMode: string,
  connectedPlayers: ConnectedPlayer[]
): PlayerColor {
  if (gameMode === "local") {
    const order: PlayerColor[] = ["red", "green", "yellow", "blue"];
    const index = order.indexOf(current);
    return order[(index + 1) % 4];
  }

  // Filter standard order to only active colors in the lobby
  const activeColors = ["red", "green", "yellow", "blue"].filter((color) =>
    connectedPlayers.some((p) => p.color === color)
  ) as PlayerColor[];

  if (activeColors.length === 0) {
    return current;
  }

  const index = activeColors.indexOf(current);
  if (index === -1) {
    return activeColors[0];
  }
  return activeColors[(index + 1) % activeColors.length];
}

export const useGameStore = create<GameState>((set, get) => {
  return {
    players: createPlayers(),
    currentTurn: "red",
    diceValue: 1,
    diceState: "idle",
    gameMode: "menu",
    winner: null,
    rollCount: 0,
    history: ["Welcome to Ludo!"],
    gameStarted: false,
    isMovingPiece: false,

    roomCode: null,
    myColor: null,
    myId: null,
    roomOwnerId: null,
    connectedPlayers: [],
    onlineQueueState: "idle",

    addLog: (log: string) => {
      set((state) => ({ history: [...state.history.slice(-30), log] }));
    },

    disconnectSocket: () => {
      if (peerInstance) {
        try {
          peerInstance.destroy();
        } catch (e) {
          console.error(e);
        }
        peerInstance = null;
      }
      clientConnections.forEach((c) => {
        try {
          c.conn.close();
        } catch (e) {}
      });
      clientConnections = [];
      if (hostConnection) {
        try {
          hostConnection.close();
        } catch (e) {}
        hostConnection = null;
      }
      set({
        roomCode: null,
        myColor: null,
        myId: null,
        roomOwnerId: null,
        connectedPlayers: [],
      });
    },

    initGame: (mode) => {
      get().disconnectSocket();

      if (mode === "local") {
        set({
          gameMode: "local",
          players: createPlayers(),
          currentTurn: "red",
          diceValue: 1,
          diceState: "idle",
          winner: null,
          rollCount: 0,
          gameStarted: true,
          isMovingPiece: false,
          history: ["Local game started!"],
        });
      } else {
        set({
          gameMode: "friends",
          players: createPlayers(),
          winner: null,
          isMovingPiece: false,
          history: ["Select host or enter room code to connect."],
        });
      }
    },

    createFriendRoom: async () => {
      const code = generateRoomCode();
      sessionStorage.setItem(`host-room-${code}`, "true");
      set({ roomCode: code });
    },

    joinFriendRoom: async (code) => {
      const formattedCode = code.toUpperCase().trim();
      sessionStorage.setItem(`host-room-${formattedCode}`, "false");
      set({ roomCode: formattedCode });
    },

    connectRoom: async (code) => {
      const formattedCode = code.toUpperCase().trim();
      const isHost = sessionStorage.getItem(`host-room-${formattedCode}`) === "true";

      get().disconnectSocket();

      const { Peer } = await import("peerjs");

      if (isHost) {
        // Owner/Host connection listener
        const peer = new Peer(formattedCode);
        peerInstance = peer;

        peer.on("open", (id) => {
          set({
            gameMode: "friends",
            roomCode: formattedCode,
            myColor: "red",
            myId: id,
            roomOwnerId: id,
            connectedPlayers: [{ id, color: "red", isOwner: true }],
            gameStarted: false,
          });
          get().addLog(`Lobby created! Room Code: ${formattedCode}`);
        });

        peer.on("connection", (conn) => {
          conn.on("open", () => {
            conn.on("data", (data: any) => {
              if (data.type === "join") {
                const peerId = data.peerId;
                const currentPlayers = get().connectedPlayers;

                // Assign first available color
                const takenColors = currentPlayers.map((p) => p.color);
                const availableColor = (["red", "green", "yellow", "blue"] as PlayerColor[]).find(
                  (c) => !takenColors.includes(c)
                );

                if (!availableColor || currentPlayers.length >= 4) {
                  conn.send({ type: "error", message: "Room is full." });
                  conn.close();
                  return;
                }

                clientConnections.push({ color: availableColor, conn, peerId });

                const newPlayersList = [
                  ...currentPlayers,
                  { id: peerId, color: availableColor, isOwner: false },
                ];

                set({ connectedPlayers: newPlayersList });

                // Welcome client & sync list
                conn.send({
                  type: "welcome",
                  color: availableColor,
                  players: newPlayersList,
                  ownerId: peer.id,
                });

                // Broadcast new list to all other clients
                clientConnections.forEach((client) => {
                  if (client.peerId !== peerId) {
                    client.conn.send({
                      type: "player-list-update",
                      players: newPlayersList,
                      ownerId: peer.id,
                    });
                  }
                });

                get().addLog(`Player joined lobby as ${availableColor.toUpperCase()}`);
              } else if (data.type === "choose-color") {
                const isTaken = get().connectedPlayers.some((p) => p.color === data.color);
                if (isTaken) return;

                const newPlayers = get().connectedPlayers.map((p) =>
                  p.id === conn.peer ? { ...p, color: data.color } : p
                );

                const assoc = clientConnections.find((c) => c.peerId === conn.peer);
                if (assoc) assoc.color = data.color;

                set({ connectedPlayers: newPlayers });

                // Broadcast updated player list
                clientConnections.forEach((client) => {
                  client.conn.send({
                    type: "player-list-update",
                    players: newPlayers,
                    ownerId: peer.id,
                  });
                });
              } else if (data.type === "roll") {
                get().roll(data.value);
                // Broadcast to other clients
                clientConnections.forEach((client) => {
                  if (client.peerId !== conn.peer) {
                    client.conn.send({ type: "roll", value: data.value });
                  }
                });
              } else if (data.type === "move") {
                get().movePiece(data.pieceId, true);
                // Broadcast to other clients
                clientConnections.forEach((client) => {
                  if (client.peerId !== conn.peer) {
                    client.conn.send({ type: "move", pieceId: data.pieceId });
                  }
                });
              }
            });

            conn.on("close", () => {
              const remainingPlayers = get().connectedPlayers.filter((p) => p.id !== conn.peer);
              clientConnections = clientConnections.filter((c) => c.peerId !== conn.peer);
              set({ connectedPlayers: remainingPlayers });

              // Broadcast new list to remaining clients
              clientConnections.forEach((client) => {
                client.conn.send({
                  type: "player-list-update",
                  players: remainingPlayers,
                  ownerId: peer.id,
                });
              });
              get().addLog("A player disconnected.");
            });
          });
        });

        peer.on("error", (err) => {
          get().addLog(`[Error] Lobby initialization failed: ${err.message}`);
        });
      } else {
        // Guest/Client connection setup
        const peer = new Peer();
        peerInstance = peer;

        peer.on("open", (id) => {
          const conn = peer.connect(formattedCode);
          hostConnection = conn;

          conn.on("open", () => {
            conn.send({ type: "join", peerId: id });
          });

          conn.on("data", (data: any) => {
            if (data.type === "welcome") {
              set({
                gameMode: "friends",
                roomCode: formattedCode,
                myColor: data.color,
                myId: id,
                roomOwnerId: data.ownerId,
                connectedPlayers: data.players,
                gameStarted: false,
              });
              get().addLog(`Connected to room ${formattedCode} as ${data.color.toUpperCase()}`);
            } else if (data.type === "player-list-update") {
              set({
                connectedPlayers: data.players,
                roomOwnerId: data.ownerId,
              });
            } else if (data.type === "game-start") {
              set({
                gameStarted: true,
                players: createPlayers(),
                currentTurn: data.startingTurn,
                winner: null,
              });
              get().addLog(`Game started! Starting turn: ${data.startingTurn.toUpperCase()}`);
            } else if (data.type === "roll") {
              get().roll(data.value);
            } else if (data.type === "move") {
              get().movePiece(data.pieceId, true);
            } else if (data.type === "error") {
              get().addLog(`[Error] Connection rejected: ${data.message}`);
            }
          });

          conn.on("close", () => {
            get().addLog("Lobby connection closed.");
            get().resetGame();
          });
        });

        peer.on("error", (err) => {
          get().addLog(`[Error] Connection failed: ${err.message}`);
        });
      }
    },

    chooseColor: (color) => {
      const { gameMode, connectedPlayers, myId } = get();

      if (gameMode !== "local" && !hostConnection) {
        // Host locally updates and broadcasts
        const isTaken = connectedPlayers.some((p) => p.color === color);
        if (isTaken) return;

        const newPlayers = connectedPlayers.map((p) => (p.id === myId ? { ...p, color } : p));
        set({ connectedPlayers: newPlayers, myColor: color });

        clientConnections.forEach((client) => {
          client.conn.send({ type: "player-list-update", players: newPlayers, ownerId: myId });
        });
      } else if (hostConnection) {
        // Client requests color change from host
        hostConnection.send({ type: "choose-color", color });
      }
    },

    startGame: () => {
      const { gameMode, connectedPlayers, myId } = get();
      if (gameMode !== "local" && !hostConnection) {
        const activeColors = ["red", "green", "yellow", "blue"].filter((color) =>
          connectedPlayers.some((p) => p.color === color)
        ) as PlayerColor[];
        const startingTurn = activeColors.length > 0 ? activeColors[0] : "red";

        set({
          gameStarted: true,
          players: createPlayers(),
          currentTurn: startingTurn,
          winner: null,
        });
        get().addLog(`Game started! Starting turn: ${startingTurn.toUpperCase()}`);

        clientConnections.forEach((client) => {
          client.conn.send({ type: "game-start", startingTurn });
        });
      }
    },

    roll: (forcedValue) => {
      const { diceState, currentTurn, myColor, gameMode, isMovingPiece, connectedPlayers } = get();

      if (diceState !== "idle" || isMovingPiece) return;

      if (gameMode !== "local" && myColor !== currentTurn && forcedValue === undefined) {
        return;
      }

      set({ diceState: "rolling" });

      setTimeout(() => {
        const playerObj = get().players.find((p) => p.color === currentTurn);
        const hasPiecesOnBoard = playerObj?.pieces.some((p) => p.position >= 0 && !p.finished);
        const needsSix = !hasPiecesOnBoard;

        const value = forcedValue !== undefined ? forcedValue : rollDice(needsSix);

        // Broadcast if local roll
        if (gameMode !== "local" && forcedValue === undefined) {
          if (hostConnection) {
            hostConnection.send({ type: "roll", value });
          } else {
            clientConnections.forEach((client) => {
              client.conn.send({ type: "roll", value });
            });
          }
        }

        set({
          diceValue: value,
          diceState: "rolled",
        });

        get().addLog(`${currentTurn.toUpperCase()} rolled a ${value}`);

        let nextRollCount = 0;
        if (value === 6) {
          nextRollCount = get().rollCount + 1;
          set({ rollCount: nextRollCount });
          if (nextRollCount === 3) {
            get().addLog(`${currentTurn.toUpperCase()} rolled three 6s in a row! Turn skipped.`);
            set({
              rollCount: 0,
              currentTurn: getNextActiveTurn(currentTurn, gameMode, connectedPlayers),
              diceState: "idle",
            });
            return;
          }
        } else {
          set({ rollCount: 0 });
        }

        const validMoves = getValidMoves(get().players, currentTurn, value);

        if (validMoves.length === 0) {
          get().addLog(`${currentTurn.toUpperCase()} has no valid moves.`);
          setTimeout(() => {
            set({
              currentTurn: getNextActiveTurn(currentTurn, gameMode, connectedPlayers),
              diceState: "idle",
              rollCount: 0,
            });
          }, 1500);
        }
      }, 600);
    },

    movePiece: async (pieceId, isRemote = false) => {
      const {
        players,
        currentTurn,
        diceValue,
        diceState,
        myColor,
        gameMode,
        isMovingPiece,
        connectedPlayers,
      } = get();

      if (diceState !== "rolled" || isMovingPiece) return;

      if (gameMode !== "local" && myColor !== currentTurn && !isRemote) {
        return;
      }

      const activePlayer = players.find((p) => p.color === currentTurn);
      const piece = activePlayer?.pieces.find((p) => p.id === pieceId);
      if (!piece || piece.finished) return;

      const validMoves = getValidMoves(players, currentTurn, diceValue);
      if (!validMoves.includes(pieceId)) return;

      // Broadcast move if initiated locally
      if (gameMode !== "local" && !isRemote) {
        if (hostConnection) {
          hostConnection.send({ type: "move", pieceId });
        } else {
          clientConnections.forEach((client) => {
            client.conn.send({ type: "move", pieceId });
          });
        }
      }

      set({ isMovingPiece: true });

      const startPos = piece.position;
      const targetPos = startPos === -1 ? 0 : startPos + diceValue;

      const steps: number[] = [];
      if (startPos === -1) {
        steps.push(0);
      } else {
        for (let pos = startPos + 1; pos <= targetPos; pos++) {
          steps.push(pos);
        }
      }

      for (const stepPos of steps) {
        await new Promise((resolve) => setTimeout(resolve, 200));

        set((state) => ({
          players: state.players.map((player) => {
            if (player.color === currentTurn) {
              return {
                ...player,
                pieces: player.pieces.map((p) => {
                  if (p.id === pieceId) {
                    return {
                      ...p,
                      position: stepPos,
                      finished: stepPos === 56,
                    };
                  }
                  return p;
                }),
              };
            }
            return player;
          }),
        }));
      }

      let landedOnFinish = targetPos === 56;
      let hasCaptured = false;

      const midMovePlayers = get().players;

      const finalPlayers = midMovePlayers.map((player) => {
        if (player.color === currentTurn) return player;

        const updatedPieces = player.pieces.map((p) => {
          if (targetPos < 0 || targetPos > 50 || p.position < 0 || p.position > 50) {
            return p;
          }

          const activeStartIndex = START_INDEX[currentTurn];
          const activeGlobalIndex = (activeStartIndex + targetPos) % 52;

          const oppStartIndex = START_INDEX[player.color];
          const oppGlobalIndex = (oppStartIndex + p.position) % 52;

          const isSafeCell = SAFE_CELLS.includes(activeGlobalIndex);

          if (!isSafeCell && activeGlobalIndex === oppGlobalIndex) {
            hasCaptured = true;
            get().addLog(
              `${currentTurn.toUpperCase()} captured ${player.color.toUpperCase()}'s piece!`
            );
            return { ...p, position: -1, finished: false };
          }
          return p;
        });

        return { ...player, pieces: updatedPieces };
      });

      set({ players: finalPlayers });

      const movingPlayer = finalPlayers.find((p) => p.color === currentTurn)!;
      const didWin = movingPlayer.pieces.every((p) => p.finished);

      if (didWin) {
        set({
          winner: currentTurn,
          diceState: "idle",
          isMovingPiece: false,
        });
        get().addLog(`${currentTurn.toUpperCase()} won the Ludo Game!`);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });
        return;
      }

      const getsExtraRoll = diceValue === 6 || hasCaptured || landedOnFinish;

      set({
        diceState: "idle",
        rollCount: getsExtraRoll && diceValue === 6 ? get().rollCount : 0,
        currentTurn: getsExtraRoll ? currentTurn : getNextActiveTurn(currentTurn, gameMode, connectedPlayers),
        isMovingPiece: false,
      });
    },

    resetGame: () => {
      get().disconnectSocket();
      set({
        players: createPlayers(),
        currentTurn: "red",
        diceValue: 1,
        diceState: "idle",
        gameMode: "menu",
        winner: null,
        rollCount: 0,
        gameStarted: false,
        isMovingPiece: false,
        roomCode: null,
        myColor: null,
        myId: null,
        roomOwnerId: null,
        connectedPlayers: [],
        onlineQueueState: "idle",
        history: ["Welcome to Ludo!"],
      });
    },
  };
});
