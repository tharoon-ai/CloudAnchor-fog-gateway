import time
import threading
from typing import Dict, Any, Tuple, Optional

class CircuitBreaker:
    def __init__(
        self,
        failure_threshold: int = 3,
        cooldown_seconds: float = 10.0,
        required_probe_successes: int = 2
    ):
        self.failure_threshold = failure_threshold
        self.cooldown_seconds = cooldown_seconds
        self.required_probe_successes = required_probe_successes
        
        self.state: str = "CLOSED"  # "CLOSED", "OPEN", "HALF-OPEN"
        self.consecutive_failures: int = 0
        self.opened_at: float = 0.0
        self.probe_successes: int = 0
        self.probing_in_flight: bool = False
        self._lock = threading.Lock()

    def can_attempt_request(self) -> Tuple[bool, str]:
        """
        Thread-safe check to determine if outbound Cloud requests should be attempted.
        Returns: (can_attempt: bool, current_state: str)
        """
        with self._lock:
            now = time.time()
            if self.state == "CLOSED":
                return True, "CLOSED"
            
            elif self.state == "OPEN":
                elapsed = now - self.opened_at
                if elapsed >= self.cooldown_seconds:
                    self.state = "HALF-OPEN"
                    self.probe_successes = 0
                    self.probing_in_flight = True
                    return True, "HALF-OPEN"
                else:
                    return False, "OPEN"
                    
            elif self.state == "HALF-OPEN":
                # Allow probe if not currently in flight
                if not self.probing_in_flight:
                    self.probing_in_flight = True
                    return True, "HALF-OPEN"
                else:
                    # Avoid flooding Cloud during probe state
                    return False, "HALF-OPEN"
                    
        return False, self.state

    def record_success(self) -> Tuple[str, Optional[str]]:
        """
        Called when a Cloud request succeeds.
        Returns (new_state, transition_event_description_or_none).
        """
        with self._lock:
            transition_msg = None
            if self.state == "CLOSED":
                self.consecutive_failures = 0
            elif self.state == "HALF-OPEN":
                self.probe_successes += 1
                self.probing_in_flight = False
                if self.probe_successes >= self.required_probe_successes:
                    self.state = "CLOSED"
                    self.consecutive_failures = 0
                    self.probe_successes = 0
                    transition_msg = f"[CIRCUIT BREAKER] Recovered from HALF-OPEN to CLOSED ({self.required_probe_successes} probe successes)."
                else:
                    transition_msg = f"[CIRCUIT BREAKER] Probe {self.probe_successes}/{self.required_probe_successes} succeeded in HALF-OPEN."
            return self.state, transition_msg

    def record_failure(self, error_detail: str = "") -> Tuple[str, Optional[str]]:
        """
        Called when a Cloud request fails.
        Returns (new_state, transition_event_description_or_none).
        """
        with self._lock:
            transition_msg = None
            now = time.time()
            if self.state == "CLOSED":
                self.consecutive_failures += 1
                if self.consecutive_failures >= self.failure_threshold:
                    self.state = "OPEN"
                    self.opened_at = now
                    self.probe_successes = 0
                    self.probing_in_flight = False
                    transition_msg = f"[CIRCUIT BREAKER] Tripped from CLOSED to OPEN ({self.consecutive_failures} consecutive failures). Cooldown: {self.cooldown_seconds}s."
            elif self.state == "HALF-OPEN":
                self.state = "OPEN"
                self.opened_at = now
                self.probe_successes = 0
                self.probing_in_flight = False
                transition_msg = f"[CIRCUIT BREAKER] Probe failed ({error_detail}). Returned from HALF-OPEN to OPEN. Cooldown: {self.cooldown_seconds}s."
            return self.state, transition_msg

    def reset_probing(self):
        """Reset probing_in_flight flag without modifying state or failure counters."""
        with self._lock:
            self.probing_in_flight = False

    def get_status(self) -> Dict[str, Any]:
        """Returns the current state and metrics for observability."""
        with self._lock:
            now = time.time()
            cooldown_remaining = 0.0
            if self.state == "OPEN":
                elapsed = now - self.opened_at
                cooldown_remaining = max(0.0, round(self.cooldown_seconds - elapsed, 1))
                if cooldown_remaining == 0.0:
                    self.state = "HALF-OPEN"
                    self.probe_successes = 0
                    self.probing_in_flight = False

            return {
                "circuit_breaker_state": self.state,
                "consecutive_failures": self.consecutive_failures,
                "failure_threshold": self.failure_threshold,
                "cooldown_remaining": cooldown_remaining,
                "probe_successes": self.probe_successes,
                "required_probe_successes": self.required_probe_successes
            }
