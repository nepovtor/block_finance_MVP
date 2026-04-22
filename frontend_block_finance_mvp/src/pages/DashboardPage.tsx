import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getProfile, makeDemoPayment } from "../services/api";
import { getRecentAnalyticsEvents, trackEvent } from "../services/analytics";
import { useAppStore } from "../store/appStore";

export default function DashboardPage() {
  const {
    user,
    reward,
    demoProduct,
    setReward,
    setUser,
    recordPayment,
    addToSavingsGoal,
    addXP,
    recordReferralInvite,
  } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState("");
  const [rewardPulse, setRewardPulse] = useState(false);
  const [referralMessage, setReferralMessage] = useState("");
  const hasReward = reward?.type === "extra_move" && reward.value > 0;
  const xpProgress = Math.min(100, Math.round((user.xp / user.xpToNext) * 100));
  const challengeTarget = 3;
  const challengeProgress = Math.min(demoProduct.paymentsToday, challengeTarget);
  const challengeCompleted = challengeProgress >= challengeTarget;
  const savingsProgress = Math.min(
    100,
    Math.round((demoProduct.savingsGoalCurrent / demoProduct.savingsGoalTarget) * 100)
  );
  const referralProgress = Math.min(
    100,
    Math.round((demoProduct.referralInvites / demoProduct.referralTarget) * 100)
  );
  const recentAnalytics = getRecentAnalyticsEvents();
  const referralLink = "blockfinance.app/invite/alex-demo";
  const firstQuestSteps = [
    {
      label: "Make a payment",
      done: demoProduct.paymentsToday > 0,
    },
    {
      label: "See the reward unlock",
      done: hasReward,
    },
    {
      label: "Open the game and use it",
      done: false,
    },
  ];

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
      const paymentsToday = recordPayment();
      trackEvent("payment_made", {
        amount: 5,
        category: "coffee",
        payments_today: paymentsToday,
      });

      if (response.reward_granted && response.reward) {
        setReward(response.reward);
        setRewardPulse(true);
        trackEvent("reward_received", {
          source: response.reward.source ?? "payment",
          reward_type: response.reward.type,
          reward_value: response.reward.value,
        });
      } else {
        setReward(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSavingsTopUp = () => {
    addToSavingsGoal(5, "+10 XP top-up bonus received");
    addXP(10);
    trackEvent("reward_received", {
      source: "savings_goal",
      reward_type: "xp_bonus",
      reward_value: 10,
    });
  };

  const handleReferralClick = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(referralLink);
      }
      const invites = recordReferralInvite();
      setReferralMessage("Invite link copied. Referral progress updated.");
      trackEvent("referral_clicked", {
        destination: "copy_link",
        invites,
      });
    } catch {
      const invites = recordReferralInvite();
      setReferralMessage("Invite action simulated. Referral progress updated.");
      trackEvent("referral_clicked", {
        destination: "simulated_copy",
        invites,
      });
    }
  };

  return (
    <div className="page-with-bottom-action min-h-screen overflow-x-clip p-4 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="space-y-4 md:hidden">
          <div className="glass-panel animate-rise-in bg-grid relative overflow-hidden p-5">
            <div className="text-xs uppercase tracking-[0.24em] text-emerald-200">
              Banking + game loop
            </div>
            <h1 className="mt-3 text-3xl font-bold text-white">Hi, {user.name}</h1>
            <p className="mt-3 text-base leading-7 text-slate-300">
              Pay with your card, unlock a game reward instantly, then use it to
              improve the run.
            </p>
          </div>

          <div className="glass-panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Today at a glance
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  Three things matter right now
                </div>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-300">
                {profileLoading ? "Syncing" : "Ready"}
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-white">Daily challenge</span>
                  <span className="text-sm text-slate-300">
                    {challengeProgress}/{challengeTarget}
                  </span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-emerald-400 to-amber-300 transition-all duration-500"
                    style={{ width: `${(challengeProgress / challengeTarget) * 100}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-white">Savings goal</span>
                  <span className="text-sm text-slate-300">
                    ${demoProduct.savingsGoalCurrent}/${demoProduct.savingsGoalTarget}
                  </span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-300 via-emerald-400 to-cyan-300 transition-all duration-500"
                    style={{ width: `${savingsProgress}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-amber-300/15 bg-amber-300/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-white">Reward status</span>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs uppercase tracking-[0.16em] text-amber-100">
                    {hasReward ? "Ready" : "Locked"}
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  {hasReward
                    ? `${reward?.type} x${reward?.value} is waiting for the next game run.`
                    : "Make one payment to light up the reward card."}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-emerald-200">
              How it works
            </div>
            <div className="mt-3 grid gap-3">
              {[
                "1. Pay for coffee",
                "2. Unlock extra move",
                "3. Open the game and use it",
              ].map((step) => (
                <div
                  key={step}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-200"
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-panel animate-rise-in bg-grid relative hidden overflow-hidden p-6 sm:p-8 md:block">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute bottom-0 left-10 h-24 w-24 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200/55 to-transparent" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="text-sm uppercase tracking-[0.28em] text-emerald-200">
                Banking dashboard
              </div>
              <h1 className="mt-3 text-3xl font-bold text-white sm:text-5xl">
                Hi, {user.name}
              </h1>
              <p className="mt-3 max-w-xl text-balance text-base leading-7 text-slate-300">
                Card action becomes instant game value. Pay once, unlock an
                advantage, then carry that momentum into the puzzle and your
                progress layers.
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-300/15 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(34,211,238,0.08),rgba(251,191,36,0.08))] p-5 text-sm text-emerald-100 shadow-lg shadow-emerald-950/20">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">
                What happens in 15 seconds
              </div>
              <div className="mt-3 font-medium">
                Card payment -&gt; reward appears -&gt; savings/referral story is
                visible -&gt; open game -&gt; use revive
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-[0.68rem] uppercase tracking-[0.16em] text-emerald-50/85">
                <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1">
                  Card spend
                </span>
                <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1">
                  Cashback reward
                </span>
                <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1">
                  Puzzle boost
                </span>
                <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1">
                  Savings quest
                </span>
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

              {!demoProduct.hasSeenValueIntro ? null : (
                <div className="mt-5 rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-emerald-200">
                    First quest
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    Prove the loop in three taps
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {firstQuestSteps.map((step) => (
                      <div
                        key={step.label}
                        className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200"
                      >
                        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                          {step.done ? "Done" : "Next"}
                        </div>
                        <div className="mt-1 font-medium text-white">{step.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="glass-panel p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
                      Daily challenge
                    </div>
                    <div className="mt-2 text-xl font-semibold text-white">
                      Make 3 card payments today
                    </div>
                  </div>
                  <div
                    className={[
                      "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
                      challengeCompleted
                        ? "bg-emerald-400/20 text-emerald-100"
                        : "bg-white/5 text-slate-300",
                    ].join(" ")}
                  >
                    {challengeCompleted ? "Completed" : `${challengeProgress}/${challengeTarget}`}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  This challenge advances every time the demo payment button is
                  used, so judges can see progression through the existing banking
                  action.
                </p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-emerald-400 to-amber-300 transition-all duration-500"
                    style={{ width: `${(challengeProgress / challengeTarget) * 100}%` }}
                  />
                </div>
                <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/50 p-4 text-sm leading-6 text-slate-300">
                  {challengeCompleted
                    ? "Challenge complete. Today’s habit reward is unlocked and the user sees clear progress momentum."
                    : "Complete all 3 payments to show a finished habit loop on the dashboard."}
                </div>
              </div>

              <div className="glass-panel p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
                      Savings goal
                    </div>
                    <div className="mt-2 text-xl font-semibold text-white">
                      Weekend gaming fund
                    </div>
                  </div>
                  <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                    ${demoProduct.savingsGoalCurrent}/${demoProduct.savingsGoalTarget}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Simple demo goal: add money manually and show that the same app
                  can turn saving into visible progress.
                </p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-300 via-emerald-400 to-cyan-300 transition-all duration-500"
                    style={{ width: `${savingsProgress}%` }}
                  />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-slate-950/50 p-4">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      Top up in demo mode
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      Each top-up adds $5 and grants a small +10 XP bonus.
                    </div>
                  </div>
                  <button
                    onClick={handleSavingsTopUp}
                    className="glow-button rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white"
                  >
                    Add $5
                  </button>
                </div>
                {demoProduct.lastSavingsBonus ? (
                  <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                    {demoProduct.lastSavingsBonus}
                  </div>
                ) : null}
              </div>
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
                    <div className="mt-4 flex flex-wrap gap-2 text-[0.68rem] uppercase tracking-[0.16em] text-amber-50/85">
                      <span className="rounded-full border border-amber-100/20 bg-amber-100/10 px-2.5 py-1">
                        Cashback live
                      </span>
                      <span className="rounded-full border border-amber-100/20 bg-amber-100/10 px-2.5 py-1">
                        Wallet bonus
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-sm leading-6 text-slate-400">
                    No active reward yet. Buy coffee to light up this card and
                    carry the bonus into the game.
                  </div>
                )}
              </div>

              <div className="mt-4 hidden gap-3 sm:grid-cols-2 md:grid">
                <button
                  onClick={handleCoffeePayment}
                  disabled={loading}
                  className="glow-button min-h-14 rounded-2xl bg-gradient-to-r from-emerald-300 via-emerald-400 to-amber-300 px-4 py-4 font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
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
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
                    Invite a friend
                  </div>
                  <div className="mt-2 text-xl font-semibold text-white">
                    Referral progress
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                  {demoProduct.referralInvites}/{demoProduct.referralTarget} invites
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Lightweight social proof for the pitch: invite flow, progress
                tracking, and a shareable achievement placeholder.
              </p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-fuchsia-300 via-cyan-300 to-emerald-400 transition-all duration-500"
                  style={{ width: `${referralProgress}%` }}
                />
              </div>
              <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  Demo link
                </div>
                <div className="mt-2 break-all text-sm text-white">{referralLink}</div>
                <button
                  onClick={handleReferralClick}
                  className="glow-button mt-4 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white"
                >
                  Invite a friend
                </button>
                {referralMessage ? (
                  <div className="mt-3 text-sm text-emerald-200">{referralMessage}</div>
                ) : null}
              </div>
              <div className="mt-4 rounded-2xl border border-fuchsia-300/15 bg-fuchsia-300/10 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-fuchsia-100/80">
                  Share card placeholder
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  "Alex saved $40 and unlocked an extra move"
                </div>
                <div className="mt-2 text-sm leading-6 text-fuchsia-50/85">
                  Ready for social image generation or messaging app sharing in a
                  next iteration.
                </div>
              </div>
            </div>

            <div className="glass-panel p-5">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
                Analytics pulse
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Local analytics events are recorded for demo narration and stored
                in browser localStorage.
              </p>
              <div className="mt-4 space-y-2">
                {recentAnalytics.length > 0 ? (
                  recentAnalytics.map((event) => (
                    <div
                      key={`${event.name}-${event.timestamp}`}
                      className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3 text-sm text-slate-300"
                    >
                      <span className="font-semibold text-white">{event.name}</span>
                      <span className="ml-2 text-slate-400">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3 text-sm text-slate-400">
                    Open the app, make a payment, or click invite to populate the
                    event stream.
                  </div>
                )}
              </div>
            </div>

            <div className="glass-panel p-5">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
                Why it matters
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                The product story is visible on one screen: transaction
                behavior creates instant motivation, savings stays visible,
                referral adds a viral surface, and motivation feeds a game loop
                that can drive habit and loyalty.
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

      <div className="bottom-action-zone lg:hidden">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row">
          <button
            onClick={handleCoffeePayment}
            disabled={loading}
            className="glow-button min-h-14 flex-1 rounded-2xl bg-gradient-to-r from-emerald-300 via-emerald-400 to-amber-300 px-4 py-4 font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {loading ? "Processing payment..." : "Pay for coffee"}
          </button>

          <Link
            to="/game"
            className="glow-button flex min-h-14 flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-center font-semibold text-white"
          >
            Play game
          </Link>
        </div>
      </div>
    </div>
  );
}
