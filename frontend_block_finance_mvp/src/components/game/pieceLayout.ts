import type { CSSProperties } from "react";

export const PIECE_CELL_GAP = 0;
export const PIECE_CELL_OVERLAP = 1;

export function getPieceGridClass(width: number) {
  switch (width) {
    case 1:
      return "grid grid-cols-1";
    case 2:
      return "grid grid-cols-2";
    case 3:
      return "grid grid-cols-3";
    case 4:
      return "grid grid-cols-4";
    default:
      return "grid grid-cols-5";
  }
}

export function getPieceGridStyle(): CSSProperties {
  return {
    gap: `${PIECE_CELL_GAP}px`,
  };
}
