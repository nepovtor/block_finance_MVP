import type { PointerEvent } from "react";
import { getShapeBounds, type Piece } from "../../game/engine";
import { type Language, t } from "../../i18n/translations";
import { getPieceGridClass, getPieceGridStyle } from "./pieceLayout";
import {
  createPieceCellLookup,
  getPieceCellStyle,
} from "./pieceContour";

type PieceTrayProps = {
  pieces: Piece[];
  selectedPieceId: string | null;
  dragPieceId: string | undefined;
  loading: boolean;
  submitting: boolean;
  gameOver: boolean;
  language: Language;
  handlePieceClick: (piece: Piece) => void;
  handlePiecePointerDown: (
    event: PointerEvent<HTMLButtonElement>,
    piece: Piece
  ) => void;
  handlePiecePointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
  handlePiecePointerUp: (event: PointerEvent<HTMLButtonElement>) => void;
  handlePiecePointerCancel: () => void;
  handleRestart: () => void;
  handleBankAndRestart: () => void;
};

export function PieceTray({
  pieces,
  selectedPieceId,
  dragPieceId,
  loading,
  submitting,
  gameOver,
  language,
  handlePieceClick,
  handlePiecePointerDown,
  handlePiecePointerMove,
  handlePiecePointerUp,
  handlePiecePointerCancel,
  handleRestart,
  handleBankAndRestart,
}: PieceTrayProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center">
      <div className="safe-bottom-tray pointer-events-auto w-full max-w-md">
        <div className="animate-fade-up border-t border-white/10 bg-slate-950/92 shadow-[0_-18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="flex justify-center px-3 py-4">
            <div className="grid grid-cols-3 gap-3">
              {pieces.map((piece) => {
                const bounds = getShapeBounds(piece.shape);
                const cellLookup = createPieceCellLookup(piece.shape.cells);
                const selected = piece.instanceId === selectedPieceId;

                return (
                  <button
                    key={piece.instanceId}
                    type="button"
                    aria-label={t("game.selectAndDragShape", language, {
                      shape: piece.shape.name,
                    })}
                    onClick={() => handlePieceClick(piece)}
                    onPointerDown={(event) => handlePiecePointerDown(event, piece)}
                    onPointerMove={handlePiecePointerMove}
                    onPointerUp={handlePiecePointerUp}
                    onPointerCancel={handlePiecePointerCancel}
                    className={[
                      "touch-none select-none rounded-xl p-1.5 transition active:scale-95",
                      selected ? "scale-105" : "",
                      dragPieceId === piece.instanceId ? "opacity-35" : "",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "piece-cluster-3d piece-cluster-tray inline-grid",
                        selected ? "brightness-110" : "",
                      ].join(" ")}
                    >
                      <div
                        className={getPieceGridClass(bounds.width)}
                        style={getPieceGridStyle()}
                      >
                        {Array.from({ length: bounds.height * bounds.width }).map(
                          (_, cellIndex) => {
                            const cellRow = Math.floor(cellIndex / bounds.width);
                            const cellCol = cellIndex % bounds.width;
                            const active = piece.shape.cells.some(
                              (cell) => cell.row === cellRow && cell.col === cellCol
                            );
                            const cellStyle = active
                              ? getPieceCellStyle(cellLookup, cellRow, cellCol, 8)
                              : undefined;

                            return (
                              <div
                                key={`${piece.instanceId}-${cellIndex}`}
                                data-piece-cell={active ? true : undefined}
                                data-piece-row={active ? cellRow : undefined}
                                data-piece-col={active ? cellCol : undefined}
                                style={cellStyle}
                                className={[
                                  "h-5 w-5 sm:h-6 sm:w-6",
                                  active
                                    ? `piece-cell-connected ${piece.shape.color}`
                                    : "opacity-0",
                                ].join(" ")}
                              />
                            );
                          }
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-white/10 px-3 py-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRestart}
                disabled={loading || submitting}
                className="flex-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {t("game.restart", language)}
              </button>
              <button
                type="button"
                onClick={handleBankAndRestart}
                disabled={loading || submitting}
                className="flex-1 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
              >
                {gameOver
                  ? t("game.saveAndPlayAgainShort", language)
                  : t("game.bankScore", language)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
