import { useNavigate } from "react-router-dom";

export default function OnboardingPage() {
  const nav = useNavigate();

  return (
    <main className="min-h-screen overflow-hidden px-4 py-8 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        <section className="glass-panel bg-grid animate-rise-in relative w-full overflow-hidden p-6 sm:p-10">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
          <div className="absolute -right-24 top-10 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-amber-300/10 blur-3xl" />

          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200">
                Hackathon MVP Demo
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-bold text-white sm:text-6xl">
                  Turn everyday payments into game energy.
                </h1>
                <p className="max-w-2xl text-balance text-lg leading-8 text-slate-300">
                  Block Finance makes banking feel rewarding for young users:
                  make a payment, unlock a gameplay boost, and grow progress in
                  one smooth loop.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => nav("/dashboard")}
                  className="glow-button rounded-2xl bg-emerald-400 px-6 py-4 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/20"
                >
                  Start live demo
                </button>
                <button
                  onClick={() => nav("/game")}
                  className="glow-button rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-base font-medium text-slate-100"
                >
                  Jump into game
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  "1. Pay for coffee",
                  "2. Unlock reward",
                  "3. Use it in game",
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
                <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
                  Product loop
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    {
                      title: "Money becomes action",
                      copy: "A simple payment instantly triggers reward logic.",
                    },
                    {
                      title: "Action becomes reward",
                      copy: "The user receives an extra move for the next session.",
                    },
                    {
                      title: "Reward becomes progress",
                      copy: "Gameplay drives score, XP, and retention-friendly momentum.",
                    },
                  ].map((item, index) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                    >
                      <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                        Step {index + 1}
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
                This demo is optimized for a 30-60 second pitch: one payment,
                one reward, one playable game loop, one clear retention story.
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
