import sys
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
PYTHON_PATH = PROJECT_ROOT / "python"
if str(PYTHON_PATH) not in sys.path:
    sys.path.insert(0, str(PYTHON_PATH))


class TestVoiceMapping(unittest.TestCase):
    def test_normalize(self):
        from voice_mapping import normalize
        self.assertEqual(normalize("   SCROLL   UP  "), "scroll up")
        self.assertEqual(normalize("\nCOPY\t"), "copy")

    def test_match_command_exact(self):
        from voice_mapping import match_command
        self.assertEqual(match_command("copy"), "copy")
        self.assertEqual(match_command("scroll down"), "scroll down")
        self.assertEqual(match_command("open calculator"), "open calculator")

    def test_match_command_alias(self):
        from voice_mapping import match_command
        self.assertEqual(match_command("increase volume"), "volume up")
        self.assertEqual(match_command("switch applications"), "switch window")
        self.assertEqual(match_command("next song"), "next track")

    def test_match_command_substring(self):
        from voice_mapping import match_command
        self.assertEqual(match_command("please copy this text for me"), "copy")
        self.assertEqual(match_command("can you scroll down please"), "scroll down")

    def test_match_command_unknown(self):
        from voice_mapping import match_command
        self.assertIsNone(match_command("abracadabra unknown string"))

    def test_execute_command(self):
        mock_pyautogui = MagicMock()
        with patch("voice_mapping.pyautogui", mock_pyautogui):
            from voice_mapping import execute_command
            success = execute_command("copy")
            self.assertTrue(success)
            mock_pyautogui.hotkey.assert_called_with("ctrl", "c")

            unmapped_success = execute_command("invalid non-existent command")
            self.assertFalse(unmapped_success)


if __name__ == "__main__":
    unittest.main()
