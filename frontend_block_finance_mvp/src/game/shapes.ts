export type ShapeCell = {
  row: number;
  col: number;
};

export type ShapeDefinition = {
  id: string;
  name: string;
  color: string;
  accentLabel: string;
  accentPattern: "coin" | "bill" | "vault" | "card" | "chart" | "bank";
  cells: ShapeCell[];
};

type BaseShapeDefinition = Omit<ShapeDefinition, "cells"> & {
  cells: ShapeCell[];
  rotations?: number[];
};

function normalizeCells(cells: ShapeCell[]): ShapeCell[] {
  const minRow = Math.min(...cells.map((cell) => cell.row));
  const minCol = Math.min(...cells.map((cell) => cell.col));

  return cells
    .map((cell) => ({
      row: cell.row - minRow,
      col: cell.col - minCol,
    }))
    .sort((a, b) => a.row - b.row || a.col - b.col);
}

function rotateCells(cells: ShapeCell[], rotation: number): ShapeCell[] {
  const normalized = normalizeCells(cells);
  const maxRow = Math.max(...normalized.map((cell) => cell.row));
  const maxCol = Math.max(...normalized.map((cell) => cell.col));

  switch (rotation % 360) {
    case 0:
      return normalizeCells(normalized);

    case 90:
      return normalizeCells(
        normalized.map((cell) => ({
          row: cell.col,
          col: maxRow - cell.row,
        }))
      );

    case 180:
      return normalizeCells(
        normalized.map((cell) => ({
          row: maxRow - cell.row,
          col: maxCol - cell.col,
        }))
      );

    case 270:
      return normalizeCells(
        normalized.map((cell) => ({
          row: maxCol - cell.col,
          col: cell.row,
        }))
      );

    default:
      return normalizeCells(normalized);
  }
}

function getCellsKey(cells: ShapeCell[]) {
  return normalizeCells(cells)
    .map((cell) => `${cell.row}:${cell.col}`)
    .join("|");
}

function getRotationSuffix(rotation: number) {
  switch (rotation) {
    case 0:
      return "0";
    case 90:
      return "90";
    case 180:
      return "180";
    case 270:
      return "270";
    default:
      return String(rotation);
  }
}

function expandShapeRotations(baseShapes: BaseShapeDefinition[]): ShapeDefinition[] {
  return baseShapes.flatMap((shape) => {
    const rotations = shape.rotations ?? [0, 90, 180, 270];
    const seen = new Set<string>();

    return rotations.flatMap((rotation) => {
      const rotatedCells = rotateCells(shape.cells, rotation);
      const key = getCellsKey(rotatedCells);

      if (seen.has(key)) {
        return [];
      }

      seen.add(key);

      const suffix = getRotationSuffix(rotation);

      return {
        id: `${shape.id}-r${suffix}`,
        name: `${shape.name} ${suffix}`,
        color: shape.color,
        accentLabel: shape.accentLabel,
        accentPattern: shape.accentPattern,
        cells: rotatedCells,
      };
    });
  });
}

const BASE_SHAPES: BaseShapeDefinition[] = [
  {
    id: "single",
    name: "Single",
    color: "bg-emerald-400",
    accentLabel: "APR",
    accentPattern: "coin",
    rotations: [0],
    cells: [{ row: 0, col: 0 }],
  },
  {
    id: "line-2",
    name: "Line 2",
    color: "bg-cyan-400",
    accentLabel: "FX",
    accentPattern: "chart",
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ],
  },
  {
    id: "line-3",
    name: "Line 3",
    color: "bg-sky-400",
    accentLabel: "PAY",
    accentPattern: "card",
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ],
  },
  {
    id: "line-4",
    name: "Line 4",
    color: "bg-indigo-400",
    accentLabel: "BANK",
    accentPattern: "bank",
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
    ],
  },
  {
    id: "line-5",
    name: "Line 5",
    color: "bg-violet-400",
    accentLabel: "SAFE",
    accentPattern: "vault",
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
      { row: 0, col: 4 },
    ],
  },
  {
    id: "square-2",
    name: "Square",
    color: "bg-amber-400",
    accentLabel: "USD",
    accentPattern: "bill",
    rotations: [0],
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ],
  },
  {
    id: "rect-3x2",
    name: "Card Rect",
    color: "bg-yellow-400",
    accentLabel: "CARD",
    accentPattern: "card",
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
    ],
  },
  {
    id: "l-3",
    name: "L 3",
    color: "bg-orange-400",
    accentLabel: "ROI",
    accentPattern: "chart",
    cells: [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ],
  },
  {
    id: "l-4",
    name: "L 4",
    color: "bg-rose-400",
    accentLabel: "LOAN",
    accentPattern: "bill",
    cells: [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
    ],
  },
  {
    id: "l-5",
    name: "L 5",
    color: "bg-red-400",
    accentLabel: "FUND",
    accentPattern: "chart",
    cells: [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
      { row: 3, col: 0 },
      { row: 3, col: 1 },
    ],
  },
  {
    id: "big-corner",
    name: "Big Corner",
    color: "bg-orange-500",
    accentLabel: "GAIN",
    accentPattern: "chart",
    cells: [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
    ],
  },
  {
    id: "t-4",
    name: "T",
    color: "bg-fuchsia-400",
    accentLabel: "COIN",
    accentPattern: "coin",
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 1 },
    ],
  },
  {
    id: "zig-4",
    name: "Zig",
    color: "bg-lime-400",
    accentLabel: "LEDG",
    accentPattern: "bank",
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
    ],
  },
  {
    id: "step-4",
    name: "Step",
    color: "bg-teal-400",
    accentLabel: "CASH",
    accentPattern: "vault",
    cells: [
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ],
  },
  {
    id: "plus-5",
    name: "Plus",
    color: "bg-green-400",
    accentLabel: "PLUS",
    accentPattern: "coin",
    rotations: [0],
    cells: [
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 2, col: 1 },
    ],
  },
  {
    id: "u-5",
    name: "U Vault",
    color: "bg-blue-500",
    accentLabel: "SAFE",
    accentPattern: "vault",
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
    ],
  },
  {
    id: "p-5",
    name: "P Block",
    color: "bg-amber-500",
    accentLabel: "BANK",
    accentPattern: "bank",
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 2, col: 0 },
    ],
  },
  {
    id: "chip-5",
    name: "Chip",
    color: "bg-cyan-500",
    accentLabel: "CHIP",
    accentPattern: "card",
    cells: [
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 2, col: 0 },
    ],
  },
  {
    id: "vault-6",
    name: "Vault Block",
    color: "bg-purple-500",
    accentLabel: "VAULT",
    accentPattern: "vault",
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
    ],
  },
  {
    id: "wallet-5",
    name: "Wallet",
    color: "bg-pink-500",
    accentLabel: "MOBY",
    accentPattern: "bank",
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 0 },
      { row: 1, col: 2 },
    ],
  },
];

export const SHAPES: ShapeDefinition[] = expandShapeRotations(BASE_SHAPES);
