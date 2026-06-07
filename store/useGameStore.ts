import { create } from "zustand";
import { Player, PlayerColor, Piece } from "@/game/types";
import { createPlayers } from "@/game/engine";
import { rollDice, getValidMoves } from "@/game/rules";
import { nextTurn, getPieceCoordinate } from "@/game/helpers";
import { START_INDEX, SAFE_CELLS } from "@/game/constants";
import { io, Socket } from "socket.io-client";
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
  socket: Socket | null;
  roomCode: string | null;
  myColor: PlayerColor | null; // Null in local play
  myId: string | null;
  roomOwnerId: string | null;
  connectedPlayers: ConnectedPlayer[]; // Connected players list in multiplayer
  onlineQueueState: "idle" | "searching" | "matched";

  // Actions
  initGame: (mode: "local" | "friends" | "online") => void;
  joinFriendRoom: (code: string) => void;
  createFriendRoom: () => void;
  startMatchmaking: () => void;
  cancelMatchmaking: () => void;
  chooseColor: (color: PlayerColor) => void;
  startGame: () => void;
  roll: (forcedValue?: number) => void;
  movePiece: (pieceId: string, isRemote?: boolean) => Promise<void>;
  resetGame: () => void;
  disconnectSocket: () => void;
  addLog: (log: string) => void;
}

const SOCKET_SERVER_URL = "http://localhost:3001";

