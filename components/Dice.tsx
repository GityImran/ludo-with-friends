import { motion } from "framer-motion";

interface DiceProps {
  value: number;
  isRolling: boolean;
  isClickable: boolean;
  color: "red" | "green" | "yellow" | "blue";
  onRoll: () => void;
}

export default function Dice({
  value,
  isRolling,
  isClickable,
  color,
  onRoll,
}: DiceProps) {
  // Define positions for pips depending on the rolled value
  const getPips = (val: number) => {
    switch (val) {
      case 1:
        return [4]; // Center
      case 2:
        return [0, 8]; // Top-left, Bottom-right
      case 3:
        return [0, 4, 8]; // Diagonal
      case 4:
        return [0, 2, 6, 8]; // 4 corners
      case 5:
        return [0, 2, 4, 6, 8]; // 4 corners + Center
      case 6:
        return [0, 2, 3, 5, 6, 8]; // Left column + Right column
      default:
        return [4];
    }
  };

  const pips = getPips(value);

  // Theme shadow color based on active player
  const glowColors = {
    red: "shadow-red-500/30 border-red-500",
    green: "shadow-green-500/30 border-green-500",
    yellow: "shadow-amber-500/30 border-amber-500",
    blue: "shadow-blue-500/30 border-blue-500",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        disabled={!isClickable}
        onClick={onRoll}
        className={`
          relative
          w-16 h-16
          md:w-20 md:h-20
          bg-white
          border-4
          rounded-2xl
          shadow-xl
          flex
          items-center
          justify-center
          p-2
          cursor-pointer
          select-none
          outline-none
          ${isClickable ? glowColors[color] + " animate-pulse" : "border-gray-200 shadow-gray-200"}
          transition-colors
          duration-300
        `}
        style={{
          boxShadow: isClickable
            ? `0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1), 0 0 15px rgba(255,255,255,0.4)`
            : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
        whileHover={isClickable ? { scale: 1.05 } : {}}
        whileTap={isClickable ? { scale: 0.95 } : {}}
        animate={
          isRolling
            ? {
                rotateX: [0, 360, 720, 1080],
                rotateY: [0, 180, 540, 1080],
                scale: [1, 1.2, 1.2, 1],
              }
            : {}
        }
        transition={{
          duration: 0.6,
          ease: "easeInOut",
        }}
      >
        {/* Dice face grid of 3x3 positions */}
        <div className="grid grid-cols-3 grid-rows-3 gap-1 w-full h-full p-1 bg-neutral-50 rounded-lg border border-neutral-100">
          {Array.from({ length: 9 }).map((_, index) => {
            const hasPip = pips.includes(index);
            return (
              <div
                key={index}
                className="flex items-center justify-center w-full h-full"
              >
                {hasPip && (
                  <motion.div
                    layoutId={`pip-${index}`}
                    className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-slate-900 shadow-sm"
                  />
                )}
              </div>
            );
          })}
        </div>
      </motion.button>
      {isClickable && (
        <span className={`text-xs font-bold uppercase tracking-wider animate-bounce mt-1 text-slate-500`}>
          Click to Roll!
        </span>
      )}
    </div>
  );
}