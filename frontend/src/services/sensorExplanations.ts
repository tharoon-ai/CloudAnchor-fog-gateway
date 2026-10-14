/**
 * CloudAnchor - Humanized Sensor Explanation Engine
 * Provides technical yet clear, human-understandable explanations for all telemetry parameters.
 */

export interface MetricExplanation {
  parameter: string;
  unit: string;
  status: "NORMAL" | "WARNING" | "CRITICAL" | "OFFLINE" | "WAITING FOR DATA";
  explanation: string;
  whatDoesThisMean: string;
  normalRange: string;
}

export function getTemperatureExplanation(temp?: number | null): MetricExplanation {
  const whatDoesThisMean = "Measures the ambient thermal condition around the edge device. Higher temperatures can cause CPU throttling or accelerate hardware component wear.";
  const normalRange = "15.0 °C to 35.0 °C";

  if (temp === undefined || temp === null) {
    return {
      parameter: "Temperature",
      unit: "°C",
      status: "WAITING FOR DATA",
      explanation: "Waiting for temperature telemetry packets from the DHT22 sensor.",
      whatDoesThisMean,
      normalRange,
    };
  }

  if (temp >= 45.0 || temp <= 0.0) {
    return {
      parameter: "Temperature",
      unit: "°C",
      status: "CRITICAL",
      explanation: `Temperature (${temp.toFixed(1)} °C) has crossed safe operating boundaries. Inspect hardware cooling immediately.`,
      whatDoesThisMean,
      normalRange,
    };
  }

  if (temp > 32.0 || temp < 10.0) {
    return {
      parameter: "Temperature",
      unit: "°C",
      status: "WARNING",
      explanation: `Temperature (${temp.toFixed(1)} °C) is above the standard range. Monitor the reading if it continues to climb.`,
      whatDoesThisMean,
      normalRange,
    };
  }

  return {
    parameter: "Temperature",
    unit: "°C",
    status: "NORMAL",
    explanation: "Temperature is within the configured operating range. Thermal dissipation is nominal.",
    whatDoesThisMean,
    normalRange,
  };
}

export function getHumidityExplanation(hum?: number | null): MetricExplanation {
  const whatDoesThisMean = "Indicates moisture concentration in the air. High humidity increases condensation risk on circuit boards, while low humidity promotes electrostatic discharge.";
  const normalRange = "30.0% to 70.0%";

  if (hum === undefined || hum === null) {
    return {
      parameter: "Relative Humidity",
      unit: "%",
      status: "WAITING FOR DATA",
      explanation: "Awaiting humidity reading from DHT22 sensor.",
      whatDoesThisMean,
      normalRange,
    };
  }

  if (hum >= 85.0 || hum <= 15.0) {
    return {
      parameter: "Relative Humidity",
      unit: "%",
      status: "CRITICAL",
      explanation: `Humidity is at ${hum.toFixed(1)}%, which is critically outside safe operating limits for electronic equipment.`,
      whatDoesThisMean,
      normalRange,
    };
  }

  if (hum > 70.0 || hum < 25.0) {
    return {
      parameter: "Relative Humidity",
      unit: "%",
      status: "WARNING",
      explanation: `Relative humidity (${hum.toFixed(1)}%) is elevated. Ensure enclosure seals remain intact.`,
      whatDoesThisMean,
      normalRange,
    };
  }

  return {
    parameter: "Relative Humidity",
    unit: "%",
    status: "NORMAL",
    explanation: "Humidity level is within normal environmental monitoring thresholds.",
    whatDoesThisMean,
    normalRange,
  };
}

export function getVibrationExplanation(vib?: number | null): MetricExplanation {
  const whatDoesThisMean = "Quantifies 3-axis motion acceleration magnitude via the MPU6050 sensor. Persistent vibration is a reliable indicator of mechanical instability or loose mounting.";
  const normalRange = "0.000 g to 0.150 g";

  if (vib === undefined || vib === null) {
    return {
      parameter: "Vibration Index",
      unit: "g",
      status: "WAITING FOR DATA",
      explanation: "Awaiting accelerometer inertial telemetry from MPU6050.",
      whatDoesThisMean,
      normalRange,
    };
  }

  if (vib >= 0.40) {
    return {
      parameter: "Vibration Index",
      unit: "g",
      status: "CRITICAL",
      explanation: `Severe vibration detected (${vib.toFixed(3)} g). Possible physical impact, motor failure, or heavy oscillation.`,
      whatDoesThisMean,
      normalRange,
    };
  }

  if (vib > 0.15) {
    return {
      parameter: "Vibration Index",
      unit: "g",
      status: "WARNING",
      explanation: `Elevated vibration level (${vib.toFixed(3)} g). Motion detected on the monitored unit.`,
      whatDoesThisMean,
      normalRange,
    };
  }

  return {
    parameter: "Vibration Index",
    unit: "g",
    status: "NORMAL",
    explanation: "Vibration levels are minimal. The monitored physical system is mechanically stable.",
    whatDoesThisMean,
    normalRange,
  };
}

