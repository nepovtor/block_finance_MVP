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

  return (
    <header className="safe-top-header animate-rise-in sticky top-0 z-20 -mx-3 mb-2 border-b border-white/8 bg-slate-950/55 px-3 pb-1.5 backdrop-blur">
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
      <div className="mt-1.5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[9px] uppercase tracking-[0.24em] text-cyan-200/55">
            Block Finance
          </p>
          <h1 className="text-base font-semibold leading-none text-white/92">Game</h1>
        </div>
        <p className="max-w-[10.5rem] text-right text-[10px] font-medium leading-3.5 text-white/45">
          {statusText.replace(/\n/g, " ")}
        </p>
      </div>
      <div className="mt-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <div
              className={[
                "flex h-5 min-w-5 items-center justify-center rounded-full border px-1 text-[9px] font-semibold tracking-[0.1em]",
                nextMilestone.icon === "MTB"
                  ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                  : "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100/85",
              ].join(" ")}
            >
              {nextMilestone.icon}
            </div>
            <p className="truncate text-[10px] font-medium text-white/58">
              {score >= nextMilestone.score
                ? currentAchievement.label
                : `${nextMilestone.label} ${Math.max(nextMilestone.score - score, 0)} left`}
            </p>
          </div>
          <p className="shrink-0 text-[10px] font-medium text-white/38">
            {score}/{nextMilestone.score}
          </p>
        </div>
        <div className="mt-1">
          <div className="h-1 overflow-hidden rounded-full bg-white/8">
            <div
              className={[
                "h-full rounded-full transition-[width]",
                nextMilestone.icon === "MTB"
                  ? "bg-[linear-gradient(90deg,_rgba(251,191,36,0.9),_rgba(253,230,138,0.95))]"
                  : "bg-[linear-gradient(90deg,_rgba(34,211,238,0.78),_rgba(103,232,249,0.9))]",
              ].join(" ")}
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
