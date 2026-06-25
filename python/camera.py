# ==============================================================================
# DEXTRA PROJECT FILE: python/camera.py
# ==============================================================================
#
# Developer Assigned: Salman (Core Gesture & Tracking Engine)
#
# Purpose:
# --------
# Encapsulates webcam video stream operations. Connects to configured video index,
# pulls frames sequentially, mirrors them, scales resolution, and formats frames
# for downstream processing and frontend WebSocket delivery.
#
# ==============================================================================

from __future__ import annotations

import argparse
import json
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Generator, Optional

try:
    import cv2
except ImportError:  # pragma: no cover - exercised only on machines without OpenCV
    cv2 = None


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SETTINGS_PATH = PROJECT_ROOT / "dextra_settings.json"


class CameraError(RuntimeError):
    """Base error raised by the DEXTRA camera module."""


class CameraOpenError(CameraError):
    """Raised when OpenCV cannot open the configured camera device."""


class CameraReadError(CameraError):
    """Raised when the camera is open but does not return a valid frame."""


@dataclass(frozen=True)
class CameraSettings:
    camera_index: int = 0
    width: int = 640
    height: int = 480
    target_fps: int = 30
    mirror: bool = True
    crop_to_aspect: bool = True

    @property
    def frame_interval(self) -> float:
        return 1.0 / max(1, self.target_fps)


@dataclass(frozen=True)
class ProcessedFrame:
    bgr: object
    rgb: object
    captured_at: float


def _require_cv2():
    if cv2 is None:
        raise CameraError(
            "OpenCV is not installed. Install project requirements with "
            "`pip install -r requirements.txt`."
        )
    return cv2


def load_camera_settings(settings_path: Path | str = DEFAULT_SETTINGS_PATH) -> CameraSettings:
    """Load camera-related settings while keeping safe defaults for missing keys."""
    path = Path(settings_path)
    if not path.exists():
        return CameraSettings()

    with path.open("r", encoding="utf-8") as handle:
        raw = json.load(handle)

    return CameraSettings(
        camera_index=int(raw.get("camera_index", CameraSettings.camera_index)),
        width=int(raw.get("camera_width", CameraSettings.width)),
        height=int(raw.get("camera_height", CameraSettings.height)),
        target_fps=int(raw.get("target_fps", CameraSettings.target_fps)),
        mirror=bool(raw.get("mirror_camera", CameraSettings.mirror)),
        crop_to_aspect=bool(raw.get("crop_to_aspect", CameraSettings.crop_to_aspect)),
    )


