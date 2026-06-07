"use client";

import Link from "next/link";
import { Play, Users, Globe, Trophy, Star, Crown } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { useEffect } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const resetGame = useGameStore((state) => state.resetGame);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  return (
    <main className="min-h-screen bg-radial from-[#1e1b4b] via-[#0f172a] to-[#020617] text-slate-100 flex flex-col items-center justify-center p-4 overflow-hidden relative select-none">
      
      {/* 1. FLOATING DECORATIONS (Ludo Club Style) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Red Piece */}
        <motion.div
          className="absolute w-12 h-12 rounded-full bg-radial from-red-400 to-red-600 border-2 border-white shadow-lg opacity-25"
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
          className="absolute w-14 h-14 rounded-full bg-radial from-amber-300 to-amber-500 border-2 border-white shadow-lg opacity-25"
          style={{ top: "25%", right: "8%" }}
          animate={{ y: [0, -30, 0], rotate: [0, 60, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Floating Blue Piece */}
        <motion.div
          className="absolute w-11 h-11 rounded-full bg-radial from-blue-400 to-blue-600 border-2 border-white shadow-lg opacity-20"
          style={{ bottom: "15%", right: "12%" }}
          animate={{ y: [0, 20, 0], rotate: [0, -45, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Floating Golden Stars */}
        <motion.div
          className="absolute text-yellow-400/20"
          style={{ top: "45%", left: "8%" }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Star className="w-8 h-8 fill-yellow-400" />
        </motion.div>
        <motion.div
          className="absolute text-yellow-400/20"
          style={{ bottom: "45%", right: "10%" }}
          animate={{ scale: [1.3, 1, 1.3], opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: 3.5, repeat: Infinity }}
        >
          <Star className="w-10 h-10 fill-yellow-400" />
        </motion.div>
      </div>

      {/* 2. MAIN CONTAINER */}
      <div className="max-w-4xl w-full flex flex-col items-center gap-10 z-10">
        
        {/* Logo Banner & Header */}
        <div className="flex flex-col items-center text-center relative px-4">
          {/* Golden Crown floating over the main title */}
          <motion.div
            className="absolute -top-10 left-[50%] -translate-x-[50%] text-amber-400 filter drop-shadow-[0_4px_8px_rgba(251,191,36,0.3)]"
            animate={{ y: [0, -8, 0], rotate: [-5, 5, -5] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Crown className="w-12 h-12 fill-amber-400" />
          </motion.div>

          {/* Title */}
          <h1 className="text-6xl md:text-8xl font-fredoka font-black tracking-tight leading-none text-white select-none mt-4 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center justify-center gap-2">
            <div className="flex">
              <span className="text-red-500">L</span>
              <span className="text-green-500">u</span>
              <span className="text-amber-400">d</span>
              <span className="text-blue-500">o</span>
            </div>
            <span className="text-white text-4xl md:text-5xl align-middle font-fredoka">WITH FRIENDS</span>
          </h1>
          
          <p className="text-slate-400 text-sm md:text-base font-medium tracking-wide mt-4 max-w-sm">
            Roll the dice, choose your lucky color, and play Ludo with players globally!
          </p>
        </div>

        {/* 3. GAME MODES (FLASHY LUDO CLUB CARDS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl px-4">
          
          {/* Local Pass & Play */}
          <Link href="/local" className="group">
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-b from-red-500 to-red-700 border-2 border-red-400/50 p-6 rounded-3xl text-center shadow-xl shadow-red-950/40 cursor-pointer relative overflow-hidden flex flex-col items-center gap-4 h-full"
            >
              {/* Gloss shine overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 pointer-events-none" />
              
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-md transform group-hover:rotate-12 transition-transform duration-300">
                <Play className="w-8 h-8 text-red-600 fill-red-600" />
              </div>
              
              <div>
                <h3 className="font-fredoka text-xl font-black text-white uppercase tracking-wider">
                  Local Play
                </h3>
                <p className="text-red-100 text-xs mt-1 font-medium opacity-90 leading-tight">
                  Pass & play with friends on the same device
                </p>
              </div>
            </motion.div>
          </Link>

          {/* Play with Friends */}
          <Link href="/friends" className="group">
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-b from-green-500 to-green-700 border-2 border-green-400/50 p-6 rounded-3xl text-center shadow-xl shadow-green-950/40 cursor-pointer relative overflow-hidden flex flex-col items-center gap-4 h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 pointer-events-none" />
              
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="font-fredoka text-xl font-black text-white uppercase tracking-wider">
                  With Friends
                </h3>
                <p className="text-green-100 text-xs mt-1 font-medium opacity-90 leading-tight">
                  Create private rooms & share session codes
                </p>
              </div>
            </motion.div>
          </Link>

          {/* Play Online Matchmaking */}
          <Link href="/online" className="group">
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-b from-blue-500 to-blue-700 border-2 border-blue-400/50 p-6 rounded-3xl text-center shadow-xl shadow-blue-950/40 cursor-pointer relative overflow-hidden flex flex-col items-center gap-4 h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 pointer-events-none" />
              
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-md transform group-hover:-rotate-12 transition-transform duration-300">
                <Globe className="w-8 h-8 text-blue-600" />
              </div>
              
              <div>
                <h3 className="font-fredoka text-xl font-black text-white uppercase tracking-wider">
                  Play Online
                </h3>
                <p className="text-blue-100 text-xs mt-1 font-medium opacity-90 leading-tight">
                  Match instantly with random players worldwide
                </p>
              </div>
            </motion.div>
          </Link>

        </div>

        {/* Info badging */}
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-900/40 px-4 py-2 border border-slate-800/80 rounded-full">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Don't forget to flame your friends!!!</span>
        </div>

      </div>

      {/* Footer copyright */}
      <footer className="mt-12 text-slate-600 text-xs font-bold tracking-wide z-10">
        © {new Date().getFullYear()} LUDO WITH FRIENDS • ALL RIGHTS RESERVED
      </footer>
    </main>
  );
}