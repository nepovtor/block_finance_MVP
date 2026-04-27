import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  deleteAccount,
  revokePersonalDataConsent,
  type ConsentStatusResponse,
} from "../services/api";
import { useAppStore } from "../store/appStore";

const CONSENT_VERSION = "2026-04-privacy-v1";

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const { authToken, clearSession, language } = useAppStore();
  const [status, setStatus] = useState<ConsentStatusResponse | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isRu = language === "ru";

  async function handleRevokeConsent() {
    setSubmitting(true);
    setMessage("");

    try {
      const result = await revokePersonalDataConsent();
      setStatus(result);
      setMessage(
        isRu
          ? "Согласие отозвано. Для дальнейшей полноценной работы аккаунта может потребоваться повторное согласие."
          : "Consent has been revoked. Full account operation may require renewed consent."
      );
    } catch {
      setMessage(
        isRu
          ? "Не удалось отозвать согласие. Попробуйте позже."
          : "Could not revoke consent. Please try again later."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      isRu
        ? "Удалить аккаунт и связанные данные? Это действие нельзя отменить."
        : "Delete your account and related data? This action cannot be undone."
    );

    if (!confirmed) return;

    setSubmitting(true);
    setMessage("");

    try {
      await deleteAccount();
      clearSession();
      navigate("/auth", { replace: true });
    } catch {
      setMessage(
        isRu
          ? "Не удалось удалить аккаунт. Попробуйте позже."
          : "Could not delete account. Please try again later."
      );
      setSubmitting(false);
    }
  }

  const sections = isRu
    ? [
        {
          title: "Какие данные используются",
          body: "Приложение использует номер телефона как персональные данные для создания аккаунта, входа в профиль, сохранения игрового прогресса и отображения результатов в списке лидеров.",
        },
        {
          title: "Цель обработки",
          body: "Номер телефона применяется только для идентификации пользователя в демо-профиле, связи игрового результата с аккаунтом и защиты доступа к данным профиля.",
        },
        {
          title: "Фиксация согласия",
          body: "При регистрации сохраняется факт согласия, версия текста согласия, дата принятия, а также технические хэши IP-адреса и User-Agent. Исходные IP-адрес и User-Agent не сохраняются в открытом виде.",
        },
        {
          title: "Отзыв согласия и удаление аккаунта",
          body: "Пользователь может отозвать согласие или удалить аккаунт. При удалении аккаунта удаляются профиль и связанные демо-данные: игровые сессии, награды, транзакции и записи согласий.",
        },
      ]
    : [
        {
          title: "Data used",
          body: "The application uses the phone number as personal data for account creation, profile access, game progress storage, and leaderboard display.",
        },
        {
          title: "Processing purpose",
          body: "The phone number is used only to identify the user in the demo profile, connect game records to the account, and protect access to profile data.",
        },
        {
          title: "Consent record",
          body: "During registration, the app stores the consent fact, consent text version, acceptance date, and technical hashes of IP address and User-Agent. Raw IP address and User-Agent are not stored in plain form.",
        },
        {
          title: "Consent withdrawal and account deletion",
          body: "The user can withdraw consent or delete the account. Account deletion removes the profile and related demo data: game sessions, rewards, transactions, and consent records.",
        },
      ];

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.20),transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_52%,#020617_100%)] px-4 py-6 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-35" />

      <section className="relative mx-auto max-w-4xl">
        <Link
          to={authToken ? "/" : "/auth"}
          className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.08]"
        >
          ← {isRu ? "Назад" : "Back"}
        </Link>

        <div className="mt-5 rounded-[2rem] border border-white/10 bg-slate-950/72 p-6 shadow-[0_28px_90px_rgba(2,6,23,0.55)] backdrop-blur-2xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
            MTBlocks · Privacy
          </p>

          <h1 className="mt-4 text-3xl font-bold text-white sm:text-5xl">
            {isRu
              ? "Политика обработки персональных данных"
              : "Privacy Policy"}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            {isRu
              ? "Этот документ описывает, как демо-приложение MTBlocks хранит и использует номер телефона пользователя."
              : "This document explains how the MTBlocks demo application stores and uses the user's phone number."}
          </p>

          <div className="mt-5 rounded-2xl border border-emerald-200/15 bg-emerald-300/[0.07] p-4 text-sm leading-6 text-emerald-50">
            <span className="font-semibold">
              {isRu ? "Версия согласия:" : "Consent version:"}
            </span>{" "}
            {CONSENT_VERSION}
          </div>

          <div className="mt-6 grid gap-4">
            {sections.map((section) => (
              <article
                key={section.title}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              >
                <h2 className="text-lg font-semibold text-white">
                  {section.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  {section.body}
                </p>
              </article>
            ))}
          </div>

          {authToken ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-semibold text-white">
                {isRu ? "Управление данными" : "Data controls"}
              </h2>

              <p className="mt-2 text-sm leading-7 text-slate-400">
                {status
                  ? isRu
                    ? `Статус согласия: ${status.accepted ? "активно" : "отозвано"}`
                    : `Consent status: ${status.accepted ? "active" : "revoked"}`
                  : isRu
                    ? "Вы можете отозвать согласие или удалить аккаунт."
                    : "You can withdraw consent or delete your account."}
              </p>

              {message ? (
                <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                  {message}
                </div>
              ) : null}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleRevokeConsent}
                  disabled={submitting}
                  className="rounded-2xl border border-amber-300/25 bg-amber-300/10 px-5 py-3 text-sm font-semibold text-amber-100 disabled:opacity-50"
                >
                  {isRu ? "Отозвать согласие" : "Withdraw consent"}
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={submitting}
                  className="rounded-2xl border border-rose-300/25 bg-rose-400/10 px-5 py-3 text-sm font-semibold text-rose-100 disabled:opacity-50"
                >
                  {isRu ? "Удалить аккаунт" : "Delete account"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
