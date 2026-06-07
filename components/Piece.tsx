import { motion } from "framer-motion";

interface PieceProps {
  color: "red" | "green" | "yellow" | "blue";
  isClickable?: boolean;
  onClick?: () => void;
}

export default function Piece({
  color,
  isClickable = false,
  onClick,
}: PieceProps) {
  // Premium Ludo token colors
  const colorMap = {
    red: "bg-radial from-[#ff000d] via-[#ff000d] to-[#e61e3b] shadow-red-950/50",
    green: "bg-radial from-[#0ADD08] via-[#0ADD08] to-[#1bb556] shadow-green-950/50",
    yellow: "bg-radial from-[#f6dd00ff] via-[#f6dd00ff] to-[#d4ad00] shadow-amber-950/50",
    blue: "bg-radial from-[#0022EE] via-[#0022EE] to-[#008fe3] shadow-blue-950/50",
  };

  return (
    <motion.button
      layout // Framer Motion animates layout changes (e.g. moving between grid cells)
      onClick={onClick}
      disabled={!isClickable}
      className={`
        relative
        w-8 h-8
        md:w-9 md:h-9
        rounded-full
        border-[2.5px]
        border-white
        outline
        outline-[1.5px]
        outline-slate-950/60
        shadow-lg
        flex
        items-center
        justify-center
        cursor-pointer
        ${colorMap[color]}
        transition-shadow
        duration-300
      `}
      style={{
        boxShadow: "inset 0 2px 4px rgba(255, 255, 255, 0.5), 0 4px 8px rgba(0, 0, 0, 0.4)",
      }}
      whileHover={isClickable ? { scale: 1.15, y: -4 } : {}}
      whileTap={isClickable ? { scale: 0.95 } : {}}
      animate={
        isClickable
          ? {
              boxShadow: [
                "inset 0 2px 4px rgba(255, 255, 255, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.8), 0 4px 8px rgba(0,0,0,0.3)",
                "inset 0 2px 4px rgba(255, 255, 255, 0.4), 0 0 12px 6px rgba(255, 255, 255, 0.9), 0 4px 8px rgba(0,0,0,0.3)",
                "inset 0 2px 4px rgba(255, 255, 255, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.8), 0 4px 8px rgba(0,0,0,0.3)",
              ],
            }
          : {}
      }
      transition={{
        boxShadow: {
          repeat: Infinity,
          duration: 1.5,
          ease: "easeInOut",
        },
        layout: {
          type: "spring",
          stiffness: 150,
          damping: 20,
        },
      }}
    >
      {/* Inner design ring to make it look like a chess/backgammon token */}
      <div className="w-4 h-4 rounded-full border border-white/30 bg-black/10 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
      </div>
    </motion.button>
  );
}