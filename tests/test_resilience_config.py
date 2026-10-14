import unittest
from fastapi.testclient import TestClient
from backend.main import app, circuit_breaker

class TestResilienceConfig(unittest.TestCase):
    def setUp(self):
        # Reset to defaults before test
        with circuit_breaker._lock:
            circuit_breaker.failure_threshold = 3
            circuit_breaker.cooldown_seconds = 10.0

    def tearDown(self):
        # Restore defaults after test
        with TestClient(app) as client:
            client.post("/api/resilience/config", json={
                "failure_threshold": 3,
                "cooldown_duration": 10.0,
                "max_backoff": 32
            })

    def test_01_get_initial_config(self):
        with TestClient(app) as client:
            res = client.get("/api/resilience/config")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertIn("failure_threshold", data)
            self.assertIn("cooldown_duration", data)
            self.assertIn("max_backoff", data)
            self.assertEqual(data["failure_threshold"], 3)
            self.assertEqual(data["cooldown_duration"], 10.0)
            self.assertEqual(data["max_backoff"], 32)

    def test_02_update_valid_config(self):
        with TestClient(app) as client:
            payload = {
                "failure_threshold": 5,
                "cooldown_duration": 20.0,
                "max_backoff": 64
            }
            res = client.post("/api/resilience/config", json=payload)
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertEqual(data["status"], "success")
            self.assertEqual(data["config"]["failure_threshold"], 5)
            self.assertEqual(data["config"]["cooldown_duration"], 20.0)
            self.assertEqual(data["config"]["max_backoff"], 64)

            # Check GET /api/resilience/config
            res_get = client.get("/api/resilience/config")
            self.assertEqual(res_get.status_code, 200)
            self.assertEqual(res_get.json()["failure_threshold"], 5)
            self.assertEqual(res_get.json()["cooldown_duration"], 20.0)
            self.assertEqual(res_get.json()["max_backoff"], 64)

            # Check GET /api/metrics reflects new threshold & max_backoff
            res_metrics = client.get("/api/metrics")
            self.assertEqual(res_metrics.status_code, 200)
            metrics_data = res_metrics.json()
            self.assertEqual(metrics_data["failure_threshold"], 5)
            self.assertEqual(metrics_data["max_backoff"], 64)

    def test_03_invalid_failure_threshold(self):
        with TestClient(app) as client:
            # Below min (0)
            res1 = client.post("/api/resilience/config", json={"failure_threshold": 0})
            self.assertEqual(res1.status_code, 400)
            self.assertIn("failure_threshold", res1.json()["detail"])

            # Above max (11)
            res2 = client.post("/api/resilience/config", json={"failure_threshold": 11})
            self.assertEqual(res2.status_code, 400)
            self.assertIn("failure_threshold", res2.json()["detail"])

    def test_04_invalid_cooldown_duration(self):
        with TestClient(app) as client:
            # Below min (0)
            res1 = client.post("/api/resilience/config", json={"cooldown_duration": 0})
            self.assertEqual(res1.status_code, 400)
            self.assertIn("cooldown_duration", res1.json()["detail"])

            # Above max (301)
            res2 = client.post("/api/resilience/config", json={"cooldown_duration": 301})
            self.assertEqual(res2.status_code, 400)
            self.assertIn("cooldown_duration", res2.json()["detail"])

    def test_05_invalid_max_backoff(self):
        with TestClient(app) as client:
            # Below min (1)
            res1 = client.post("/api/resilience/config", json={"max_backoff": 1})
            self.assertEqual(res1.status_code, 400)
            self.assertIn("max_backoff", res1.json()["detail"])

            # Above max (301)
            res2 = client.post("/api/resilience/config", json={"max_backoff": 301})
            self.assertEqual(res2.status_code, 400)
            self.assertIn("max_backoff", res2.json()["detail"])

if __name__ == "__main__":
    unittest.main()
