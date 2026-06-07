export type PlayerColor =
  | "red"
  | "green"
  | "yellow"
  | "blue";

export interface Piece {
  id: string;
  color: PlayerColor;

  position: number;

  finished: boolean;
}

export interface Player {
  color: PlayerColor;
  pieces: Piece[];
}

export interface GameState {
  players: Player[];
  currentTurn: PlayerColor;
  diceValue: number;
}