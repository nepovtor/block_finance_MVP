import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import { initFrontendMonitoring, Sentry } from "./monitoring/sentry";
import "./index.css";

initFrontendMonitoring();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-slate-100">
          <div className="max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-200">
              MTBlocks
            </p>
            <h1 className="mt-3 text-2xl font-bold text-white">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              The error has been recorded. Please reload the page.
            </p>
          </div>
        </main>
      }
    >
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
