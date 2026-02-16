import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase"; // KEEP this for Supabase auth
import client from "../api/client"; // Use the new API client for other calls
import { gameApi } from "../api/game"; // Import gameApi for gamification stats

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const [gamificationStats, setGamificationStats] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const didRedirect = useRef(false);

  const fetchGamificationStats = useCallback(async (userId) => {
    try {
      const stats = await gameApi.getStats(userId);
      setGamificationStats(stats);
    } catch (error) {
      console.error("Error fetching gamification stats:", error);
      setGamificationStats(null);
    }
  }, []);

  const checkProStatus = useCallback(async (userId) => {
    try {
      // Endpoint uses JWT to identify user, no need to pass userId in path
      const { data } = await client.get("/api/payments/status");
      setIsPro(data?.isPro || false);
      setHasUsedTrial(data?.hasUsedTrial || false);
    } catch (error) {
      console.error("Error checking pro status:", error);
      setIsPro(false);
      setHasUsedTrial(false);
    }
  }, []);

  const loadUserSession = useCallback(async () => {
    setLoading(true);
    const {
      data: { session: s },
    } = await supabase.auth.getSession();
    // setSession(s); // No longer needed
    setUser(s?.user ?? null);

    if (s?.user) {
      await checkProStatus(s.user.id);
      await fetchGamificationStats(s.user.id);
    } else {
      setIsPro(false);
      setHasUsedTrial(false);
      setGamificationStats(null);
    }
    setLoading(false);
  }, [checkProStatus, fetchGamificationStats]);

  useEffect(() => {
    loadUserSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, s) => {
      console.log("[Auth] Event:", event);
      // setSession(s); // No longer needed
      setUser(s?.user ?? null);

      if (event === "SIGNED_IN" && s?.user) {
        await checkProStatus(s.user.id);
        await fetchGamificationStats(s.user.id);
        // Handle redirect after sign-in
        if (!didRedirect.current) {
          didRedirect.current = true;
          if (window.location.hash) {
            window.history.replaceState(null, "", window.location.pathname);
          }
          if (location.pathname === "/" || location.pathname === "/login") {
            navigate("/penny", { replace: true });
          }
        }
      } else if (event === "SIGNED_OUT") {
        setIsPro(false);
        setHasUsedTrial(false);
        setGamificationStats(null);
        didRedirect.current = false;
        navigate("/", { replace: true });
      } else if (event === "TOKEN_REFRESHED" && s?.user) {
        await checkProStatus(s.user.id);
        await fetchGamificationStats(s.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [location.pathname, navigate, checkProStatus, fetchGamificationStats]);

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) console.error("Login error:", error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    // setSession(null); // No longer needed
    setIsPro(false);
    setGamificationStats(null);
    navigate("/", { replace: true });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isPro,
        hasUsedTrial,
        gamificationStats,
        signInWithGoogle,
        signOut,
        checkProStatus,
        fetchGamificationStats,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
