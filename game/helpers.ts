import { TURNS } from "./turns";
import { PlayerColor } from "./types";
import { PATH } from "./path";
import { START_INDEX } from "./constants";

export function nextTurn(current: string): PlayerColor {
  const index = TURNS.indexOf(current as any);
  return TURNS[(index + 1) % TURNS.length];
}

export function getPieceCoordinate(
  color: PlayerColor,
  position: number,
  pieceIndex: number
): [number, number] {
  // 1. Home pockets (position === -1)
  if (position === -1) {
    switch (color) {
      case "red":
        return [
          pieceIndex < 2 ? 2 : 3,
          pieceIndex % 2 === 0 ? 2 : 3,
        ];
      case "green":
        return [
          pieceIndex < 2 ? 2 : 3,
          pieceIndex % 2 === 0 ? 11 : 12,
        ];
      case "yellow":
        return [
          pieceIndex < 2 ? 11 : 12,
          pieceIndex % 2 === 0 ? 11 : 12,
        ];
      case "blue":
        return [
          pieceIndex < 2 ? 11 : 12,
          pieceIndex % 2 === 0 ? 2 : 3,
        ];
    }
  }

  // 2. Finish position (position === 56)
  if (position === 56) {
    switch (color) {
      case "red":
        return [7, 6];
      case "green":
        return [6, 7];
      case "yellow":
        return [7, 8];
      case "blue":
        return [8, 7];
    }
  }

  // 3. Home lanes (position 51 to 55)
  if (position >= 51 && position <= 55) {
    const laneIndex = position - 50; // 1 to 5
    switch (color) {
      case "red":
        return [7, laneIndex];
      case "green":
        return [laneIndex, 7];
      case "yellow":
        return [7, 14 - laneIndex];
      case "blue":
        return [14 - laneIndex, 7];
    }
  }

  // 4. Outer path loop (position 0 to 50)
  const startIndex = START_INDEX[color];
  const globalIndex = (startIndex + position) % 52;
  return PATH[globalIndex] as [number, number];
}