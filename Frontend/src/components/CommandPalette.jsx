import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './CommandPalette.css';

const API = 'http://localhost:8000';

const GESTURES = [
  { emoji: '☝️', name: 'Index Finger Up', action: 'Move Cursor', desc: 'Only index extended, hand moves freely' },
  { emoji: '🤏', name: 'Quick Pinch', action: 'Left Click', desc: 'Index + thumb briefly touch and release' },
  { emoji: '🤏🤏', name: 'Double Pinch', action: 'Double Click', desc: 'Two rapid pinches within 0.35 s' },
  { emoji: '✊', name: 'Hold Pinch + Move', action: 'Drag & Drop', desc: 'Pinch held >0.6 s while moving hand' },
  { emoji: '🖕', name: 'Middle + Thumb Pinch', action: 'Right Click', desc: 'Middle finger + thumb touch' },
  { emoji: '🤌', name: 'Ring + Thumb Pinch', action: 'Middle Click', desc: 'Ring finger + thumb touch' },
  { emoji: '👌', name: 'OK Sign', action: 'Confirm / Enter', desc: 'Index + thumb circle, other fingers extended' },
  { emoji: '✌️', name: 'Two Fingers + Move Up/Down', action: 'Vertical Scroll', desc: 'Index & middle extended, hand moves vertically' },
  { emoji: '✌️↔', name: 'Two Fingers Lateral', action: 'Horizontal Scroll', desc: 'Index & middle extended, hand moves left/right' },
  { emoji: '👋', name: 'Wrist Flick Left', action: 'Navigate Back', desc: 'Quick leftward wrist snap' },
  { emoji: '👋', name: 'Wrist Flick Right', action: 'Navigate Forward', desc: 'Quick rightward wrist snap' },
  { emoji: '☝️⬆', name: 'Index Hold Up (1s)', action: 'Page Up', desc: 'Index up, hand stationary for 1 second' },
  { emoji: '☝️⬇', name: 'Index Hold Down (1s)', action: 'Page Down', desc: 'Index down, hand stationary for 1 second' },
  { emoji: '🤏➡', name: 'Pinch Expand', action: 'Zoom In (Ctrl +)', desc: 'Thumb & index spread outward rapidly' },
  { emoji: '🤏⬅', name: 'Pinch Contract', action: 'Zoom Out (Ctrl −)', desc: 'Thumb & index pinch inward rapidly' },
  { emoji: '🖖', name: 'V-Spread', action: 'Switch Window (Alt+Tab)', desc: 'Index & middle spread wide apart' },
  { emoji: '✊', name: 'Closed Fist (still)', action: 'Minimize Window', desc: 'All fingers curled, no movement for 0.5s' },
  { emoji: '🖐', name: 'Four Fingers Up', action: 'Close Window (Alt+F4)', desc: 'All fingers except thumb extended' },
  { emoji: '🤟', name: 'Spider-Man Pose', action: 'Open Start Menu', desc: 'Thumb + index + pinky extended' },
  { emoji: '✋', name: 'Open Palm', action: 'Freeze / Rest Mode', desc: 'All five fingers extended, hand still' },
  { emoji: '🤙', name: 'Shaka Sign', action: 'Toggle Voice Mode', desc: 'Thumb + pinky only extended' },
  { emoji: '🤞', name: 'Crossed Fingers', action: 'Lock Screen', desc: 'Index + middle crossed' },
];

