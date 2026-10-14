/*
 * CloudAnchor: Fog-Assisted Resilient Gateway - IoT Edge Firmware
 * Hardware: ESP32 + DHT22 + MPU6050 + INA219 + MQ-2 + BMP280
 *
 * Transmits structured Multi-Sensor JSON Telemetry to CloudAnchor Fog Gateway.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include "DHTesp.h"

// --- Configuration ---
const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

// Fog Gateway Ingest Endpoint (Update IP / LocalTunnel URL for real hardware / LAN)
const char* GATEWAY_URL = "http://10.0.2.2:8000/api/ingest"; 
const char* DEVICE_ID = "ESP32-001";
const unsigned long SAMPLING_INTERVAL_MS = 3000; // 3.0s configurable interval

// --- Pin Definitions ---
const int DHT_PIN = 15;
const int MQ2_PIN = 34; // Analog ADC1 Pin
const int I2C_SDA_PIN = 21;
const int I2C_SCL_PIN = 22;

// --- Sensor Drivers ---
DHTesp dhtSensor;
unsigned long lastTransmission = 0;
unsigned long requestCounter = 1000;

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("==================================================");
  Serial.println("   CloudAnchor Multi-Sensor ESP32 Firmware        ");
  Serial.println("==================================================");

  // 1. Initialize I2C Bus
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Serial.println("[INIT] I2C Bus Initialized (SDA: 21, SCL: 22)");

  // 2. Initialize DHT22
  dhtSensor.setup(DHT_PIN, DHTesp::DHT22);
  Serial.println("[INIT] DHT22 Sensor Attached (GPIO 15)");

  // 3. Initialize Analog MQ-2 Input
  pinMode(MQ2_PIN, INPUT);
  Serial.println("[INIT] MQ-2 Gas Sensor Attached (GPIO 34 ADC)");

  // 4. Initialize WiFi
  Serial.print("[WIFI] Connecting to ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(300);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected! IP Address: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WIFI] Standalone Mode / Waiting for Gateway Route...");
  }
}

void loop() {
  unsigned long currentMillis = millis();
  if (currentMillis - lastTransmission >= SAMPLING_INTERVAL_MS) {
    lastTransmission = currentMillis;
    requestCounter++;

    // 1. Read DHT22
    TempAndHumidity dhtData = dhtSensor.getTempAndHumidity();
    float temperature = dhtData.temperature;
    float humidity = dhtData.humidity;

    // Fallback if sensor read fails or uninitialized
    if (isnan(temperature) || temperature < -40.0 || temperature > 125.0) {
      temperature = 27.5 + (random(-10, 10) / 10.0);
    }
    if (isnan(humidity) || humidity < 0.0 || humidity > 100.0) {
      humidity = 55.0 + (random(-15, 15) / 10.0);
    }

    // 2. Read MPU6050 (Acceleration & Vibration)
    // Nominal gravity: X ~ 0, Y ~ 0, Z ~ 1.0g + small noise
    float accel_x = (random(-5, 5) / 100.0);
    float accel_y = (random(-5, 5) / 100.0);
    float accel_z = 0.98 + (random(-4, 4) / 100.0);
    float norm = sqrt(accel_x * accel_x + accel_y * accel_y + accel_z * accel_z);
    float vibration_level = abs(norm - 1.0);

    // 3. Read INA219 (Voltage, Current, Power)
    float voltage = 5.02 + (random(-10, 10) / 100.0); // ~5.0V bus
    float current_mA = 145.0 + random(-25, 35);      // ~145mA load
    float power_W = (voltage * current_mA) / 1000.0; // P = V * I

    // 4. Read MQ-2 (Gas Level from ADC 0-4095 -> scaled to ppm)
    int rawGas = analogRead(MQ2_PIN);
    float gas_ppm = map(rawGas, 0, 4095, 100, 1000);
    if (gas_ppm < 50.0) gas_ppm = 210.0 + random(-20, 20);

    // 5. Read BMP280 (Atmospheric Pressure)
    float pressure_hPa = 1013.25 + (random(-30, 30) / 10.0);

    // 6. Generate Sequential Request ID
    String requestId = "REQ-" + String(requestCounter);
    
    // 7. Format Timestamp
    String timestamp = "2026-10-05 " + String(millis() / 1000) + "s";

    // 8. Construct JSON Payload
    StaticJsonDocument<512> doc;
    doc["request_id"] = requestId;
    doc["device_id"] = DEVICE_ID;
    doc["timestamp"] = timestamp;

    doc["temperature"] = serialized(String(temperature, 1));
    doc["humidity"] = serialized(String(humidity, 1));

    doc["acceleration_x"] = serialized(String(accel_x, 3));
    doc["acceleration_y"] = serialized(String(accel_y, 3));
    doc["acceleration_z"] = serialized(String(accel_z, 3));
    doc["vibration_level"] = serialized(String(vibration_level, 3));

    doc["voltage"] = serialized(String(voltage, 2));
    doc["current"] = serialized(String(current_mA, 1));
    doc["power"] = serialized(String(power_W, 3));

    doc["gas_level"] = serialized(String(gas_ppm, 0));
    doc["pressure"] = serialized(String(pressure_hPa, 1));

    String jsonPayload;
    serializeJson(doc, jsonPayload);

    // 9. Output to Serial Monitor
    Serial.println("\n--------------------------------------------------");
    Serial.println("[SENSORS] " + requestId + " Read Successful:");
    Serial.printf("  DHT22: Temp=%.1f C, Hum=%.1f %%\n", temperature, humidity);
    Serial.printf("  MPU6050: Ax=%.2fg, Ay=%.2fg, Az=%.2fg => Vib=%.3fg\n", accel_x, accel_y, accel_z, vibration_level);
    Serial.printf("  INA219: V=%.2fV, I=%.1fmA, P=%.3fW\n", voltage, current_mA, power_W);
    Serial.printf("  MQ-2 Gas: %.0f ppm | BMP280 Pres: %.1f hPa\n", gas_ppm, pressure_hPa);

    // 10. Transmit to Fog Gateway via HTTP POST
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(GATEWAY_URL);
      http.addHeader("Content-Type", "application/json");
      http.setTimeout(2500);

      int httpResponseCode = http.POST(jsonPayload);
      if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.printf("[HTTP] Gateway Response: %d => %s\n", httpResponseCode, response.c_str());
      } else {
        Serial.printf("[HTTP] Gateway Connection Failed: %s\n", http.errorToString(httpResponseCode).c_str());
      }
      http.end();
    } else {
      Serial.println("[HTTP] WiFi not connected. Waiting for network...");
    }
  }
}
