import unittest
from backend.main import backoff_delay, BASE_BACKOFF, MAX_BACKOFF

class TestExponentialBackoff(unittest.TestCase):
    def test_01_base_delay(self):
        self.assertEqual(backoff_delay(0), 2)

    def test_02_exponential_growth(self):
        self.assertEqual(backoff_delay(1), 4)
        self.assertEqual(backoff_delay(2), 8)
        self.assertEqual(backoff_delay(3), 16)
        self.assertEqual(backoff_delay(4), 32)

    def test_03_max_backoff_cap(self):
        self.assertEqual(backoff_delay(5), 32)
        self.assertEqual(backoff_delay(10), 32)

if __name__ == "__main__":
    unittest.main()
