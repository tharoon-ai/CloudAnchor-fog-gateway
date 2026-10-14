/*
  CloudAnchor — Arduino Uno + Tinkercad Circuits Telemetry Source
  
  Authoritative Request Counter starting at REQ-1 on boot/restart.
  Outputs valid JSON strings to the Serial Monitor at 9600 baud.
*/

#include <Arduino.h>

// Global Request Counter (starts at 1 upon boot / reset)
unsigned long requestCounter = 1;
const char* DEVICE_ID = "ARDUINO-001";

// Pin definitions in Tinkercad
const int TEMP_PIN = A0;     // Temperature sensor / Potentiometer
const int HUM_PIN = A1;      // Humidity sensor / Potentiometer
const int VOLT_PIN = A2;     // Voltage divider input

void setup() {
  Serial.begin(9600);
  while (!Serial) {
    ; // Wait for serial port to connect
  }
  delay(1000);
}

void loop() {
  // Read simulated analog inputs
  int rawTemp = analogRead(TEMP_PIN);
  int rawHum = analogRead(HUM_PIN);
  int rawVolt = analogRead(VOLT_PIN);

  // Map analog readings to physical units
  float temperature = (rawTemp > 0) ? (15.0 + (rawTemp / 1023.0) * 30.0) : 25.50;
  float humidity = (rawHum > 0) ? (30.0 + (rawHum / 1023.0) * 50.0) : 56.40;
  float voltage = (rawVolt > 0) ? ((rawVolt / 1023.0) * 10.0) : 5.02;

  // Load Current (derived load model: baseline ~110mA)
  float current = 90.0 + (temperature * 0.8) + (humidity * 0.15);
  
  // Power Draw in Watts: P = (V * I_mA) / 1000.0
  float power = (voltage * current) / 1000.0;

  // Multi-sensor Edge Assessment
  int healthScore = 100;
  const char* systemStatus = "NORMAL";
  const char* riskLevel = "LOW";

  if (temperature > 45.0 || voltage < 4.5 || voltage > 5.5) {
    healthScore = 75;
    systemStatus = "WARNING";
    riskLevel = "MEDIUM";
  }

  // Format and send pure JSON payload with authoritative REQ-X counter
  Serial.print("{\"request_id\":\"REQ-");
  Serial.print(requestCounter);
  Serial.print("\",\"device_id\":\"");
  Serial.print(DEVICE_ID);
  Serial.print("\",\"temperature\":");
  Serial.print(temperature, 2);
  Serial.print(",\"humidity\":");
  Serial.print(humidity, 2);
  Serial.print(",\"voltage\":");
  Serial.print(voltage, 2);
  Serial.print(",\"current\":");
  Serial.print(current, 2);
  Serial.print(",\"power\":");
  Serial.print(power, 3);
  Serial.print(",\"health_score\":");
  Serial.print(healthScore);
  Serial.print(",\"system_status\":\"");
  Serial.print(systemStatus);
  Serial.print("\",\"risk_level\":\"");
  Serial.print(riskLevel);
  Serial.println("\"}");

  // Increment authoritative counter for next transmission
  requestCounter++;

  // 3-second transmission interval
  delay(3000);
}
