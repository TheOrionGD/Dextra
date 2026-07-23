import os
os.environ["GLOG_minloglevel"] = "3"  # Suppress MediaPipe C++ Clearcut telemetry logs

import cv2
import mediapipe as mp
import numpy as np
import urllib.request
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = PROJECT_ROOT / "hand_landmarker.task"
MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"

class GestureEngine:
    def __init__(self, min_detection_confidence=0.7, min_tracking_confidence=0.7):
        if not MODEL_PATH.exists():
            print(f"Downloading model {MODEL_PATH.name}...")
            urllib.request.urlretrieve(MODEL_URL, str(MODEL_PATH))
            
        BaseOptions = mp.tasks.BaseOptions
        self.HandLandmarker = mp.tasks.vision.HandLandmarker
        HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
        VisionRunningMode = mp.tasks.vision.RunningMode

        options = HandLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=str(MODEL_PATH)),
            num_hands=1,
            min_hand_detection_confidence=min_detection_confidence,
            min_hand_presence_confidence=min_tracking_confidence,
            min_tracking_confidence=min_tracking_confidence,
            running_mode=VisionRunningMode.IMAGE)

        self.landmarker = self.HandLandmarker.create_from_options(options)

    def process_frame(self, rgb_frame):
        """
        Process an RGB frame and extract normalized landmarks.
        Returns a dictionary containing raw Mediapipe landmarks and an array of 21 points (x, y, z),
        and the annotated frame (or the original frame if no hands detected).
        """
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        results = self.landmarker.detect(mp_image)
        
        landmarks = []
        annotated_frame = rgb_frame.copy()
        
        if results.hand_landmarks:
            for hand_landmarks in results.hand_landmarks:
                for lm in hand_landmarks:
                    landmarks.append({
                        "x": lm.x,
                        "y": lm.y,
                        "z": lm.z
                    })
                    x = int(lm.x * rgb_frame.shape[1])
                    y = int(lm.y * rgb_frame.shape[0])
                    cv2.circle(annotated_frame, (x, y), 5, (0, 255, 0), -1)
                break
                
        return {
            "landmarks": landmarks,
            "annotated_frame": annotated_frame,
            "raw_results": results
        }

    def close(self):
        try:
            self.landmarker.close()
        except Exception:
            pass

if __name__ == "__main__":
    engine = GestureEngine()
    print("MediaPipe Hands Engine Initialized:", engine)
