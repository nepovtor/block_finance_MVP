import { useEffect, useRef, useState, type PointerEvent } from "react";
import { BOARD_SIZE, type Piece } from "../game/engine";

export type HoveredCell = { row: number; col: number } | null;

export type DragState = {
  pieceId: string;
  clientX: number;
  clientY: number;
  anchorRow: number;
  anchorCol: number;
  moved: boolean;
};

export const DRAG_GHOST_CELL_SIZE = 28;
export const DRAG_GHOST_GAP = 0;

function getDragAnchor(
  event: PointerEvent<HTMLButtonElement>,
  piece: Piece
): { anchorRow: number; anchorCol: number } {
  const activeCells = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>("[data-piece-cell]")
  );

  const closestCell = activeCells.reduce<HTMLElement | null>((closest, cell) => {
    if (!closest) return cell;

    const cellRect = cell.getBoundingClientRect();
    const closestRect = closest.getBoundingClientRect();
    const cellDistance =
      Math.abs(event.clientX - (cellRect.left + cellRect.width / 2)) +
      Math.abs(event.clientY - (cellRect.top + cellRect.height / 2));
    const closestDistance =
      Math.abs(event.clientX - (closestRect.left + closestRect.width / 2)) +
      Math.abs(event.clientY - (closestRect.top + closestRect.height / 2));

    return cellDistance < closestDistance ? cell : closest;
  }, null);

  const fallbackCell = piece.shape.cells[0] ?? { row: 0, col: 0 };

  return {
    anchorRow: Number(closestCell?.dataset.pieceRow ?? fallbackCell.row),
    anchorCol: Number(closestCell?.dataset.pieceCol ?? fallbackCell.col),
  };
}

function getDragOrigin(
  hoveredCell: HoveredCell,
  dragState: DragState | null
): HoveredCell {
  if (!hoveredCell || !dragState) {
    return hoveredCell;
  }

  return {
    row: hoveredCell.row - dragState.anchorRow,
    col: hoveredCell.col - dragState.anchorCol,
  };
}

function getBoardCellFromPoint(
  boardElement: HTMLDivElement | null,
  clientX: number,
  clientY: number
): HoveredCell {
  if (!boardElement) {
    return null;
  }

  const boardRect = boardElement.getBoundingClientRect();

  if (
    clientX < boardRect.left ||
    clientX > boardRect.right ||
    clientY < boardRect.top ||
    clientY > boardRect.bottom
  ) {
    return null;
  }

  const firstCell = boardElement.querySelector<HTMLElement>("[data-board-cell]");
  const secondColCell = boardElement.querySelector<HTMLElement>(
    '[data-board-cell][data-row="0"][data-col="1"]'
  );
  const secondRowCell = boardElement.querySelector<HTMLElement>(
    '[data-board-cell][data-row="1"][data-col="0"]'
  );

  if (!firstCell) {
    return null;
  }

  const firstCellRect = firstCell.getBoundingClientRect();
  const cellWidth = firstCellRect.width;
  const cellHeight = firstCellRect.height;
  const gapX = secondColCell
    ? secondColCell.getBoundingClientRect().left - firstCellRect.left - cellWidth
    : 0;
  const gapY = secondRowCell
    ? secondRowCell.getBoundingClientRect().top - firstCellRect.top - cellHeight
    : 0;
  const stepX = cellWidth + gapX;
  const stepY = cellHeight + gapY;
  const relativeX = clientX - boardRect.left;
  const relativeY = clientY - boardRect.top;
  const col = Math.floor(relativeX / stepX);
  const row = Math.floor(relativeY / stepY);

  if (
    row < 0 ||
    row >= BOARD_SIZE ||
    col < 0 ||
    col >= BOARD_SIZE ||
    relativeX - col * stepX > cellWidth ||
    relativeY - row * stepY > cellHeight
  ) {
    return null;
  }

  return { row, col };
}

type UseGameDragParams = {
  pieces: Piece[];
  selectedPiece: Piece | null;
  setSelectedPieceId: (pieceId: string | null) => void;
  placePieceOnBoard: (piece: Piece | null, row: number, col: number) => boolean;
};

