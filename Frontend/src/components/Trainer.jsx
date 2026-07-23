import { useState, useEffect, useRef, useCallback } from 'react';
import './Trainer.css';

/**
 * DEXTRA Gesture Trainer Page
 *
 * - Live camera feed rendered on HTML5 <canvas> via WebSocket JPEG stream from WS /trainer/stream
 * - Real-time finger state detection display (extended / curled)
 * - Form to name and record a custom gesture mapped to a system action
 * - Custom gesture list pulled from GET /gestures with delete via DELETE /gestures/:name
 * - Saves via POST /gestures
 */

const WS_URL = 'ws://localhost:8000/trainer/stream';
const API    = 'http://localhost:8000';

const FINGER_NAMES = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
const FINGER_ICONS = ['👍', '☝️', '🖕', '💍', '🤙'];

const AVAILABLE_ACTIONS = [
  'Left Click', 'Right Click', 'Double Click', 'Middle Click',
  'Scroll Up', 'Scroll Down', 'Zoom In', 'Zoom Out',
  'Navigate Back', 'Navigate Forward',
  'Switch Window (Alt+Tab)', 'Minimize Window', 'Close Window (Alt+F4)',
  'Open Start Menu', 'Freeze / Rest Mode',
  'Toggle Voice Mode', 'Lock Screen', 'Screenshot', 'Show Desktop',
];

