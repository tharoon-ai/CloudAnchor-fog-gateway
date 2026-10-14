import unittest
import time
from backend.circuit_breaker import CircuitBreaker

class TestCircuitBreakerFSM(unittest.TestCase):
    def test_01_initial_closed_state(self):
        cb = CircuitBreaker(failure_threshold=3, cooldown_seconds=1.0, required_probe_successes=2)
        can_attempt, state = cb.can_attempt_request()
        self.assertTrue(can_attempt)
        self.assertEqual(state, "CLOSED")
        status = cb.get_status()
        self.assertEqual(status["consecutive_failures"], 0)
        self.assertEqual(status["circuit_breaker_state"], "CLOSED")

    def test_02_success_resets_failures(self):
        cb = CircuitBreaker(failure_threshold=3, cooldown_seconds=1.0, required_probe_successes=2)
        cb.record_failure("Err 1")
        cb.record_failure("Err 2")
        self.assertEqual(cb.consecutive_failures, 2)
        state, _ = cb.record_success()
        self.assertEqual(state, "CLOSED")
        self.assertEqual(cb.consecutive_failures, 0)

    def test_03_trips_to_open_after_threshold(self):
        cb = CircuitBreaker(failure_threshold=3, cooldown_seconds=1.0, required_probe_successes=2)
        cb.record_failure("Err 1")
        cb.record_failure("Err 2")
        self.assertEqual(cb.state, "CLOSED")
        
        state, msg = cb.record_failure("Err 3")
        self.assertEqual(state, "OPEN")
        self.assertIn("Tripped", msg)
        
        # In OPEN state during cooldown, fast-fail without outbound request
        can_attempt, current_state = cb.can_attempt_request()
        self.assertFalse(can_attempt)
        self.assertEqual(current_state, "OPEN")

    def test_04_transitions_to_half_open_after_cooldown(self):
        cb = CircuitBreaker(failure_threshold=3, cooldown_seconds=0.2, required_probe_successes=2)
        cb.record_failure("Err 1")
        cb.record_failure("Err 2")
        cb.record_failure("Err 3")
        self.assertEqual(cb.state, "OPEN")
        
        # Wait for cooldown to expire
        time.sleep(0.25)
        
        can_attempt, state = cb.can_attempt_request()
        self.assertTrue(can_attempt)
        self.assertEqual(state, "HALF-OPEN")

    def test_05_half_open_probe_failure_returns_to_open(self):
        cb = CircuitBreaker(failure_threshold=3, cooldown_seconds=0.2, required_probe_successes=2)
        cb.record_failure("Err 1")
        cb.record_failure("Err 2")
        cb.record_failure("Err 3")
        time.sleep(0.25)
        
        cb.can_attempt_request() # Enters HALF-OPEN
        self.assertEqual(cb.state, "HALF-OPEN")
        
        state, msg = cb.record_failure("Probe failed")
        self.assertEqual(state, "OPEN")
        self.assertIn("Returned from HALF-OPEN to OPEN", msg)

    def test_06_half_open_probe_success_recovers_to_closed(self):
        cb = CircuitBreaker(failure_threshold=3, cooldown_seconds=0.2, required_probe_successes=2)
        cb.record_failure("Err 1")
        cb.record_failure("Err 2")
        cb.record_failure("Err 3")
        time.sleep(0.25)
        
        cb.can_attempt_request() # Enters HALF-OPEN
        
        # Probe 1 succeeds
        state, msg = cb.record_success()
        self.assertEqual(state, "HALF-OPEN")
        self.assertEqual(cb.probe_successes, 1)
        
        # Probe 2 succeeds
        state, msg = cb.record_success()
        self.assertEqual(state, "CLOSED")
        self.assertIn("Recovered from HALF-OPEN to CLOSED", msg)
        self.assertEqual(cb.consecutive_failures, 0)

if __name__ == "__main__":
    unittest.main()
