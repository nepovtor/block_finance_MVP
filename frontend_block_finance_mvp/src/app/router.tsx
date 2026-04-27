
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "../store/appStore";
import LanguageSelectionPage from "../pages/LanguageSelectionPage";
import Onboarding from "../pages/OnboardingPage";
import Dashboard from "../pages/DashboardPage";
import Game from "../pages/GamePage";
import AuthPage from "../pages/AuthPage";
import PrivacyPolicyPage from "../pages/PrivacyPolicyPage";

export default function Router() {
  const { hasSelectedLanguage, authToken } = useAppStore();

  if (!hasSelectedLanguage) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<LanguageSelectionPage />} />
        </Routes>
      </BrowserRouter>
    );
  }

  if (!authToken) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/game" element={<Game />} />
        <Route path="/auth" element={<Navigate to="/" replace />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
