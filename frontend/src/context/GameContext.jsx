import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
// import { supabase } from "../lib/supabase"; // Removed unused supabase import
import { useAuth } from "./AuthContext";
import { gameApi } from "../api/game"; // Import the new gameApi

const GameContext = createContext({});

export function GameProvider({ children }) {
  const { user, gamificationStats } = useAuth();
  const [xp, setXp] = useState(0);
  const [virtualCash, setVirtualCash] = useState(100000); // Assuming this is managed separately
  const [level, setLevel] = useState(1);
  const [rank, setRank] = useState("Novice");
  const [badges] = useState([]); // Badges are not currently managed but kept for future expansion
  const [justLeveledUp, setJustLeveledUp] = useState(false);

  // This logic should primarily come from the backend's gamificationStats.
  // Keeping it here for initial UI responsiveness before backend sync, but backend is source of truth.
  const getLevelFromXp = useCallback((totalXp) => {
    if (totalXp < 0) return 0;
    return Math.floor(Math.sqrt(totalXp / 100)); // Match backend formula
  }, []);

  const getRankFromLevel = useCallback((lvl) => {
    if (lvl >= 50) return "Kage";
    if (lvl >= 20) return "Jonin";
    if (lvl >= 10) return "Chunin";
    if (lvl >= 0) return "Genin";
    return "Genin";
  }, []);

  useEffect(() => {
    if (gamificationStats && gamificationStats.xp !== undefined) {
      setXp(gamificationStats.xp);
      setLevel(gamificationStats.level);
      setRank(
        gamificationStats.rank || getRankFromLevel(gamificationStats.level),
      );
    } else if (user) {
      // If gamificationStats from AuthContext is not yet available, fetch it
      loadGameProfile(user.id);
    }
  }, [user, gamificationStats, getLevelFromXp, getRankFromLevel]);

  const loadGameProfile = useCallback(
    async (userId) => {
      if (!userId) return;
      try {
        // Fetch stats from our backend API
        const stats = await gameApi.getStats(userId);
        setXp(stats.xp || 0);
        setLevel(stats.level || 0);
        setRank(stats.rank || getRankFromLevel(stats.level || 0));
        // Assuming virtual_cash will be part of these stats or fetched separately
        // setVirtualCash(stats.virtual_cash || 100000);
      } catch (err) {
        console.error("Error loading game profile from API:", err);
        // Fallback to localStorage for XP if API fails (e.g., during dev)
        const savedXp = parseInt(localStorage.getItem(`xp_${userId}`)) || 0;
        setXp(savedXp);
        const lvl = getLevelFromXp(savedXp);
        setLevel(lvl);
        setRank(getRankFromLevel(lvl));
      }
    },
    [getLevelFromXp, getRankFromLevel],
  );

  const addXp = async (amount, reason) => {
    if (!user || !user.id) {
      console.warn("User not logged in, XP not added.");
      return;
    }

    try {
      const result = await gameApi.addXp(user.id, amount, reason);
      if (result.status === "ok") {
        setXp(result.totalXp);
        if (result.leveledUp) {
          setLevel(result.newLevel);
          setRank(result.rank);
          setJustLeveledUp(true);
        }
        console.log(`+${amount} XP: ${reason}. Total XP: ${result.totalXp}`);
      } else {
        console.error("Error adding XP from API:", result.error);
      }
    } catch (err) {
      console.error("Error calling addXp API:", err);
      // Fallback for UI if API call fails
      const newXp = xp + amount;
      setXp(newXp);
      const newLevel = getLevelFromXp(newXp);
      if (newLevel > level) {
        setLevel(newLevel);
        setRank(getRankFromLevel(newLevel));
        setJustLeveledUp(true);
      }
    }
  };

  const addCash = async (amount, reason) => {
    // This should eventually go through an API endpoint to prevent direct DB access
    // For now, it will update locally.
    console.log(`+$${amount} Virtual Cash: ${reason}`);
    setVirtualCash(virtualCash + amount);
    // In a future refactor, this would be:
    // await gameApi.addCash(user.id, amount, reason);
  };

  const clearLevelUp = () => setJustLeveledUp(false);

  return (
    <GameContext.Provider
      value={{
        xp,
        virtualCash,
        level,
        rank,
        badges,
        addXp,
        addCash,
        justLeveledUp,
        clearLevelUp,
        getRankFromLevel,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useGame = () => useContext(GameContext);
