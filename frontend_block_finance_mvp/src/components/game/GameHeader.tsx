import { Link } from "react-router-dom";
import { type Language, t } from "../../i18n/translations";

const ACHIEVEMENT_MILESTONES = [
  { score: 5000, labelKey: "game.milestoneStarter", badge: "I" },
  { score: 15000, labelKey: "game.milestoneBuilder", badge: "II" },
  { score: 45000, labelKey: "game.milestoneCapital", badge: "III" },
  { score: 100000, labelKey: "game.milestoneLegend", badge: "MAX" },
] as const;

type GameHeaderProps = {
  score: number;
  scorePulse: boolean;
  rewardAvailable: boolean;
  rewardValue: number | undefined;
  statusText: string;
  language: Language;
};

export function GameHeader({
  score,
  scorePulse,
  rewardAvailable,
  rewardValue,
  statusText,
  language,
}: GameHeaderProps) {
  void rewardAvailable;
  void rewardValue;
  void statusText;

  const completedMaxMilestone =
    score >= ACHIEVEMENT_MILESTONES[ACHIEVEMENT_MILESTONES.length - 1].score;
  const nextMilestone = completedMaxMilestone
    ? ACHIEVEMENT_MILESTONES[ACHIEVEMENT_MILESTONES.length - 1]
    : ACHIEVEMENT_MILESTONES.find((milestone) => score < milestone.score) ??
      ACHIEVEMENT_MILESTONES[ACHIEVEMENT_MILESTONES.length - 1];
  const previousMilestone = ACHIEVEMENT_MILESTONES.reduce(
    (current, milestone) => (milestone.score <= score ? milestone : current),
    null as (typeof ACHIEVEMENT_MILESTONES)[number] | null
  );
  const progressStart = completedMaxMilestone
    ? nextMilestone.score
    : previousMilestone?.score ?? 0;
  const progressRange = Math.max(nextMilestone.score - progressStart, 1);
  const progressValue = completedMaxMilestone
    ? 100
    : Math.max(0, Math.min(100, ((score - progressStart) / progressRange) * 100));
  const nextGoalLabel = completedMaxMilestone
    ? t("game.maxMilestoneReached", language)
    : t("game.nextGoal", language, {
        value: nextMilestone.score.toLocaleString(),
      });
  const progressCopy = completedMaxMilestone
    ? t("game.maxMilestoneComplete", language, {
        label: t(nextMilestone.labelKey, language),
      })
    : t("game.milestoneProgress", language, {
        current: score.toLocaleString(),
        target: nextMilestone.score.toLocaleString(),
      });
  const progressBarClass = completedMaxMilestone
    ? "bg-[linear-gradient(90deg,_rgba(251,191,36,0.96),_rgba(253,224,71,0.92))]"
    : "bg-[linear-gradient(90deg,_rgba(16,185,129,0.95),_rgba(34,211,238,0.92))]";

  return (
    <header className="safe-top-header animate-rise-in sticky top-0 z-20 -mx-3 mb-2 border-b border-white/8 bg-[linear-gradient(180deg,rgba(2,6,23,0.92),rgba(15,23,42,0.72))] px-3 pb-2 backdrop-blur-xl">
      <div className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.68),rgba(15,23,42,0.42))] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_14px_30px_rgba(2,6,23,0.2)]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              to="/dashboard"
              aria-label={t("game.backToDashboard", language)}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]"
            >
              ←
            </Link>
            <p className="truncate text-[0.86rem] font-semibold text-white">
              MTBlocks
            </p>
          </div>
          <div
            className={[
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-right transition",
              scorePulse ? "animate-score-pop" : "",
              scorePulse
                ? "border-cyan-200/60 bg-cyan-300 text-slate-950"
                : "border-white/10 bg-white/[0.06] text-white",
            ].join(" ")}
          >
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] opacity-65">
              {t("game.pointsLabel", language)}
            </span>
            <span className="text-[0.92rem] font-bold leading-none">
              {score.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-[0.72rem] font-medium text-white/82">
              {nextGoalLabel}
            </p>
            <span className="shrink-0 text-[0.66rem] font-semibold text-white/52">
              {completedMaxMilestone ? nextMilestone.badge : progressCopy}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={["h-full rounded-full transition-[width]", progressBarClass].join(
                " "
              )}
              style={{ width: `${progressValue}%` }}
            />
          </div>
          {!completedMaxMilestone ? (
            <p className="mt-1 truncate text-[0.64rem] text-white/42">
              {t(nextMilestone.labelKey, language)}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