const Trainer = ({ showToast, showBackendAlert }) => {
  const canvasRef         = useRef(null);
  const wsRef             = useRef(null);
  const animFrameRef      = useRef(null);
  const imgRef            = useRef(null);
  const fpsCounterRef     = useRef({ frames: 0, lastTs: performance.now() });

  const [streaming, setStreaming]       = useState(false);
  const [fps, setFps]                   = useState(0);
  const [fingerStates, setFingerStates] = useState(Array(5).fill(false));
  const [gestureName, setGestureName]   = useState('');
  const [mappedAction, setMappedAction] = useState(AVAILABLE_ACTIONS[0]);
  const [customGestures, setCustomGestures] = useState([]);
  const [recording, setRecording]       = useState(false);
  const [countdown, setCountdown]       = useState(null);

  /* ── Load custom gestures ── */
  const loadGestures = useCallback(async () => {
    try {
      const res = await fetch(`${API}/gestures`, { signal: AbortSignal.timeout(2500) });
      if (res.ok) setCustomGestures(await res.json());
    } catch { /* backend offline */ }
  }, []);

  useEffect(() => { loadGestures(); }, [loadGestures]);

  /* ── WebSocket camera stream ── */
  const startStream = useCallback(async () => {
    if (wsRef.current) return;

    // Ensure backend engines (camera/voice) are running before connecting WS
    try {
      const statusRes = await fetch(`${API}/api/system-status`);
      const status = await statusRes.json();
      if (status.engine === 'Standby') {
        const consent = window.confirm("DEXTRA needs your permission to activate the Camera and Microphone hardware for the gesture trainer. Allow access?");
        if (!consent) return;
        
        await fetch(`${API}/api/engines/start`, { method: 'POST' });
        // Give it a brief moment to spin up the camera thread
        await new Promise(r => setTimeout(r, 800));
      }
    } catch (e) {
      console.warn("Failed to check or start engines:", e);
    }

    let ws;
    try {
      ws = new WebSocket(WS_URL);
    } catch {
      showToast('⚠️ WebSocket error — is the backend running?', 'error');
      const triggerAlert = showBackendAlert || window.showBackendAlert;
      if (triggerAlert) {
        triggerAlert('Connect Camera Stream failed: Backend WebSocket server is offline or inactive.');
      }
      return;
    }
    ws.binaryType = 'blob';
    wsRef.current = ws;

    ws.onopen = () => {
      setStreaming(true);
      showToast('📡 Trainer stream connected', 'info');
    };

    ws.onmessage = (event) => {
      // Expect either JSON metadata or JPEG blob
      if (typeof event.data === 'string') {
        try {
          const meta = JSON.parse(event.data);
          if (meta.finger_states) setFingerStates(meta.finger_states);
        } catch { /* ignore */ }
        return;
      }

      const url = URL.createObjectURL(event.data);
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        URL.revokeObjectURL(url);

        // FPS counter
        const now = performance.now();
        fpsCounterRef.current.frames += 1;
        const elapsed = now - fpsCounterRef.current.lastTs;
        if (elapsed >= 500) {
          setFps(Math.round((fpsCounterRef.current.frames / elapsed) * 1000));
          fpsCounterRef.current = { frames: 0, lastTs: now };
        }
      };
      img.src = url;
    };

    ws.onerror = () => {
      showToast('⚠️ WebSocket error — is the backend running?', 'error');
      const triggerAlert = showBackendAlert || window.showBackendAlert;
      if (triggerAlert) {
        triggerAlert('Connect Camera Stream failed: Backend WebSocket server is offline or inactive.');
      }
    };

    ws.onclose = () => {
      setStreaming(false);
      wsRef.current = null;
    };
  }, [showToast, showBackendAlert]);

  const stopStream = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    imgRef.current = null;
    setStreaming(false);
    setFps(0);
  }, []);

  // Render loop for canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      if (imgRef.current && streaming) {
        ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
      }
      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [streaming]);

  // Cleanup websocket on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  /* ── Record gesture ── */
  const handleRecord = async () => {
    if (!gestureName.trim()) {
      showToast('✏️ Please enter a gesture name first', 'error');
      return;
    }

    setRecording(true);
    // 3-second countdown
    for (let i = 3; i >= 1; i--) {
      setCountdown(i);
      await new Promise(r => setTimeout(r, 1000));
    }
    setCountdown('GO!');
    await new Promise(r => setTimeout(r, 500));
    setCountdown(null);

    // Capture current finger states and send to backend
    const payload = {
      name: gestureName.trim(),
      action: mappedAction,
      finger_states: fingerStates,
      timestamp: new Date().toISOString(),
    };

    try {
      const res = await fetch(`${API}/gestures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        showToast(`✅ Gesture "${payload.name}" saved!`, 'success');
        setGestureName('');
        loadGestures();
      } else {
        showToast('⚠️ Backend rejected gesture — check payload.', 'error');
      }
    } catch {
      // Store locally as fallback
      setCustomGestures(prev => [...prev.filter(g => g.name !== payload.name), payload]);
      showToast('💾 Saved locally (backend offline)', 'info');
      const triggerAlert = showBackendAlert || window.showBackendAlert;
      if (triggerAlert) {
        triggerAlert('Save Custom Gesture failed: Backend server is offline or inactive. Saved to temporary session only.');
      }
    }

    setRecording(false);
  };

  /* ── Delete gesture ── */
  const handleDelete = async (name) => {
    try {
      await fetch(`${API}/gestures/${encodeURIComponent(name)}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(3000),
      });
    } catch {
      const triggerAlert = showBackendAlert || window.showBackendAlert;
      if (triggerAlert) {
        triggerAlert('Delete Gesture backend request failed: Backend server is offline or inactive.');
      }
    }
    setCustomGestures(prev => prev.filter(g => g.name !== name));
    showToast(`🗑️ Gesture "${name}" removed`, 'info');
  };

  return (
    <main className="trainer-page">
      <div className="section-header" style={{ marginBottom: '28px' }}>
        <div className="section-icon" aria-hidden="true">🎯</div>
        <div>
          <h1>Gesture Trainer</h1>
          <p style={{ margin: 0 }}>Record custom gestures from the live camera feed and map them to system actions.</p>
        </div>
      </div>

      <div className="trainer-layout">
        {/* ── Left: Camera Feed ── */}
        <div className="glass-card camera-panel">
          <div className={`camera-feed-wrapper${streaming ? ' active' : ''}`}>
            <canvas
              ref={canvasRef}
              className="camera-canvas"
              width={640}
              height={480}
              aria-label="Live camera feed with hand tracking overlay"
            />

            {/* Overlay when not streaming */}
            {!streaming && (
              <div className="camera-overlay">
                <div className="camera-overlay-icon">📷</div>
                <div className="camera-overlay-title">Camera Feed Inactive</div>
                <div className="camera-overlay-sub">
                  Start the stream to see your hand tracking feed. Requires backend server on port 8000.
                </div>
              </div>
            )}

            {/* Countdown overlay */}
            {countdown !== null && (
              <div className="camera-overlay" style={{ background: 'rgba(26,46,66,0.70)' }}>
                <div style={{ fontSize: '5rem', fontWeight: 800, color: '#8CC0EB' }}>{countdown}</div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem' }}>
                  Hold your gesture pose…
                </div>
              </div>
            )}

            {streaming && <div className="fps-badge" aria-live="polite">{fps} FPS</div>}
          </div>

          {/* Finger state display */}
          <div>
            <div className="form-label" style={{ marginBottom: '8px' }}>Detected Finger States</div>
            <div className="finger-state-grid">
              {FINGER_NAMES.map((name, i) => (
                <div key={name} className={`finger-card${fingerStates[i] ? ' extended' : ' curled'}`}>
                  <span className="finger-icon" aria-hidden="true">{FINGER_ICONS[i]}</span>
                  <span className="finger-name">{name}</span>
                  <span className="finger-state">{fingerStates[i] ? 'UP' : 'DOWN'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Landmark pills */}
          <div className="landmark-bar">
            {Array.from({ length: 21 }, (_, i) => (
              <span
                key={i}
                className={`landmark-pill${streaming ? ' detected' : ' undetected'}`}
              >
                L{i}
              </span>
            ))}
          </div>

          {/* Camera controls */}
          <div className="camera-controls" style={{ marginTop: '16px' }}>
            {!streaming ? (
              <button id="trainer-start-btn" className="btn btn-primary" onClick={startStream}>
                ▶ Start Stream
              </button>
            ) : (
              <button id="trainer-stop-btn" className="btn btn-danger" onClick={stopStream}>
                ■ Stop Stream
              </button>
            )}
            <button className="btn btn-ghost" onClick={loadGestures}>
              🔄 Refresh Gestures
            </button>
          </div>
        </div>

        {/* ── Right: Recording Panel ── */}
        <div className="trainer-panel">

          {/* Record Form */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div className="section-header">
              <div className="section-icon" aria-hidden="true">📝</div>
              <div>
                <div className="section-title">Record New Gesture</div>
                <div className="section-subtitle">Hold your pose, then hit Record</div>
              </div>
            </div>

            <div className="record-form">
              <div className="form-group">
                <label htmlFor="gesture-name-input" className="form-label">Gesture Name</label>
                <input
                  id="gesture-name-input"
                  type="text"
                  className="form-input"
                  value={gestureName}
                  onChange={e => setGestureName(e.target.value)}
                  placeholder="e.g. Three Fingers Up"
                  maxLength={40}
                  aria-required="true"
                />
              </div>

              <div className="form-group">
                <label htmlFor="gesture-action-select" className="form-label">Map to Action</label>
                <select
                  id="gesture-action-select"
                  className="action-select"
                  value={mappedAction}
                  onChange={e => setMappedAction(e.target.value)}
                >
                  {AVAILABLE_ACTIONS.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <button
                id="trainer-record-btn"
                className="btn btn-primary"
                onClick={handleRecord}
                disabled={recording || !gestureName.trim()}
                aria-busy={recording}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {recording ? (
                  <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Recording…</>
                ) : '🔴 Record Gesture (3s countdown)'}
              </button>
            </div>
          </div>

          {/* Saved Gestures */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div className="section-header">
              <div className="section-icon" aria-hidden="true">🗃️</div>
              <div>
                <div className="section-title">Saved Gestures</div>
                <div className="section-subtitle">{customGestures.length} custom gesture{customGestures.length !== 1 ? 's' : ''}</div>
              </div>
            </div>

            {customGestures.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: '#8fa8bf' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🤚</div>
                <div style={{ fontSize: '0.85rem' }}>No custom gestures yet.<br />Record your first one above!</div>
              </div>
            ) : (
              <div className="gesture-list">
                {customGestures.map((g, i) => (
                  <div key={i} className="gesture-list-item">
                    <span style={{ fontSize: '1.1rem' }}>🤚</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="gesture-list-name">{g.name}</div>
                      <div className="gesture-list-action">→ {g.action}</div>
                    </div>
                    <button
                      className="gesture-list-del"
                      onClick={() => handleDelete(g.name)}
                      aria-label={`Delete gesture ${g.name}`}
                      title="Delete gesture"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="glass-panel" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: '0.80rem', color: '#546e8a', lineHeight: 1.7 }}>
              <strong style={{ color: '#2c3e50', display: 'block', marginBottom: '6px' }}>💡 Trainer Tips</strong>
              <ul style={{ paddingLeft: '16px', margin: 0 }}>
                <li>Start the backend server with <code>python main.py</code> first</li>
                <li>Good lighting improves MediaPipe detection accuracy</li>
                <li>Hold your gesture still for the 3-second countdown</li>
                <li>Custom gestures override built-in ones in the recognition pipeline</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Trainer;