def center_crop_to_aspect(frame, width: int, height: int):
    """Center-crop a frame to match the requested output aspect ratio."""
    if width <= 0 or height <= 0:
        raise ValueError("Camera output width and height must be positive.")

    frame_height, frame_width = frame.shape[:2]
    target_aspect = width / height
    frame_aspect = frame_width / frame_height

    if abs(frame_aspect - target_aspect) < 0.001:
        return frame

    if frame_aspect > target_aspect:
        cropped_width = int(frame_height * target_aspect)
        x1 = max(0, (frame_width - cropped_width) // 2)
        return frame[:, x1 : x1 + cropped_width]

    cropped_height = int(frame_width / target_aspect)
    y1 = max(0, (frame_height - cropped_height) // 2)
    return frame[y1 : y1 + cropped_height, :]


def preprocess_frame(raw_frame, settings: CameraSettings) -> ProcessedFrame:
    """Crop, mirror, resize, and convert a raw BGR frame into MediaPipe-ready RGB."""
    cv = _require_cv2()
    frame = raw_frame

    if settings.crop_to_aspect:
        frame = center_crop_to_aspect(frame, settings.width, settings.height)

    if settings.mirror:
        frame = cv.flip(frame, 1)

    if frame.shape[1] != settings.width or frame.shape[0] != settings.height:
        frame = cv.resize(frame, (settings.width, settings.height), interpolation=cv.INTER_AREA)

    rgb = cv.cvtColor(frame, cv.COLOR_BGR2RGB)
    return ProcessedFrame(bgr=frame, rgb=rgb, captured_at=time.time())


class CameraStream:
    """Small wrapper around OpenCV VideoCapture with predictable cleanup."""

    def __init__(
        self,
        settings: Optional[CameraSettings] = None,
        capture_factory: Optional[Callable[[int], object]] = None,
        sleeper: Callable[[float], None] = time.sleep,
        clock: Callable[[], float] = time.perf_counter,
    ) -> None:
        self.settings = settings or load_camera_settings()
        self._capture_factory = capture_factory
        self._sleeper = sleeper
        self._clock = clock
        self._capture = None
        self._last_frame_started_at: Optional[float] = None

    @property
    def is_open(self) -> bool:
        return bool(self._capture is not None and self._capture.isOpened())

    def start(self) -> "CameraStream":
        cv = _require_cv2()
        factory = self._capture_factory or cv.VideoCapture
        self._capture = factory(self.settings.camera_index)

        if not self._capture or not self._capture.isOpened():
            self.release()
            raise CameraOpenError(
                f"Could not open camera index {self.settings.camera_index}. "
                "Check dextra_settings.json or close apps already using the webcam."
            )

        self._set_capture_property(cv.CAP_PROP_FRAME_WIDTH, self.settings.width)
        self._set_capture_property(cv.CAP_PROP_FRAME_HEIGHT, self.settings.height)
        self._set_capture_property(cv.CAP_PROP_FPS, self.settings.target_fps)
        return self

    def _set_capture_property(self, prop_id: int, value: int) -> None:
        if self._capture is not None and hasattr(self._capture, "set"):
            self._capture.set(prop_id, value)

    def release(self) -> None:
        if self._capture is not None:
            self._capture.release()
        self._capture = None
        self._last_frame_started_at = None

    def __enter__(self) -> "CameraStream":
        return self.start()

    def __exit__(self, exc_type, exc, traceback) -> None:
        self.release()

    def read(self) -> ProcessedFrame:
        if self._capture is None:
            self.start()

        self._pace()
        ok, raw_frame = self._capture.read()
        if not ok or raw_frame is None:
            raise CameraReadError("Camera is open but no frame was returned.")

        return preprocess_frame(raw_frame, self.settings)

    def frames(self) -> Generator[ProcessedFrame, None, None]:
        try:
            if self._capture is None:
                self.start()
            while True:
                yield self.read()
        finally:
            self.release()

    def _pace(self) -> None:
        now = self._clock()
        if self._last_frame_started_at is None:
            self._last_frame_started_at = now
            return

        elapsed = now - self._last_frame_started_at
        remaining = self.settings.frame_interval - elapsed
        if remaining > 0:
            self._sleeper(remaining)

        self._last_frame_started_at = self._clock()


def encode_jpeg(frame_bgr, quality: int = 80) -> bytes:
    """Encode a processed BGR frame for WebSocket binary streaming."""
    cv = _require_cv2()
    ok, buffer = cv.imencode(".jpg", frame_bgr, [int(cv.IMWRITE_JPEG_QUALITY), quality])
    if not ok:
        raise CameraReadError("Failed to encode camera frame as JPEG.")
    return buffer.tobytes()


def iter_jpeg_frames(
    settings: Optional[CameraSettings] = None, quality: int = 80
) -> Generator[bytes, None, None]:
    """Yield mirrored, resized JPEG frames for FastAPI WebSocket handlers."""
    with CameraStream(settings=settings) as stream:
        for frame in stream.frames():
            yield encode_jpeg(frame.bgr, quality=quality)


def capture_one_frame(settings: Optional[CameraSettings] = None) -> ProcessedFrame:
    """Open the configured camera, capture one processed frame, and release it."""
    with CameraStream(settings=settings) as stream:
        return stream.read()


def _run_smoke_check(frame_count: int) -> None:
    settings = load_camera_settings()
    started_at = time.perf_counter()

    with CameraStream(settings=settings) as stream:
        for _ in range(frame_count):
            stream.read()

    elapsed = max(time.perf_counter() - started_at, 0.001)
    fps = frame_count / elapsed
    print(
        f"Captured {frame_count} frame(s) from camera index "
        f"{settings.camera_index} at {fps:.1f} FPS."
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="DEXTRA OpenCV camera smoke check")
    parser.add_argument("--frames", type=int, default=30, help="Number of frames to capture")
    args = parser.parse_args()
    _run_smoke_check(max(1, args.frames))


if __name__ == "__main__":
    main()
