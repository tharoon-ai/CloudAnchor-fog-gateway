import unittest
import time
import threading
import uuid
from fastapi.testclient import TestClient
from backend.telemetry_cache import TelemetryCache, telemetry_cache
from backend.main import app, circuit_breaker

class TestTelemetryCache(unittest.TestCase):
    def setUp(self):
        # Use an isolated cache instance for unit tests
        self.cache = TelemetryCache()

    def test_01_empty_cache(self):
        result = self.cache.get("NON_EXISTENT_DEVICE")
        self.assertIsNone(result)

    def test_02_cache_update_and_retrieval(self):
        self.cache.update(
            device_id="ESP32-WOKWI-SIM",
            temperature=24.5,
            humidity=40.0,
            timestamp="2026-08-26T21:00:00"
        )
        data = self.cache.get("ESP32-WOKWI-SIM")
        self.assertIsNotNone(data)
        self.assertEqual(data["status"], "cached")
        self.assertEqual(data["label"], "Cached / Stale")
        self.assertEqual(data["device_id"], "ESP32-WOKWI-SIM")
        self.assertEqual(data["temperature"], 24.5)
        self.assertEqual(data["humidity"], 40.0)
        self.assertEqual(data["timestamp"], "2026-08-26T21:00:00")
        self.assertIn("last_updated_sec_ago", data)
        self.assertIsInstance(data["last_updated_sec_ago"], (int, float))

    def test_03_last_updated_sec_ago(self):
        self.cache.update("DEV-TIMER", 20.0, 50.0, "2026-08-26T21:00:00")
        time.sleep(0.15)
        data = self.cache.get("DEV-TIMER")
        self.assertIsNotNone(data)
        self.assertGreaterEqual(data["last_updated_sec_ago"], 0.1)

    def test_04_multiple_device_ids(self):
        self.cache.update("DEV-A", 22.0, 45.0, "T1")
        self.cache.update("DEV-B", 28.0, 65.0, "T2")

        data_a = self.cache.get("DEV-A")
        data_b = self.cache.get("DEV-B")

        self.assertIsNotNone(data_a)
        self.assertIsNotNone(data_b)
        self.assertEqual(data_a["temperature"], 22.0)
        self.assertEqual(data_b["temperature"], 28.0)

        # Update DEV-A should not affect DEV-B
        self.cache.update("DEV-A", 23.5, 46.0, "T3")
        data_a_updated = self.cache.get("DEV-A")
        data_b_unchanged = self.cache.get("DEV-B")

        self.assertEqual(data_a_updated["temperature"], 23.5)
        self.assertEqual(data_b_unchanged["temperature"], 28.0)

    def test_05_thread_safe_access(self):
        errors = []

        def worker_writer(device_id: str, count: int):
            try:
                for i in range(count):
                    self.cache.update(device_id, float(i), float(i * 2), f"TS-{i}")
            except Exception as e:
                errors.append(e)

        def worker_reader(device_id: str, count: int):
            try:
                for _ in range(count):
                    self.cache.get(device_id)
            except Exception as e:
                errors.append(e)

        threads = []
        for d in range(5):
            dev = f"DEV-THREAD-{d}"
            threads.append(threading.Thread(target=worker_writer, args=(dev, 50)))
            threads.append(threading.Thread(target=worker_reader, args=(dev, 50)))

        for t in threads:
            t.start()
        for t in threads:
            t.join()

        self.assertEqual(len(errors), 0, f"Thread safety errors occurred: {errors}")

    def test_06_api_cache_endpoint_success(self):
        dev_id = f"DEV-API-{uuid.uuid4().hex[:6]}"
        telemetry_cache.update(
            device_id=dev_id,
            temperature=25.5,
            humidity=55.0,
            timestamp="2026-08-26T21:00:00"
        )
        with TestClient(app) as client:
            response = client.get(f"/api/cache/{dev_id}")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["status"], "cached")
            self.assertEqual(data["label"], "Cached / Stale")
            self.assertEqual(data["device_id"], dev_id)
            self.assertEqual(data["temperature"], 25.5)
            self.assertEqual(data["humidity"], 55.0)
            self.assertIn("last_updated_sec_ago", data)

    def test_07_api_cache_endpoint_not_found(self):
        with TestClient(app) as client:
            response = client.get(f"/api/cache/NON_EXISTENT_{uuid.uuid4().hex[:6]}")
            self.assertEqual(response.status_code, 404)
            data = response.json()
            self.assertIn("detail", data)

    def test_08_cache_availability_during_cloud_outage(self):
        # Simulate circuit breaker OPEN with active cooldown
        circuit_breaker.state = "OPEN"
        circuit_breaker.opened_at = time.time()
        dev_id = f"DEV-OUTAGE-{uuid.uuid4().hex[:6]}"
        req_id = f"REQ-OUTAGE-{uuid.uuid4().hex[:6]}"

        with TestClient(app) as client:
            # Send ingest request while cloud is blocked
            ingest_payload = {
                "device_id": dev_id,
                "temperature": 29.5,
                "humidity": 70.0,
                "timestamp": "2026-08-26T21:15:00",
                "request_id": req_id
            }
            res_ingest = client.post("/api/ingest", json=ingest_payload)
            self.assertEqual(res_ingest.status_code, 200)
            ingest_data = res_ingest.json()
            self.assertEqual(ingest_data["status"], "buffered")
            self.assertEqual(ingest_data["circuit_breaker_state"], "OPEN")

            # Cache must immediately return the stale telemetry reading
            res_cache = client.get(f"/api/cache/{dev_id}")
            self.assertEqual(res_cache.status_code, 200)
            cache_data = res_cache.json()
            self.assertEqual(cache_data["status"], "cached")
            self.assertEqual(cache_data["label"], "Cached / Stale")
            self.assertEqual(cache_data["device_id"], dev_id)
            self.assertEqual(cache_data["temperature"], 29.5)
            self.assertEqual(cache_data["humidity"], 70.0)

        # Reset circuit breaker state for subsequent tests
        circuit_breaker.state = "CLOSED"
        circuit_breaker.consecutive_failures = 0

if __name__ == "__main__":
    unittest.main()
