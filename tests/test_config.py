import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
PYTHON_PATH = PROJECT_ROOT / "python"
if str(PYTHON_PATH) not in sys.path:
    sys.path.insert(0, str(PYTHON_PATH))

from config import SettingsManager, DEFAULT_SETTINGS


class TestSettingsManager(unittest.TestCase):
    def setUp(self):
        # Reset singleton instance for test isolation
        SettingsManager._instance = None

    def test_default_settings_keys(self):
        manager = SettingsManager()
        settings = manager.get_settings()
        for key in DEFAULT_SETTINGS:
            self.assertIn(key, settings)

    def test_update_settings(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            settings_path = Path(temp_dir) / "dextra_settings.json"
            gestures_path = Path(temp_dir) / "dextra_custom_gestures.json"

            with patch("config.SETTINGS_FILE", settings_path), \
                 patch("config.GESTURES_FILE", gestures_path):
                manager = SettingsManager()
                success = manager.update_settings({"cursor_smoothing": 12, "camera_index": 1})
                self.assertTrue(success)

                updated = manager.get_settings()
                self.assertEqual(updated["cursor_smoothing"], 12)
                self.assertEqual(updated["camera_index"], 1)

    def test_custom_gestures_crud(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            settings_path = Path(temp_dir) / "dextra_settings.json"
            gestures_path = Path(temp_dir) / "dextra_custom_gestures.json"

            with patch("config.SETTINGS_FILE", settings_path), \
                 patch("config.GESTURES_FILE", gestures_path):
                manager = SettingsManager()
                self.assertEqual(manager.get_custom_gestures(), [])

                test_gesture = {"name": "Test Pose", "action": "Left Click", "finger_states": [True, True, False, False, False]}
                save_success = manager.update_custom_gestures([test_gesture])
                self.assertTrue(save_success)

                gestures = manager.get_custom_gestures()
                self.assertEqual(len(gestures), 1)
                self.assertEqual(gestures[0]["name"], "Test Pose")

    def test_corrupted_json_fallback(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            settings_path = Path(temp_dir) / "dextra_settings.json"
            gestures_path = Path(temp_dir) / "dextra_custom_gestures.json"
            settings_path.write_text("INVALID JSON", encoding="utf-8")
            gestures_path.write_text("CORRUPT DATA", encoding="utf-8")

            with patch("config.SETTINGS_FILE", settings_path), \
                 patch("config.GESTURES_FILE", gestures_path):
                manager = SettingsManager()
                # Should fall back to DEFAULT_SETTINGS and empty list gracefully without crashing
                self.assertEqual(manager.get_settings(), DEFAULT_SETTINGS)
                self.assertEqual(manager.get_custom_gestures(), [])


if __name__ == "__main__":
    unittest.main()
