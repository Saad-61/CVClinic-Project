import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "./components/app-shell";
import { CvProvider } from "./state/cv-context";
import LandingPage from "./pages/landing-page";
import AnalyzingPage from "./pages/analyzing-page";
import ResultsPage from "./pages/results-page";

export default function App() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <CvProvider>
      <div className={`app-theme-bg min-h-screen ${isLanding ? "theme-premium-landing" : ""}`}>
        <AppShell>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/analyzing" element={<AnalyzingPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </div>
    </CvProvider>
  );
}

