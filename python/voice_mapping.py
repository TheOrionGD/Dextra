import pyautogui
import os
import subprocess

pyautogui.FAILSAFE = True

COMMANDS = {
    # ── Editing ──
    "copy": lambda: pyautogui.hotkey("ctrl", "c"),
    "cut": lambda: pyautogui.hotkey("ctrl", "x"),
    "paste": lambda: pyautogui.hotkey("ctrl", "v"),
    "undo": lambda: pyautogui.hotkey("ctrl", "z"),
    "redo": lambda: pyautogui.hotkey("ctrl", "y"),
    "select all": lambda: pyautogui.hotkey("ctrl", "a"),
    "save": lambda: pyautogui.hotkey("ctrl", "s"),
    "save as": lambda: pyautogui.hotkey("ctrl", "shift", "s"),
    "find": lambda: pyautogui.hotkey("ctrl", "f"),
    "replace": lambda: pyautogui.hotkey("ctrl", "h"),
    "delete": lambda: pyautogui.press("delete"),
    "bold": lambda: pyautogui.hotkey("ctrl", "b"),
    "italic": lambda: pyautogui.hotkey("ctrl", "i"),
    "underline": lambda: pyautogui.hotkey("ctrl", "u"),
    "new line": lambda: pyautogui.press("enter"),

    # ── Navigation ──
    "scroll up": lambda: pyautogui.scroll(600),
    "scroll down": lambda: pyautogui.scroll(-600),
    "scroll top": lambda: pyautogui.press("home"),
    "scroll bottom": lambda: pyautogui.press("end"),
    "go back": lambda: pyautogui.hotkey("alt", "left"),
    "go forward": lambda: pyautogui.hotkey("alt", "right"),
    "page up": lambda: pyautogui.press("pageup"),
    "page down": lambda: pyautogui.press("pagedown"),
    "zoom in": lambda: pyautogui.hotkey("ctrl", "+"),
    "zoom out": lambda: pyautogui.hotkey("ctrl", "-"),
    "reset zoom": lambda: pyautogui.hotkey("ctrl", "0"),

    # ── Window & Tab Management ──
    "close tab": lambda: pyautogui.hotkey("ctrl", "w"),
    "new tab": lambda: pyautogui.hotkey("ctrl", "t"),
    "reopen tab": lambda: pyautogui.hotkey("ctrl", "shift", "t"),
    "next tab": lambda: pyautogui.hotkey("ctrl", "tab"),
    "previous tab": lambda: pyautogui.hotkey("ctrl", "shift", "tab"),
    "new window": lambda: pyautogui.hotkey("ctrl", "n"),
    "close window": lambda: pyautogui.hotkey("alt", "f4"),
    "switch window": lambda: pyautogui.hotkey("alt", "tab"),
    "minimize": lambda: pyautogui.hotkey("win", "down"),
    "maximize": lambda: pyautogui.hotkey("win", "up"),
    "restore": lambda: pyautogui.hotkey("win", "down"),
    "task view": lambda: pyautogui.hotkey("win", "tab"),
    "snap left": lambda: pyautogui.hotkey("win", "left"),
    "snap right": lambda: pyautogui.hotkey("win", "right"),

    # ── Media & Volume ──
    "volume up": lambda: pyautogui.press("volumeup"),
    "volume down": lambda: pyautogui.press("volumedown"),
    "mute": lambda: pyautogui.press("volumemute"),
    "unmute": lambda: pyautogui.press("volumemute"),
    "play": lambda: pyautogui.press("playpause"),
    "pause": lambda: pyautogui.press("playpause"),
    "play pause": lambda: pyautogui.press("playpause"),
    "next track": lambda: pyautogui.press("nexttrack"),
    "previous track": lambda: pyautogui.press("prevtrack"),
    "fullscreen": lambda: pyautogui.press("f11"),
    "exit fullscreen": lambda: pyautogui.press("esc"),

    # ── System & Apps ──
    "screenshot": lambda: pyautogui.hotkey("win", "prtscr"),
    "open explorer": lambda: pyautogui.hotkey("win", "e"),
    "show desktop": lambda: pyautogui.hotkey("win", "d"),
    "lock screen": lambda: pyautogui.hotkey("win", "l"),
    "open settings": lambda: pyautogui.hotkey("win", "i"),
    "task manager": lambda: pyautogui.hotkey("ctrl", "shift", "esc"),
    "open notepad": lambda: subprocess.Popen(["notepad.exe"]),
    "open calculator": lambda: subprocess.Popen(["calc.exe"]),
}

ALIASES = {
    "copy text": "copy",
    "paste it": "paste",
    "switch applications": "switch window",
    "change window": "switch window",
    "increase volume": "volume up",
    "decrease volume": "volume down",
    "silence": "mute",
    "next song": "next track",
    "previous song": "previous track",
}

def normalize(text: str) -> str:
    return " ".join(text.lower().strip().split())

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

def execute_command(text: str):
    command = match_command(text)
    if command is None:
        return False
    try:
        COMMANDS[command]()
    except Exception as e:
        print(f"Failed to execute command '{command}': {e}")
    return True