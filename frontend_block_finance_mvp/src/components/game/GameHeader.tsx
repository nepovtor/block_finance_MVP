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
    <header className="safe-top-header animate-rise-in sticky top-0 z-20 -mx-3 mb-3 border-b border-white/10 bg-slate-950/70 px-3 pb-2 backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/dashboard"
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/85"
        >
          ← Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <div
            className={[
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
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
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
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
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.26em] text-cyan-200/70">
            Block Finance
          </p>
          <h1 className="text-lg font-bold leading-none">Game</h1>
        </div>
        <p className="max-w-[11rem] text-right text-[11px] leading-4 text-white/60">
          {statusText.replace(/\n/g, " ")}
        </p>
      </div>
      <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.04] px-2.5 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div
              className={[
                "flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-bold tracking-[0.12em]",
                nextMilestone.icon === "MTB"
                  ? "border-amber-300/40 bg-amber-300/15 text-amber-100"
                  : "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
              ].join(" ")}
            >
              {nextMilestone.icon}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] uppercase tracking-[0.18em] text-white/45">
                Achievement
              </p>
              <p className="truncate text-xs font-semibold text-white/90">
                {score >= nextMilestone.score
                  ? currentAchievement.label
                  : nextMilestone.label}
              </p>
            </div>
          </div>
          <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">
            {Math.max(nextMilestone.score - score, 0)} to go
          </p>
        </div>
        <div className="mt-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={[
                "h-full rounded-full transition-[width]",
                nextMilestone.icon === "MTB"
                  ? "bg-[linear-gradient(90deg,_#fbbf24,_#fde68a)]"
                  : "bg-[linear-gradient(90deg,_#22d3ee,_#67e8f9)]",
              ].join(" ")}
              style={{ width: `${progressValue}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-white/40">
            <span>{score} pts</span>
            <span>{nextMilestone.score} pts</span>
          </div>
        </div>
      </div>
    </header>
  );
}
