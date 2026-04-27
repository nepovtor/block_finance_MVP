import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { t } from "../i18n/translations";
import { login, register } from "../services/api";
import { ApiError } from "../services/api/client";
import { useAppStore } from "../store/appStore";

type AuthMode = "login" | "register";

function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function isStrongPassword(password: string) {
  return (
    password.length >= 8 &&
    /[A-Za-zА-Яа-я]/.test(password) &&
    /\d/.test(password)
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { language, setReward, setSession } = useAppStore();

  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [personalDataConsent, setPersonalDataConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
  }

  function validateForm() {
    const trimmedName = name.trim();

    if (mode === "register" && !trimmedName) {
      return t("auth.nameRequired", language);
    }

    if (mode === "register" && (trimmedName.length < 2 || trimmedName.length > 80)) {
      return t("auth.nameInvalid", language);
    }

    if (!phone.trim()) {
      return t("auth.phoneRequired", language);
    }

    if (!isValidPhone(phone)) {
      return t("auth.phoneInvalid", language);
    }

    if (!password) {
      return t("auth.passwordRequired", language);
    }

    if (!isStrongPassword(password)) {
      return t("auth.passwordInvalid", language);
    }

    if (mode === "register" && !personalDataConsent) {
      return t("auth.personalDataConsentRequired", language);
    }

    return null;
  }

  function mapAuthError(err: unknown) {
    if (!(err instanceof ApiError)) {
      return t("auth.genericError", language);
    }

    if (err.status === 401) {
      return t("auth.loginInvalid", language);
    }

    if (err.status === 409) {
      return t("auth.userExists", language);
    }

    if (err.status === 422) {
      const detail = typeof err.message === "string" ? err.message : "";
      const responseBody = err.responseBody;

      if (
        typeof responseBody === "object" &&
        responseBody !== null &&
        "detail" in responseBody &&
        Array.isArray(responseBody.detail)
      ) {
        const fields = responseBody.detail
          .map((issue) =>
            typeof issue === "object" &&
            issue !== null &&
            "loc" in issue &&
            Array.isArray(issue.loc)
              ? issue.loc.join(".")
              : ""
          )
          .filter(Boolean);

        if (fields.some((field) => field.includes("name"))) {
          return t("auth.nameInvalid", language);
        }

        if (fields.some((field) => field.includes("phone"))) {
          return t("auth.phoneInvalid", language);
        }

        if (fields.some((field) => field.includes("password"))) {
          return t("auth.passwordInvalid", language);
        }
      }

      if (detail.includes("Name must")) {
        return t("auth.nameInvalid", language);
      }

      if (detail.includes("phone")) {
        return t("auth.phoneInvalid", language);
      }

      if (detail.includes("Password must")) {
        return t("auth.passwordInvalid", language);
      }
    }

    return t("auth.genericError", language);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response =
        mode === "login"
          ? await login(phone, password)
          : await register(name.trim(), phone, password, personalDataConsent);

      setSession(response.access_token || response.token, response.refresh_token, response.user);
      setReward(response.user.activeReward);
      navigate("/", { replace: true });
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(251,191,36,0.15),transparent_26%),linear-gradient(180deg,#020617_0%,#0f172a_48%,#020617_100%)] px-4 py-5 text-slate-100 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />

      <section className="relative mx-auto grid min-h-[calc(100vh-2.5rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="animate-rise-in space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.12)]">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />
            {t("auth.badge", language)}
          </div>

          <div className="max-w-2xl space-y-4">
            <h1 className="text-balance text-4xl font-bold leading-[1.03] text-white sm:text-5xl lg:text-6xl">
              {t("auth.title", language)}
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              {t("auth.subtitle", language)}
            </p>
          </div>

          <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
            {[
              t("auth.step1", language),
              t("auth.step2", language),
              t("auth.step3", language),
            ].map((step) => (
              <div
                key={step}
                className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm leading-5 text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl"
              >
                {step}
              </div>
            ))}
          </div>

          <div className="max-w-xl rounded-3xl border border-emerald-200/10 bg-emerald-300/[0.06] p-4 text-sm leading-6 text-emerald-100/90 backdrop-blur-xl">
            {t("auth.secureHint", language)}
          </div>
        </div>

        <div className="animate-rise-in rounded-[2rem] border border-white/10 bg-slate-950/72 p-4 shadow-[0_28px_90px_rgba(2,6,23,0.62)] backdrop-blur-2xl sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/80">
                MTBlocks
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Banking game profile
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200/20 bg-amber-200/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">
              Demo
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={[
                "rounded-[1.1rem] px-4 py-3 text-sm font-semibold transition",
                mode === "login"
                  ? "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
                  : "text-slate-300 hover:bg-white/[0.05]",
              ].join(" ")}
            >
              {t("auth.login", language)}
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={[
                "rounded-[1.1rem] px-4 py-3 text-sm font-semibold transition",
                mode === "register"
                  ? "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
                  : "text-slate-300 hover:bg-white/[0.05]",
              ].join(" ")}
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
                  autoComplete="name"
                  maxLength={80}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/60 focus:bg-white/[0.065]"
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
                autoComplete="tel"
                inputMode="tel"
                maxLength={32}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/60 focus:bg-white/[0.065]"
                placeholder={t("auth.phonePlaceholder", language)}
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">
                {t("auth.passwordLabel", language)}
              </span>
              {mode === "login" ? (
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  maxLength={128}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/60 focus:bg-white/[0.065]"
                  placeholder={t("auth.passwordPlaceholder", language)}
                  minLength={8}
                  required
                />
              ) : (
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  maxLength={128}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/60 focus:bg-white/[0.065]"
                  placeholder={t("auth.passwordPlaceholder", language)}
                  minLength={8}
                  required
                />
              )}
            </label>

            {mode === "register" ? (
              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-5 text-slate-300">
                <input
                  type="checkbox"
                  checked={personalDataConsent}
                  onChange={(event) => setPersonalDataConsent(event.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-slate-950 text-emerald-400 accent-emerald-400"
                  required
                />
                <span>{t("auth.personalDataConsent", language)}</span>
              </label>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="glow-button min-h-14 w-full rounded-2xl bg-emerald-400 px-6 py-4 text-base font-bold text-slate-950 shadow-lg shadow-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-70"
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
    </main>
  );
}
