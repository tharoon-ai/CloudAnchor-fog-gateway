import time
import threading
from typing import Dict, Any, Optional, List

class TelemetryCache:
    """Thread-safe in-memory cache storing the latest multi-sensor telemetry and fusion state per device."""

    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def update(
        self,
        device_id: str,
        temperature: float,
        humidity: float,
        timestamp: str,
        acceleration_x: float = 0.0,
        acceleration_y: float = 0.0,
        acceleration_z: float = 1.0,
        vibration_level: float = 0.0,
        voltage: float = 5.0,
        current: float = 0.0,
        power: float = 0.0,
        gas_level: Optional[float] = None,
        pressure: Optional[float] = None,
        health_score: int = 100,
        system_status: str = "NORMAL",
        risk_level: str = "LOW",
        warning_reason: Optional[str] = None,
        request_id: Optional[str] = None
    ) -> None:
        """Update or insert the latest multi-sensor reading for a given device_id."""
        with self._lock:
            self._cache[device_id] = {
                "device_id": device_id,
                "request_id": request_id,
                "timestamp": str(timestamp),
                "temperature": float(temperature),
                "humidity": float(humidity),
                "acceleration_x": float(acceleration_x),
                "acceleration_y": float(acceleration_y),
                "acceleration_z": float(acceleration_z),
                "vibration_level": float(vibration_level),
                "voltage": float(voltage),
                "current": float(current),
                "power": float(power),
                "gas_level": gas_level,
                "pressure": pressure,
                "health_score": health_score,
                "system_status": system_status,
                "risk_level": risk_level,
                "warning_reason": warning_reason,
                "cached_at": time.time()
            }

    def get(self, device_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve the cached reading with last_updated_sec_ago calculation and sensor freshness."""
        with self._lock:
            entry = self._cache.get(device_id)
            if not entry:
                return None
            
            elapsed = time.time() - entry["cached_at"]
            is_stale = elapsed > 10.0
            
            res = dict(entry)
            res["status"] = "cached"
            res["label"] = "Cached / Stale"
            res["freshness"] = "stale" if is_stale else "active"
            res["last_updated_sec_ago"] = round(elapsed, 1)
            
            # Individual sensor freshness status
            res["sensor_status"] = {
                "dht22": "ONLINE" if not is_stale else "STALE",
                "mpu6050": "ONLINE" if not is_stale else "STALE",
                "ina219": "ONLINE" if not is_stale else "STALE",
                "mq2": "ONLINE" if (entry.get("gas_level") is not None and not is_stale) else "NOT_CONFIGURED" if entry.get("gas_level") is None else "STALE",
                "bmp280": "ONLINE" if (entry.get("pressure") is not None and not is_stale) else "NOT_CONFIGURED" if entry.get("pressure") is None else "STALE"
            }
            return res

    def get_latest(self) -> Optional[Dict[str, Any]]:
        """Retrieve the most recently updated device telemetry across all devices."""
        with self._lock:
            if not self._cache:
                return None
            latest_dev = max(self._cache.keys(), key=lambda k: self._cache[k]["cached_at"])
            entry = self._cache[latest_dev]
            elapsed = time.time() - entry["cached_at"]
            is_stale = elapsed > 10.0
            
            res = dict(entry)
            res["status"] = "cached"
            res["label"] = "Cached / Stale"
            res["freshness"] = "stale" if is_stale else "active"
            res["last_updated_sec_ago"] = round(elapsed, 1)
            res["sensor_status"] = {
                "dht22": "ONLINE" if not is_stale else "STALE",
                "mpu6050": "ONLINE" if not is_stale else "STALE",
                "ina219": "ONLINE" if not is_stale else "STALE",
                "mq2": "ONLINE" if (entry.get("gas_level") is not None and not is_stale) else "NOT_CONFIGURED" if entry.get("gas_level") is None else "STALE",
                "bmp280": "ONLINE" if (entry.get("pressure") is not None and not is_stale) else "NOT_CONFIGURED" if entry.get("pressure") is None else "STALE"
            }
            return res

    def clear(self) -> None:
        """Clear all entries from the cache."""
        with self._lock:
            self._cache.clear()

    def get_all_devices(self) -> List[str]:
        """Return list of all cached device IDs."""
        with self._lock:
            return list(self._cache.keys())

# Global cache instance for the Fog Gateway
telemetry_cache = TelemetryCache()
