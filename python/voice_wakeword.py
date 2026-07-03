import queue
import threading
import numpy as np
import sounddevice as sd

SAMPLE_RATE = 16000
BLOCK_SIZE = 1024
THRESHOLD = 0.02

audio_queue = queue.Queue()
system_active = False


def audio_callback(indata, frames, time, status):
    if status:
        print(status)

    audio_queue.put(indata.copy())


def detect_wakeword(audio):
    """
    Placeholder wakeword detector.

    Replace this with:
    - OpenWakeWord
    - Porcupine
    - Whisper keyword classifier
    - Custom ML model
    """

    rms = np.sqrt(np.mean(audio ** 2))

    if rms > THRESHOLD:
        return True

    return False


def activate():
    global system_active

    if system_active:
        return

    system_active = True

    print("DEXTRA ACTIVE")

    # Example:
    # requests.post("http://localhost:8000/activate")
    #
    # or
    # subprocess.Popen(["python", "voice_engine.py"])


def listen():
    with sd.InputStream(
        samplerate=SAMPLE_RATE,
        channels=1,
        callback=audio_callback,
        blocksize=BLOCK_SIZE,
    ):

        print("Listening for wakeword...")

        while True:
            block = audio_queue.get()

            if detect_wakeword(block):
                activate()


if __name__ == "__main__":
    listen()