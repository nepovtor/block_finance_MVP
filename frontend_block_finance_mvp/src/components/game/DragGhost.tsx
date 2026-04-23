import type { Ref } from "react";
import type { Piece } from "../../game/engine";
import {
  DRAG_GHOST_CELL_RADIUS,
  DRAG_GHOST_CELL_SIZE,
} from "../../hooks/useGameDrag";
import { getPieceGridClass, getPieceGridStyle } from "./pieceLayout";
import {
  createPieceCellLookup,
  getPieceCellStyle,
} from "./pieceContour";

type DragGhostProps = {
  piece: Piece;
  width: number;
  height: number;
  dragGhostRef: Ref<HTMLDivElement>;
};

export function DragGhost({
  piece,
  width,
  height,
  dragGhostRef,
}: DragGhostProps) {
  const cellLookup = createPieceCellLookup(piece.shape.cells);

  return (
    <div ref={dragGhostRef} className="pointer-events-none fixed z-50 opacity-85">
      <div
        className={getPieceGridClass(width)}
        style={getPieceGridStyle()}
      >
        {Array.from({ length: height * width }).map((_, cellIndex) => {
          const cellRow = Math.floor(cellIndex / width);
          const cellCol = cellIndex % width;
          const active = piece.shape.cells.some(
            (cell) => cell.row === cellRow && cell.col === cellCol
          );
          const cellStyle = active
            ? {
                ...getPieceCellStyle(
                  cellLookup,
                  cellRow,
                  cellCol,
                  DRAG_GHOST_CELL_RADIUS
                ),
                width: `${DRAG_GHOST_CELL_SIZE}px`,
                height: `${DRAG_GHOST_CELL_SIZE}px`,
              }
            : {
                width: `${DRAG_GHOST_CELL_SIZE}px`,
                height: `${DRAG_GHOST_CELL_SIZE}px`,
              };

          return (
            <div
              key={`${piece.instanceId}-drag-${cellIndex}`}
              className={[
                active
                  ? `piece-cell-3d piece-cell-ghost ${piece.shape.color}`
                  : "opacity-0",
              ].join(" ")}
              style={cellStyle}
            >
              {active ? <span className="piece-cell-surface" /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
