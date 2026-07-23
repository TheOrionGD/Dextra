import json
import os
import threading
from pathlib import Path
from typing import Dict, Any, List

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SETTINGS_FILE = PROJECT_ROOT / "dextra_settings.json"
GESTURES_FILE = PROJECT_ROOT / "dextra_custom_gestures.json"

DEFAULT_SETTINGS = {
    "camera_index": 0,
    "cursor_smoothing": 5,
    "click_threshold_px": 30,
    "drag_hold_time_sec": 0.6,
    "double_click_time_sec": 0.35,
    "cooldown_period_sec": 0.3,
    "voice_commands_enabled": True,
    "gesture_trainer_enabled": True
}

class SettingsManager:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(SettingsManager, cls).__new__(cls)
                cls._instance._init()
            return cls._instance

    def _init(self):
        self._settings_lock = threading.Lock()
        self._gestures_lock = threading.Lock()
        self._ensure_files_exist()

    def _ensure_files_exist(self):
        with self._settings_lock:
            if not SETTINGS_FILE.exists():
                with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
                    json.dump(DEFAULT_SETTINGS, f, indent=2)
        with self._gestures_lock:
            if not GESTURES_FILE.exists():
                with open(GESTURES_FILE, "w", encoding="utf-8") as f:
                    json.dump([], f, indent=2)

    def get_settings(self) -> Dict[str, Any]:
        with self._settings_lock:
            try:
                with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                    settings = json.load(f)
                    # Merge with defaults to ensure all keys exist
                    merged = DEFAULT_SETTINGS.copy()
                    merged.update(settings)
                    return merged
            except Exception:
                return DEFAULT_SETTINGS.copy()

    def update_settings(self, new_settings: Dict[str, Any]) -> bool:
        with self._settings_lock:
            try:
                current_settings = {}
                if SETTINGS_FILE.exists():
                    with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                        current_settings = json.load(f)
                current_settings.update(new_settings)
                with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
                    json.dump(current_settings, f, indent=2)
                return True
            except Exception:
                return False

    def get_custom_gestures(self) -> List[Any]:
        with self._gestures_lock:
            try:
                with open(GESTURES_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return []

    def update_custom_gestures(self, gestures: List[Any]) -> bool:
        with self._gestures_lock:
            try:
                with open(GESTURES_FILE, "w", encoding="utf-8") as f:
                    json.dump(gestures, f, indent=2)
                return True
            except Exception:
                return False

if __name__ == "__main__":
    sm = SettingsManager()
    print("Current Settings:", sm.get_settings())
    print("Custom Gestures:", sm.get_custom_gestures())

