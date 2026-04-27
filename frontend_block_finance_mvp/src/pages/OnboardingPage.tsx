import { useNavigate } from "react-router-dom";

import { t } from "../i18n/translations";
import { useAppStore } from "../store/appStore";

export default function OnboardingPage() {
  const nav = useNavigate();
  const { demoProduct, setHasSeenValueIntro, language } = useAppStore();

  function handleStartDemo() {
    setHasSeenValueIntro(true);
    nav("/dashboard");
  }

  const productLoop = [
    {
      index: "01",
      title: t("onboarding.loop1Title", language),
      copy: t("onboarding.loop1Copy", language),
      accent: "from-emerald-300 to-cyan-300",
    },
    {
      index: "02",
      title: t("onboarding.loop2Title", language),
      copy: t("onboarding.loop2Copy", language),
      accent: "from-amber-200 to-yellow-300",
    },
    {
      index: "03",
      title: t("onboarding.loop3Title", language),
      copy: t("onboarding.loop3Copy", language),
      accent: "from-fuchsia-300 to-violet-300",
    },
  ];

  const quests = [
    {
      title: t("onboarding.quest1Title", language),
      copy: t("onboarding.quest1Copy", language),
    },
    {
      title: t("onboarding.quest2Title", language, {
        paymentsToday: demoProduct.paymentsToday,
        savingsCurrent: demoProduct.savingsGoalCurrent,
        savingsTarget: demoProduct.savingsGoalTarget,
      }),
      copy: t("onboarding.quest2Copy", language, {
        paymentsToday: demoProduct.paymentsToday,
        savingsCurrent: demoProduct.savingsGoalCurrent,
        savingsTarget: demoProduct.savingsGoalTarget,
      }),
    },
    {
      title: t("onboarding.quest3Title", language),
      copy: t("onboarding.quest3Copy", language),
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_10%,rgba(16,185,129,0.20),transparent_28%),radial-gradient(circle_at_88%_16%,rgba(251,191,36,0.15),transparent_26%),linear-gradient(180deg,#020617_0%,#0f172a_48%,#020617_100%)] px-4 py-5 text-slate-100 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-35" />
      <div className="pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-16 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl" />

      <section className="relative mx-auto grid min-h-[calc(100vh-2.5rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="animate-rise-in space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.12)]">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />
            {t("onboarding.badge", language)}
          </div>

          <div className="max-w-3xl space-y-4">
            <h1 className="text-balance text-4xl font-bold leading-[1.03] text-white sm:text-5xl lg:text-6xl">
              {t("onboarding.title", language)}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              {t("onboarding.subtitle", language)}
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-emerald-200/15 bg-emerald-300/[0.07] p-4 text-sm leading-6 text-emerald-50 backdrop-blur-xl">
            <span className="font-semibold text-white">
              {t("onboarding.quickIntroLabel", language)}
            </span>
            <span className="ml-2 text-emerald-100">
              {t("onboarding.quickIntroValue", language)}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              t("onboarding.step1", language),
              t("onboarding.step2", language),
              t("onboarding.step3", language),
            ].map((step) => (
              <div
                key={step}
                className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm leading-5 text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl"
              >
                {step}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleStartDemo}
              className="glow-button min-h-14 rounded-2xl bg-emerald-400 px-6 py-4 text-base font-bold text-slate-950 shadow-lg shadow-emerald-500/25"
            >
              {t("onboarding.startDemo", language)}
            </button>
            <button
              onClick={() => nav("/game")}
              className="glow-button min-h-14 rounded-2xl border border-white/10 bg-white/[0.055] px-6 py-4 text-base font-semibold text-slate-100 backdrop-blur-xl"
            >
              {t("onboarding.jumpToGame", language)}
            </button>
          </div>
        </div>

        <div className="animate-rise-in space-y-4">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/72 p-5 shadow-[0_28px_90px_rgba(2,6,23,0.62)] backdrop-blur-2xl">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-300/12 blur-3xl" />
            <div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-amber-300/10 blur-3xl" />

            <div className="relative flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/80">
                  MTBlocks
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {t("onboarding.productLoop", language)}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200/20 bg-amber-200/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">
                MVP
              </div>
            </div>

            <div className="relative mt-5 rounded-[1.65rem] border border-white/10 bg-[linear-gradient(135deg,rgba(16,185,129,0.22),rgba(15,23,42,0.72)_48%,rgba(251,191,36,0.14))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">
                    Demo card
                  </p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    $5.00
                  </p>
                  <p className="mt-1 text-sm text-emerald-100">
                    Coffee payment
                  </p>
                </div>
                <div className="grid h-10 w-12 grid-cols-3 gap-1 rounded-xl border border-amber-200/25 bg-amber-200/15 p-1">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <span
                      key={index}
                      className="rounded-sm bg-amber-100/70"
                    />
                  ))}
                </div>
              </div>

              <div className="mt-7 flex items-center justify-between text-xs text-white/60">
                <span>**** 5821</span>
                <span>MTB</span>
              </div>
            </div>

            <div className="relative mt-4 grid gap-3">
              {productLoop.map((item) => (
                <div
                  key={item.index}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-sm font-black text-slate-950`}
                    >
                      {item.index}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {item.copy}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                {t("onboarding.firstQuest", language)}
              </p>
              <p className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[0.68rem] uppercase tracking-[0.16em] text-slate-300">
                {t("onboarding.dashboardStartsHere", language)}
              </p>
            </div>

            <div className="grid gap-3">
              {quests.map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/8 bg-slate-950/35 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                    {t("onboarding.questLabel", language, { index: index + 1 })}
                  </p>
                  <p className="mt-2 font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {item.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.65rem] border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
            {t("onboarding.pitchNote", language)}
          </div>
        </div>
      </section>
    </main>
  );
}
