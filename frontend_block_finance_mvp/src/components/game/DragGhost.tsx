import type { Ref } from "react";
import type { Piece } from "../../game/engine";
import {
  DRAG_GHOST_CELL_GAP,
  DRAG_GHOST_CELL_RADIUS,
  DRAG_GHOST_CELL_SIZE,
} from "../../hooks/useGameDrag";

function getShapeGridClass(width: number) {
  switch (width) {
    case 1:
      return "grid-cols-1";
    case 2:
      return "grid-cols-2";
    case 3:
      return "grid-cols-3";
    case 4:
      return "grid-cols-4";
    default:
      return "grid-cols-5";
  }
}

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
  return (
    <div ref={dragGhostRef} className="pointer-events-none fixed z-50 opacity-85">
      <div
        className={["grid", getShapeGridClass(width)].join(" ")}
        style={{ gap: `${DRAG_GHOST_CELL_GAP}px` }}
      >
        {Array.from({ length: height * width }).map((_, cellIndex) => {
          const cellRow = Math.floor(cellIndex / width);
          const cellCol = cellIndex % width;
          const active = piece.shape.cells.some(
            (cell) => cell.row === cellRow && cell.col === cellCol
          );

          return (
            <div
              key={`${piece.instanceId}-drag-${cellIndex}`}
              className={[
                active
                  ? `${piece.shape.color} shadow-[inset_0_1px_5px_rgba(255,255,255,0.45),0_4px_10px_rgba(0,0,0,0.28)]`
                  : "opacity-0",
              ].join(" ")}
              style={{
                width: `${DRAG_GHOST_CELL_SIZE}px`,
                height: `${DRAG_GHOST_CELL_SIZE}px`,
                borderRadius: `${DRAG_GHOST_CELL_RADIUS}px`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
