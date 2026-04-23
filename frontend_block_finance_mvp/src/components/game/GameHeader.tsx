import { Link } from "react-router-dom";

const ACHIEVEMENT_MILESTONES = [
  { score: 40, label: "First stack", icon: "◧" },
  { score: 90, label: "Clean lane", icon: "△" },
  { score: 160, label: "Hot streak", icon: "✦" },
  { score: 280, label: "MTB mode", icon: "MTB" },
] as const;

type GameHeaderProps = {
  score: number;
  scorePulse: boolean;
  rewardAvailable: boolean;
  rewardValue: number | undefined;
  statusText: string;
};

export function GameHeader({
  score,
  scorePulse,
  rewardAvailable,
  rewardValue,
  statusText,
}: GameHeaderProps) {
  const nextMilestone =
    ACHIEVEMENT_MILESTONES.find((milestone) => score < milestone.score) ??
    ACHIEVEMENT_MILESTONES[ACHIEVEMENT_MILESTONES.length - 1];
  const previousMilestone = ACHIEVEMENT_MILESTONES.reduce(
    (current, milestone) =>
      milestone.score <= score ? milestone : current,
    null as (typeof ACHIEVEMENT_MILESTONES)[number] | null
  );
  const currentAchievement = previousMilestone ?? ACHIEVEMENT_MILESTONES[0];
  const progressStart = previousMilestone?.score ?? 0;
  const progressRange = Math.max(nextMilestone.score - progressStart, 1);
  const progressValue =
    score >= nextMilestone.score
      ? 100
      : Math.max(
          0,
          Math.min(100, ((score - progressStart) / progressRange) * 100)
        );
  const progressLabel =
    score >= nextMilestone.score
      ? currentAchievement.label
      : `${nextMilestone.icon} ${Math.max(nextMilestone.score - score, 0)} left`;

  return (
    <header className="safe-top-header animate-rise-in sticky top-0 z-20 -mx-3 mb-2 border-b border-white/8 bg-slate-950/50 px-3 pb-1 backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/dashboard"
          className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/80"
        >
          ← Dashboard
        </Link>
        <div className="flex items-center gap-1.5">
          <div
            className={[
              "rounded-full px-2.5 py-1 text-[11px] font-medium transition",
              scorePulse ? "animate-score-pop" : "",
              scorePulse
                ? "bg-cyan-300 text-slate-950"
                : "bg-white/10 text-white/90",
            ].join(" ")}
          >
            Score {score}
          </div>
          <div
            className={[
              "rounded-full px-2.5 py-1 text-[11px] font-medium transition",
              rewardAvailable ? "animate-reward-pop" : "",
              rewardAvailable
                ? "bg-amber-300 text-slate-950"
                : "bg-white/10 text-white/60",
            ].join(" ")}
          >
            {rewardAvailable ? `Reward ×${rewardValue}` : "No reward"}
          </div>
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/8">
          <div
            className={[
              "h-full rounded-full transition-[width]",
              nextMilestone.icon === "MTB"
                ? "bg-[linear-gradient(90deg,_rgba(251,191,36,0.88),_rgba(253,230,138,0.92))]"
                : "bg-[linear-gradient(90deg,_rgba(34,211,238,0.72),_rgba(103,232,249,0.82))]",
            ].join(" ")}
            style={{ width: `${progressValue}%` }}
          />
        </div>
        <p className="max-w-[11rem] truncate text-[9px] font-medium text-white/40">
          {statusText.replace(/\n/g, " ")} · {progressLabel}
        </p>
      </div>
    </header>
  );
}
