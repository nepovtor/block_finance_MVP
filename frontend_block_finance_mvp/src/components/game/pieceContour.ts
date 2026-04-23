import type { CSSProperties } from "react";
import type { ShapeCell } from "../../game/shapes";
import { PIECE_CELL_OVERLAP, PIECE_SURFACE_OVERLAP } from "./pieceLayout";

type PieceCellLookup = Set<string>;

function getCellKey(row: number, col: number) {
  return `${row}:${col}`;
}

export function createPieceCellLookup(cells: ShapeCell[]): PieceCellLookup {
  return new Set(cells.map((cell) => getCellKey(cell.row, cell.col)));
}

export function getPieceCellStyle(
  cellLookup: PieceCellLookup,
  row: number,
  col: number,
  radius: number
): CSSProperties {
  const hasTop = cellLookup.has(getCellKey(row - 1, col));
  const hasRight = cellLookup.has(getCellKey(row, col + 1));
  const hasBottom = cellLookup.has(getCellKey(row + 1, col));
  const hasLeft = cellLookup.has(getCellKey(row, col - 1));

  return {
    borderTopLeftRadius: !hasTop && !hasLeft ? `${radius}px` : "0px",
    borderTopRightRadius: !hasTop && !hasRight ? `${radius}px` : "0px",
    borderBottomRightRadius: !hasBottom && !hasRight ? `${radius}px` : "0px",
    borderBottomLeftRadius: !hasBottom && !hasLeft ? `${radius}px` : "0px",
    marginRight: hasRight ? `${-PIECE_CELL_OVERLAP}px` : undefined,
    marginBottom: hasBottom ? `${-PIECE_CELL_OVERLAP}px` : undefined,
    zIndex: hasRight || hasBottom ? 1 : 0,
    "--piece-surface-top-inset": hasTop ? `${-PIECE_SURFACE_OVERLAP}px` : "0px",
    "--piece-surface-right-inset": hasRight ? `${-PIECE_SURFACE_OVERLAP}px` : "0px",
    "--piece-surface-bottom-inset": hasBottom ? `${-PIECE_SURFACE_OVERLAP}px` : "0px",
    "--piece-surface-left-inset": hasLeft ? `${-PIECE_SURFACE_OVERLAP}px` : "0px",
    "--piece-edge-top-alpha": hasTop ? "0" : "0.08",
    "--piece-edge-right-alpha": hasRight ? "0" : "0.08",
    "--piece-edge-bottom-alpha": hasBottom ? "0" : "0.08",
    "--piece-edge-left-alpha": hasLeft ? "0" : "0.08",
    "--piece-gloss-opacity": hasTop ? "0.08" : "0.82",
  } as CSSProperties;
}