const CommandPalette = ({ showToast, showBackendAlert }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [smoothing, setSmoothing] = useState(5);
  const [threshold, setThreshold] = useState(30);

  const navigate = useNavigate();
  const location = useLocation();
  const overlayRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Sync settings with local storage or backend
  useEffect(() => {
    const fetchCurrentSettings = async () => {
      try {
        const res = await fetch(`${API}/settings`, { signal: AbortSignal.timeout(1500) });
        if (res.ok) {
          const data = await res.json();
          if (data.cursor_smoothing) setSmoothing(data.cursor_smoothing);
          if (data.click_threshold_px) setThreshold(data.click_threshold_px);
          setBackendStatus('Online');
        } else {
          setBackendStatus('Offline');
        }
      } catch {
        setBackendStatus('Offline');
        // read local storage
        const localSmooth = localStorage.getItem('dextra_smoothing');
        const localThresh = localStorage.getItem('dextra_threshold');
        if (localSmooth) setSmoothing(Number(localSmooth));
        if (localThresh) setThreshold(Number(localThresh));
      }
    };

    if (isOpen) {
      fetchCurrentSettings();
    }
  }, [isOpen]);

  const saveSetting = async (key, value) => {
    localStorage.setItem(`dextra_${key}`, value.toString());
    try {
      const currentRes = await fetch(`${API}/settings`);
      let current = {};
      if (currentRes.ok) {
        current = await currentRes.json();
      }
      await fetch(`${API}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...current,
          [key === 'smoothing' ? 'cursor_smoothing' : 'click_threshold_px']: value,
        }),
      });
    } catch {
      // Offline fallback
      setBackendStatus('Offline');
      const triggerAlert = showBackendAlert || window.showBackendAlert;
      if (triggerAlert) {
        triggerAlert('Command Palette setting sync failed: Backend server is offline or inactive.');
      }
    }
  };

  // Keyboard shortcut listener for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setSearch('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset selected index when search query changes
  useEffect(() => {
    setSelectedIndex(0);
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [search]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Close when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  if (!isOpen) return null;

  // Build commands
  const commands = [
    // Navigation Category
    {
      category: 'Navigation',
      label: 'Go to Dashboard',
      icon: '⚡',
      action: () => navigate('/app'),
      keywords: 'dashboard home overview status app',
    },
    {
      category: 'Navigation',
      label: 'Go to Gesture Trainer',
      icon: '🎯',
      action: () => navigate('/app/trainer'),
      keywords: 'trainer record custom webcam train mediaPipe gesture',
    },
    {
      category: 'Navigation',
      label: 'Go to Voice Controller',
      icon: '🎙️',
      action: () => navigate('/app/voice'),
      keywords: 'voice whisper mic speech commands audio listen',
    },
    {
      category: 'Navigation',
      label: 'Go to Gesture Library',
      icon: '🤚',
      action: () => navigate('/app/gestures'),
      keywords: 'gestures library reference scroll zoom list actions',
    },
    {
      category: 'Navigation',
      label: 'Go to System Settings',
      icon: '⚙️',
      action: () => navigate('/app/settings'),
      keywords: 'settings configurations preferences camera delay',
    },
    {
      category: 'Navigation',
      label: 'Go to Welcome Screen',
      icon: '🏠',
      action: () => navigate('/'),
      keywords: 'welcome landing back home intro start',
    },

    // System Control Category
    {
      category: 'System Control',
      label: `Ping Backend Status (Currently: ${backendStatus})`,
      icon: '📡',
      action: async () => {
        setBackendStatus('Pinging...');
        try {
          const res = await fetch(`${API}/health`, { signal: AbortSignal.timeout(1500) });
          if (res.ok) {
            setBackendStatus('Online');
            if (showToast) showToast('✅ Backend is Online and active!', 'success');
          } else {
            setBackendStatus('Offline');
            const triggerAlert = showBackendAlert || window.showBackendAlert;
            if (triggerAlert) triggerAlert('Ping check returned error: Backend server is offline or inactive.');
          }
        } catch {
          setBackendStatus('Offline');
          const triggerAlert = showBackendAlert || window.showBackendAlert;
          if (triggerAlert) triggerAlert('Ping check failed: Backend server is offline or inactive. Backend process not yet created.');
        }
      },
      keywords: 'ping backend health check connection fastapi status link',
    },
    {
      category: 'Settings Adjustments',
      label: `Set Cursor Smoothing: Low (2 frames)`,
      icon: '🖱️',
      action: () => {
        setSmoothing(2);
        saveSetting('smoothing', 2);
      },
      keywords: 'smoothing cursor buffer low lag fast responsive',
    },
    {
      category: 'Settings Adjustments',
      label: `Set Cursor Smoothing: Medium (5 frames) - Recommended`,
      icon: '🖱️',
      action: () => {
        setSmoothing(5);
        saveSetting('smoothing', 5);
      },
      keywords: 'smoothing cursor buffer medium standard default recomended',
    },
    {
      category: 'Settings Adjustments',
      label: `Set Cursor Smoothing: High (10 frames)`,
      icon: '🖱️',
      action: () => {
        setSmoothing(10);
        saveSetting('smoothing', 10);
      },
      keywords: 'smoothing cursor buffer high heavy stable float',
    },
    {
      category: 'Settings Adjustments',
      label: `Set Click Threshold: Tight (20 px)`,
      icon: '🤏',
      action: () => {
        setThreshold(20);
        saveSetting('threshold', 20);
      },
      keywords: 'click threshold tight small distance narrow pinch',
    },
    {
      category: 'Settings Adjustments',
      label: `Set Click Threshold: Normal (30 px) - Default`,
      icon: '🤏',
      action: () => {
        setThreshold(30);
        saveSetting('threshold', 30);
      },
      keywords: 'click threshold normal average middle standard pinch',
    },
    {
      category: 'Settings Adjustments',
      label: `Set Click Threshold: Loose (45 px)`,
      icon: '🤏',
      action: () => {
        setThreshold(45);
        saveSetting('threshold', 45);
      },
      keywords: 'click threshold loose high large wide pinch distance',
    },
  ];

  // Dynamic search matching
  const query = search.toLowerCase().trim();
  let filtered = commands.filter(
    (c) =>
      c.label.toLowerCase().includes(query) ||
      c.keywords.toLowerCase().includes(query) ||
      c.category.toLowerCase().includes(query)
  );

  // If no results, check if searching for gestures specifically
  const gestureMatches = GESTURES.filter(
    (g) =>
      g.name.toLowerCase().includes(query) ||
      g.action.toLowerCase().includes(query) ||
      g.desc.toLowerCase().includes(query)
  );

  const gestureCommands = gestureMatches.map((g) => ({
    category: 'Gesture Library Reference',
    label: `${g.emoji} ${g.name} ── Mapped to: ${g.action}`,
    sublabel: g.desc,
    icon: '🤚',
    action: () => {
      navigate('/app/gestures');
    },
    keywords: 'gesture hand shortcut move mouse track',
  }));

  filtered = [...filtered, ...gestureCommands];

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
      scrollIntoView(selectedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      scrollIntoView(selectedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    }
  };

  const scrollIntoView = (index) => {
    const list = listRef.current;
    if (!list) return;
    const items = list.querySelectorAll('.cmd-item');
    const activeItem = items[index % filtered.length];
    if (!activeItem) return;

    const listRect = list.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    if (itemRect.bottom > listRect.bottom) {
      list.scrollTop += itemRect.bottom - listRect.bottom;
    } else if (itemRect.top < listRect.top) {
      list.scrollTop -= listRect.top - itemRect.top;
    }
  };

  // Group by category for visual styling
  const categories = {};
  filtered.forEach((item, index) => {
    if (!categories[item.category]) {
      categories[item.category] = [];
    }
    categories[item.category].push({ ...item, originalIndex: index });
  });

  return (
    <div
      className="cmd-overlay"
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && setIsOpen(false)}
    >
      <div className="cmd-palette glass-card" onKeyDown={handleKeyDown}>
        <div className="cmd-header">
          <span className="cmd-search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="cmd-search-input"
            placeholder="Search commands, pages, or gestures..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <kbd className="cmd-esc-tag">ESC</kbd>
        </div>

        <div className="cmd-body" ref={listRef}>
          {filtered.length === 0 ? (
            <div className="cmd-no-results">No matching commands found.</div>
          ) : (
            Object.keys(categories).map((catName) => (
              <div key={catName} className="cmd-category-group">
                <div className="cmd-category-title">{catName}</div>
                <div className="cmd-category-items">
                  {categories[catName].map((item) => {
                    const isSelected = selectedIndex === item.originalIndex;
                    return (
                      <div
                        key={item.originalIndex}
                        className={`cmd-item${isSelected ? ' active-item' : ''}`}
                        onClick={() => {
                          setSelectedIndex(item.originalIndex);
                          item.action();
                        }}
                      >
                        <span className="cmd-item-icon">{item.icon}</span>
                        <div className="cmd-item-details">
                          <span className="cmd-item-label">{item.label}</span>
                          {item.sublabel && (
                            <span className="cmd-item-sublabel">{item.sublabel}</span>
                          )}
                        </div>
                        {isSelected && <span className="cmd-item-hint">⏎ Enter</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cmd-footer">
          <div className="cmd-footer-keys">
            <span>
              <kbd>↑</kbd> <kbd>↓</kbd> Navigate
            </span>
            <span>
              <kbd>↵ Enter</kbd> Select
            </span>
            <span>
              <kbd>esc</kbd> Close
            </span>
          </div>
          <div className="cmd-footer-status">
            <span className="cmd-footer-status-dot" style={{ background: backendStatus === 'Online' ? '#27ae60' : backendStatus === 'Pinging...' ? '#e67e22' : '#e74c3c' }} />
            DEXTRA Backend: {backendStatus} (Smoothing: {smoothing}f)
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
