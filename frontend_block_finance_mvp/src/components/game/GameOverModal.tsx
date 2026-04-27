import { type LeaderboardEntry } from "../../services/api";
import { type Language, t } from "../../i18n/translations";

type GameOverModalProps = {
  score: number;
  movesUsed: number;
  extraMovesUsed: number;
  rewardAvailable: boolean;
  submitting: boolean;
  language: Language;
  leaderboard: LeaderboardEntry[];
  onRestart: () => void;
  onUseExtraMove: () => void;
  onBankAndRestart: () => void;
};

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  if (minutes <= 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export function GameOverModal({
  score,
  movesUsed,
  extraMovesUsed,
  rewardAvailable,
  submitting,
  language,
  leaderboard,
  onRestart,
  onUseExtraMove,
  onBankAndRestart,
}: GameOverModalProps) {
  const leaderboardTitle = language === "ru" ? "Список лидеров" : "Leaderboard";
  const noLeaders = language === "ru" ? "Сохранённых рекордов пока нет" : "No saved records yet";
  const bestLabel = language === "ru" ? "Золотое место" : "Gold place";
  const scoreLabel = language === "ru" ? "Счёт" : "Score";
  const timeLabel = language === "ru" ? "Время" : "Time";

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/70 px-3 backdrop-blur-sm sm:items-center">
      <div className="safe-bottom-modal mb-3 max-h-[94dvh] w-full max-w-sm overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-950/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <p className="text-[10px] uppercase tracking-[0.24em] text-amber-200/70">
          {t("game.runFinished", language)}
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white">
          {t("game.gameOver", language)}
        </h2>
        <p className="mt-2 text-sm text-white/65">
          {t("game.noPlacements", language)}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white/[0.05] p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
              {t("game.scoreLabel", language)}
            </p>
            <p className="mt-1 text-xl font-bold text-white">{score}</p>
          </div>
          <div className="rounded-2xl bg-white/[0.05] p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
              {t("game.moves", language)}
            </p>
            <p className="mt-1 text-xl font-bold text-white">{movesUsed}</p>
          </div>
        </div>

        <p className="mt-3 text-xs text-white/50">
          {t("game.extraMovesUsed", language, { value: extraMovesUsed })}
        </p>

        <section className="mt-4 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
              {leaderboardTitle}
            </p>
            <span className="rounded-full border border-amber-200/20 bg-amber-200/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-100">
              Top
            </span>
          </div>

          {leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((entry) => {
                const isGold = entry.rank === 1;

                return (
                  <div
                    key={`${entry.rank}-${entry.name}-${entry.score}-${entry.finished_at ?? ""}`}
                    className={[
                      "rounded-2xl border p-3",
                      isGold
                        ? "border-amber-200/35 bg-[linear-gradient(135deg,rgba(251,191,36,0.18),rgba(255,255,255,0.04))]"
                        : "border-white/8 bg-slate-950/45",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={[
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black",
                            isGold
                              ? "bg-amber-300 text-slate-950 shadow-[0_0_22px_rgba(251,191,36,0.35)]"
                              : "bg-white/10 text-white/75",
                          ].join(" ")}
                        >
                          {isGold ? "1" : entry.rank}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {entry.name}
                          </p>
                          {isGold ? (
                            <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-amber-100/75">
                              {bestLabel}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-white">
                          {entry.score.toLocaleString()}
                        </p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/38">
                          {scoreLabel}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between rounded-xl bg-black/12 px-3 py-2 text-xs text-white/56">
                      <span>{timeLabel}</span>
                      <span className="font-semibold text-white/80">
                        {formatDuration(entry.duration_seconds)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-4 text-sm text-white/50">
              {noLeaders}
            </p>
          )}
        </section>

        <div className="mt-5 space-y-2">
          {rewardAvailable ? (
            <button
              type="button"
              onClick={onUseExtraMove}
              disabled={submitting}
              className="w-full rounded-2xl bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              {t("game.useExtraMoveReward", language)}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRestart}
            disabled={submitting}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {t("game.restart", language)}
          </button>
          <button
            type="button"
            onClick={onBankAndRestart}
            disabled={submitting}
            className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
          >
            {t("game.saveScoreAndPlayAgain", language)}
          </button>
        </div>
      </div>
    </div>
  );
}
