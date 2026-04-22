
import { SHAPES, ShapeCell, ShapeDefinition } from "./shapes";

export const BOARD_SIZE = 8;
export const PIECES_PER_BATCH = 3;

export type BoardCell = 0 | 1;
export type Board = BoardCell[][];

export type Piece = {
  instanceId: string;
  shape: ShapeDefinition;
};

export type PlacementResult = {
  board: Board;
  scoreGained: number;
  clearedRows: number[];
  clearedCols: number[];
  placedCells: ShapeCell[];
};

function createPieceId(shapeId: string): string {
  return `${shapeId}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => 0 as BoardCell)
  );
}

export function getShapeBounds(shape: ShapeDefinition) {
  const maxRow = Math.max(...shape.cells.map((cell) => cell.row));
  const maxCol = Math.max(...shape.cells.map((cell) => cell.col));

  return {
    height: maxRow + 1,
    width: maxCol + 1,
  };
}

export function getPlacementCells(
  shape: ShapeDefinition,
  anchorRow: number,
  anchorCol: number
): ShapeCell[] {
  return shape.cells.map((cell) => ({
    row: anchorRow + cell.row,
    col: anchorCol + cell.col,
  }));
}

export function canPlaceShape(
  board: Board,
  shape: ShapeDefinition,
  anchorRow: number,
  anchorCol: number
): boolean {
  return getPlacementCells(shape, anchorRow, anchorCol).every((cell) => {
    const row = board[cell.row];
    if (!row) {
      return false;
    }

    return row[cell.col] === 0;
  });
}

export function clearCompletedLines(board: Board) {
  const clearedRows: number[] = [];
  const clearedCols: number[] = [];

  for (let rowIndex = 0; rowIndex < BOARD_SIZE; rowIndex += 1) {
    if (board[rowIndex].every((cell) => cell === 1)) {
      clearedRows.push(rowIndex);
    }
  }

  for (let colIndex = 0; colIndex < BOARD_SIZE; colIndex += 1) {
    const fullColumn = board.every((row) => row[colIndex] === 1);
    if (fullColumn) {
      clearedCols.push(colIndex);
    }
  }

  const nextBoard = board.map((row) => [...row]) as Board;

  clearedRows.forEach((rowIndex) => {
    for (let colIndex = 0; colIndex < BOARD_SIZE; colIndex += 1) {
      nextBoard[rowIndex][colIndex] = 0;
    }
  });

  clearedCols.forEach((colIndex) => {
    for (let rowIndex = 0; rowIndex < BOARD_SIZE; rowIndex += 1) {
      nextBoard[rowIndex][colIndex] = 0;
    }
  });

  return {
    board: nextBoard,
    clearedRows,
    clearedCols,
  };
}

export function calculateScore(
  shapeSize: number,
  clearedRowsCount: number,
  clearedColsCount: number
): number {
  const lineCount = clearedRowsCount + clearedColsCount;
  const placementScore = shapeSize * 5;
  const lineScore = lineCount * 40;
  const comboBonus = lineCount > 1 ? 20 : 0;

  return placementScore + lineScore + comboBonus;
}

export function placeShape(
  board: Board,
  shape: ShapeDefinition,
  anchorRow: number,
  anchorCol: number
): PlacementResult {
  const placedCells = getPlacementCells(shape, anchorRow, anchorCol);
  const nextBoard = board.map((row) => [...row]) as Board;

  placedCells.forEach((cell) => {
    nextBoard[cell.row][cell.col] = 1;
  });

  const cleared = clearCompletedLines(nextBoard);
  const scoreGained = calculateScore(
    shape.cells.length,
    cleared.clearedRows.length,
    cleared.clearedCols.length
  );

  return {
    board: cleared.board,
    scoreGained,
    clearedRows: cleared.clearedRows,
    clearedCols: cleared.clearedCols,
    placedCells,
  };
}

export function createPieceBatch(
  random: () => number = Math.random
): Piece[] {
  return Array.from({ length: PIECES_PER_BATCH }, () => {
    const shape = SHAPES[Math.floor(random() * SHAPES.length)];
    return {
      instanceId: createPieceId(shape.id),
      shape,
    };
  });
}

export function canPieceFitAnywhere(board: Board, piece: Piece): boolean {
  for (let rowIndex = 0; rowIndex < BOARD_SIZE; rowIndex += 1) {
    for (let colIndex = 0; colIndex < BOARD_SIZE; colIndex += 1) {
      if (canPlaceShape(board, piece.shape, rowIndex, colIndex)) {
        return true;
      }
    }
  }

  return false;
}

export function hasAnyValidMove(board: Board, pieces: Piece[]): boolean {
  return pieces.some((piece) => canPieceFitAnywhere(board, piece));
}
