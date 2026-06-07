"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Users, UserPlus, Star } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { motion } from "framer-motion";

export default function FriendsLobby() {
  const [code, setCode] = useState("");
  const router = useRouter();
  const { initGame, createFriendRoom, joinFriendRoom, roomCode, gameMode } =
    useGameStore();

  // Initialize store connection to multiplayer on mount
  useEffect(() => {
    initGame("friends");
  }, [initGame]);

  // Redirect to room once roomCode is synchronized from socket server
  useEffect(() => {
    if (roomCode && gameMode === "friends") {
      router.push(`/room/${roomCode}`);
    }
  }, [roomCode, gameMode, router]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length === 6) {
      joinFriendRoom(code.trim());
    }
  };

  return (
    <main className="min-h-screen bg-radial from-[#1e1b4b] via-[#0f172a] to-[#020617] text-slate-100 flex flex-col items-center justify-center p-4 overflow-hidden relative select-none">
      
      {/* FLOATING DECORATIONS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Floating Red Piece */}
        <motion.div
          className="absolute w-12 h-12 rounded-full bg-radial from-red-400 to-red-600 border-2 border-white shadow-lg opacity-15"
          style={{ top: "15%", left: "10%" }}
          animate={{ y: [0, -20, 0], rotate: [0, 45, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Floating Green Piece */}
        <motion.div
          className="absolute w-10 h-10 rounded-full bg-radial from-green-400 to-green-600 border-2 border-white shadow-lg opacity-20"
          style={{ bottom: "20%", left: "15%" }}
          animate={{ y: [0, 25, 0], rotate: [0, -30, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Floating Yellow Piece */}
        <motion.div
          className="absolute w-14 h-14 rounded-full bg-radial from-amber-300 to-amber-500 border-2 border-white shadow-lg opacity-15"
          style={{ top: "25%", right: "8%" }}
          animate={{ y: [0, -30, 0], rotate: [0, 60, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Floating Blue Piece */}
        <motion.div
          className="absolute w-11 h-11 rounded-full bg-radial from-blue-400 to-blue-600 border-2 border-white shadow-lg opacity-15"
          style={{ bottom: "15%", right: "12%" }}
          animate={{ y: [0, 20, 0], rotate: [0, -45, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Floating Golden Stars */}
        <motion.div
          className="absolute text-yellow-400/15"
          style={{ top: "45%", left: "8%" }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Star className="w-8 h-8 fill-yellow-400" />
        </motion.div>
      </div>

      {/* Back to Menu */}
      <div className="absolute top-4 left-4 z-20">
        <Link href="/">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 border-2 border-slate-700/80 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer text-white shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Menu</span>
          </motion.div>
        </Link>
      </div>

      {/* Control Box */}
      <div className="max-w-md w-full bg-slate-900/60 p-8 rounded-3xl border-2 border-slate-800 shadow-2xl backdrop-blur-md flex flex-col gap-8 z-10">
        
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner shadow-emerald-500/5">
            <Users className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-black text-white font-fredoka uppercase tracking-wider">Play with Friends</h1>
          <p className="text-slate-400 text-xs mt-1.5 font-medium">Host a room or enter a room code to join</p>
        </div>

        {/* Section 1: Host Room */}
        <div className="flex flex-col gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={createFriendRoom}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-b from-green-500 to-green-650 hover:from-green-400 hover:to-green-600 text-white font-black py-4 px-4 rounded-xl text-sm shadow-lg shadow-green-950/20 transition cursor-pointer relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/15 pointer-events-none" />
            <Plus className="w-4 h-4" />
            <span>HOST A NEW GAME</span>
          </motion.button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-[1px] bg-slate-800" />
          <span className="text-slate-500 text-xs font-black uppercase tracking-wider">OR</span>
          <div className="flex-1 h-[1px] bg-slate-800" />
        </div>

        {/* Section 2: Join Room */}
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider pl-1">
              Enter Room Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="E.g. LUDO12"
              className="w-full bg-slate-950/60 border-2 border-slate-800 focus:border-green-500 rounded-xl py-3.5 px-4 font-mono text-center text-lg font-black tracking-widest text-white outline-none transition shadow-inner"
            />
          </div>

          <motion.button
            whileHover={code.trim().length === 6 ? { scale: 1.03 } : {}}
            whileTap={code.trim().length === 6 ? { scale: 0.97 } : {}}
            type="submit"
            disabled={code.trim().length !== 6}
            className={`
              w-full flex items-center justify-center gap-2 font-bold py-4 px-4 rounded-xl text-sm transition relative overflow-hidden
              ${
                code.trim().length === 6
                  ? "bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-750 text-white cursor-pointer shadow-md"
                  : "bg-slate-900 text-slate-600 border-2 border-slate-950 cursor-not-allowed"
              }
            `}
          >
            {code.trim().length === 6 && <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 pointer-events-none" />}
            <UserPlus className="w-4 h-4" />
            <span>JOIN EXISTING ROOM</span>
          </motion.button>
        </form>

      </div>
    </main>
  );
}
