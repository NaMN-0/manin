import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { GameProvider } from "./context/GameContext";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import MarketOverview from "./pages/MarketOverview";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import PennyStocks from "./pages/PennyStocks";
import ProDashboard from "./pages/ProDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ProGate from "./components/ProGate";
import Onboarding from "./pages/Onboarding";
import PaperTrading from "./pages/PaperTrading";
import Profile from "./pages/Profile";
import LevelUpModal from "./components/LevelUpModal";
import { useGame } from "./context/GameContext";
import LifetimeBanner from "./components/LifetimeBanner";
// import ErrorDisplay from "./components/ErrorDisplay"; // Removed unused import
import ScrollToTop from "./components/ScrollToTop";
import {
  TermsOfService,
  PrivacyPolicy,
  RefundPolicy,
  RiskDisclaimer,
} from "./pages/LegalPages";
import Footer from "./components/Footer";
import { Toaster } from "sonner";

const MainLayout = () => {
  const { level, rank, justLeveledUp, clearLevelUp } = useGame();

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      {justLeveledUp && (
        <LevelUpModal level={level} rank={rank} onClose={clearLevelUp} />
      )}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GameProvider>
          <Toaster richColors position="top-center" theme="dark" />
          <ScrollToTop /> {/* Add ScrollToTop here */}
          <LifetimeBanner />
          <Navbar />
          <Routes>
            {/* Landing Page - custom layout (manages its own footer/scroll) */}
            <Route path="/" element={<Landing />} />

            {/* Main App Layout - includes global footer */}
            <Route element={<MainLayout />}>
              <Route
                path="/welcome"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/paper-trading"
                element={
                  <ProtectedRoute>
                    <PaperTrading />
                  </ProtectedRoute>
                }
              />
              <Route path="/market" element={<MarketOverview />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route
                path="/penny"
                element={
                  <ProtectedRoute>
                    <PennyStocks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pro"
                element={
                  <ProtectedRoute>
                    <ProGate>
                      <ProDashboard />
                    </ProGate>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/refunds" element={<RefundPolicy />} />
              <Route path="/disclaimer" element={<RiskDisclaimer />} />
            </Route>
          </Routes>
        </GameProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
