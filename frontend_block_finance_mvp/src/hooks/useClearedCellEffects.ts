import { useEffect, useState } from "react";
import { BOARD_SIZE, type Board, type Piece, placeShape } from "../game/engine";

export type ClearedCellEffect = {
  row: number;
  col: number;
  color: string;
  variant: 0 | 1 | 2 | 3;
};

export const CLEAR_ANIMATION_MS = 520;

export function useClearedCellEffects(board: Board) {
  const [clearedCellEffects, setClearedCellEffects] = useState<ClearedCellEffect[]>([]);

  useEffect(() => {
    if (clearedCellEffects.length === 0) return;
    const timeoutId = window.setTimeout(
      () => setClearedCellEffects([]),
      CLEAR_ANIMATION_MS
    );
    return () => window.clearTimeout(timeoutId);
  }, [clearedCellEffects]);

  function buildClearedCellEffects(
    move: ReturnType<typeof placeShape>,
    piece: Piece
  ) {
    if (move.clearedRows.length === 0 && move.clearedCols.length === 0) {
      return [];
    }

    const placedCellMap = new Map(
      move.placedCells.map((cell) => [`${cell.row}-${cell.col}`, piece.shape.color])
    );
    const cells = new Map<string, ClearedCellEffect>();

    move.clearedRows.forEach((rowIndex) => {
      for (let colIndex = 0; colIndex < BOARD_SIZE; colIndex += 1) {
        const key = `${rowIndex}-${colIndex}`;
        const color = placedCellMap.get(key) ?? board[rowIndex][colIndex]?.color;

        if (!color) continue;

        cells.set(key, {
          row: rowIndex,
          col: colIndex,
          color,
          variant: ((rowIndex + colIndex) % 4) as 0 | 1 | 2 | 3,
        });
      }
    });

    move.clearedCols.forEach((colIndex) => {
      for (let rowIndex = 0; rowIndex < BOARD_SIZE; rowIndex += 1) {
        const key = `${rowIndex}-${colIndex}`;
        const color = placedCellMap.get(key) ?? board[rowIndex][colIndex]?.color;

        if (!color) continue;

        cells.set(key, {
          row: rowIndex,
          col: colIndex,
          color,
          variant: ((rowIndex + colIndex + 1) % 4) as 0 | 1 | 2 | 3,
        });
      }
    });

    return Array.from(cells.values());
  }

  return {
    clearedCellEffects,
    setClearedCellEffects,
    buildClearedCellEffects,
  };
}
