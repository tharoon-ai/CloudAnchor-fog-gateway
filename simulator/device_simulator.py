import argparse
import random
import time
import requests

class DeviceSimulator:
    def __init__(self, gateway_url: str, interval: float, num_devices: int, anomaly: bool = False):
        self.gateway_url = gateway_url
        self.interval = interval
        self.num_devices = num_devices
        self.anomaly = anomaly
        self.running = False
        self.request_counter = int(time.time()) % 1000000

        # Generate a list of device names (Arduino Sensor Node)
        self.devices = [f"ARDUINO-{i:03d}" for i in range(1, num_devices + 1)]
        
        # Track baseline readings to generate gradual variations rather than wild jumps
        self.device_readings = {
            device: {
                "temp": random.uniform(22.0, 30.0),
                "hum": random.uniform(45.0, 65.0),
                "ax": random.uniform(-0.03, 0.03),
                "ay": random.uniform(-0.03, 0.03),
                "az": random.uniform(0.97, 1.02),
                "vib": random.uniform(0.02, 0.08),
                "volt": random.uniform(4.95, 5.08),
                "current": random.uniform(110.0, 180.0),
                "gas": random.uniform(180.0, 260.0),
                "pres": random.uniform(1010.0, 1016.0),
            }
            for device in self.devices
        }

    def generate_reading(self, device_id: str) -> dict:
        self.request_counter += 1
        request_id = f"REQ-{self.request_counter:04d}"
        
        readings = self.device_readings[device_id]

        if not self.anomaly:
            # 1. Normal Operation: subtle organic drift
            readings["temp"] += random.uniform(-0.3, 0.3)
            readings["hum"] += random.uniform(-0.8, 0.8)
            readings["ax"] += random.uniform(-0.01, 0.01)
            readings["ay"] += random.uniform(-0.01, 0.01)
            readings["az"] += random.uniform(-0.01, 0.01)
            readings["volt"] += random.uniform(-0.02, 0.02)
            readings["current"] += random.uniform(-5.0, 5.0)
            readings["gas"] += random.uniform(-4.0, 4.0)
            readings["pres"] += random.uniform(-0.2, 0.2)

            # Clamp to normal operating bands
            readings["temp"] = max(18.0, min(38.0, readings["temp"]))
            readings["hum"] = max(30.0, min(80.0, readings["hum"]))
            readings["volt"] = max(4.8, min(5.3, readings["volt"]))
            readings["current"] = max(80.0, min(260.0, readings["current"]))
            readings["gas"] = max(120.0, min(350.0, readings["gas"]))
            readings["pres"] = max(995.0, min(1030.0, readings["pres"]))

            # Dynamic vibration index from gravity vector delta
            norm = (readings["ax"]**2 + readings["ay"]**2 + readings["az"]**2)**0.5
            readings["vib"] = round(abs(norm - 1.0) + random.uniform(0.01, 0.04), 3)
        else:
            # 2. Anomaly Mode: Elevated stress to test Edge Intelligence & Fusion warnings
            readings["temp"] = random.uniform(48.0, 68.0)
            readings["hum"] = random.uniform(70.0, 90.0)
            readings["vib"] = random.uniform(0.45, 0.85)
            readings["volt"] = random.uniform(4.4, 4.7)
            readings["current"] = random.uniform(550.0, 920.0)
            readings["gas"] = random.uniform(480.0, 820.0)
            readings["pres"] = random.uniform(970.0, 1035.0)

        # Power = V * (I / 1000)
        power_W = round(readings["volt"] * (readings["current"] / 1000.0), 3)

        reading = {
            "request_id": request_id,
            "device_id": device_id,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            
            # Primary: DHT22
            "temperature": round(readings["temp"], 1),
            "humidity": round(readings["hum"], 1),
            
            # Primary: MPU6050
            "acceleration_x": round(readings["ax"], 3),
            "acceleration_y": round(readings["ay"], 3),
            "acceleration_z": round(readings["az"], 3),
            "vibration_level": round(readings["vib"], 3),
            
            # Primary: INA219
            "voltage": round(readings["volt"], 2),
            "current": round(readings["current"], 1),
            "power": power_W,
            
            # Secondary: MQ-2 & BMP280
            "gas_level": round(readings["gas"], 0),
            "pressure": round(readings["pres"], 1)
        }
        return reading

    def start(self):
        self.running = True
        print("==========================================================")
        print("   CloudAnchor Multi-Sensor Edge Simulator Started        ")
        print("==========================================================")
        print(f"Target Gateway: {self.gateway_url}")
        print(f"Simulating {self.num_devices} devices with DHT22, MPU6050, INA219, MQ-2, BMP280...")
        print(f"Sampling Interval: {self.interval}s | Anomaly Mode: {self.anomaly}\n")
        
        try:
            while self.running:
                for device in self.devices:
                    if not self.running:
                        break
                    
                    reading = self.generate_reading(device)
                    try:
                        print(
                            f"[{reading['timestamp']}] Sending {reading['request_id']} ({device}): "
                            f"Temp={reading['temperature']}°C, Hum={reading['humidity']}%, Vib={reading['vibration_level']}g, "
                            f"V={reading['voltage']}V, I={reading['current']}mA, P={reading['power']}W, Gas={reading['gas_level']}ppm"
                        )
                        response = requests.post(f"{self.gateway_url}/api/ingest", json=reading, timeout=3)
                        res_json = response.json()
                        health = res_json.get("health_score", "--")
                        status_str = res_json.get("system_status", "--")
                        print(f"  |-- Response ({response.status_code}): Status={res_json.get('status')} | Health={health}/100 [{status_str}]\n")
                    except requests.exceptions.RequestException as e:
                        print(f"  |-- Connection failed: {e}\n")
                    
                    time.sleep(self.interval / len(self.devices))
        except KeyboardInterrupt:
            self.stop()

    def stop(self):
        self.running = False
        print("\nMulti-Sensor Device Simulator stopped.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CloudAnchor Multi-Sensor IoT Device Simulator")
    parser.add_argument("--gateway", type=str, default="http://localhost:8000", help="Gateway URL")
    parser.add_argument("--interval", type=float, default=3.0, help="Generation interval in seconds")
    parser.add_argument("--devices", type=int, default=2, help="Number of simulated devices")
    parser.add_argument("--anomaly", action="store_true", help="Simulate stress/anomaly conditions for testing fusion warnings")
    
    args = parser.parse_args()
    
    simulator = DeviceSimulator(args.gateway, args.interval, args.devices, args.anomaly)
    simulator.start()
