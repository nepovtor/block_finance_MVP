import type { Ref } from "react";
import type { Board } from "../../game/engine";
import { type Language, t } from "../../i18n/translations";

type ClearedCellEffect = {
  row: number;
  col: number;
  color: string;
  variant: 0 | 1 | 2 | 3;
};

type GameBoardProps = {
  board: Board;
  boardRef: Ref<HTMLDivElement>;
  boardFlash: boolean;
  invalidMovePulse: boolean;
  previewCellMap: Map<string, boolean>;
  clearedCellMap: Map<string, ClearedCellEffect>;
  language: Language;
  handleBoardClick: (row: number, col: number) => void;
};

export function GameBoard({
  board,
  boardRef,
  boardFlash,
  invalidMovePulse,
  previewCellMap,
  clearedCellMap,
  language,
  handleBoardClick,
}: GameBoardProps) {
  return (
    <section
      className={[
        "animate-fade-up relative mx-auto w-full max-w-[22rem] rounded-[2rem] border border-white/10 bg-slate-950/55 p-3 shadow-[0_22px_80px_rgba(0,0,0,0.48)] transition",
        boardFlash ? "animate-board-flash ring-4 ring-emerald-300/20" : "",
        invalidMovePulse ? "animate-shake-soft" : "",
      ].join(" ")}
    >
      <div ref={boardRef} className="game-board grid">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const previewState = previewCellMap.get(`${rowIndex}-${colIndex}`);
            const clearedEffect = clearedCellMap.get(`${rowIndex}-${colIndex}`);
            const occupied = cell !== null;
            const previewClass =
              previewState === undefined
                ? ""
                : previewState
                  ? "bg-emerald-400/70 ring-2 ring-emerald-200/80"
                  : "bg-rose-500/70 ring-2 ring-rose-200/70";

            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                type="button"
                aria-label={t("game.placeSelectedShapeAt", language, {
                  row: rowIndex + 1,
                  col: colIndex + 1,
                })}
                data-board-cell
                data-row={rowIndex}
                data-col={colIndex}
                onClick={() => handleBoardClick(rowIndex, colIndex)}
                className={[
                  "relative aspect-square overflow-hidden rounded-xl border transition",
                  occupied
                    ? `${cell.color} border-white/10 shadow-[inset_0_1px_8px_rgba(255,255,255,0.35),0_4px_10px_rgba(0,0,0,0.24)]`
                    : "border-white/5 bg-[#14203b] hover:bg-[#1a2948]",
                  previewClass,
                ].join(" ")}
              >
                {clearedEffect ? (
                  <span
                    className={[
                      "pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_1px_8px_rgba(255,255,255,0.35),0_4px_10px_rgba(0,0,0,0.24)]",
                      `line-clear-${clearedEffect.variant}`,
                      clearedEffect.color,
                    ].join(" ")}
                  />
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