export const useGameStore = create<GameState>((set, get) => {
  // Setup socket listener
  const setupSocketListeners = (socket: Socket) => {
    socket.on("room-details", ({ roomCode, players: activePlayers, color, myId, ownerId }) => {
      set({
        roomCode,
        myColor: color,
        myId,
        roomOwnerId: ownerId,
        connectedPlayers: activePlayers,
        gameStarted: false, // Wait for manual start in private lobbies
      });
      get().addLog(`Joined room ${roomCode} as ${color}`);
    });

    socket.on("player-list-update", ({ players, ownerId }) => {
      // Find own updated color
      const { socket: currentSocket } = get();
      const me = players.find((p: any) => p.id === currentSocket?.id);
      
      set({
        connectedPlayers: players,
        roomOwnerId: ownerId || get().roomOwnerId,
        myColor: me ? me.color : get().myColor,
      });
    });

    socket.on("game-start", () => {
      set({
        gameStarted: true,
        players: createPlayers(),
        currentTurn: "red",
        winner: null,
      });
      get().addLog("Game started!");
    });

    socket.on("opponent-roll", ({ value }) => {
      get().roll(value);
    });

    socket.on("opponent-move", ({ pieceId }) => {
      get().movePiece(pieceId, true);
    });

    socket.on("matchmaking-success", ({ roomCode }) => {
      set({ onlineQueueState: "matched" });
      socket.emit("join-room", { roomCode });
    });

    socket.on("error", ({ message }) => {
      get().addLog(`[Error] ${message}`);
    });
  };

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

    socket: null,
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
      const { socket } = get();
      if (socket) {
        socket.disconnect();
        set({
          socket: null,
          roomCode: null,
          myColor: null,
          myId: null,
          roomOwnerId: null,
          connectedPlayers: [],
        });
      }
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
        // Online or Friends mode setup
        const socket = io(SOCKET_SERVER_URL);
        set({
          gameMode: mode,
          socket,
          players: createPlayers(),
          winner: null,
          isMovingPiece: false,
          history: [`Connecting to multiplayer server...`],
        });
        setupSocketListeners(socket);
      }
    },

    createFriendRoom: () => {
      const { socket } = get();
      if (socket) {
        socket.emit("create-room");
      }
    },

    joinFriendRoom: (code) => {
      const { socket } = get();
      if (socket) {
        socket.emit("join-room", { roomCode: code.toUpperCase() });
      }
    },

    startMatchmaking: () => {
      const { socket } = get();
      if (socket) {
        set({ onlineQueueState: "searching" });
        socket.emit("join-queue");
        get().addLog("Searching for matchmaking players...");
      }
    },

    cancelMatchmaking: () => {
      const { socket } = get();
      if (socket) {
        socket.emit("leave-queue");
        set({ onlineQueueState: "idle" });
        get().addLog("Matchmaking queue cancelled.");
      }
    },

    chooseColor: (color) => {
      const { socket, roomCode } = get();
      if (socket && roomCode) {
        socket.emit("choose-color", { roomCode, color });
      }
    },

    startGame: () => {
      const { socket, roomCode } = get();
      if (socket && roomCode) {
        socket.emit("start-game", { roomCode });
      }
    },

    roll: (forcedValue) => {
      const { diceState, currentTurn, myColor, gameMode, socket, roomCode, players, isMovingPiece } = get();

      // Ensure game is started, and dice is idle, and no piece is moving
      if (diceState !== "idle" || isMovingPiece) return;

      // In online/friends mode, only the turn player can roll
      if (gameMode !== "local" && myColor !== currentTurn && forcedValue === undefined) {
        return;
      }

      set({ diceState: "rolling" });

      // Simulate dice animation duration
      setTimeout(() => {
        // Check if the current player needs a 6 to start moving (no active pieces currently on the board)
        const playerObj = players.find((p) => p.color === currentTurn);
        const hasPiecesOnBoard = playerObj?.pieces.some((p) => p.position >= 0 && !p.finished);
        const needsSix = !hasPiecesOnBoard;

        const value = forcedValue !== undefined ? forcedValue : rollDice(needsSix);

        // If it's a local roll in multiplayer, broadcast it
        if (gameMode !== "local" && forcedValue === undefined && socket && roomCode) {
          socket.emit("roll", { roomCode, value });
        }

        set({
          diceValue: value,
          diceState: "rolled",
        });

        get().addLog(`${currentTurn.toUpperCase()} rolled a ${value}`);

        // Handle consecutive 6s skip turn
        let nextRollCount = 0;
        if (value === 6) {
          nextRollCount = get().rollCount + 1;
          set({ rollCount: nextRollCount });
          if (nextRollCount === 3) {
            get().addLog(`${currentTurn.toUpperCase()} rolled three 6s in a row! Turn skipped.`);
            set({
              rollCount: 0,
              currentTurn: nextTurn(currentTurn),
              diceState: "idle",
            });
            return;
          }
        } else {
          set({ rollCount: 0 });
        }

        // Check valid moves
        const validMoves = getValidMoves(players, currentTurn, value);

        if (validMoves.length === 0) {
          get().addLog(`${currentTurn.toUpperCase()} has no valid moves.`);
          // Delay auto turn pass so player can see the roll
          setTimeout(() => {
            set({
              currentTurn: nextTurn(currentTurn),
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
        socket,
        roomCode,
        isMovingPiece,
      } = get();

      // Validation checks
      if (diceState !== "rolled" || isMovingPiece) return;

      // Check client's turn in multiplayer
      if (gameMode !== "local" && myColor !== currentTurn && !isRemote) {
        return;
      }

      // Confirm piece belongs to current player
      const activePlayer = players.find((p) => p.color === currentTurn);
      const piece = activePlayer?.pieces.find((p) => p.id === pieceId);
      if (!piece || piece.finished) return;

      // Verify the move is valid
      const validMoves = getValidMoves(players, currentTurn, diceValue);
      if (!validMoves.includes(pieceId)) return;

      // If it's a local move in multiplayer, broadcast it
      if (gameMode !== "local" && !isRemote && socket && roomCode) {
        socket.emit("move", { roomCode, pieceId });
      }

      // Lock controls for step-by-step transition
      set({ isMovingPiece: true });

      // Determine step sequence
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

      // Step-by-step position incrementing
      for (const stepPos of steps) {
        // Wait 200ms per step
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

      // Movement finished, run landing effects
      let landedOnFinish = targetPos === 56;
      let hasCaptured = false;

      // Fetch the latest state of players after walking completed
      const midMovePlayers = get().players;

      // Capture checks on final position (only outer track positions 0..50)
      const finalPlayers = midMovePlayers.map((player) => {
        if (player.color === currentTurn) return player; // Cannot capture own piece

        const updatedPieces = player.pieces.map((p) => {
          // Both pieces must be on the outer track (0..50) to allow capturing
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
            return { ...p, position: -1, finished: false }; // Send opponent home
          }
          return p;
        });

        return { ...player, pieces: updatedPieces };
      });

      // Update state with final players (captures applied)
      set({ players: finalPlayers });

      // Check win condition
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

      // Determine next turn: roll again if 6, captured enemy, or landed on finish
      const getsExtraRoll = diceValue === 6 || hasCaptured || landedOnFinish;

      set({
        diceState: "idle",
        rollCount: getsExtraRoll && diceValue === 6 ? get().rollCount : 0,
        currentTurn: getsExtraRoll ? currentTurn : nextTurn(currentTurn),
        isMovingPiece: false, // Unlock controls
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
