import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import MarketOverview from './pages/MarketOverview';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import PennyStocks from './pages/PennyStocks';
import ProDashboard from './pages/ProDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ProGate from './components/ProGate';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import LifetimeBanner from './components/LifetimeBanner';
import ErrorDisplay from './components/ErrorDisplay';
import ScrollToTop from './components/ScrollToTop'; // Import ScrollToTop

import Footer from './components/Footer';

const MainLayout = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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
        <ScrollToTop /> {/* Add ScrollToTop here */}
        <Navbar />
        <LifetimeBanner />
        <Routes>
          {/* Landing Page - custom layout (manages its own footer/scroll) */}
          <Route path="/" element={<Landing />} />

          {/* Main App Layout - includes global footer */}
          <Route element={<MainLayout />}>
            <Route path="/welcome" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />
            <Route path="/market" element={<MarketOverview />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/penny" element={
              <ProtectedRoute>
                <PennyStocks />
              </ProtectedRoute>
            } />
            <Route path="/pro" element={
              <ProtectedRoute>
                <ProGate>
                  <ProDashboard />
                </ProGate>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
