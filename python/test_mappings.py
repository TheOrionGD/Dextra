import unittest
from gesture_mapping import GestureMapper
from voice_mapping import match_command

class TestDextraMappings(unittest.TestCase):
    def test_voice_commands(self):
        # Testing exact matches
        self.assertEqual(match_command("scroll up"), "scroll up")
        self.assertEqual(match_command("copy"), "copy")
        self.assertEqual(match_command("open calculator"), "open calculator")
        
        # Testing synonyms/aliases
        self.assertEqual(match_command("switch applications"), "switch window")
        self.assertEqual(match_command("decrease volume"), "volume down")
        self.assertEqual(match_command("next song"), "next track")
        
        # Testing substring matches
        self.assertEqual(match_command("please scroll down for me"), "scroll down")
        self.assertEqual(match_command("hey dextra lock screen"), "lock screen")

    def test_gesture_heuristics(self):
        mapper = GestureMapper()
        # Mocking landmarks. Each landmark has 'x' and 'y' (and 'z', but we use x/y).
        # Finger states: [thumb, index, middle, ring, pinky]
        
        # Open Palm: all fingers extended
        landmarks_palm = [{'x': 0, 'y': 0}] * 21
        landmarks_palm[4] = {'x': 1, 'y': 0}  # Thumb tip far x
        landmarks_palm[3] = {'x': 0.5, 'y': 0}
        landmarks_palm[2] = {'x': 0, 'y': 0}
        landmarks_palm[17] = {'x': 0, 'y': 0} # Pinky MCP
        
        for tip, pip in zip([8, 12, 16, 20], [6, 10, 14, 18]):
            landmarks_palm[tip] = {'x': 0, 'y': -1} # Tip higher than PIP (smaller y)
            landmarks_palm[pip] = {'x': 0, 'y': 0}
            
        states = mapper.get_finger_states(landmarks_palm)
        self.assertEqual(states, [True, True, True, True, True])

        # Closed Fist: all fingers curled
        landmarks_fist = [{'x': 0, 'y': 0}] * 21
        landmarks_fist[4] = {'x': 0, 'y': 0}  # Thumb tip close to pinky MCP
        landmarks_fist[3] = {'x': 0, 'y': 0}
        landmarks_fist[17] = {'x': 0, 'y': 0} # Pinky MCP
        
        for tip, pip in zip([8, 12, 16, 20], [6, 10, 14, 18]):
            landmarks_fist[tip] = {'x': 0, 'y': 1} # Tip lower than PIP (larger y)
            landmarks_fist[pip] = {'x': 0, 'y': 0}
            
        states = mapper.get_finger_states(landmarks_fist)
        self.assertEqual(states, [False, False, False, False, False])
        
        # Spider-Man: Thumb, Index, Pinky extended
        landmarks_spidey = [{'x': 0, 'y': 0}] * 21
        landmarks_spidey[4] = {'x': 1, 'y': 0}  # Thumb extended
        landmarks_spidey[3] = {'x': 0.5, 'y': 0}
        landmarks_spidey[17] = {'x': 0, 'y': 0}
        
        for tip, pip in zip([8, 12, 16, 20], [6, 10, 14, 18]):
            if tip in [8, 20]:
                landmarks_spidey[tip] = {'x': 0, 'y': -1} # extended
            else:
                landmarks_spidey[tip] = {'x': 0, 'y': 1} # curled
            landmarks_spidey[pip] = {'x': 0, 'y': 0}
            
        states = mapper.get_finger_states(landmarks_spidey)
        self.assertEqual(states, [True, True, False, False, True])

if __name__ == '__main__':
    unittest.main()
