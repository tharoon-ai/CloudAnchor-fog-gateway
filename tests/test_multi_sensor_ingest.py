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

class TestMultiSensorIngest(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()

    def test_01_insert_and_retrieve_multi_sensor_record(self):
        req_id = f"REQ-TEST-MS-{uuid.uuid4().hex[:6]}"
        res = insert_record(
            request_id=req_id,
            device_id="ESP32-001",
            timestamp="2026-10-05 21:00:00",
            temperature=27.5,
            humidity=45.0,
            acceleration_x=0.02,
            acceleration_y=0.01,
            acceleration_z=0.99,
            vibration_level=0.04,
            voltage=5.02,
            current=135.0,
            power=0.68,
            gas_level=210.0,
            pressure=1012.5,
            health_score=92,
            system_status="NORMAL",
            risk_level="LOW",
            warning_reason=None,
            status="PENDING"
        )
        self.assertTrue(res)
        rec = get_record_by_request_id(req_id)
        self.assertIsNotNone(rec)
        self.assertEqual(rec["temperature"], 27.5)
        self.assertEqual(rec["vibration_level"], 0.04)
        self.assertEqual(rec["voltage"], 5.02)
        self.assertEqual(rec["current"], 135.0)
        self.assertEqual(rec["power"], 0.68)
        self.assertEqual(rec["gas_level"], 210.0)
        self.assertEqual(rec["pressure"], 1012.5)
        self.assertEqual(rec["health_score"], 92)
        self.assertEqual(rec["system_status"], "NORMAL")

    def test_02_ingest_payload_generates_fusion(self):
        req_id = f"REQ-TEST-INGEST-{uuid.uuid4().hex[:6]}"
        payload = SensorPayload(
            request_id=req_id,
            device_id="ESP32-002",
            timestamp="2026-10-05 21:05:00",
            temperature=32.0,
            humidity=50.0,
            acceleration_x=0.05,
            acceleration_y=0.02,
            acceleration_z=0.98,
            vibration_level=0.08,
            voltage=4.98,
            current=180.0,
            power=0.90,
            gas_level=230.0,
            pressure=1011.0
        )
        res = asyncio.run(ingest_sensor_data(payload))
        self.assertIn(res["status"], ["success", "buffered"])
        self.assertEqual(res["request_id"], req_id)
        self.assertIn("health_score", res)
        self.assertIn("system_status", res)
        
        # Verify stored in SQLite
        rec = get_record_by_request_id(req_id)
        self.assertIsNotNone(rec)
        self.assertEqual(rec["health_score"], res["health_score"])

    def test_03_validation_rejects_out_of_range(self):
        with self.assertRaises(Exception):
            SensorPayload(
                request_id="REQ-INVALID",
                device_id="ESP32-001",
                timestamp="now",
                temperature=250.0, # Exceeds max 120
                humidity=50.0
            )

if __name__ == "__main__":
    unittest.main()
