"""
Multi-Sensor Fusion Engine for CloudAnchor Fog Gateway.
Academic Rule-Based Edge Intelligence Layer.

Analyzes raw telemetry from multiple IoT sensors:
- DHT22 (Temperature, Humidity)
- MPU6050 (Acceleration X/Y/Z, Vibration Level)
- INA219 (Voltage, Current, Power)
- MQ-2 (Gas/Smoke Level)
- BMP280 (Atmospheric Pressure)

Calculates:
- Health Score (0 - 100)
- System Status (NORMAL, WARNING, CRITICAL)
- Risk Level (LOW, MEDIUM, HIGH)
- Human-readable Warning Reason
"""

from typing import Dict, Any, Optional, Tuple, List


class MultiSensorFusionEngine:
    """Rule-Based Multi-Sensor Fusion Engine executing at the Fog Layer."""

    # Nominal & Threshold Parameters
    TEMP_WARNING_HIGH = 45.0      # °C
    TEMP_CRITICAL_HIGH = 65.0     # °C
    TEMP_WARNING_LOW = 0.0        # °C

    HUM_WARNING_HIGH = 85.0       # %
    HUM_WARNING_LOW = 15.0        # %

    VIB_WARNING_HIGH = 0.35       # g (vibration index)
    VIB_CRITICAL_HIGH = 0.75      # g

    VOLT_NOMINAL = 5.0            # V
    VOLT_TOLERANCE = 0.75         # ±0.75V nominal band
    CURRENT_WARNING_HIGH = 500.0  # mA
    CURRENT_CRITICAL_HIGH = 900.0 # mA

    GAS_WARNING_HIGH = 450.0      # ppm (MQ-2)
    GAS_CRITICAL_HIGH = 750.0     # ppm

    PRESSURE_WARNING_LOW = 980.0  # hPa (BMP280)
    PRESSURE_WARNING_HIGH = 1040.0# hPa

    @classmethod
    def evaluate(
        cls,
        temperature: Optional[float] = None,
        humidity: Optional[float] = None,
        vibration_level: Optional[float] = None,
        voltage: Optional[float] = None,
        current: Optional[float] = None,
        power: Optional[float] = None,
        gas_level: Optional[float] = None,
        pressure: Optional[float] = None,
        acceleration_x: Optional[float] = None,
        acceleration_y: Optional[float] = None,
        acceleration_z: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Evaluate multi-sensor readings and return fusion assessment.
        
        Returns:
            dict containing:
                - health_score: int (0 - 100)
                - system_status: str ("NORMAL" | "WARNING" | "CRITICAL")
                - risk_level: str ("LOW" | "MEDIUM" | "HIGH")
                - warning_reason: Optional[str]
                - sensor_stresses: Dict[str, float]
                - evaluation_method: str ("Rule-Based Multi-Sensor Fusion")
        """
        deductions = 0.0
        critical_flags: List[str] = []
        warning_flags: List[str] = []
        sensor_stresses: Dict[str, float] = {}

        # 1. Thermal Stress (DHT22)
        if temperature is not None:
            if temperature >= cls.TEMP_CRITICAL_HIGH:
                deductions += 40.0
                critical_flags.append(f"Severe Overheating ({temperature:.1f}°C >= {cls.TEMP_CRITICAL_HIGH}°C)")
                sensor_stresses["thermal"] = 100.0
            elif temperature >= cls.TEMP_WARNING_HIGH:
                deductions += 18.0
                warning_flags.append(f"Elevated Temperature ({temperature:.1f}°C)")
                sensor_stresses["thermal"] = 60.0
            elif temperature < cls.TEMP_WARNING_LOW:
                deductions += 15.0
                warning_flags.append(f"Freezing Temperature ({temperature:.1f}°C)")
                sensor_stresses["thermal"] = 50.0
            else:
                sensor_stresses["thermal"] = 0.0

        # 2. Humidity Stress (DHT22)
        if humidity is not None:
            if humidity > cls.HUM_WARNING_HIGH:
                deductions += 10.0
                warning_flags.append(f"Excessive Moisture ({humidity:.0f}%)")
                sensor_stresses["humidity"] = 50.0
            elif humidity < cls.HUM_WARNING_LOW:
                deductions += 8.0
                warning_flags.append(f"Low Humidity / Static Risk ({humidity:.0f}%)")
                sensor_stresses["humidity"] = 40.0
            else:
                sensor_stresses["humidity"] = 0.0

        # 3. Mechanical Vibration (MPU6050)
        # If vibration_level not directly given, approximate from accelerometer vectors
        effective_vib = vibration_level
        if effective_vib is None and all(v is not None for v in [acceleration_x, acceleration_y, acceleration_z]):
            # Dynamic deviation from 1.0g gravitational baseline
            norm = (acceleration_x**2 + acceleration_y**2 + acceleration_z**2)**0.5
            effective_vib = abs(norm - 1.0)

        if effective_vib is not None:
            if effective_vib >= cls.VIB_CRITICAL_HIGH:
                deductions += 40.0
                critical_flags.append(f"Dangerous Mechanical Vibration ({effective_vib:.2f}g)")
                sensor_stresses["vibration"] = 100.0
            elif effective_vib >= cls.VIB_WARNING_HIGH:
                deductions += 18.0
                warning_flags.append(f"Abnormal Vibration ({effective_vib:.2f}g)")
                sensor_stresses["vibration"] = 60.0
            else:
                sensor_stresses["vibration"] = 0.0

        # 4. Electrical Load & Power (INA219)
        if current is not None:
            if current >= cls.CURRENT_CRITICAL_HIGH:
                deductions += 35.0
                critical_flags.append(f"Severe Current Overload ({current:.1f}mA)")
                sensor_stresses["electrical"] = 100.0
            elif current >= cls.CURRENT_WARNING_HIGH:
                deductions += 16.0
                warning_flags.append(f"High Current Draw ({current:.1f}mA)")
                sensor_stresses["electrical"] = 55.0
            else:
                sensor_stresses["electrical"] = 0.0

        if voltage is not None:
            volt_diff = abs(voltage - cls.VOLT_NOMINAL)
            if volt_diff > cls.VOLT_TOLERANCE * 1.8:
                deductions += 25.0
                critical_flags.append(f"Critical Voltage Instability ({voltage:.2f}V)")
            elif volt_diff > cls.VOLT_TOLERANCE:
                deductions += 12.0
                warning_flags.append(f"Voltage Deviation ({voltage:.2f}V)")

        # 5. Environmental Gas / Smoke (MQ-2)
        if gas_level is not None:
            if gas_level >= cls.GAS_CRITICAL_HIGH:
                deductions += 45.0
                critical_flags.append(f"Hazardous Gas/Smoke Detected ({gas_level:.0f} ppm)")
                sensor_stresses["gas"] = 100.0
            elif gas_level >= cls.GAS_WARNING_HIGH:
                deductions += 20.0
                warning_flags.append(f"Elevated Gas Level ({gas_level:.0f} ppm)")
                sensor_stresses["gas"] = 60.0
            else:
                sensor_stresses["gas"] = 0.0

        # 6. Barometric Pressure (BMP280)
        if pressure is not None:
            if pressure < cls.PRESSURE_WARNING_LOW or pressure > cls.PRESSURE_WARNING_HIGH:
                deductions += 8.0
                warning_flags.append(f"Barometric Anomaly ({pressure:.1f} hPa)")
                sensor_stresses["pressure"] = 40.0
            else:
                sensor_stresses["pressure"] = 0.0

        # Calculate final Health Score (0 - 100)
        raw_score = max(0.0, min(100.0, 100.0 - deductions))
        health_score = int(round(raw_score))

        # Determine System Status and Risk Level
        if len(critical_flags) > 0 or health_score <= 45:
            system_status = "CRITICAL"
            risk_level = "HIGH"
        elif len(warning_flags) > 0 or health_score <= 75:
            system_status = "WARNING"
            risk_level = "MEDIUM"
        else:
            system_status = "NORMAL"
            risk_level = "LOW"

        # Construct Reason
        all_reasons = critical_flags + warning_flags
        if all_reasons:
            warning_reason = "; ".join(all_reasons)
        else:
            warning_reason = None

        return {
            "health_score": health_score,
            "system_status": system_status,
            "risk_level": risk_level,
            "warning_reason": warning_reason,
            "sensor_stresses": sensor_stresses,
            "evaluation_method": "Rule-Based Multi-Sensor Fusion"
        }


# Global singleton instance for quick invocation
multi_sensor_fusion = MultiSensorFusionEngine()
