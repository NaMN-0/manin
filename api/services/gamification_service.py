
import os
import math
import httpx
from datetime import datetime
from typing import Optional, Dict

# Rank Thresholds
# Level N requires roughly N^2 * 100 XP
# Level 1: 0-99
# Level 2: 100-399
# Level 5: 2500 XP
# Level 10: 10000 XP (Kage)

RANKS = {
    "genin": (0, 9),      # Levels 0-9
    "chunin": (10, 19),   # Levels 10-19
    "jonin": (20, 49),    # Levels 20-49
    "kage": (50, 999)     # Levels 50+
}

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

class GamificationService:
    @staticmethod
    def calculate_level(xp: int) -> int:
        """
        Calculates level from XP.
        Formula: Level = floor(sqrt(XP / 100))
        XP = 100 * Level^2
        """
        if xp < 0: return 0
        return math.floor(math.sqrt(xp / 100))

    @staticmethod
    def get_rank(level: int) -> str:
        for rank, (min_l, max_l) in RANKS.items():
            if min_l <= level <= max_l:
                return rank
        return "kage" # Fallback for high levels

    @staticmethod
    def xp_to_next_level(level: int) -> int:
        """Total XP required to reach the start of next level."""
        return 100 * ((level + 1) ** 2)

    @staticmethod
    async def add_xp(user_id: str, amount: int, action: str) -> Dict:
        """
        Adds XP to a user and checks for level up.
        Returns check result: { "oldLevel": int, "newLevel": int, "leveledUp": bool, "newRank": str }
        """
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
             return {"error": "Supabase not configured"}

        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "apikey": SUPABASE_SERVICE_KEY,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }

            try:
                # 1. Fetch current stats
                res = await client.get(
                    f"{SUPABASE_URL}/rest/v1/manin_users?id=eq.{user_id}&select=xp,combat_style",
                    headers=headers
                )
                if res.status_code != 200 or not res.json():
                    return {"error": "User not found"}
                
                user_data = res.json()[0]
                current_xp = user_data.get("xp", 0) or 0
                old_level = GamificationService.calculate_level(current_xp)
                
                # 2. Update XP
                new_xp = current_xp + amount
                new_level = GamificationService.calculate_level(new_xp)
                leveled_up = new_level > old_level
                
                patch_data = {"xp": new_xp}
                
                # 3. Update Combat Style (Rank) if leveled up
                new_rank = user_data.get("combat_style")
                if leveled_up:
                    new_rank = GamificationService.get_rank(new_level)
                    patch_data["combat_style"] = new_rank

                await client.patch(
                    f"{SUPABASE_URL}/rest/v1/manin_users?id=eq.{user_id}",
                    headers=headers,
                    json=patch_data
                )

                # 4. Log Action (Optional - creates a history)
                # We could have a 'gamification_log' table, but for now just logging to console
                print(f"[Gamification] User {user_id} gained {amount} XP via {action}. Total: {new_xp} (Lvl {new_level})")

                return {
                    "status": "ok",
                    "xpAdded": amount,
                    "totalXp": new_xp,
                    "oldLevel": old_level,
                    "newLevel": new_level,
                    "leveledUp": leveled_up,
                    "rank": new_rank
                }

            except Exception as e:
                print(f"[Gamification] Error: {e}")
                return {"error": str(e)}

    @staticmethod
    async def get_user_stats(user_id: str) -> Dict:
        """Returns comprehensive gamification stats for frontend."""
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
             return {}

        async with httpx.AsyncClient() as client:
            try:
                res = await client.get(
                    f"{SUPABASE_URL}/rest/v1/manin_users?id=eq.{user_id}&select=xp,combat_style",
                    headers={
                        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                        "apikey": SUPABASE_SERVICE_KEY
                    }
                )
                if res.status_code == 200 and res.json():
                    data = res.json()[0]
                    xp = data.get("xp", 0) or 0
                    level = GamificationService.calculate_level(xp)
                    next_level_xp = GamificationService.xp_to_next_level(level)
                    start_level_xp = 100 * (level ** 2)
                    
                    return {
                        "xp": xp,
                        "level": level,
                        "rank": data.get("combat_style", "ronin"),
                        "nextLevelXp": next_level_xp,
                        "progress": round((xp - start_level_xp) / (next_level_xp - start_level_xp) * 100, 1) if next_level_xp > start_level_xp else 0
                    }
            except Exception as e:
                print(f"[Gamification] Stats Error: {e}")
        
        return {"xp": 0, "level": 0, "rank": "ronin", "progress": 0}
