"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Scroll, Trophy, Star } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import Board from "@/components/Board";
import { motion } from "framer-motion";

export default function LocalPlay() {
  const {
    initGame,
    currentTurn,
    players,
    history,
    winner,
  } = useGameStore();

  useEffect(() => {
    initGame("local");
  }, [initGame]);

  const activePlayer = players.find((p) => p.color === currentTurn);

  return (
    <main className="min-h-screen bg-radial from-[#1e1b4b] via-[#0f172a] to-[#020617] text-slate-100 flex flex-col md:flex-row items-center justify-center gap-6 p-4 md:p-8 overflow-hidden relative select-none">
      
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
          className="absolute w-10 h-10 rounded-full bg-radial from-green-400 to-green-600 border-2 border-white shadow-lg opacity-10"
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
          className="absolute w-11 h-11 rounded-full bg-radial from-blue-400 to-blue-600 border-2 border-white shadow-lg opacity-10"
          style={{ bottom: "15%", right: "12%" }}
          animate={{ y: [0, 20, 0], rotate: [0, -45, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Floating Golden Stars */}
        <motion.div
          className="absolute text-yellow-400/10"
          style={{ top: "45%", left: "8%" }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Star className="w-8 h-8 fill-yellow-400" />
        </motion.div>
      </div>

      {/* Top Header/Nav */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
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

      {/* Main Board Container */}
      <div className="flex-1 flex flex-col items-center justify-center mt-12 md:mt-0 z-10">
        <Board />
      </div>

      {/* Control Sidebar */}
      <div className="w-full md:w-80 bg-slate-900/60 border-2 border-slate-800 p-6 rounded-3xl flex flex-col gap-6 shadow-xl backdrop-blur-md z-10">
        
        {/* Header Title */}
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-black text-white font-fredoka uppercase tracking-wider">Local Play</h2>
          <p className="text-slate-400 text-xs mt-1 font-medium">Pass & Play on this device</p>
        </div>

        {/* Turn Indicator Banner */}
        <div className="flex items-center justify-between bg-slate-950/60 border border-slate-850 p-3.5 rounded-2xl">
          <span className="text-slate-400 text-sm font-medium">Turn</span>
          <div className="flex items-center gap-2">
            <span
              className={`w-3.5 h-3.5 rounded-full`}
              style={{
                backgroundColor:
                  currentTurn === "red"
                    ? "#ef4444"
                    : currentTurn === "green"
                    ? "#22c55e"
                    : currentTurn === "yellow"
                    ? "#eab308"
                    : "#3b82f6",
                boxShadow: `0 0 10px ${
                  currentTurn === "red"
                    ? "#ef4444"
                    : currentTurn === "green"
                    ? "#22c55e"
                    : currentTurn === "yellow"
                    ? "#eab308"
                    : "#3b82f6"
                }`,
              }}
            />
            <span className="font-fredoka font-black text-white uppercase text-sm tracking-wide">{currentTurn}</span>
          </div>
        </div>

        {/* Game History log */}
        <div className="flex-1 flex flex-col min-h-[160px] md:min-h-[220px]">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">
            <Scroll className="w-3.5 h-3.5" />
            <span>Game Log</span>
          </div>
          <div className="flex-1 bg-slate-950/50 border border-slate-850 rounded-2xl p-4 font-mono text-xs overflow-y-auto max-h-[160px] md:max-h-[220px] scrollbar-thin scrollbar-thumb-slate-800">
            {history.map((log, index) => (
              <div key={index} className="text-slate-300 py-0.5 border-b border-slate-900/30 last:border-0">
                <span className="text-slate-500 mr-1">&gt;</span>
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => initGame("local")}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-750 border border-slate-600/50 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition shadow-lg cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Game</span>
          </motion.button>
        </div>

      </div>

      {/* Winner Modal */}
      {winner && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/90 border-2 border-slate-700 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <Trophy className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
            <div>
              <h2 className="text-3xl font-black text-white font-fredoka uppercase">{winner} Wins!</h2>
              <p className="text-slate-400 text-sm mt-2">
                All 4 pieces successfully reached the home finish!
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => initGame("local")}
                className="w-full bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-450 text-slate-950 font-black py-3.5 px-4 rounded-xl text-sm shadow-md transition cursor-pointer"
              >
                Play Again
              </motion.button>
              <Link href="/">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-xl text-sm transition text-center cursor-pointer"
                >
                  Back to Menu
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
