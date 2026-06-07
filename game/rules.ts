import { Player, PlayerColor } from "./types";

export function rollDice(needsSix: boolean = false): number {
  if (needsSix) {
    // 30% chance of rolling a 6 when needed (first-release helper), 70% chance of rolling 1-5
    const rand = Math.random();
    if (rand < 0.30) {
      return 6;
    } else {
      return Math.floor(Math.random() * 5) + 1; // 1 to 5
    }
  }
  // Standard fair roll
  return Math.floor(Math.random() * 6) + 1;
}

export function canLeaveHome(dice: number): boolean {
  return dice === 6;
}

export function getValidMoves(
  players: Player[],
  color: PlayerColor,
  diceValue: number
): string[] {
  const player = players.find((p) => p.color === color);
  if (!player) return [];

  const validPieceIds: string[] = [];

  player.pieces.forEach((piece) => {
    // Finished pieces cannot move
    if (piece.finished || piece.position === 56) {
      return;
    }

    // Inside home pocket (-1) requires a 6 to leave
    if (piece.position === -1) {
      if (diceValue === 6) {
        validPieceIds.push(piece.id);
      }
      return;
    }

    // On the board: position + diceValue must not overshoot 56
    if (piece.position >= 0) {
      if (piece.position + diceValue <= 56) {
        validPieceIds.push(piece.id);
      }
    }
  });

  return validPieceIds;
}