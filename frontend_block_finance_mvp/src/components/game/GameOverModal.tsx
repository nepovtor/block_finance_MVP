type GameOverModalProps = {
  score: number;
  movesUsed: number;
  extraMovesUsed: number;
  rewardAvailable: boolean;
  submitting: boolean;
  onRestart: () => void;
  onUseExtraMove: () => void;
  onBankAndRestart: () => void;
};

export function GameOverModal({
  score,
  movesUsed,
  extraMovesUsed,
  rewardAvailable,
  submitting,
  onRestart,
  onUseExtraMove,
  onBankAndRestart,
}: GameOverModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/70 px-3 backdrop-blur-sm sm:items-center">
      <div className="safe-bottom-modal mb-3 w-full max-w-sm rounded-[2rem] border border-white/10 bg-slate-950/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <p className="text-[10px] uppercase tracking-[0.24em] text-amber-200/70">
          Run finished
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white">Game Over</h2>
        <p className="mt-2 text-sm text-white/65">
          None of the current 3 pieces can be placed on the board.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white/[0.05] p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
              Score
            </p>
            <p className="mt-1 text-xl font-bold text-white">{score}</p>
          </div>
          <div className="rounded-2xl bg-white/[0.05] p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
              Moves
            </p>
            <p className="mt-1 text-xl font-bold text-white">{movesUsed}</p>
          </div>
        </div>

        <p className="mt-3 text-xs text-white/50">
          Extra moves used: {extraMovesUsed}
        </p>

        <div className="mt-5 space-y-2">
          {rewardAvailable ? (
            <button
              type="button"
              onClick={onUseExtraMove}
              disabled={submitting}
              className="w-full rounded-2xl bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              Use extra move reward
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRestart}
            disabled={submitting}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Restart
          </button>
          <button
            type="button"
            onClick={onBankAndRestart}
            disabled={submitting}
            className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
          >
            Save score and play again
          </button>
        </div>
      </div>
    </div>
  );
}
