import { Player } from "./types";

export function createPlayers(): Player[] {
  return [
    {
      color: "red",
      pieces: Array.from(
        { length: 4 },
        (_, i) => ({
          id: `red-${i}`,
          color: "red",
          position: -1,
          finished: false,
        })
      ),
    },

    {
      color: "green",
      pieces: Array.from(
        { length: 4 },
        (_, i) => ({
          id: `green-${i}`,
          color: "green",
          position: -1,
          finished: false,
        })
      ),
    },

    {
      color: "yellow",
      pieces: Array.from(
        { length: 4 },
        (_, i) => ({
          id: `yellow-${i}`,
          color: "yellow",
          position: -1,
          finished: false,
        })
      ),
    },

    {
      color: "blue",
      pieces: Array.from(
        { length: 4 },
        (_, i) => ({
          id: `blue-${i}`,
          color: "blue",
          position: -1,
          finished: false,
        })
      ),
    },
  ];
}