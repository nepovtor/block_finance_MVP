import { Link } from "react-router-dom";

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
    </header>
  );
}
