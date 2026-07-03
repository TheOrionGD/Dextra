import numpy as np
import sounddevice as sd
import torch

from transformers import pipeline

# ----------------------------
# Configuration
# ----------------------------
SAMPLE_RATE = 16000
RECORD_SECONDS = 3
MODEL_NAME = "openai/whisper-tiny"

# ----------------------------
# Load ASR Model
# ----------------------------
print("Loading speech recognition model...")

device = 0 if torch.cuda.is_available() else -1

asr = pipeline(
    task="automatic-speech-recognition",
    model=MODEL_NAME,
    device=device,
)

print("Model loaded successfully.")

# ----------------------------
# Audio Recording
# ----------------------------
def record_audio(duration=RECORD_SECONDS):
    """
    Records microphone audio and returns a NumPy array.
    """

    print("Listening...")

    recording = sd.rec(
        int(duration * SAMPLE_RATE),
        samplerate=SAMPLE_RATE,
        channels=1,
        dtype="float32",
    )

    sd.wait()

    print("Recording complete.")

    return recording.flatten()


# ----------------------------
# Speech-to-Text
# ----------------------------
def transcribe(audio):
    """
    Performs local speech recognition.
    """

    result = asr(
        {
            "sampling_rate": SAMPLE_RATE,
            "raw": audio,
        }
    )

    return result["text"]


# ----------------------------
# Main
# ----------------------------
def main():
    audio = record_audio()

    text = transcribe(audio)

    print("\nRecognized Speech:")
    print(text)


if __name__ == "__main__":
    main()