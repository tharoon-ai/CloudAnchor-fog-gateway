import unittest
from fastapi.testclient import TestClient
from backend.main import app

class TestGatewayPhase1(unittest.TestCase):
    def test_health_metrics_initial(self):
        with TestClient(app) as client:
            response = client.get("/api/metrics")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["total_requests"], 0)
            self.assertEqual(data["success_requests"], 0)
            self.assertEqual(data["failed_requests"], 0)

    def test_logs_initial(self):
        with TestClient(app) as client:
            response = client.get("/api/logs")
            self.assertEqual(response.status_code, 200)
            logs = response.json()
            self.assertIn("Fog Gateway Started", logs[0]["message"])

if __name__ == "__main__":
    unittest.main()
