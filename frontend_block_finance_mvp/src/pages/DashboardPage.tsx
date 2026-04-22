import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getProfile, makeDemoPayment } from "../services/api";
import { useAppStore } from "../store/appStore";

export default function DashboardPage() {
  const { user, reward, setReward, setUser } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState("");
  const [rewardPulse, setRewardPulse] = useState(false);
  const hasReward = reward?.type === "extra_move" && reward.value > 0;
  const xpProgress = Math.min(100, Math.round((user.xp / user.xpToNext) * 100));

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const profile = await getProfile();
        if (active) {
          setUser(profile);
          setReward(profile.activeReward);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load profile");
        }
      } finally {
        if (active) {
          setProfileLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [setReward, setUser]);

  useEffect(() => {
    if (!rewardPulse) {
      return;
    }

    const timeoutId = window.setTimeout(() => setRewardPulse(false), 650);
    return () => window.clearTimeout(timeoutId);
  }, [rewardPulse]);

  const handleCoffeePayment = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await makeDemoPayment();

      if (response.reward_granted && response.reward) {
        setReward(response.reward);
        setRewardPulse(true);
      } else {
        setReward(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-clip p-4 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="glass-panel animate-rise-in bg-grid relative overflow-hidden p-6 sm:p-8">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute bottom-0 left-10 h-24 w-24 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="text-sm uppercase tracking-[0.28em] text-emerald-200">
                Dashboard
              </div>
              <h1 className="mt-3 text-3xl font-bold text-white sm:text-5xl">
                Hi, {user.name}
              </h1>
              <p className="mt-3 max-w-xl text-balance text-base leading-7 text-slate-300">
                One payment unlocks one clear gameplay advantage. This is the
                core MVP loop: spend, earn a reward, and turn engagement into
                progress.
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-300/15 bg-emerald-400/10 p-5 text-sm text-emerald-100 shadow-lg shadow-emerald-950/20">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">
                Live demo flow
              </div>
              <div className="mt-3 font-medium">
                Pay for coffee -&gt; reward appears -&gt; open game -&gt; use
                revive
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div className="glass-panel p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
                    Profile
                  </div>
                  <div className="mt-2 text-xl font-semibold text-white">
                    Financial progress with game energy
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                  {profileLoading ? "Syncing" : "Connected"}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="stat-tile">
                  <div className="text-sm text-slate-400">Level</div>
                  <div className="mt-2 text-3xl font-bold text-white">
                    {user.level}
                  </div>
                </div>
                <div className="stat-tile">
                  <div className="text-sm text-slate-400">Streak</div>
                  <div className="mt-2 text-3xl font-bold text-white">
                    {user.streak}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.16em] text-amber-200">
                    Days active
                  </div>
                </div>
                <div className="stat-tile">
                  <div className="text-sm text-slate-400">XP</div>
                  <div className="mt-2 text-3xl font-bold text-white">
                    {user.xp}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    of {user.xpToNext} to next level
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/8 bg-slate-950/50 p-4">
                <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
                  <span>XP progress</span>
                  <span>{xpProgress}%</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-emerald-400 to-amber-300 transition-all duration-500"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {[
                {
                  label: "1. Trigger action",
                  copy: "Tap the payment CTA to simulate a real banking moment.",
                },
                {
                  label: "2. Receive reward",
                  copy: "The backend grants an extra move for the next run.",
                },
                {
                  label: "3. Play with purpose",
                  copy: "Open the game and convert reward into a better score.",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                >
                  <div className="text-sm font-semibold text-white">
                    {item.label}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-400">
                    {item.copy}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div
              className={[
                "glass-panel p-5",
                hasReward || rewardPulse ? "animate-reward-pop" : "",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
                  Active reward
                </div>
                <div
                  className={[
                    "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
                    hasReward
                      ? "bg-amber-300/20 text-amber-100"
                      : "bg-slate-800 text-slate-400",
                  ].join(" ")}
                >
                  {hasReward ? "Ready" : "Locked"}
                </div>
              </div>

              <div
                className={[
                  "mt-4 rounded-[22px] border p-5",
                  hasReward
                    ? "border-amber-300/20 bg-gradient-to-br from-amber-300/20 via-amber-200/10 to-emerald-300/10 shadow-lg shadow-amber-950/20"
                    : "border-white/8 bg-white/[0.03]",
                ].join(" ")}
              >
                {hasReward ? (
                  <>
                    <div className="text-xs uppercase tracking-[0.22em] text-amber-100/90">
                      Reward unlocked
                    </div>
                    <div className="mt-2 text-2xl font-bold text-white">
                      {reward.type} x{reward.value}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-200">
                      This gives the player one rescue reroll after a dead-end
                      board state.
                    </div>
                  </>
                ) : (
                  <div className="text-sm leading-6 text-slate-400">
                    No active reward yet. Buy coffee to light up this card and
                    carry the bonus into the game.
                  </div>
                )}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={handleCoffeePayment}
                  disabled={loading}
                  className="glow-button min-h-14 rounded-2xl bg-emerald-400 px-4 py-4 font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {loading ? "Processing payment..." : "Pay for coffee"}
                </button>

                <Link
                  to="/game"
                  className="glow-button flex min-h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-center font-semibold text-white"
                >
                  Play game
                </Link>
              </div>
            </div>

            <div className="glass-panel p-5">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
                Why it matters
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                The product story is visible on one screen: transaction
                behavior creates instant motivation, and motivation feeds a game
                loop that can drive habit and loyalty.
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="animate-fade-up rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
