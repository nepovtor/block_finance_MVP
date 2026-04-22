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

export const SHAPES: ShapeDefinition[] = [
  {
    id: "single",
    name: "Single",
    color: "bg-emerald-400",
    accentLabel: "APR",
    accentPattern: "coin",
    cells: [{ row: 0, col: 0 }],
  },
  {
    id: "line-2-h",
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
    id: "line-3-h",
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
    id: "line-4-h",
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
    id: "line-5-v",
    name: "Line 5",
    color: "bg-violet-400",
    accentLabel: "SAFE",
    accentPattern: "vault",
    cells: [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
      { row: 3, col: 0 },
      { row: 4, col: 0 },
    ],
  },
  {
    id: "square-2",
    name: "Square",
    color: "bg-amber-400",
    accentLabel: "USD",
    accentPattern: "bill",
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
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
    id: "j-4",
    name: "J 4",
    color: "bg-pink-400",
    accentLabel: "CARD",
    accentPattern: "card",
    cells: [
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 2, col: 1 },
      { row: 2, col: 0 },
    ],
  },
  {
    id: "t-4",
    name: "T 4",
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
];
