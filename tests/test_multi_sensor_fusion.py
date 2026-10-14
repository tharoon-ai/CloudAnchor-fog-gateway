import unittest
from backend.multi_sensor_fusion import MultiSensorFusionEngine

class TestMultiSensorFusion(unittest.TestCase):

    def test_01_normal_condition(self):
        result = MultiSensorFusionEngine.evaluate(
            temperature=26.5,
            humidity=50.0,
            vibration_level=0.05,
            voltage=5.02,
            current=120.0,
            power=0.60,
            gas_level=200.0,
            pressure=1013.2
        )
        self.assertEqual(result["system_status"], "NORMAL")
        self.assertEqual(result["risk_level"], "LOW")
        self.assertGreaterEqual(result["health_score"], 85)
        self.assertIsNone(result["warning_reason"])

    def test_02_warning_elevated_vibration_and_current(self):
        result = MultiSensorFusionEngine.evaluate(
            temperature=30.0,
            humidity=55.0,
            vibration_level=0.45,  # High vibration > 0.35
            voltage=5.0,
            current=600.0,         # High current > 500
            power=3.0,
            gas_level=220.0
        )
        self.assertEqual(result["system_status"], "WARNING")
        self.assertEqual(result["risk_level"], "MEDIUM")
        self.assertLess(result["health_score"], 80)
        self.assertIsNotNone(result["warning_reason"])
        self.assertIn("Vibration", result["warning_reason"])
        self.assertIn("Current", result["warning_reason"])

    def test_03_critical_severe_overheating_and_gas(self):
        result = MultiSensorFusionEngine.evaluate(
            temperature=72.0,      # Severe overheating > 65
            humidity=40.0,
            vibration_level=0.85,  # Critical vibration > 0.75
            voltage=4.2,           # Low voltage
            current=950.0,         # Severe current overload > 900
            power=4.0,
            gas_level=800.0        # Hazardous gas > 750
        )
        self.assertEqual(result["system_status"], "CRITICAL")
        self.assertEqual(result["risk_level"], "HIGH")
        self.assertLessEqual(result["health_score"], 35)
        self.assertIsNotNone(result["warning_reason"])
        self.assertIn("Severe Overheating", result["warning_reason"])

    def test_04_vibration_calculated_from_accel(self):
        result = MultiSensorFusionEngine.evaluate(
            temperature=25.0,
            humidity=50.0,
            acceleration_x=0.5,
            acceleration_y=0.4,
            acceleration_z=1.2,    # Combined norm sqrt(0.25+0.16+1.44) = 1.36 -> dev ~ 0.36g
            voltage=5.0,
            current=100.0
        )
        self.assertIn("vibration", result["sensor_stresses"])

if __name__ == "__main__":
    unittest.main()
