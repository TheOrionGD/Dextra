import time
import threading
import cv2
from camera import CameraStream, encode_jpeg, load_camera_settings
from gesture_engine import GestureEngine
from gesture_mapping import GestureMapper

class GestureMouse:
    def __init__(self):
        self.settings = load_camera_settings()
        self.stream = CameraStream(settings=self.settings)
        self.engine = GestureEngine()
        self.mapper = GestureMapper()
        
        self.latest_frame_jpeg = b""
        self.latest_finger_states = [False] * 5
        self.frame_lock = threading.Lock()
        
        self.running = False
        self.thread = None

    def start(self):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()
        print("Gesture Mouse thread started.")

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join()
        self.engine.close()
        print("Gesture Mouse thread stopped.")

    def _loop(self):
        with self.stream:
            for processed_frame in self.stream.frames():
                if not self.running:
                    break
                
                # Process with mediapipe
                result = self.engine.process_frame(processed_frame.rgb)
                
                # Extract finger states for the trainer UI
                finger_states = [False] * 5
                if result["landmarks"]:
                    finger_states = self.mapper.get_finger_states(result["landmarks"])
                
                # Map to mouse actions
                self.mapper.process_landmarks(result["landmarks"])
                
                # Encode annotated frame to JPEG for WS stream
                annotated_bgr = cv2.cvtColor(result["annotated_frame"], cv2.COLOR_RGB2BGR)
                jpeg_bytes = encode_jpeg(annotated_bgr)
                
                with self.frame_lock:
                    self.latest_frame_jpeg = jpeg_bytes
                    self.latest_finger_states = finger_states

    def get_latest_frame_and_states(self):
        with self.frame_lock:
            return self.latest_frame_jpeg, self.latest_finger_states

    def get_latest_frame(self):
        with self.frame_lock:
            return self.latest_frame_jpeg

# Singleton-like instance for use in FastAPI
mouse_service = GestureMouse()

if __name__ == "__main__":
    try:
        mouse_service.start()
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        mouse_service.stop()
