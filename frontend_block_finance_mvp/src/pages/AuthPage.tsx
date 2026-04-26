import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { t } from "../i18n/translations";
import { login, register } from "../services/api";
import { useAppStore } from "../store/appStore";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const navigate = useNavigate();
  const { language, setReward, setSession } = useAppStore();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response =
        mode === "login"
          ? await login(phone, password)
          : await register(name, phone, password);

      setSession(response.token, response.user);
      setReward(response.user.activeReward);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.genericError", language));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-clip px-4 py-6 text-slate-100 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center sm:min-h-[calc(100vh-4rem)]">
        <section className="glass-panel bg-grid animate-rise-in relative grid w-full gap-8 overflow-hidden p-6 sm:p-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
          <div className="absolute -right-24 top-10 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-amber-300/10 blur-3xl" />

          <div className="space-y-5">
            <div className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200">
              {t("auth.badge", language)}
            </div>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-3xl font-bold text-white sm:text-5xl">
                {t("auth.title", language)}
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                {t("auth.subtitle", language)}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                t("auth.step1", language),
                t("auth.step2", language),
                t("auth.step3", language),
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

          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-slate-950/30 sm:p-6">
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  mode === "login"
                    ? "bg-emerald-400 text-slate-950"
                    : "text-slate-300 hover:bg-white/[0.04]"
                }`}
              >
                {t("auth.login", language)}
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  mode === "register"
                    ? "bg-emerald-400 text-slate-950"
                    : "text-slate-300 hover:bg-white/[0.04]"
                }`}
              >
                {t("auth.register", language)}
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              {mode === "register" ? (
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">
                    {t("auth.nameLabel", language)}
                  </span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/50"
                    placeholder={t("auth.namePlaceholder", language)}
                    required
                  />
                </label>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">
                  {t("auth.phoneLabel", language)}
                </span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/50"
                  placeholder={t("auth.phonePlaceholder", language)}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">
                  {t("auth.passwordLabel", language)}
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/50"
                  placeholder={t("auth.passwordPlaceholder", language)}
                  minLength={6}
                  required
                />
              </label>

              {error ? (
                <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="glow-button min-h-14 w-full rounded-2xl bg-emerald-400 px-6 py-4 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading
                  ? t("auth.processing", language)
                  : mode === "login"
                    ? t("auth.loginCta", language)
                    : t("auth.registerCta", language)}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
