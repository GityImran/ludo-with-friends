import { useGameStore } from "@/store/useGameStore";
import { getPieceCoordinate } from "@/game/helpers";
import { SAFE_CELLS, START_INDEX } from "@/game/constants";
import { PATH } from "@/game/path";
import { PlayerColor, Piece as PieceType } from "@/game/types";
import { getValidMoves } from "@/game/rules";
import Piece from "./Piece";
import Dice from "./Dice";
import { Star } from "lucide-react";

export default function Board() {
  const {
    players,
    currentTurn,
    diceValue,
    diceState,
    myColor,
    gameMode,
    movePiece,
    roll,
    winner,
    isMovingPiece,
  } = useGameStore();

  // 1. Determine which pieces are clickable
  const isMyTurn = gameMode === "local" || myColor === currentTurn;
  const activeValidMoves =
    isMyTurn && diceState === "rolled" && !isMovingPiece
      ? getValidMoves(players, currentTurn, diceValue)
      : [];

  // 2. Map all active pieces (excluding finished ones) to their coordinates
  const boardPiecesMap = new Map<string, { piece: PieceType; color: PlayerColor }[]>();

  players.forEach((player) => {
    player.pieces.forEach((piece, index) => {
      // Finished pieces are rendered inside the center triangle overlay
      if (piece.finished || piece.position === 56) return;

      const [r, c] = getPieceCoordinate(player.color, piece.position, index);
      const key = `${r}-${c}`;

      if (!boardPiecesMap.has(key)) {
        boardPiecesMap.set(key, []);
      }
      boardPiecesMap.get(key)!.push({ piece, color: player.color });
    });
  });

  // 3. Collect finished pieces for rendering inside the center overlay
  const finishedPiecesByColor = {
    red: players.find((p) => p.color === "red")?.pieces.filter((p) => p.finished || p.position === 56) || [],
    green: players.find((p) => p.color === "green")?.pieces.filter((p) => p.finished || p.position === 56) || [],
    yellow: players.find((p) => p.color === "yellow")?.pieces.filter((p) => p.finished || p.position === 56) || [],
    blue: players.find((p) => p.color === "blue")?.pieces.filter((p) => p.finished || p.position === 56) || [],
  };

  // Helper to determine styling of grid cells
  const getCellProps = (row: number, col: number) => {
    const isCenter = row >= 6 && row <= 8 && col >= 6 && col <= 8;
    if (isCenter) return { bg: "bg-transparent", isBorder: false };

    // Home yards
    if (row < 6 && col < 6) return { bg: "bg-white", isBorder: true, yard: "red" };
    if (row < 6 && col > 8) return { bg: "bg-white", isBorder: true, yard: "green" };
    if (row > 8 && col > 8) return { bg: "bg-white", isBorder: true, yard: "yellow" };
    if (row > 8 && col < 6) return { bg: "bg-white", isBorder: true, yard: "blue" };

    // Home lanes
    if (row === 7 && col >= 1 && col <= 5) return { bg: "bg-[#ff000d]", isBorder: true };
    if (col === 7 && row >= 1 && row <= 5) return { bg: "bg-[#0ADD08]", isBorder: true };
    if (row === 7 && col >= 9 && col <= 13) return { bg: "bg-[#f6dd00ff]", isBorder: true };
    if (col === 7 && row >= 9 && row <= 13) return { bg: "bg-[#0022EE]", isBorder: true };

    // Start cells
    if (row === 6 && col === 1) return { bg: "bg-[#ff000d]", isBorder: true, isStart: "red" };
    if (row === 1 && col === 8) return { bg: "bg-[#0ADD08]", isBorder: true, isStart: "green" };
    if (row === 8 && col === 13) return { bg: "bg-[#f6dd00ff]", isBorder: true, isStart: "yellow" };
    if (row === 13 && col === 6) return { bg: "bg-[#0022EE]", isBorder: true, isStart: "blue" };

    // Safe cells (stars)
    const cellIndex = getCellIndexFromCoord(row, col);
    const isSafe = cellIndex !== null && SAFE_CELLS.includes(cellIndex);
    if (isSafe) return { bg: "bg-amber-100", isBorder: true, isSafe: true };

    // General track cells
    return { bg: "bg-neutral-50", isBorder: true };
  };

  // Find index in PATH list based on coordinates
  function getCellIndexFromCoord(r: number, c: number): number | null {
    const idx = PATH.findIndex((coord) => coord[0] === r && coord[1] === c);
    return idx !== -1 ? idx : null;
  }

  // Render dice placeholders in empty home yard corners
  const renderDiceInCorner = (color: PlayerColor) => {
    const isCurrentTurn = currentTurn === color;
    const isMyTurn = gameMode === "local" || myColor === currentTurn;
    const isDiceClickable = isMyTurn && diceState === "idle" && !winner && !isMovingPiece;

    // Corner offset alignments inside board quadrants
    const positionStyles = {
      red: "top-4 left-4",
      green: "top-4 right-4",
      yellow: "bottom-4 right-4",
      blue: "bottom-4 left-4",
    };

    const themeStyles = {
      red: "border-red-400/20 bg-red-950/20 text-red-400/30",
      green: "border-green-400/20 bg-green-950/20 text-green-400/30",
      yellow: "border-amber-400/20 bg-amber-950/20 text-amber-400/30",
      blue: "border-blue-400/20 bg-blue-950/20 text-blue-400/30",
    };

    return (
      <div className={`absolute ${positionStyles[color]} z-20`}>
        {isCurrentTurn ? (
          <Dice
            value={diceValue}
            isRolling={diceState === "rolling"}
            isClickable={isDiceClickable}
            color={currentTurn}
            onRoll={() => roll()}
          />
        ) : (
          <div
            className={`
              w-16 h-16
              md:w-20 md:h-20
              border-4 border-dashed rounded-2xl
              flex items-center justify-center
              transition-opacity
              duration-300
              ${themeStyles[color]}
            `}
          >
            {/* Single faint central pip inside placeholder */}
            <div className="w-2.5 h-2.5 rounded-full bg-current opacity-30" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full aspect-square max-w-[560px] md:max-w-[620px] bg-[#2b2d42] border-[10px] border-[#1f202e] rounded-[36px] p-2 md:p-3 shadow-[0_20px_45px_rgba(0,0,0,0.6)] outline outline-[4px] outline-slate-900/60 overflow-hidden select-none">
      {/* 15x15 Grid Layout */}
      <div
        className="grid w-full h-full rounded-[20px] overflow-hidden"
        style={{
          gridTemplateColumns: "repeat(15, minmax(0, 1fr))",
          gridTemplateRows: "repeat(15, minmax(0, 1fr))",
        }}
      >
        {Array.from({ length: 225 }).map((_, index) => {
          const row = Math.floor(index / 15);
          const col = index % 15;
          const { bg, isBorder, yard, isStart, isSafe } = getCellProps(row, col);

          // Get pieces occupying this cell
          const cellPieces = boardPiecesMap.get(`${row}-${col}`) || [];

          // Custom styling for home yard interior boxes
          const isYardInner =
            yard &&
            ((yard === "red" && row >= 1 && row <= 4 && col >= 1 && col <= 4) ||
              (yard === "green" && row >= 1 && row <= 4 && col >= 10 && col <= 13) ||
              (yard === "yellow" && row >= 10 && row <= 13 && col >= 10 && col <= 13) ||
              (yard === "blue" && row >= 10 && row <= 13 && col >= 1 && col <= 4));

          let pocketColor = "";
          let isPocket = false;
          if (isYardInner) {
            // Check pocket cells
            const pockets = {
              red: [[2, 2], [2, 3], [3, 2], [3, 3]],
              green: [[2, 11], [2, 12], [3, 11], [3, 12]],
              yellow: [[11, 11], [11, 12], [12, 11], [12, 12]],
              blue: [[11, 2], [11, 3], [12, 2], [12, 3]],
            };
            const activeColor = yard as PlayerColor;
            isPocket = pockets[activeColor].some(([r, c]) => r === row && c === col);
            pocketColor = activeColor;
          }

          return (
            <div
              key={index}
              className={`
                relative
                flex
                items-center
                justify-center
                transition-colors
                ${isBorder ? "border-[1.5px] border-slate-950/20" : ""}
                ${isYardInner ? (isPocket ? "bg-white" : "bg-white") : bg}
              `}
              style={{
                // Make home yard quadrants colored
                backgroundColor:
                  yard && !isYardInner
                    ? yard === "red"
                      ? "#ff000d"
                      : yard === "green"
                      ? "#0ADD08"
                      : yard === "yellow"
                      ? "#f6dd00ff"
                      : "#0022EE"
                    : undefined,
              }}
            >
              {/* Pocket Circles inside Home Yards */}
              {isPocket && (
                <div
                  className={`
                    w-[85%] h-[85%]
                    rounded-full
                    border-[3px]
                    flex
                    items-center
                    justify-center
                    shadow-md
                  `}
                  style={{
                    borderColor:
                      pocketColor === "red"
                        ? "#ff000d"
                        : pocketColor === "green"
                        ? "#0ADD08"
                        : pocketColor === "yellow"
                        ? "#f6dd00ff"
                        : "#0022EE",
                    backgroundColor: "#ffffff",
                    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.15)",
                  }}
                />
              )}

              {/* Safe Star cells icons */}
              {isSafe && (
                <Star className="w-4 h-4 md:w-5 md:h-5 text-amber-500 fill-amber-400 opacity-90 filter drop-shadow-sm" />
              )}
              {isStart && (
                <Star
                  className={`w-4 h-4 md:w-5 md:h-5 fill-white text-white filter drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.35)]`}
                />
              )}

              {/* Pieces rendering */}
              {cellPieces.length > 0 && (
                <div
                  className={`
                    absolute
                    w-full h-full
                    flex
                    items-center
                    justify-center
                    ${
                      cellPieces.length > 1
                        ? "grid grid-cols-2 gap-0.5 p-0.5 scale-75 md:scale-80"
                        : ""
                    }
                  `}
                >
                  {cellPieces.map(({ piece, color }) => {
                    const isClickable = activeValidMoves.includes(piece.id);
                    return (
                      <div
                        key={piece.id}
                        className="flex items-center justify-center w-full h-full"
                      >
                        <Piece
                          color={color}
                          isClickable={isClickable}
                          onClick={() => movePiece(piece.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3x3 Center Overlay Container */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: "40.3%",
          top: "40.3%",
          width: "19.4%",
          height: "19.4%",
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          {/* Red triangle (Left) */}
          <polygon points="0,0 50,50 0,100" fill="#ff000d" stroke="#2b2d42" strokeWidth="2.5" />
          {/* Green triangle (Top) */}
          <polygon points="0,0 100,0 50,50" fill="#0ADD08" stroke="#2b2d42" strokeWidth="2.5" />
          {/* Yellow triangle (Right) */}
          <polygon points="100,0 100,100 50,50" fill="#f6dd00ff" stroke="#2b2d42" strokeWidth="2.5" />
          {/* Blue triangle (Bottom) */}
          <polygon points="0,100 100,100 50,50" fill="#38b6ff" stroke="#2b2d42" strokeWidth="2.5" />

          {/* Golden Center ring */}
          <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#2b2d42" strokeWidth="3" />
          <circle cx="50" cy="50" r="8" fill="#ffd000" stroke="#2b2d42" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="3" fill="#ffffff" />
        </svg>

        {/* Finished Pieces Absolute Renderers */}
        {/* Red Finish list */}
        {finishedPiecesByColor.red.length > 0 && (
          <div
            className="absolute flex items-center justify-center pointer-events-auto"
            style={{ left: "20%", top: "50%", transform: "translate(-50%, -50%)" }}
          >
            <div className="relative scale-60 md:scale-75">
              {finishedPiecesByColor.red.map((piece, idx) => (
                <div
                  key={piece.id}
                  className="absolute"
                  style={{ top: `${idx * -4}px`, left: `${idx * -2}px` }}
                >
                  <Piece color="red" isClickable={false} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Green Finish list */}
        {finishedPiecesByColor.green.length > 0 && (
          <div
            className="absolute flex items-center justify-center pointer-events-auto"
            style={{ left: "50%", top: "20%", transform: "translate(-50%, -50%)" }}
          >
            <div className="relative scale-60 md:scale-75">
              {finishedPiecesByColor.green.map((piece, idx) => (
                <div
                  key={piece.id}
                  className="absolute"
                  style={{ top: `${idx * -4}px`, left: `${idx * -2}px` }}
                >
                  <Piece color="green" isClickable={false} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Yellow Finish list */}
        {finishedPiecesByColor.yellow.length > 0 && (
          <div
            className="absolute flex items-center justify-center pointer-events-auto"
            style={{ left: "80%", top: "50%", transform: "translate(-50%, -50%)" }}
          >
            <div className="relative scale-60 md:scale-75">
              {finishedPiecesByColor.yellow.map((piece, idx) => (
                <div
                  key={piece.id}
                  className="absolute"
                  style={{ top: `${idx * -4}px`, left: `${idx * -2}px` }}
                >
                  <Piece color="yellow" isClickable={false} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blue Finish list */}
        {finishedPiecesByColor.blue.length > 0 && (
          <div
            className="absolute flex items-center justify-center pointer-events-auto"
            style={{ left: "50%", top: "80%", transform: "translate(-50%, -50%)" }}
          >
            <div className="relative scale-60 md:scale-75">
              {finishedPiecesByColor.blue.map((piece, idx) => (
                <div
                  key={piece.id}
                  className="absolute"
                  style={{ top: `${idx * -4}px`, left: `${idx * -2}px` }}
                >
                  <Piece color="blue" isClickable={false} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4 Corner Dice Placeholders & Renderers */}
      {renderDiceInCorner("red")}
      {renderDiceInCorner("green")}
      {renderDiceInCorner("yellow")}
      {renderDiceInCorner("blue")}
    </div>
  );
}