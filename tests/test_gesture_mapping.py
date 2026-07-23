import math
import sys
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
PYTHON_PATH = PROJECT_ROOT / "python"
if str(PYTHON_PATH) not in sys.path:
    sys.path.insert(0, str(PYTHON_PATH))


class TestGestureMapping(unittest.TestCase):
    def setUp(self):
        # Create mock pyautogui to prevent mouse automation during test runs
        self.mock_pyautogui = MagicMock()
        self.mock_pyautogui.size.return_value = (1920, 1080)

    def test_calculate_distance(self):
        with patch("gesture_mapping.pyautogui", self.mock_pyautogui):
            from gesture_mapping import GestureMapper
            mapper = GestureMapper()
            p1 = {'x': 0.0, 'y': 0.0}
            p2 = {'x': 3.0, 'y': 4.0}
            dist = mapper.calculate_distance(p1, p2)
            self.assertAlmostEqual(dist, 5.0)

    def test_get_finger_states_open_palm(self):
        with patch("gesture_mapping.pyautogui", self.mock_pyautogui):
            from gesture_mapping import GestureMapper
            mapper = GestureMapper()

            # Mock 21 landmarks for Open Palm
            landmarks = [{'x': 0.5, 'y': 0.5}] * 21
            # Thumb extended
            landmarks[4] = {'x': 0.9, 'y': 0.5}  # Thumb tip
            landmarks[3] = {'x': 0.7, 'y': 0.5}  # Thumb IP
            landmarks[17] = {'x': 0.1, 'y': 0.5} # Pinky MCP

            # Fingers extended: tip y < pip y
            for tip, pip in zip([8, 12, 16, 20], [6, 10, 14, 18]):
                landmarks[tip] = {'x': 0.5, 'y': 0.2}
                landmarks[pip] = {'x': 0.5, 'y': 0.4}

            states = mapper.get_finger_states(landmarks)
            self.assertEqual(states, [True, True, True, True, True])

    def test_get_finger_states_closed_fist(self):
        with patch("gesture_mapping.pyautogui", self.mock_pyautogui):
            from gesture_mapping import GestureMapper
            mapper = GestureMapper()

            # Mock 21 landmarks for Closed Fist
            landmarks = [{'x': 0.5, 'y': 0.5}] * 21
            # Thumb curled
            landmarks[4] = {'x': 0.2, 'y': 0.5}
            landmarks[3] = {'x': 0.2, 'y': 0.5}
            landmarks[17] = {'x': 0.2, 'y': 0.5}

            # Fingers curled: tip y > pip y
            for tip, pip in zip([8, 12, 16, 20], [6, 10, 14, 18]):
                landmarks[tip] = {'x': 0.5, 'y': 0.6}
                landmarks[pip] = {'x': 0.5, 'y': 0.4}

            states = mapper.get_finger_states(landmarks)
            self.assertEqual(states, [False, False, False, False, False])

    def test_process_landmarks_closed_fist_triggers_minimize(self):
        with patch("gesture_mapping.pyautogui", self.mock_pyautogui):
            from gesture_mapping import GestureMapper
            mapper = GestureMapper()

            landmarks = [{'x': 0.5, 'y': 0.5}] * 21
            landmarks[4] = {'x': 0.2, 'y': 0.5}
            landmarks[3] = {'x': 0.2, 'y': 0.5}
            landmarks[17] = {'x': 0.2, 'y': 0.5}
            for tip, pip in zip([8, 12, 16, 20], [6, 10, 14, 18]):
                landmarks[tip] = {'x': 0.5, 'y': 0.6}
                landmarks[pip] = {'x': 0.5, 'y': 0.4}

            mapper.process_landmarks(landmarks)
            self.mock_pyautogui.hotkey.assert_called_with("win", "down")


if __name__ == "__main__":
    unittest.main()
