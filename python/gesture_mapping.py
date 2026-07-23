import time
import math
import numpy as np
import pyautogui
from config import SettingsManager
from voice_commands import voice_service

pyautogui.FAILSAFE = False

class GestureMapper:
    def __init__(self):
        self.settings_manager = SettingsManager()
        self.screen_width, self.screen_height = pyautogui.size()
        
        # Buffer for moving average
        self.x_buffer = []
        self.y_buffer = []
        
        # State tracking
        self.last_click_time = 0
        self.last_action_time = 0
        
        # Drag & Zoom tracking
        self.is_dragging = False
        self.drag_start_time = 0
        self.last_pinch_dist = None

    def update_settings(self):
        self.settings = self.settings_manager.get_settings()
        self.smoothing = max(1, self.settings.get("cursor_smoothing", 5))
        self.click_threshold = self.settings.get("click_threshold_px", 30) / 1000.0
        self.cooldown = self.settings.get("cooldown_period_sec", 0.3)
        self.double_click_time = self.settings.get("double_click_time_sec", 0.35)
        self.custom_gestures = self.settings_manager.get_custom_gestures()

    def calculate_distance(self, p1, p2):
        return math.hypot(p1['x'] - p2['x'], p1['y'] - p2['y'])

    def get_finger_states(self, landmarks):
        # Return [thumb, index, middle, ring, pinky] True if extended
        states = []
        # Thumb: compare tip to MCP on x-axis (approximate)
        thumb_tip = landmarks[4]
        thumb_ip = landmarks[3]
        thumb_mcp = landmarks[2]
        # Heuristic: distance from tip to pinky MCP > IP to pinky MCP
        pinky_mcp = landmarks[17]
        dist_tip = self.calculate_distance(thumb_tip, pinky_mcp)
        dist_ip = self.calculate_distance(thumb_ip, pinky_mcp)
        states.append(dist_tip > dist_ip)

        # Other fingers: tip y < pip y
        tips = [8, 12, 16, 20]
        pips = [6, 10, 14, 18]
        for tip, pip in zip(tips, pips):
            states.append(landmarks[tip]['y'] < landmarks[pip]['y'])
        
        return states

    def process_landmarks(self, landmarks):
        if not landmarks or len(landmarks) < 21:
            return

        self.update_settings()

        thumb_tip = landmarks[4]
        index_tip = landmarks[8]
        middle_tip = landmarks[12]
        ring_tip = landmarks[16]

        finger_states = self.get_finger_states(landmarks)
        states_tuple = tuple(finger_states)

        current_time = time.time()
        
        # 1. Custom Gestures Overlay (matches by finger states roughly)
        # Not fully implementing distance matrix for simplicity, just finger states mapping if present
        for cg in self.custom_gestures:
            if tuple(cg.get("finger_states", [])) == states_tuple:
                if current_time - self.last_action_time > self.cooldown:
                    action = cg.get("mapped_action")
                    if action:
                        keys = action.split("+")
                        pyautogui.hotkey(*keys)
                        self.last_action_time = current_time
                    return

        # 2. System Gestures
        if states_tuple == (1, 1, 1, 1, 1):
            # Open Palm -> Rest mode
            self.x_buffer.clear()
            self.y_buffer.clear()
            return
            
        if states_tuple == (0, 0, 0, 0, 0):
            # Closed Fist -> Minimize
            if current_time - self.last_action_time > self.cooldown:
                pyautogui.hotkey("win", "down")
                self.last_action_time = current_time
            return
            
        if states_tuple == (1, 1, 0, 0, 1):
            # Spider-Man Pose -> Start Menu
            if current_time - self.last_action_time > self.cooldown:
                pyautogui.press("win")
                self.last_action_time = current_time
            return
            
        if states_tuple == (1, 0, 0, 0, 1):
            # Shaka Sign -> Trigger Voice
            if current_time - self.last_action_time > self.cooldown:
                voice_service.trigger_listening()
                self.last_action_time = current_time
            return
            
        if states_tuple == (0, 1, 1, 1, 1):
            # Four Fingers Up -> Close Window
            if current_time - self.last_action_time > self.cooldown:
                pyautogui.hotkey("alt", "f4")
                self.last_action_time = current_time
            return

        if states_tuple == (0, 1, 1, 0, 0):
            # V-Spread vs Crossed Fingers vs Scroll
            dist = self.calculate_distance(index_tip, middle_tip)
            if dist > 0.08:
                # V-Spread -> Switch Window
                if current_time - self.last_action_time > self.cooldown:
                    pyautogui.hotkey("alt", "tab")
                    self.last_action_time = current_time
                return
            elif dist < 0.02:
                # Crossed Fingers -> Lock Screen
                if current_time - self.last_action_time > self.cooldown:
                    pyautogui.hotkey("win", "l")
                    self.last_action_time = current_time
                return
            else:
                # Two fingers close together -> Scroll
                # Map y-coordinate to scroll
                scroll_y = int((0.5 - index_tip['y']) * 100)
                pyautogui.scroll(scroll_y * 2)
                return

        if states_tuple == (1, 1, 0, 0, 0):
            # Zoom logic (Pinch expand/contract)
            thumb_index_dist = self.calculate_distance(thumb_tip, index_tip)
            if self.last_pinch_dist is not None:
                diff = thumb_index_dist - self.last_pinch_dist
                if diff > 0.03:
                    pyautogui.hotkey("ctrl", "+")
                    self.last_pinch_dist = thumb_index_dist
                elif diff < -0.03:
                    pyautogui.hotkey("ctrl", "-")
                    self.last_pinch_dist = thumb_index_dist
            else:
                self.last_pinch_dist = thumb_index_dist
            return
        else:
            self.last_pinch_dist = None

        if states_tuple == (0, 0, 1, 1, 1) or states_tuple == (1, 0, 1, 1, 1):
            # OK Sign -> Enter Key (Index + thumb pinched, others extended)
            if self.calculate_distance(thumb_tip, index_tip) < self.click_threshold:
                if current_time - self.last_action_time > self.cooldown:
                    pyautogui.press("enter")
                    self.last_action_time = current_time
                return

        # Cursor movement driven by index tip (map to screen)
        raw_x = index_tip['x'] * self.screen_width
        raw_y = index_tip['y'] * self.screen_height

        self.x_buffer.append(raw_x)
        self.y_buffer.append(raw_y)

        if len(self.x_buffer) > self.smoothing:
            self.x_buffer.pop(0)
            self.y_buffer.pop(0)

        smooth_x = np.mean(self.x_buffer)
        smooth_y = np.mean(self.y_buffer)

        if finger_states[1]: # Index is extended
            pyautogui.moveTo(smooth_x, smooth_y)

        # Check clicks
        thumb_index_dist = self.calculate_distance(thumb_tip, index_tip)
        thumb_middle_dist = self.calculate_distance(thumb_tip, middle_tip)

        if thumb_index_dist < self.click_threshold:
            if not self.is_dragging:
                if self.drag_start_time == 0:
                    self.drag_start_time = current_time
                elif current_time - self.drag_start_time > 0.6:
                    self.is_dragging = True
                    pyautogui.mouseDown()
            
            if current_time - self.last_action_time > self.cooldown and not self.is_dragging:
                if current_time - self.last_click_time < self.double_click_time:
                    pyautogui.doubleClick()
                    self.last_action_time = current_time
                    self.last_click_time = 0
                else:
                    pyautogui.click()
                    self.last_click_time = current_time
                    self.last_action_time = current_time
        else:
            if self.is_dragging:
                pyautogui.mouseUp()
                self.is_dragging = False
            self.drag_start_time = 0

        if thumb_middle_dist < self.click_threshold:
            if current_time - self.last_action_time > self.cooldown:
                pyautogui.click(button='right')
                self.last_action_time = current_time
                
        thumb_ring_dist = self.calculate_distance(thumb_tip, ring_tip)
        if thumb_ring_dist < self.click_threshold:
            if current_time - self.last_action_time > self.cooldown:
                pyautogui.click(button='middle')
                self.last_action_time = current_time

if __name__ == "__main__":
    mapper = GestureMapper()
    print("Gesture Mapper Initialized")
