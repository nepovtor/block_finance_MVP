export type ShapeCell = {
  row: number;
  col: number;
};

export type ShapeDefinition = {
  id: string;
  name: string;
  color: string;
  accentLabel: string;
  accentPattern:
    | "coin"
    | "chip"
    | "card"
    | "bank"
    | "vault"
    | "token"
    | "terminal"
    | "money"
    | "moby"
    | "dollar"
    | "gateway"
    | "ledger";
  cells: ShapeCell[];
};

export const SHAPES: ShapeDefinition[] = [
  {
    id: "single",
    name: "Reward Token",
    color: "bg-amber-400",
    accentLabel: "TOKEN",
    accentPattern: "coin",
    cells: [{ row: 0, col: 0 }],
  },
  {
    id: "line-2-h",
    name: "Card Chip",
    color: "bg-emerald-400",
    accentLabel: "CHIP",
    accentPattern: "chip",
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ],
  },
  {
    id: "line-3-h",
    name: "Bank Card",
    color: "bg-sky-400",
    accentLabel: "CARD",
    accentPattern: "card",
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ],
  },
  {
    id: "line-4-h",
    name: "Bank Building",
    color: "bg-blue-500",
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
    name: "Vault Tower",
    color: "bg-slate-400",
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
    name: "Coin Stack",
    color: "bg-yellow-400",
    accentLabel: "STACK",
    accentPattern: "token",
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ],
  },
  {
    id: "l-3",
    name: "Terminal",
    color: "bg-teal-400",
    accentLabel: "TAP",
    accentPattern: "terminal",
    cells: [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ],
  },
  {
    id: "l-4",
    name: "Cash Bundle",
    color: "bg-emerald-500",
    accentLabel: "CASH",
    accentPattern: "money",
    cells: [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
    ],
  },
  {
    id: "j-4",
    name: "Moby Emblem",
    color: "bg-cyan-400",
    accentLabel: "MOBY",
    accentPattern: "moby",
    cells: [
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 2, col: 1 },
      { row: 2, col: 0 },
    ],
  },
  {
    id: "t-4",
    name: "Dollar Totem",
    color: "bg-lime-400",
    accentLabel: "FLOW",
    accentPattern: "dollar",
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 1 },
    ],
  },
  {
    id: "zig-4",
    name: "Gateway Rail",
    color: "bg-indigo-400",
    accentLabel: "GATE",
    accentPattern: "gateway",
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
    ],
  },
  {
    id: "step-4",
    name: "Ledger Block",
    color: "bg-amber-300",
    accentLabel: "LEDGER",
    accentPattern: "ledger",
    cells: [
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ],
  },
];
