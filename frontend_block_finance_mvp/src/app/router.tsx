
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "../store/appStore";
import LanguageSelectionPage from "../pages/LanguageSelectionPage";
import Onboarding from "../pages/OnboardingPage";
import Dashboard from "../pages/DashboardPage";
import Game from "../pages/GamePage";

export default function Router() {
  const { hasSelectedLanguage } = useAppStore();

  if (!hasSelectedLanguage) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<LanguageSelectionPage />} />
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
      </Routes>
    </BrowserRouter>
  );
}
