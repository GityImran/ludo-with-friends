"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Globe, Star } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { motion } from "framer-motion";

export default function OnlineMatchmaking() {
  const router = useRouter();
  const {
    initGame,
    startMatchmaking,
    cancelMatchmaking,
    roomCode,
    gameMode,
    onlineQueueState,
  } = useGameStore();

  // Initialize online game connection
  useEffect(() => {
    initGame("online");
  }, [initGame]);

  // Once socket connects, join matchmaking queue
  const socket = useGameStore((state) => state.socket);
  useEffect(() => {
    if (socket) {
      startMatchmaking();
    }
  }, [socket, startMatchmaking]);

  // Redirect to room once matched and roomCode generated
  useEffect(() => {
    if (roomCode && gameMode === "online") {
      router.push(`/room/${roomCode}`);
    }
  }, [roomCode, gameMode, router]);

  const handleCancel = () => {
    cancelMatchmaking();
    router.push("/");
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
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCancel}
          className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 border-2 border-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer text-white shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel</span>
        </motion.button>
      </div>

      {/* Matchmaking Card */}
      <div className="max-w-md w-full bg-slate-900/60 p-8 rounded-3xl border-2 border-slate-800 shadow-2xl backdrop-blur-md flex flex-col gap-6 items-center text-center z-10">
        
        {/* Globe icon pulsing */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
          <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-3xl flex items-center justify-center mx-auto relative border border-blue-500/20 animate-spin-slow shadow-md">
            <Globe className="w-8 h-8 animate-pulse" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-black text-white font-fredoka uppercase tracking-wider">Online Matchmaking</h1>
          <p className="text-slate-400 text-xs mt-1.5 font-medium leading-relaxed max-w-xs">
            {onlineQueueState === "searching"
              ? "Finding random opponents worldwide..."
              : onlineQueueState === "matched"
              ? "Match found! Preparing board..."
              : "Connecting to server..."}
          </p>
        </div>

        {/* Loading Spinner */}
        <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-850 px-6 py-4 rounded-2xl w-full justify-center shadow-inner">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          <span className="text-xs font-semibold text-slate-355 tracking-wide uppercase">
            {onlineQueueState === "searching" ? "Searching for players..." : "Starting game..."}
          </span>
        </div>

        {/* Cancel Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleCancel}
          className="w-full bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-750 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition shadow-lg cursor-pointer"
        >
          Cancel Matchmaking
        </motion.button>

      </div>
    </main>
  );
}
