import time
import threading
import queue
import json

from voice_engine import record_audio, transcribe, SAMPLE_RATE
from voice_mapping import execute_command
from config import SettingsManager

voice_status_queue = queue.Queue()

class VoiceDaemon:
    def __init__(self):
        self.settings = SettingsManager()
        self.running = False
        self.is_paused = False
        self.thread = None
        self.trigger_event = threading.Event()
        
        # State
        self.is_listening_for_command = False
        self.latest_command = ""

    def start(self):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()
        print("Voice Daemon started (Push-to-Talk mode).")

    def stop(self):
        self.running = False
        self.trigger_event.set() # wake up loop to exit
        if self.thread:
            self.thread.join()
        print("Voice Daemon stopped.")

    def trigger_listening(self):
        if not self.is_paused:
            self.trigger_event.set()

    def toggle_pause(self):
        self.is_paused = not self.is_paused
        state = "standby" if self.is_paused else "listening"
        voice_status_queue.put({"type": "status", "state": state})
        print(f"Voice listening {state}")

    def _loop(self):
        print("Waiting for gesture trigger...")
        voice_status_queue.put({"type": "status", "state": "standby"})
        while self.running:
            # Wait until trigger_listening is called
            self.trigger_event.wait()
            if not self.running:
                break
            
            self.trigger_event.clear()
            
            settings = self.settings.get_settings()
            if not settings.get("voice_commands_enabled", True) or self.is_paused:
                continue

            print("Gesture detected! Recording command...")
            voice_status_queue.put({"type": "wakeword", "message": "Gesture detected! Recording..."})
            self.is_listening_for_command = True
            
            # Record audio
            try:
                audio = record_audio()
                
                # Transcribe
                voice_status_queue.put({"type": "status", "state": "transcribing"})
                text = transcribe(audio).strip()
                print(f"Transcribed: {text}")
                
                # Ignore empty transcriptions and common Whisper hallucinations on silence
                if not text or text.lower() in ["you", "thank you.", "thank you very much.", "안녕! 안녕!"]:
                    print("Ignored empty or hallucinated speech.")
                else:
                    self.latest_command = text
                    voice_status_queue.put({"type": "transcription", "text": text})
                    # Execute mapping
                    if execute_command(text):
                        voice_status_queue.put({"type": "action", "message": f"Executed: {text}"})
                    else:
                        voice_status_queue.put({"type": "action", "message": f"Unrecognized command: {text}"})
            except Exception as e:
                err = f"Error during transcription: {e}"
                print(err)
                voice_status_queue.put({"type": "error", "message": err})
            
            self.is_listening_for_command = False
            voice_status_queue.put({"type": "status", "state": "standby"})
            print("Finished processing. Waiting for next gesture trigger...")

# Singleton-like instance
voice_service = VoiceDaemon()

if __name__ == "__main__":
    try:
        voice_service.start()
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        voice_service.stop()


