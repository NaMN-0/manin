
import sys
import os
import unittest

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../api')))

from api.services.gamification_service import GamificationService

class TestGamification(unittest.TestCase):
    def test_calculate_level(self):
        # Level = floor(sqrt(XP / 100))
        # 0 XP -> 0
        self.assertEqual(GamificationService.calculate_level(0), 0)
        # 99 XP -> 0
        self.assertEqual(GamificationService.calculate_level(99), 0)
        # 100 XP -> 1
        self.assertEqual(GamificationService.calculate_level(100), 1)
        # 399 XP -> 1 (sqrt(3.99) ~ 1.99)
        self.assertEqual(GamificationService.calculate_level(399), 1)
        # 400 XP -> 2
        self.assertEqual(GamificationService.calculate_level(400), 2)
        # 2500 XP -> 5
        self.assertEqual(GamificationService.calculate_level(2500), 5)
        
    def test_xp_to_next_level(self):
        # XP needed for level L+1 = 100 * (L+1)^2
        # Current Level 0 -> Need 100 XP for Level 1
        self.assertEqual(GamificationService.xp_to_next_level(0), 100)
        # Current Level 1 -> Need 400 XP for Level 2
        self.assertEqual(GamificationService.xp_to_next_level(1), 400)
        # Current Level 4 -> Need 2500 XP for Level 5
        self.assertEqual(GamificationService.xp_to_next_level(4), 2500)

    def test_get_rank(self):
        self.assertEqual(GamificationService.get_rank(0), "genin")
        self.assertEqual(GamificationService.get_rank(5), "genin")
        self.assertEqual(GamificationService.get_rank(9), "genin")
        self.assertEqual(GamificationService.get_rank(10), "chunin")
        self.assertEqual(GamificationService.get_rank(19), "chunin")
        self.assertEqual(GamificationService.get_rank(20), "jonin")
        self.assertEqual(GamificationService.get_rank(50), "kage")

if __name__ == '__main__':
    unittest.main()
