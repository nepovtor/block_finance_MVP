import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
          : await register(name.trim(), phone, password);

      setSession(response.token, response.user);
      setReward(response.user.activeReward);
      navigate("/", { replace: true });
    } catch (err) {
      setError(mapAuthError(err));
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
              <p className="max-w-xl text-sm leading-6 text-emerald-200/85">
                {t("auth.secureHint", language)}
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
                    autoComplete="name"
                    maxLength={80}
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
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={32}
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
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  maxLength={128}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/50"
                  placeholder={t("auth.passwordPlaceholder", language)}
                  minLength={8}
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
