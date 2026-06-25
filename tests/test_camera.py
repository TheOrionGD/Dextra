import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from python import camera


class FakeCapture:
    def __init__(self, index, frame=None, opened=True):
        self.index = index
        self.frame = frame
        self.opened = opened
        self.released = False
        self.properties = {}

    def isOpened(self):
        return self.opened and not self.released

    def set(self, prop_id, value):
        self.properties[prop_id] = value

    def read(self):
        return True, self.frame.copy()

    def release(self):
        self.released = True


class CameraTests(unittest.TestCase):
    def setUp(self):
        self.fake_cv2 = SimpleNamespace(
            CAP_PROP_FRAME_WIDTH=3,
            CAP_PROP_FRAME_HEIGHT=4,
            CAP_PROP_FPS=5,
            COLOR_BGR2RGB=6,
            INTER_AREA=7,
            flip=lambda frame, mode: np.flip(frame, axis=1),
            resize=lambda frame, size, interpolation=None: frame,
            cvtColor=lambda frame, code: frame[:, :, ::-1],
        )

    def test_loads_configured_camera_index(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            settings_path = Path(temp_dir) / "settings.json"
            settings_path.write_text(json.dumps({"camera_index": 2}), encoding="utf-8")

            settings = camera.load_camera_settings(settings_path)

        self.assertEqual(settings.camera_index, 2)

    def test_opens_reads_preprocesses_and_releases_capture(self):
        raw_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        raw_frame[:, 0] = [10, 20, 30]
        raw_frame[:, -1] = [100, 110, 120]
        captures = []

        def capture_factory(index):
            capture = FakeCapture(index=index, frame=raw_frame)
            captures.append(capture)
            return capture

        settings = camera.CameraSettings(camera_index=1, width=640, height=480)

        with patch.object(camera, "cv2", self.fake_cv2):
            with camera.CameraStream(settings=settings, capture_factory=capture_factory) as stream:
                processed = stream.read()

        self.assertEqual(captures[0].index, 1)
        self.assertTrue(captures[0].released)
        self.assertEqual(processed.bgr[0, 0].tolist(), [100, 110, 120])
        self.assertEqual(processed.rgb[0, 0].tolist(), [120, 110, 100])

    def test_releases_capture_when_open_fails(self):
        capture = FakeCapture(index=0, frame=np.zeros((1, 1, 3), dtype=np.uint8), opened=False)

        with patch.object(camera, "cv2", self.fake_cv2):
            with self.assertRaises(camera.CameraOpenError):
                camera.CameraStream(capture_factory=lambda index: capture).start()

        self.assertTrue(capture.released)


if __name__ == "__main__":
    unittest.main()
