import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { t } from "../i18n/translations";
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
    language,
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
      label: t("onboarding.quest1Title", language),
      done: demoProduct.paymentsToday > 0,
    },
    {
      label: t("dashboard.receiveReward", language),
      done: hasReward,
    },
    {
      label: t("onboarding.quest3Title", language),
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
          setError(
            err instanceof Error ? err.message : t("error.failedToLoadProfile", language)
          );
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
      setError(err instanceof Error ? err.message : t("error.paymentFailed", language));
    } finally {
      setLoading(false);
    }
  };

  const handleSavingsTopUp = () => {
    addToSavingsGoal(5, t("dashboard.savingsBonus", language));
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
      setReferralMessage(t("dashboard.inviteCopied", language));
      trackEvent("referral_clicked", {
        destination: "copy_link",
        invites,
      });
    } catch {
      const invites = recordReferralInvite();
      setReferralMessage(t("dashboard.inviteSimulated", language));
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
              {t("dashboard.mobileBadge", language)}
            </div>
            <h1 className="mt-3 text-3xl font-bold text-white">
              {t("dashboard.greeting", language, { name: user.name })}
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-300">
              {t("dashboard.mobileIntro", language)}
            </p>
          </div>

          <div className="glass-panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  {t("dashboard.todayAtGlance", language)}
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {t("dashboard.threeThings", language)}
                </div>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-300">
                {profileLoading ? t("dashboard.syncing", language) : t("dashboard.ready", language)}
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-white">
                    {t("dashboard.dailyChallenge", language)}
                  </span>
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
                  <span className="text-sm font-semibold text-white">
                    {t("dashboard.savingsGoal", language)}
                  </span>
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
                  <span className="text-sm font-semibold text-white">
                    {t("dashboard.rewardStatus", language)}
                  </span>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs uppercase tracking-[0.16em] text-amber-100">
                    {hasReward ? t("dashboard.ready", language) : t("dashboard.locked", language)}
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  {hasReward
                    ? t("dashboard.rewardWaiting", language, {
                        rewardType: reward?.type ?? "reward",
                        rewardValue: reward?.value ?? 0,
                      })
                    : t("dashboard.makePaymentToReward", language)}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-emerald-200">
              {t("dashboard.howItWorks", language)}
            </div>
            <div className="mt-3 grid gap-3">
              {[
                t("onboarding.step1", language),
                t("onboarding.step2", language),
                t("onboarding.step3", language),
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
                {t("dashboard.bankDashboard", language)}
              </div>
              <h1 className="mt-3 text-3xl font-bold text-white sm:text-5xl">
                {t("dashboard.greeting", language, { name: user.name })}
              </h1>
              <p className="mt-3 max-w-xl text-balance text-base leading-7 text-slate-300">
                {t("dashboard.desktopIntro", language)}
              </p>
            </div>

              <div className="rounded-3xl border border-emerald-300/15 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(34,211,238,0.08),rgba(251,191,36,0.08))] p-5 text-sm text-emerald-100 shadow-lg shadow-emerald-950/20">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">
                  {t("dashboard.whatHappens", language)}
                </div>
                <div className="mt-3 font-medium">
                  {t("dashboard.whatHappensFlow", language)}
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-[0.68rem] uppercase tracking-[0.16em] text-emerald-50/85">
                  <span className="bonus-chip bonus-chip-reward">{t("dashboard.cardSpend", language)}</span>
                  <span className="bonus-chip bonus-chip-cashback">{t("dashboard.cashbackReward", language)}</span>
                  <span className="bonus-chip bonus-chip-reward">{t("dashboard.puzzleBoost", language)}</span>
                  <span className="bonus-chip bonus-chip-cashback">{t("dashboard.savingsQuest", language)}</span>
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
                    {t("dashboard.profile", language)}
                  </div>
                  <div className="mt-2 text-xl font-semibold text-white">
                    {t("dashboard.financialProgress", language)}
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                  {profileLoading ? t("dashboard.syncing", language) : t("dashboard.connected", language)}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="stat-tile">
                  <div className="text-sm text-slate-400">{t("dashboard.level", language)}</div>
                  <div className="mt-2 text-3xl font-bold text-white">
                    {user.level}
                  </div>
                </div>
                <div className="stat-tile">
                  <div className="text-sm text-slate-400">{t("dashboard.streak", language)}</div>
                  <div className="mt-2 text-3xl font-bold text-white">
                    {user.streak}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.16em] text-amber-200">
                    {t("dashboard.daysActive", language)}
                  </div>
                </div>
                <div className="stat-tile">
                  <div className="text-sm text-slate-400">{t("dashboard.xp", language)}</div>
                  <div className="mt-2 text-3xl font-bold text-white">
                    {user.xp}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {t("dashboard.toNextLevel", language, { value: user.xpToNext })}
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/8 bg-slate-950/50 p-4">
                <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
                  <span>{t("dashboard.xpProgress", language)}</span>
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
                    {t("dashboard.firstQuest", language)}
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {t("dashboard.proveLoop", language)}
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {firstQuestSteps.map((step) => (
                      <div
                        key={step.label}
                        className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200"
                      >
                        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                          {step.done ? t("dashboard.done", language) : t("dashboard.next", language)}
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
                  label: t("dashboard.triggerAction", language),
                  copy: t("dashboard.triggerActionCopy", language),
                },
                {
                  label: t("dashboard.receiveReward", language),
                  copy: t("dashboard.receiveRewardCopy", language),
                },
                {
                  label: t("dashboard.playWithPurpose", language),
                  copy: t("dashboard.playWithPurposeCopy", language),
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
                      {t("dashboard.dailyChallenge", language)}
                    </div>
                    <div className="mt-2 text-xl font-semibold text-white">
                      {t("dashboard.make3Payments", language)}
                    </div>
                  </div>
                  <div
                    className={challengeCompleted ? "brand-badge-finance" : "brand-badge-neutral"}
                  >
                    {challengeCompleted ? t("dashboard.completed", language) : `${challengeProgress}/${challengeTarget}`}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {t("dashboard.challengeExplanation", language)}
                </p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-emerald-400 to-amber-300 transition-all duration-500"
                    style={{ width: `${(challengeProgress / challengeTarget) * 100}%` }}
                  />
                </div>
                <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/50 p-4 text-sm leading-6 text-slate-300">
                  {challengeCompleted
                    ? t("dashboard.challengeCompleteCopy", language)
                    : t("dashboard.challengePendingCopy", language)}
                </div>
              </div>

              <div className="glass-panel p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
                      {t("dashboard.savingsGoal", language)}
                    </div>
                    <div className="mt-2 text-xl font-semibold text-white">
                      {t("dashboard.weekendFund", language)}
                    </div>
                  </div>
                  <div className="brand-badge-finance">
                    ${demoProduct.savingsGoalCurrent}/${demoProduct.savingsGoalTarget}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {t("dashboard.savingsExplanation", language)}
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
                      {t("dashboard.topUpDemo", language)}
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      {t("dashboard.topUpDemoCopy", language)}
                    </div>
                  </div>
                  <button
                    onClick={handleSavingsTopUp}
                    className="glow-button rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white"
                  >
                    {t("dashboard.add5", language)}
                  </button>
                </div>
                {demoProduct.lastSavingsBonus ? (
                  <div className="mt-4 reward-surface px-4 py-3 text-sm text-amber-100">
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
                  {t("dashboard.activeReward", language)}
                </div>
                <div
                  className={hasReward ? "brand-badge-bonus" : "brand-badge-neutral"}
                >
                  {hasReward ? t("dashboard.ready", language) : t("dashboard.locked", language)}
                </div>
              </div>

              <div
                className={[
                  "mt-4 p-5",
                  hasReward
                    ? "reward-surface animate-reward-pop border-amber-300/20"
                    : "reward-surface-muted",
                ].join(" ")}
              >
                {hasReward ? (
                  <>
                    <div className="text-xs uppercase tracking-[0.22em] text-amber-100/90">
                      {t("dashboard.rewardUnlocked", language)}
                    </div>
                    <div className="mt-2 text-2xl font-bold text-white">
                      {reward.type} x{reward.value}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-200">
                      {t("dashboard.rewardDescription", language)}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-[0.68rem] uppercase tracking-[0.16em] text-amber-50/85">
                      <span className="bonus-chip bonus-chip-cashback">{t("dashboard.cashbackLive", language)}</span>
                      <span className="bonus-chip bonus-chip-reward">{t("dashboard.walletBonus", language)}</span>
                      <span className="bonus-chip bonus-chip-cashback">{t("dashboard.bonusActive", language)}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-sm leading-6 text-slate-400">
                    {t("dashboard.noActiveReward", language)}
                  </div>
                )}
              </div>

              <div className="mt-4 hidden gap-3 sm:grid-cols-2 md:grid">
                <button
                  onClick={handleCoffeePayment}
                  disabled={loading}
                  className="glow-button min-h-14 rounded-2xl bg-gradient-to-r from-emerald-300 via-emerald-400 to-amber-300 px-4 py-4 font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {loading
                    ? t("dashboard.processingPayment", language)
                    : t("dashboard.payForCoffee", language)}
                </button>

                <Link
                  to="/game"
                  className="glow-button flex min-h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-center font-semibold text-white"
                >
                  {t("dashboard.playGame", language)}
                </Link>
              </div>
            </div>

            <div className="glass-panel p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
                    {t("dashboard.inviteFriend", language)}
                  </div>
                  <div className="mt-2 text-xl font-semibold text-white">
                    {t("dashboard.referralProgress", language)}
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                  {t("dashboard.invitesCount", language, {
                    count: demoProduct.referralInvites,
                    target: demoProduct.referralTarget,
                  })}
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {t("dashboard.referralCopy", language)}
              </p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-fuchsia-300 via-cyan-300 to-emerald-400 transition-all duration-500"
                  style={{ width: `${referralProgress}%` }}
                />
              </div>
              <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  {t("dashboard.demoLink", language)}
                </div>
                <div className="mt-2 break-all text-sm text-white">{referralLink}</div>
                <button
                  onClick={handleReferralClick}
                  className="glow-button mt-4 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white"
                >
                  {t("dashboard.inviteFriend", language)}
                </button>
                {referralMessage ? (
                  <div className="mt-3 text-sm text-emerald-200">{referralMessage}</div>
                ) : null}
              </div>
              <div className="mt-4 rounded-2xl border border-fuchsia-300/15 bg-fuchsia-300/10 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-fuchsia-100/80">
                  {t("dashboard.shareCardPlaceholder", language)}
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {t("dashboard.shareCardTitle", language)}
                </div>
                <div className="mt-2 text-sm leading-6 text-fuchsia-50/85">
                  {t("dashboard.shareCardCopy", language)}
                </div>
              </div>
            </div>

            <div className="glass-panel p-5">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
                {t("dashboard.analyticsPulse", language)}
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {t("dashboard.analyticsCopy", language)}
              </p>
              <div className="mt-4 space-y-2">
                {recentAnalytics.length > 0 ? (
                  recentAnalytics.map((event) => (
                    <div
                      key={`${event.name}-${event.timestamp}`}
                      className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3 text-sm text-slate-300"
                    >
                      <span className="font-semibold text-white">
                        {t(`dashboard.event.${event.name}`, language)}
                      </span>
                      <span className="ml-2 text-slate-400">
                        {new Date(event.timestamp).toLocaleTimeString(
                          language === "ru" ? "ru-RU" : "en-US"
                        )}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3 text-sm text-slate-400">
                    {t("dashboard.analyticsEmpty", language)}
                  </div>
                )}
              </div>
            </div>

            <div className="glass-panel p-5">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
                {t("dashboard.whyItMatters", language)}
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {t("dashboard.whyItMattersCopy", language)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="bonus-chip bonus-chip-cashback">{t("dashboard.bonusWallet", language)}</span>
                <span className="bonus-chip bonus-chip-reward">{t("dashboard.progressRails", language)}</span>
                <span className="bonus-chip bonus-chip-cashback">{t("dashboard.cardToReward", language)}</span>
              </div>
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
            {loading
              ? t("dashboard.processingPayment", language)
              : t("dashboard.payForCoffee", language)}
          </button>

          <Link
            to="/game"
            className="glow-button flex min-h-14 flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-center font-semibold text-white"
          >
            {t("dashboard.playGame", language)}
          </Link>
        </div>
      </div>
    </div>
  );
}
