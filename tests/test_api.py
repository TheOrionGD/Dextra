import json
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

from fastapi.testclient import TestClient
from gui_server import app


class TestFastAPIEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_get_health(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_get_settings(self):
        response = self.client.get("/settings")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("cursor_smoothing", data)
        self.assertIn("camera_index", data)

    def test_get_gestures(self):
        response = self.client.get("/gestures")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_get_system_status(self):
        response = self.client.get("/api/system-status")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("engine", data)
        self.assertIn("voice_module", data)
        self.assertIn("total_gestures", data)

    def test_get_all_gestures(self):
        response = self.client.get("/api/all-gestures")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

    def test_get_voice_commands(self):
        response = self.client.get("/api/voice-commands")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)

    def test_post_engines_start(self):
        with patch("gui_server.mouse_service") as mock_mouse, \
             patch("gui_server.voice_service") as mock_voice:
            response = self.client.post("/api/engines/start")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["status"], "success")
            mock_mouse.start.assert_called_once()
            mock_voice.start.assert_called_once()


if __name__ == "__main__":
    unittest.main()