export function getVoltageExplanation(volt?: number | null): MetricExplanation {
  const whatDoesThisMean = "Measures the electrical DC bus potential supplied to the edge unit. Voltage drops can cause microcontroller brownouts or sensor read errors.";
  const normalRange = "4.75 V to 5.25 V (5V DC Nominal)";

  if (volt === undefined || volt === null) {
    return {
      parameter: "Bus Voltage",
      unit: "V",
      status: "WAITING FOR DATA",
      explanation: "Awaiting bus voltage measurement from INA219 sensor.",
      whatDoesThisMean,
      normalRange,
    };
  }

  if (volt < 4.2 || volt > 5.8) {
    return {
      parameter: "Bus Voltage",
      unit: "V",
      status: "CRITICAL",
      explanation: `Bus voltage (${volt.toFixed(2)} V) is outside safe operating margins. Risk of device reboot or hardware stress.`,
      whatDoesThisMean,
      normalRange,
    };
  }

  if (volt < 4.75 || volt > 5.25) {
    return {
      parameter: "Bus Voltage",
      unit: "V",
      status: "WARNING",
      explanation: `Voltage (${volt.toFixed(2)} V) is slightly drifting from the nominal 5.00V target.`,
      whatDoesThisMean,
      normalRange,
    };
  }

  return {
    parameter: "Bus Voltage",
    unit: "V",
    status: "NORMAL",
    explanation: "Supply voltage is stable and within standard tolerance margins.",
    whatDoesThisMean,
    normalRange,
  };
}

export function getCurrentExplanation(curr?: number | null): MetricExplanation {
  const whatDoesThisMean = "Indicates the instantaneous electrical current drawn by the edge node, Wi-Fi radio, and connected sensors.";
  const normalRange = "50.0 mA to 250.0 mA";

  if (curr === undefined || curr === null) {
    return {
      parameter: "Shunt Current",
      unit: "mA",
      status: "WAITING FOR DATA",
      explanation: "Awaiting current measurement from INA219 sensor.",
      whatDoesThisMean,
      normalRange,
    };
  }

  if (curr >= 500.0) {
    return {
      parameter: "Shunt Current",
      unit: "mA",
      status: "CRITICAL",
      explanation: `High current draw (${curr.toFixed(1)} mA). Check for partial short-circuits or peripheral overload.`,
      whatDoesThisMean,
      normalRange,
    };
  }

  if (curr > 250.0) {
    return {
      parameter: "Shunt Current",
      unit: "mA",
      status: "WARNING",
      explanation: `Current consumption (${curr.toFixed(1)} mA) is elevated above baseline operating load.`,
      whatDoesThisMean,
      normalRange,
    };
  }

  return {
    parameter: "Shunt Current",
    unit: "mA",
    status: "NORMAL",
    explanation: "Current consumption indicates normal active microprocessor and radio load.",
    whatDoesThisMean,
    normalRange,
  };
}

export function getPowerExplanation(power?: number | null): MetricExplanation {
  const whatDoesThisMean = "Represents the rate of electrical energy consumption, calculated in real time as Voltage × Current.";
  const normalRange = "0.30 W to 1.20 W";

  if (power === undefined || power === null) {
    return {
      parameter: "Power Draw",
      unit: "W",
      status: "WAITING FOR DATA",
      explanation: "Awaiting power measurement from INA219 sensor.",
      whatDoesThisMean,
      normalRange,
    };
  }

  if (power >= 2.5) {
    return {
      parameter: "Power Draw",
      unit: "W",
      status: "CRITICAL",
      explanation: `Power consumption (${power.toFixed(2)} W) exceeds rated thermal and energy budget.`,
      whatDoesThisMean,
      normalRange,
    };
  }

  if (power > 1.2) {
    return {
      parameter: "Power Draw",
      unit: "W",
      status: "WARNING",
      explanation: `Power consumption (${power.toFixed(2)} W) is elevated above nominal steady-state levels.`,
      whatDoesThisMean,
      normalRange,
    };
  }

  return {
    parameter: "Power Draw",
    unit: "W",
    status: "NORMAL",
    explanation: "Instantaneous electrical power draw is within expected operating limits.",
    whatDoesThisMean,
    normalRange,
  };
}

export function getAccelerationExplanation(ax?: number, ay?: number, az?: number): MetricExplanation {
  const whatDoesThisMean = "The MPU6050 measures acceleration along three spatial axes (X, Y, Z). These raw vectors are combined to evaluate the physical vibration magnitude of the monitored system.";
  const normalRange = "X: ±0.1g, Y: ±0.1g, Z: ~1.0g (Gravity)";

  if (ax === undefined || ay === undefined || az === undefined) {
    return {
      parameter: "3-Axis Acceleration",
      unit: "g",
      status: "WAITING FOR DATA",
      explanation: "Awaiting inertial acceleration vectors from MPU6050 sensor.",
      whatDoesThisMean,
      normalRange,
    };
  }

  const norm = Math.sqrt(ax * ax + ay * ay + az * az);
  const diff = Math.abs(norm - 1.0);

  if (diff > 0.4) {
    return {
      parameter: "3-Axis Acceleration",
      unit: "g",
      status: "CRITICAL",
      explanation: "Significant multi-axis inertial displacement detected. Potential physical shock or tilt.",
      whatDoesThisMean,
      normalRange,
    };
  }

  if (diff > 0.15) {
    return {
      parameter: "3-Axis Acceleration",
      unit: "g",
      status: "WARNING",
      explanation: "Moderate multi-axis acceleration variance detected on the monitored unit.",
      whatDoesThisMean,
      normalRange,
    };
  }

  return {
    parameter: "3-Axis Acceleration",
    unit: "g",
    status: "NORMAL",
    explanation: "MPU6050 inertial vectors indicate stationary, stable device alignment.",
    whatDoesThisMean,
    normalRange,
  };
}

