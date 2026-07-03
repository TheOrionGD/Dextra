import pyautogui

# Safety: move mouse to top-left to abort automation
pyautogui.FAILSAFE = True

# ---------------------------------------------------
# Command Categories
# ---------------------------------------------------

COMMANDS = {
    # Editing
    "copy": lambda: pyautogui.hotkey("ctrl", "c"),
    "paste": lambda: pyautogui.hotkey("ctrl", "v"),
    "cut": lambda: pyautogui.hotkey("ctrl", "x"),
    "undo": lambda: pyautogui.hotkey("ctrl", "z"),
    "redo": lambda: pyautogui.hotkey("ctrl", "y"),
    "select all": lambda: pyautogui.hotkey("ctrl", "a"),
    "save": lambda: pyautogui.hotkey("ctrl", "s"),

    # Navigation
    "find": lambda: pyautogui.hotkey("ctrl", "f"),
    "refresh": lambda: pyautogui.press("f5"),
    "scroll up": lambda: pyautogui.scroll(600),
    "scroll down": lambda: pyautogui.scroll(-600),

    # Window Management
    "switch window": lambda: pyautogui.hotkey("alt", "tab"),
    "close window": lambda: pyautogui.hotkey("alt", "f4"),
    "minimize": lambda: pyautogui.hotkey("win", "down"),
    "maximize": lambda: pyautogui.hotkey("win", "up"),
    "desktop": lambda: pyautogui.hotkey("win", "d"),

    # Browser
    "new tab": lambda: pyautogui.hotkey("ctrl", "t"),
    "close tab": lambda: pyautogui.hotkey("ctrl", "w"),
    "next tab": lambda: pyautogui.hotkey("ctrl", "tab"),
    "previous tab": lambda: pyautogui.hotkey("ctrl", "shift", "tab"),

    # Zoom
    "zoom in": lambda: pyautogui.hotkey("ctrl", "+"),
    "zoom out": lambda: pyautogui.hotkey("ctrl", "-"),
    "reset zoom": lambda: pyautogui.hotkey("ctrl", "0"),

    # Media (platform-dependent)
    "play": lambda: pyautogui.press("playpause"),
    "pause": lambda: pyautogui.press("playpause"),
    "next song": lambda: pyautogui.press("nexttrack"),
    "previous song": lambda: pyautogui.press("prevtrack"),
    "volume up": lambda: pyautogui.press("volumeup"),
    "volume down": lambda: pyautogui.press("volumedown"),
    "mute": lambda: pyautogui.press("volumemute"),
}

# ---------------------------------------------------
# Synonyms
# ---------------------------------------------------

ALIASES = {
    "copy text": "copy",
    "please copy": "copy",
    "paste it": "paste",
    "copy this": "copy",
    "switch applications": "switch window",
    "change window": "switch window",
    "increase volume": "volume up",
    "decrease volume": "volume down",
    "silence": "mute",
}

# ---------------------------------------------------
# Normalization
# ---------------------------------------------------

def normalize(text: str) -> str:
    return " ".join(text.lower().strip().split())

# ---------------------------------------------------
# Command Matching
# ---------------------------------------------------

def match_command(text: str):
    text = normalize(text)

    if text in ALIASES:
        text = ALIASES[text]

    if text in COMMANDS:
        return text

    for command in COMMANDS:
        if command in text:
            return command

    return None

# ---------------------------------------------------
# Execute Command
# ---------------------------------------------------

def execute_command(text: str):
    command = match_command(text)

    if command is None:
        print(f"No matching command: '{text}'")
        return False

    print(f"Executing: {command}")
    COMMANDS[command]()
    return True

# ---------------------------------------------------
# Demo
# ---------------------------------------------------

if __name__ == "__main__":
    while True:
        phrase = input("Voice Command: ")

        if phrase.lower() == "exit":
            break

        execute_command(phrase)