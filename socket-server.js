const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3001;

// Room mapping: roomCode -> { code, players: [{ id, color }], ownerId, isMatchmaking }
const rooms = new Map();
// Global matchmaking queue: [socketId]
let matchmakingQueue = [];

function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const COLORS = ["red", "green", "yellow", "blue"];

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // 1. Create Room
  socket.on("create-room", () => {
    const roomCode = generateRoomCode();
    rooms.set(roomCode, {
      code: roomCode,
      players: [{ id: socket.id, color: "red" }],
      ownerId: socket.id,
      isMatchmaking: false,
    });

    socket.join(roomCode);
    
    const playersList = [{ id: socket.id, color: "red", isOwner: true }];
    socket.emit("room-details", {
      roomCode,
      players: playersList,
      color: "red",
      myId: socket.id,
      ownerId: socket.id,
    });

    console.log(`Room created: ${roomCode} by socket ${socket.id}`);
  });

  // 2. Join Room
  socket.on("join-room", ({ roomCode }) => {
    const code = roomCode.toUpperCase();
    const room = rooms.get(code);

    if (!room) {
      socket.emit("error", { message: "Room not found." });
      return;
    }

    if (room.players.length >= 4) {
      socket.emit("error", { message: "Room is full." });
      return;
    }

    // Assign first available color
    const takenColors = room.players.map((p) => p.color);
    const availableColor = COLORS.find((c) => !takenColors.includes(c));

    room.players.push({ id: socket.id, color: availableColor });
    socket.join(code);

    const playersList = room.players.map((p) => ({
      id: p.id,
      color: p.color,
      isOwner: p.id === room.ownerId,
    }));

    // Notify joining socket
    socket.emit("room-details", {
      roomCode: code,
      players: playersList,
      color: availableColor,
      myId: socket.id,
      ownerId: room.ownerId,
    });

    // Notify other players in the room
    socket.to(code).emit("player-list-update", {
      players: playersList,
    });

    console.log(`Socket ${socket.id} joined room ${code} as ${availableColor}`);

    // If matchmaking and 2 players, auto start game
    if (room.isMatchmaking && room.players.length >= 2) {
      io.to(code).emit("game-start");
      console.log(`Matchmaking game started in room ${code}`);
    }
  });

  // 3. Choose Color (first-come, first-served)
  socket.on("choose-color", ({ roomCode, color }) => {
    const code = roomCode.toUpperCase();
    const room = rooms.get(code);
    if (!room) return;

    // Verify color is not already taken
    const isTaken = room.players.some((p) => p.color === color);
    if (isTaken) {
      socket.emit("error", { message: `Color ${color} is already taken.` });
      return;
    }

    // Find player and update color
    const player = room.players.find((p) => p.id === socket.id);
    if (player) {
      const oldColor = player.color;
      player.color = color;
      console.log(`Socket ${socket.id} in room ${code} changed color from ${oldColor} to ${color}`);

      const playersList = room.players.map((p) => ({
        id: p.id,
        color: p.color,
        isOwner: p.id === room.ownerId,
      }));

      // Broadcast update to all players in the room
      io.to(code).emit("player-list-update", {
        players: playersList,
      });
    }
  });

  // 4. Start Game (Owner Only, >= 2 players)
  socket.on("start-game", ({ roomCode }) => {
    const code = roomCode.toUpperCase();
    const room = rooms.get(code);
    if (!room) return;

    if (room.ownerId !== socket.id) {
      socket.emit("error", { message: "Only the room owner can start the game." });
      return;
    }

    if (room.players.length < 2) {
      socket.emit("error", { message: "Cannot start game with only 1 player." });
      return;
    }

    console.log(`Owner ${socket.id} started game in room ${code}`);
    io.to(code).emit("game-start");
  });

  // 5. Roll Dice Broadcast
  socket.on("roll", ({ roomCode, value }) => {
    const code = roomCode.toUpperCase();
    socket.to(code).emit("opponent-roll", { value });
  });

  // 6. Move Piece Broadcast
  socket.on("move", ({ roomCode, pieceId }) => {
    const code = roomCode.toUpperCase();
    socket.to(code).emit("opponent-move", { pieceId });
  });

  // 7. Matchmaking Queue Join
  socket.on("join-queue", () => {
    // Prevent duplicate entries
    if (!matchmakingQueue.includes(socket.id)) {
      matchmakingQueue.push(socket.id);
      console.log(`Socket added to matchmaking queue: ${socket.id}. Queue size: ${matchmakingQueue.length}`);
    }

    // Matchmaking threshold: 2 players
    if (matchmakingQueue.length >= 2) {
      const p1 = matchmakingQueue.shift();
      const p2 = matchmakingQueue.shift();

      const roomCode = generateRoomCode();
      rooms.set(roomCode, {
        code: roomCode,
        players: [], // Will populate during join-room emits
        ownerId: null,
        isMatchmaking: true,
      });

      console.log(`Matchmaking match found! Creating room ${roomCode} for ${p1} and ${p2}`);

      io.to(p1).emit("matchmaking-success", { roomCode });
      io.to(p2).emit("matchmaking-success", { roomCode });
    }
  });

  // 8. Matchmaking Queue Leave
  socket.on("leave-queue", () => {
    matchmakingQueue = matchmakingQueue.filter((id) => id !== socket.id);
    console.log(`Socket left matchmaking queue: ${socket.id}`);
  });

  // 9. Disconnection
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    matchmakingQueue = matchmakingQueue.filter((id) => id !== socket.id);

    // Scan and clean rooms
    rooms.forEach((room, roomCode) => {
      const playerIndex = room.players.findIndex((p) => p.id === socket.id);
      if (playerIndex !== -1) {
        const removedPlayer = room.players.splice(playerIndex, 1)[0];
        console.log(`Removed player ${removedPlayer.color} from room ${roomCode}`);

        if (room.players.length === 0) {
          rooms.delete(roomCode);
          console.log(`Deleted empty room ${roomCode}`);
        } else {
          // If the removed player was the owner, delegate to the next player
          if (room.ownerId === socket.id) {
            room.ownerId = room.players[0].id;
            console.log(`New owner for room ${roomCode} is delegated to ${room.ownerId}`);
          }

          const playersList = room.players.map((p) => ({
            id: p.id,
            color: p.color,
            isOwner: p.id === room.ownerId,
          }));

          // Notify remaining players in the room
          io.to(roomCode).emit("player-list-update", {
            players: playersList,
            ownerId: room.ownerId,
          });
        }
      }
    });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Ludo socket server listening on port ${PORT}`);
});
