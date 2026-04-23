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

  return (
    <main className="min-h-screen overflow-x-clip px-4 py-6 text-slate-100 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center sm:min-h-[calc(100vh-4rem)]">
        <section className="glass-panel bg-grid animate-rise-in relative w-full overflow-hidden p-6 sm:p-10">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
          <div className="absolute -right-24 top-10 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-amber-300/10 blur-3xl" />

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200">
                {t("onboarding.badge", language)}
              </div>

              <div className="rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-50">
                {t("onboarding.quickIntroLabel", language)}
                <span className="ml-2 font-semibold text-white">
                  {t("onboarding.quickIntroValue", language)}
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-3xl font-bold text-white sm:text-5xl lg:text-6xl">
                  {t("onboarding.title", language)}
                </h1>
                <p className="max-w-2xl text-balance text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                  {t("onboarding.subtitle", language)}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleStartDemo}
                  className="glow-button min-h-14 rounded-2xl bg-emerald-400 px-6 py-4 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/20"
                >
                  {t("onboarding.startDemo", language)}
                </button>
                <button
                  onClick={() => nav("/game")}
                  className="glow-button min-h-14 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-base font-medium text-slate-100"
                >
                  {t("onboarding.jumpToGame", language)}
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  t("onboarding.step1", language),
                  t("onboarding.step2", language),
                  t("onboarding.step3", language),
                ].map((step) => (
                  <div
                    key={step}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200"
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-slate-950/30">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
                    {t("onboarding.firstQuest", language)}
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                    {t("onboarding.dashboardStartsHere", language)}
                  </div>
                </div>
                <div className="mt-5 grid gap-3">
                  {[
                    {
                      title: t("onboarding.quest1Title", language),
                      copy: t("onboarding.quest1Copy", language),
                    },
                    {
                      title: t("onboarding.quest2Title", language),
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
                  ].map((item, index) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                    >
                      <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                        {t("onboarding.questLabel", language, { index: index + 1 })}
                      </div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {item.title}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {item.copy}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-slate-950/30">
                <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
                  {t("onboarding.productLoop", language)}
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    {
                      title: t("onboarding.loop1Title", language),
                      copy: t("onboarding.loop1Copy", language),
                    },
                    {
                      title: t("onboarding.loop2Title", language),
                      copy: t("onboarding.loop2Copy", language),
                    },
                    {
                      title: t("onboarding.loop3Title", language),
                      copy: t("onboarding.loop3Copy", language),
                    },
                  ].map((item, index) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                    >
                      <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                        {t("onboarding.loopStep", language, { index: index + 1 })}
                      </div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {item.title}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {item.copy}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm leading-6 text-amber-100">
                {t("onboarding.pitchNote", language)}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
