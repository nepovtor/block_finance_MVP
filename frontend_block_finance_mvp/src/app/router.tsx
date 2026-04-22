
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Onboarding from "../pages/OnboardingPage";
import Dashboard from "../pages/DashboardPage";
import Game from "../pages/GamePage";

export default function Router() {
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
