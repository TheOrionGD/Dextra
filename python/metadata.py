# Metadata for built-in gestures and voice command categories

BUILTIN_GESTURES = [
    # Cursor & Click
    { "emoji": '☝️', "name": 'Index Finger Up', "desc": 'Only index extended, hand moves freely', "action": 'Move Cursor', "category": 'Cursor & Click' },
    { "emoji": '🤏', "name": 'Quick Pinch', "desc": 'Index + thumb briefly touch and release', "action": 'Left Click', "category": 'Cursor & Click' },
    { "emoji": '🤏🤏', "name": 'Double Pinch', "desc": 'Two rapid pinches within 0.35 s', "action": 'Double Click', "category": 'Cursor & Click' },
    { "emoji": '✊', "name": 'Hold Pinch + Move', "desc": 'Pinch held >0.6 s while moving hand', "action": 'Drag & Drop', "category": 'Cursor & Click' },
    { "emoji": '🖕', "name": 'Middle + Thumb Pinch', "desc": 'Middle finger + thumb touch', "action": 'Right Click', "category": 'Cursor & Click' },
    { "emoji": '🤌', "name": 'Ring + Thumb Pinch', "desc": 'Ring finger + thumb touch', "action": 'Middle Click', "category": 'Cursor & Click' },
    { "emoji": '👌', "name": 'OK Sign', "desc": 'Index + thumb circle, other fingers extended', "action": 'Confirm / Enter', "category": 'Cursor & Click' },
    # Scrolling
    { "emoji": '✌️', "name": 'Two Fingers + Move Up/Down', "desc": 'Index & middle extended, hand moves vertically', "action": 'Vertical Scroll', "category": 'Scrolling & Navigation' },
    { "emoji": '✌️↔', "name": 'Two Fingers Lateral', "desc": 'Index & middle extended, hand moves left/right', "action": 'Horizontal Scroll', "category": 'Scrolling & Navigation' },
    { "emoji": '👋', "name": 'Wrist Flick Left', "desc": 'Quick leftward wrist snap (index up)', "action": 'Navigate Back', "category": 'Scrolling & Navigation' },
    { "emoji": '👋', "name": 'Wrist Flick Right', "desc": 'Quick rightward wrist snap (index up)', "action": 'Navigate Forward', "category": 'Scrolling & Navigation' },
    { "emoji": '☝️⬆', "name": 'Index Hold Up (1s)', "desc": 'Index up, hand stationary for 1 second', "action": 'Page Up', "category": 'Scrolling & Navigation' },
    { "emoji": '☝️⬇', "name": 'Index Hold Down (1s)', "desc": 'Index down, hand stationary for 1 second', "action": 'Page Down', "category": 'Scrolling & Navigation' },
    # Zoom
    { "emoji": '🤏➡', "name": 'Pinch Expand', "desc": 'Thumb & index spread outward rapidly', "action": 'Zoom In (Ctrl +)', "category": 'Zoom' },
    { "emoji": '🤏⬅', "name": 'Pinch Contract', "desc": 'Thumb & index pinch inward rapidly', "action": 'Zoom Out (Ctrl −)', "category": 'Zoom' },
    # Window
    { "emoji": '🖖', "name": 'V-Spread', "desc": 'Index & middle spread wide apart', "action": 'Switch Window (Alt+Tab)', "category": 'Window Management' },
    { "emoji": '✊', "name": 'Closed Fist (still)', "desc": 'All fingers curled, no movement for 0.5s', "action": 'Minimize Window', "category": 'Window Management' },
    { "emoji": '🖐', "name": 'Four Fingers Up', "desc": 'All fingers except thumb extended', "action": 'Close Window (Alt+F4)', "category": 'Window Management' },
    { "emoji": '🤟', "name": 'Spider-Man Pose', "desc": 'Thumb + index + pinky extended', "action": 'Open Start Menu', "category": 'Window Management' },
    # System
    { "emoji": '✋', "name": 'Open Palm', "desc": 'All five fingers extended, hand still', "action": 'Freeze / Rest Mode', "category": 'System' },
    { "emoji": '🤙', "name": 'Shaka Sign', "desc": 'Thumb + pinky only extended', "action": 'Toggle Voice Mode', "category": 'System' },
    { "emoji": '🤞', "name": 'Crossed Fingers', "desc": 'Index + middle crossed', "action": 'Lock Screen', "category": 'System' },
]

VOICE_CMD_CATEGORIES = [
  {
    "title": '🧭 Navigation',
    "cmds": ['scroll up', 'scroll down', 'scroll top', 'scroll bottom', 'go back', 'go forward',
           'page up', 'page down', 'zoom in', 'zoom out', 'reset zoom'],
  },
  {
    "title": '✏️ Editing',
    "cmds": ['copy', 'cut', 'paste', 'undo', 'redo', 'select all', 'save', 'find', 'delete', 'bold', 'italic'],
  },
  {
    "title": '🪟 Window & Tabs',
    "cmds": ['close tab', 'new tab', 'next tab', 'new window', 'close window', 'switch window',
           'minimize', 'maximize', 'restore', 'snap left', 'snap right'],
  },
  {
    "title": '🎵 Media & Volume',
    "cmds": ['volume up', 'volume down', 'mute', 'play', 'pause', 'next track', 'previous track', 'fullscreen'],
  },
  {
    "title": '⚡ System & Apps',
    "cmds": ['screenshot', 'open explorer', 'show desktop', 'lock screen',
           'task manager', 'open terminal', 'open notepad', 'open calculator'],
  },
  {
    "title": '🤚 DEXTRA Control',
    "cmds": ['start listening', 'stop listening', 'open trainer', 'open settings',
           'toggle gestures', 'calibrate', 'help'],
  },
]