export function useGameDrag({
  pieces,
  selectedPiece,
  setSelectedPieceId,
  placePieceOnBoard,
}: UseGameDragParams) {
  const [hoveredCell, setHoveredCell] = useState<HoveredCell>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const dragGhostRef = useRef<HTMLDivElement | null>(null);
  const suppressNextPieceClick = useRef(false);

  useEffect(() => {
    if (!dragState || !dragGhostRef.current) return;

    dragGhostRef.current.style.left = `${
      dragState.clientX -
      (dragState.anchorCol * (DRAG_GHOST_CELL_SIZE + DRAG_GHOST_GAP) +
        DRAG_GHOST_CELL_SIZE / 2)
    }px`;
    dragGhostRef.current.style.top = `${
      dragState.clientY -
      (dragState.anchorRow * (DRAG_GHOST_CELL_SIZE + DRAG_GHOST_GAP) +
        DRAG_GHOST_CELL_SIZE / 2)
    }px`;
  }, [dragState]);

  function clearHoveredCell() {
    setHoveredCell(null);
  }

  function resetDragState() {
    setDragState(null);
    setHoveredCell(null);
  }

  function handleBoardPreview(row: number, col: number) {
    if (dragState || !selectedPiece) return;
    setHoveredCell({ row, col });
  }

  function handleBoardLeave() {
    if (dragState) return;
    setHoveredCell(null);
  }

  function handlePiecePointerDown(
    event: PointerEvent<HTMLButtonElement>,
    piece: Piece
  ) {
    const dragAnchor = getDragAnchor(event, piece);

    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedPieceId(piece.instanceId);
    setDragState({
      pieceId: piece.instanceId,
      clientX: event.clientX,
      clientY: event.clientY,
      anchorRow: dragAnchor.anchorRow,
      anchorCol: dragAnchor.anchorCol,
      moved: false,
    });
    setHoveredCell(
      getBoardCellFromPoint(boardRef.current, event.clientX, event.clientY)
    );
  }

  function handlePiecePointerMove(event: PointerEvent<HTMLButtonElement>) {
    setDragState((current) => {
      if (!current) {
        return current;
      }

      const moved =
        current.moved ||
        Math.abs(event.clientX - current.clientX) > 3 ||
        Math.abs(event.clientY - current.clientY) > 3;

      return {
        ...current,
        clientX: event.clientX,
        clientY: event.clientY,
        moved,
      };
    });

    setHoveredCell(
      getBoardCellFromPoint(boardRef.current, event.clientX, event.clientY)
    );
  }

  function handlePiecePointerUp(event: PointerEvent<HTMLButtonElement>) {
    const cell = getBoardCellFromPoint(boardRef.current, event.clientX, event.clientY);

    if (dragState?.moved) {
      suppressNextPieceClick.current = true;
    }

    const originCell = getDragOrigin(cell, dragState);
    const draggedPiece =
      pieces.find((piece) => piece.instanceId === dragState?.pieceId) ?? null;

    if (originCell) {
      const placed = placePieceOnBoard(draggedPiece, originCell.row, originCell.col);
      suppressNextPieceClick.current = suppressNextPieceClick.current || placed;
    }

    resetDragState();
  }

  function handlePiecePointerCancel() {
    resetDragState();
  }

  function handlePieceClick(piece: Piece) {
    if (suppressNextPieceClick.current) {
      suppressNextPieceClick.current = false;
      return;
    }

    setSelectedPieceId(piece.instanceId);
  }

  return {
    boardRef,
    dragGhostRef,
    dragState,
    hoveredCell,
    dragOriginCell: getDragOrigin(hoveredCell, dragState),
    handleBoardPreview,
    handleBoardLeave,
    handlePiecePointerDown,
    handlePiecePointerMove,
    handlePiecePointerUp,
    handlePiecePointerCancel,
    handlePieceClick,
    clearHoveredCell,
    resetDragState,
  };
}
