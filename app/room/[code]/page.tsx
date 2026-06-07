"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Check, ArrowLeft, Users, Scroll, LogOut, Trophy, Star } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import Board from "@/components/Board";
import { motion } from "framer-motion";

interface Props {
  params: Promise<{ code: string }>;
}

export default function GameRoom({ params }: Props) {
  // Unwrap params using React.use() to support Next.js 16 App Router
  const { code } = use(params);
  const router = useRouter();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const {
    roomCode,
    myColor,
    myId,
    roomOwnerId,
    connectedPlayers,
    gameStarted,
    currentTurn,
    history,
    winner,
    connectRoom,
    chooseColor,
    startGame,
    resetGame,
  } = useGameStore();

  useEffect(() => {
    if (!myId) {
      connectRoom(code);
    }
  }, [myId, code, connectRoom]);

  const copyRoomLink = () => {
    if (typeof window !== "undefined") {
      const inviteUrl = `${window.location.origin}/room/${code}`;
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const copyRoomCodeOnly = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleExit = () => {
    resetGame();
    router.push("/");
  };

  const isMyTurn = currentTurn === myColor;

  const isOwner = myId === roomOwnerId;

  // Map players to seats
  const seats = [
    { color: "red", label: "Red Player", hex: "#ef4444" },
    { color: "green", label: "Green Player", hex: "#22c55e" },
    { color: "yellow", label: "Yellow Player", hex: "#eab308" },
    { color: "blue", label: "Blue Player", hex: "#3b82f6" },
  ];

  return (
    <main className="min-h-screen bg-radial from-[#1e1b4b] via-[#0f172a] to-[#020617] text-slate-100 flex flex-col md:flex-row items-center justify-center gap-6 p-4 md:p-8 overflow-hidden relative select-none">
      
      {/* FLOATING DECORATIONS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Floating Red Piece */}
        <motion.div
          className="absolute w-12 h-12 rounded-full bg-radial from-[#ff6b8b] via-[#ff4b60] to-[#e61e3b] border-2 border-white shadow-lg opacity-15"
          style={{ top: "15%", left: "10%" }}
          animate={{ y: [0, -20, 0], rotate: [0, 45, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Floating Green Piece */}
        <motion.div
          className="absolute w-10 h-10 rounded-full bg-radial from-[#57f495] via-[#2ade72] to-[#1bb556] border-2 border-white shadow-lg opacity-20"
          style={{ bottom: "20%", left: "15%" }}
          animate={{ y: [0, 25, 0], rotate: [0, -30, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Floating Yellow Piece */}
        <motion.div
          className="absolute w-14 h-14 rounded-full bg-radial from-[#ffe45e] via-[#ffd000] to-[#d4ad00] border-2 border-white shadow-lg opacity-15"
          style={{ top: "25%", right: "8%" }}
          animate={{ y: [0, -30, 0], rotate: [0, 60, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Floating Blue Piece */}
        <motion.div
          className="absolute w-11 h-11 rounded-full bg-radial from-[#6ed0ff] via-[#38b6ff] to-[#008fe3] border-2 border-white shadow-lg opacity-15"
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

      {/* Top Header Navigation */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExit}
          className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 border-2 border-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer text-white shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Room</span>
        </motion.button>
      </div>

      {/* LOBBY WAITING SCREEN */}
      {!gameStarted ? (
        <div className="max-w-md w-full bg-slate-900/60 p-8 rounded-3xl border-2 border-slate-800 shadow-2xl backdrop-blur-md flex flex-col gap-6 items-center text-center z-10">
          <div>
            <div className="w-14 h-14 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner shadow-amber-500/5">
              <Users className="w-7 h-7 animate-pulse" />
            </div>
            <h1 className="text-3xl font-black text-white font-fredoka uppercase tracking-wider">Waiting for Players</h1>
             <p className="text-slate-400 text-xs mt-1.5 font-medium leading-relaxed">
              Share the link or code below with your friends to play!
            </p>
          </div>

          {/* Copy Box */}
          <div className="w-full flex flex-col gap-3 bg-slate-950/60 border-2 border-slate-800 rounded-2xl p-4 shadow-inner">
            <div className="flex items-center justify-between w-full px-1">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider pl-1">Room Code</span>
              <span className="text-2xl font-black text-white tracking-widest uppercase font-mono">{code}</span>
            </div>
            
            <div className="flex gap-2 w-full mt-1">
              {/* Copy Invite Link */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={copyRoomLink}
                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-850 hover:bg-slate-750 border border-slate-700/50 text-slate-200 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-green-400 font-fredoka">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Link</span>
                  </>
                )}
              </motion.button>

              {/* Copy Code Only */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={copyRoomCodeOnly}
                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-850 hover:bg-slate-750 border border-slate-700/50 text-slate-200 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-green-400 font-fredoka">Code Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Code</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Connected players list / Seat Choice */}
          <div className="w-full flex flex-col gap-3 text-left">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider pl-1">
              Choose Color / Seats ({connectedPlayers.length}/4)
            </h3>
            <div className="flex flex-col gap-2.5">
              {seats.map((seat) => {
                const occupant = connectedPlayers.find((p) => p.color === seat.color);
                const isTaken = !!occupant;
                const isMe = occupant?.id === myId;
                const isOccupantOwner = occupant?.isOwner;

                return (
                  <motion.button
                    whileHover={!isTaken ? { scale: 1.02, x: 2 } : {}}
                    whileTap={!isTaken ? { scale: 0.98 } : {}}
                    key={seat.color}
                    disabled={isTaken}
                    onClick={() => chooseColor(seat.color as any)}
                    className={`
                      w-full flex items-center justify-between p-3.5 rounded-xl border-2 text-left transition-all duration-200
                      ${
                        isMe
                          ? "bg-slate-950/60 border-amber-400 text-white shadow-md ring-1 ring-amber-400/50"
                          : isTaken
                          ? "bg-slate-950/20 border-slate-900 text-slate-500 cursor-not-allowed"
                          : "bg-slate-950/40 border-slate-800/80 text-slate-300 hover:border-slate-650 hover:bg-slate-950/60 cursor-pointer"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                        style={{
                          backgroundColor: seat.hex,
                          boxShadow: isMe ? `0 0 10px ${seat.hex}` : undefined,
                        }}
                      />
                      <div className="flex flex-col">
                        <span className={`font-fredoka font-bold text-sm ${isMe ? "text-white" : isTaken ? "text-slate-500" : "text-slate-300"}`}>
                          {seat.label} {isMe && <span className="text-xs text-amber-400 font-medium ml-1.5">(Your Seat)</span>}
                        </span>
                        {isTaken && (
                          <span className="text-[10px] text-slate-500 font-mono leading-none mt-0.5">
                            {isOccupantOwner ? "Lobby Owner" : "Joined Player"}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <span className="text-xs font-bold tracking-wider uppercase font-fredoka">
                      {isMe ? (
                        <span className="text-amber-400">Selected</span>
                      ) : isTaken ? (
                        <span className="text-slate-600">Taken</span>
                      ) : (
                        <span className="text-emerald-400">Choose</span>
                      )}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Start Game Controls */}
          <div className="w-full border-t border-slate-800 pt-5 mt-2">
            {isOwner ? (
              <div className="flex flex-col gap-2.5">
                <motion.button
                  whileHover={connectedPlayers.length >= 2 ? { scale: 1.03 } : {}}
                  whileTap={connectedPlayers.length >= 2 ? { scale: 0.97 } : {}}
                  onClick={startGame}
                  disabled={connectedPlayers.length < 2}
                  className={`
                    w-full py-4 px-4 rounded-xl text-sm font-black transition-all shadow-lg uppercase tracking-wider relative overflow-hidden
                    ${
                      connectedPlayers.length >= 2
                        ? "bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-450 text-slate-950 cursor-pointer shadow-amber-950/20"
                        : "bg-slate-900 text-slate-600 border-2 border-slate-950 cursor-not-allowed"
                    }
                  `}
                >
                  {connectedPlayers.length >= 2 && <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/15 pointer-events-none" />}
                  Start Game
                </motion.button>
                {connectedPlayers.length < 2 && (
                  <p className="text-slate-500 text-xs font-medium">
                    Need at least 2 players in the lobby to start
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2.5 bg-slate-950/60 border border-slate-850 py-3.5 px-4 rounded-xl w-full shadow-inner">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-ping" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Waiting for host to start the game...
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* GAME BOARD & INTERFACE SCREEN */
        <>
          {/* Left/Center: The Board */}
          <div className="flex-1 flex flex-col items-center justify-center mt-12 md:mt-0 z-10">
            <Board />
          </div>

          {/* Right: Sidebar Control Panel */}
          <div className="w-full md:w-80 bg-slate-900/60 border-2 border-slate-800 p-6 rounded-3xl flex flex-col gap-6 shadow-xl backdrop-blur-md z-10">
            
            {/* Room Header Info */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-white font-fredoka uppercase tracking-tight">Room Active</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-slate-400 text-xs font-mono">Code: {code}</span>
                  <button onClick={copyRoomLink} className="text-slate-400 hover:text-white transition cursor-pointer">
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              
              {/* Client player identifier */}
              <div className="bg-slate-950/60 border border-slate-850 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-inner">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Seat:</span>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seats.find(s => s.color === myColor)?.hex }} />
                <span className="text-white text-xs font-bold uppercase">{myColor}</span>
              </div>
            </div>

            {/* Turn Indicator */}
            <div className="flex items-center justify-between bg-slate-950/60 border border-slate-850 p-3.5 rounded-2xl">
              <span className="text-slate-400 text-sm font-medium">Turn</span>
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{
                    backgroundColor: seats.find(s => s.color === currentTurn)?.hex,
                    boxShadow: `0 0 10px ${seats.find(s => s.color === currentTurn)?.hex}`,
                  }}
                />
                <span className="font-fredoka font-black text-white uppercase text-sm tracking-wide">
                  {currentTurn} {isMyTurn && <span className="text-xs text-green-400 font-medium ml-1">(You)</span>}
                </span>
              </div>
            </div>

            {/* History Logs */}
            <div className="flex-1 flex flex-col min-h-[140px] md:min-h-[180px]">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">
                <Scroll className="w-3.5 h-3.5" />
                <span>Game Log</span>
              </div>
              <div className="flex-1 bg-slate-950/50 border border-slate-850 rounded-2xl p-4 font-mono text-xs overflow-y-auto max-h-[140px] md:max-h-[180px] scrollbar-thin scrollbar-thumb-slate-800">
                {history.map((log, index) => (
                  <div key={index} className="text-slate-300 py-0.5 border-b border-slate-900/30 last:border-0">
                    <span className="text-slate-500 mr-1">&gt;</span>
                    {log}
                  </div>
                ))}
              </div>
            </div>

            {/* Disconnect Exit Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleExit}
              className="flex items-center justify-center gap-2 bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-750 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition shadow-lg cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Leave Room</span>
            </motion.button>
          </div>
        </>
      )}

      {/* Winner Modal */}
      {winner && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/90 border-2 border-slate-700 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <Trophy className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
            <div>
              <h2 className="text-3xl font-black text-white font-fredoka uppercase">{winner} Wins!</h2>
              <p className="text-slate-400 text-sm mt-2">
                All 4 pieces of player {winner.toUpperCase()} successfully finished the game!
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleExit}
                className="w-full bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-450 text-slate-950 font-black py-3.5 px-4 rounded-xl text-sm shadow-md transition cursor-pointer"
              >
                Back to Dashboard
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
