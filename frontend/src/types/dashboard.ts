export type NavTab = "overview" | "sensors" | "data_calc" | "system";

export type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF-OPEN";

export type SystemStatus = "NORMAL" | "WARNING" | "CRITICAL";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface SensorStatusMap {
  dht22?: "ONLINE" | "STALE" | "OFFLINE" | "NOT_CONFIGURED";
  mpu6050?: "ONLINE" | "STALE" | "OFFLINE" | "NOT_CONFIGURED";
  ina219?: "ONLINE" | "STALE" | "OFFLINE" | "NOT_CONFIGURED";
  mq2?: "ONLINE" | "STALE" | "OFFLINE" | "NOT_CONFIGURED";
  bmp280?: "ONLINE" | "STALE" | "OFFLINE" | "NOT_CONFIGURED";
}

export interface ParsedTelemetry {
  deviceId: string;
  requestId: string;
  timestamp: string;
  
  // Primary Tinkercad Sensors & Derived
  temperature: number;
  humidity: number;
  voltage: number;
  current: number;
  power: number;
  
  // Multi-Sensor Fusion & Health
  healthScore?: number | null;
  systemStatus: SystemStatus | "NO DATA";
  riskLevel: RiskLevel | "NO DATA";
  warningReason?: string | null;
  sensorStatus?: SensorStatusMap;
  
  // Optional / Legacy fields
  accelerationX?: number;
  accelerationY?: number;
  accelerationZ?: number;
  vibrationLevel?: number;
  gasLevel?: number | null;
  pressure?: number | null;
  
  statusLabel?: string;
  lastUpdatedSecAgo?: number;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: "cloud" | "queue" | "circuit_breaker" | "fusion";
  level: "success" | "warning" | "error" | "info";
  title: string;
  description: string;
  badge?: string;
}

export interface ChartDataPoint {
  time: string;
  temperature: number;
  humidity: number;
  vibrationLevel: number;
  voltage: number;
  current: number;
  power: number;
  gasLevel?: number;
  pressure?: number;
  healthScore: number;
}

export interface DashboardMetrics {
  total_requests: number;
  success_requests: number;
  failed_requests: number;
  cloud_api: {
    status: "ONLINE" | "OFFLINE";
  };
  gateway_mode: "NORMAL" | "DEGRADED" | "RECOVERING";
  pending_queue: number;
  synced_queue: number;
  failed_queue: number;
  circuit_breaker_state: CircuitBreakerState;
  consecutive_failures: number;
  failure_threshold: number;
  cooldown_remaining: number;
  probe_successes: number;
  required_probe_successes: number;
  base_backoff: number;
  max_backoff: number;
  current_retry_count: number;
  next_retry_in: number;
  latest_telemetry?: {
    device_id: string;
    request_id?: string;
    timestamp: string;
    temperature: number;
    humidity: number;
    acceleration_x?: number;
    acceleration_y?: number;
    acceleration_z?: number;
    vibration_level?: number;
    voltage?: number;
    current?: number;
    power?: number;
    gas_level?: number | null;
    pressure?: number | null;
    health_score?: number;
    system_status?: SystemStatus;
    risk_level?: RiskLevel;
    warning_reason?: string | null;
    sensor_status?: SensorStatusMap;
    status?: string;
    label?: string;
    last_updated_sec_ago?: number;
  } | null;
}

export interface ResilienceConfig {
  failure_threshold: number;
  cooldown_duration: number;
  max_backoff: number;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  level: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  message: string;
}
