import unittest
import asyncio
import uuid
from backend.database import (
    init_db,
    get_record_by_request_id,
    insert_record,
    update_status,
    get_pending_records,
    get_queue_counts
)
from backend.main import ingest_sensor_data, get_metrics, SensorPayload

class TestGatewayQueue(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def test_01_insert_and_retrieve_record(self):
        req_id = f"REQ-UNIT-{uuid.uuid4().hex[:6]}"
        res = insert_record(req_id, "TEST-DEV", 24.5, 50.0, "100s", status="PENDING")
        self.assertTrue(res)
        rec = get_record_by_request_id(req_id)
        self.assertIsNotNone(rec)
        self.assertEqual(rec["status"], "PENDING")
        self.assertEqual(rec["temperature"], 24.5)

    def test_02_duplicate_insert_fails(self):
        req_id = f"REQ-UNIT-{uuid.uuid4().hex[:6]}"
        res1 = insert_record(req_id, "TEST-DEV", 24.5, 50.0, "100s", status="PENDING")
        self.assertTrue(res1)
        # Second insert must return False due to UNIQUE constraint
        res2 = insert_record(req_id, "TEST-DEV", 24.5, 50.0, "100s", status="PENDING")
        self.assertFalse(res2)

    def test_03_update_status_lifecycle(self):
        req_id = f"REQ-UNIT-{uuid.uuid4().hex[:6]}"
        insert_record(req_id, "TEST-DEV", 26.0, 60.0, "101s", status="PENDING")
        update_status(req_id, "SYNCED")
        rec = get_record_by_request_id(req_id)
        self.assertEqual(rec["status"], "SYNCED")

    def test_04_get_pending_records_fifo(self):
        req1 = f"REQ-FIFO-1-{uuid.uuid4().hex[:6]}"
        req2 = f"REQ-FIFO-2-{uuid.uuid4().hex[:6]}"
        insert_record(req1, "TEST-DEV", 20.0, 40.0, "102s", status="PENDING")
        insert_record(req2, "TEST-DEV", 21.0, 41.0, "103s", status="PENDING")
        pending = get_pending_records(limit=1000)
        req_ids = [p["request_id"] for p in pending]
        self.assertIn(req1, req_ids)
        self.assertIn(req2, req_ids)

    def test_05_ingest_duplicate_graceful(self):
        req_id = f"REQ-DUP-{uuid.uuid4().hex[:6]}"
        insert_record(req_id, "TEST-DEV", 22.0, 45.0, "104s", status="PENDING")
        payload = SensorPayload(
            device_id="TEST-DEV",
            temperature=22.0,
            humidity=45.0,
            timestamp="104s",
            request_id=req_id
        )
        res = asyncio.run(ingest_sensor_data(payload))
        self.assertEqual(res["status"], "duplicate")
        self.assertIn("already exists", res["message"])

    def test_06_metrics_counts(self):
        metrics = asyncio.run(get_metrics())
        self.assertIn("pending_queue", metrics)
        self.assertIn("synced_queue", metrics)
        self.assertIn("failed_queue", metrics)
        self.assertIn("circuit_breaker_state", metrics)

if __name__ == "__main__":
    unittest.main()
