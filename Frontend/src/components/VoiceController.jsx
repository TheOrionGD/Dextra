import { useState, useEffect, useRef, useCallback } from 'react';
import './VoiceController.css';

/**
 * DEXTRA PROJECT FILE: gui/src/components/VoiceController.jsx
 *
 * Voice Command Engine Interface
 * ─────────────────────────────
 * Full implementation of:
 *  1. Animated mic orb (standby / listening / wakeword-detected states)
 *  2. Soundwave pulse visualizer during listening
 *  3. Real-time transcription text via WebSocket /voice/stream
 *  4. Configurable wakeword saved via POST /settings
 *  5. Scrolling command history log with timestamps
 *  6. Full voice command reference (40+ commands across 6 categories)
 */

const API    = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000/voice/stream';



// Format time as HH:MM:SS
const fmt = () => new Date().toLocaleTimeString('en-GB');

const VoiceController = ({ showToast, showBackendAlert }) => {
  const [wakeword, setWakeword]         = useState('DEXTRA');
  const [editingWw, setEditingWw]       = useState(false);
  const [draftWw, setDraftWw]           = useState('DEXTRA');
  const [micState, setMicState]         = useState('standby'); // 'standby' | 'listening' | 'wakeword'
  const [transcript, setTranscript]     = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [activeCategory, setActiveCategory] = useState(0);
  const [cmdCategories, setCmdCategories] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/voice-commands`)
      .then(r => r.json())
      .then(data => setCmdCategories(data))
      .catch(e => console.error("Error fetching voice commands", e));
  }, []);

  const wsRef   = useRef(null);
  const logRef  = useRef(null);

  // Auto-scroll command log
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [commandHistory]);

  /* ── WebSocket voice stream ── */
  const connectWs = useCallback(() => {
    if (wsRef.current) return;
    let ws;
    try {
      ws = new WebSocket(WS_URL);
    } catch {
      setMicState('standby');
      showToast('⚠️ Voice engine error — is the backend running?', 'error');
      const triggerAlert = showBackendAlert || window.showBackendAlert;
      if (triggerAlert) {
        triggerAlert('Activate Voice Engine failed: Backend WebSocket server is offline or inactive.');
      }
      return;
    }
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);

        if (msg.type === 'status') {
          setMicState(msg.state); // 'standby' | 'listening' | 'wakeword'
        }

        if (msg.type === 'transcript') {
          setTranscript(msg.text);
        }

        if (msg.type === 'command') {
          setCommandHistory(prev => [
            ...prev.slice(-49), // keep last 50
            { text: msg.text, action: msg.action, time: fmt() },
          ]);
          setTranscript('');
        }
      } catch { /* ignore malformed */ }
    };

    ws.onerror = () => {
      setMicState('standby');
      showToast('⚠️ Voice engine connection error — backend offline?', 'error');
      const triggerAlert = showBackendAlert || window.showBackendAlert;
      if (triggerAlert) {
        triggerAlert('Voice Engine WebSocket error: Backend server is offline or inactive.');
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      setMicState('standby');
    };
  }, [showToast, showBackendAlert]);

  const disconnectWs = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setMicState('standby');
  }, []);

  useEffect(() => { return () => disconnectWs(); }, [disconnectWs]);

  /* ── Toggle listening ── */
  const toggleListening = () => {
    if (micState === 'standby') {
      connectWs();
      setMicState('listening');
      showToast('🎙️ Voice engine activated — say "' + wakeword + '"', 'info');
    } else {
      disconnectWs();
      setMicState('standby');
      setTranscript('');
    }
  };

  /* ── Save wakeword ── */
  const saveWakeword = async () => {
    const newWw = draftWw.trim().toUpperCase();
    if (!newWw) return;
    setWakeword(newWw);
    setEditingWw(false);

    try {
      await fetch(`${API}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wakeword: newWw }),
        signal: AbortSignal.timeout(3000),
      });
      showToast(`✅ Wakeword updated to "${newWw}"`, 'success');
    } catch {
      showToast('💾 Wakeword saved locally (backend offline)', 'info');
      const triggerAlert = showBackendAlert || window.showBackendAlert;
      if (triggerAlert) {
        triggerAlert('Save Wakeword request failed: Backend server is offline or inactive.');
      }
    }
  };



  const micLabel = {
    standby:  '🎙️',
    listening: '🎤',
    wakeword: '⚡',
  }[micState];

  const stateText = {
    standby:  'Standby — Click to Activate',
    listening: `Listening… say "${wakeword}"`,
    wakeword: 'Wakeword Detected — Transcribing',
  }[micState];

  const stateSub = {
    standby:  'Voice engine is inactive',
    listening: 'Background mic active via Whisper STT',
    wakeword: 'Processing your command…',
  }[micState];

  return (
    <main className="voice-page">
      <div className="section-header" style={{ marginBottom: '28px' }}>
        <div className="section-icon" aria-hidden="true">🎙️</div>
        <div>
          <h1>Voice Command Engine</h1>
          <p style={{ margin: 0 }}>Configure the wakeword, monitor mic status, and view command history.</p>
        </div>
      </div>

      <div className="voice-layout">
        {/* ── Left Column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Mic Visualizer */}
          <div className="glass-card mic-visualizer">
            {/* Orb with ripple rings */}
            <div className="mic-orb-container" aria-live="polite" aria-label={stateText}>
              <div className={`mic-orb-ring${micState !== 'standby' ? ' pulse' : ''}`} />
              <div className={`mic-orb-ring${micState !== 'standby' ? ' pulse' : ''}`} />
              <div className={`mic-orb-ring${micState !== 'standby' ? ' pulse' : ''}`} />
              <button
                className={`mic-orb ${micState}`}
                onClick={toggleListening}
                aria-pressed={micState !== 'standby'}
                aria-label={micState === 'standby' ? 'Activate voice engine' : 'Deactivate voice engine'}
              >
                {micLabel}
              </button>
            </div>

            {/* Soundwave */}
            <div className={`soundwave${micState !== 'standby' ? ' active' : ' idle'}`} aria-hidden="true">
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i} className="soundwave-bar" />
              ))}
            </div>

            {/* Status */}
            <div>
              <div className="mic-status-text">{stateText}</div>
              <div className="mic-status-sub">{stateSub}</div>
            </div>

            {/* Live transcript */}
            <div
              className={`transcript-box${transcript ? ' active' : ''}`}
              aria-live="polite"
              aria-label="Live transcription"
            >
              {transcript || (micState !== 'standby' ? '…awaiting speech…' : 'Voice engine inactive')}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button id="voice-toggle-btn" className={`btn ${micState !== 'standby' ? 'btn-danger' : 'btn-primary'}`} onClick={toggleListening}>
                {micState !== 'standby' ? '⏹ Stop Listening' : '▶ Start Listening'}
              </button>
            </div>
          </div>

          {/* Command Log */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div className="section-header">
              <div className="section-icon" aria-hidden="true">📋</div>
              <div>
                <div className="section-title">Command History</div>
                <div className="section-subtitle">{commandHistory.length} command{commandHistory.length !== 1 ? 's' : ''} executed this session</div>
              </div>
            </div>

            {commandHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 12px', color: '#8fa8bf' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎙️</div>
                <div style={{ fontSize: '0.85rem' }}>
                  No commands yet.<br />Activate the mic and say "{wakeword}" to begin.
                </div>
              </div>
            ) : (
              <div className="command-log" ref={logRef}>
                {commandHistory.map((cmd, i) => (
                  <div key={i} className="command-log-item">
                    <span className="cmd-icon" aria-hidden="true">⚡</span>
                    <span className="cmd-text">"{cmd.text}"</span>
                    <span className="cmd-action">{cmd.action}</span>
                    <span className="cmd-time">{cmd.time}</span>
                  </div>
                ))}
              </div>
            )}

            {commandHistory.length > 0 && (
              <button
                className="btn btn-ghost"
                style={{ marginTop: '12px', fontSize: '0.80rem' }}
                onClick={() => setCommandHistory([])}
              >
                🗑️ Clear History
              </button>
            )}
          </div>
        </div>

        {/* ── Right Column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Wakeword Config */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div className="section-header">
              <div className="section-icon" aria-hidden="true">🔑</div>
              <div>
                <div className="section-title">Activation Wakeword</div>
                <div className="section-subtitle">Keyword that triggers transcription</div>
              </div>
            </div>

            {!editingWw ? (
              <>
                <div className="wakeword-display">
                  <span style={{ fontSize: '1.3rem' }}>🔊</span>
                  <span className="wakeword-word">"{wakeword}"</span>
                  <span className={`badge ${micState !== 'standby' ? 'badge-online' : 'badge-idle'}`}>
                    <span className="badge-dot" />
                    {micState !== 'standby' ? 'Active' : 'Idle'}
                  </span>
                </div>
                <button className="btn btn-secondary" onClick={() => { setDraftWw(wakeword); setEditingWw(true); }}>
                  ✏️ Change Wakeword
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label htmlFor="wakeword-input" className="form-label">New Wakeword</label>
                  <input
                    id="wakeword-input"
                    type="text"
                    className="form-input"
                    value={draftWw}
                    onChange={e => setDraftWw(e.target.value.toUpperCase())}
                    placeholder="e.g. DEXTRA"
                    maxLength={20}
                    onKeyDown={e => e.key === 'Enter' && saveWakeword()}
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary" onClick={saveWakeword}>✅ Save</button>
                  <button className="btn btn-ghost" onClick={() => setEditingWw(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Voice Command Reference */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div className="section-header">
              <div className="section-icon" aria-hidden="true">📖</div>
              <div>
                <div className="section-title">Command Reference</div>
                <div className="section-subtitle">40+ commands across 6 categories</div>
              </div>
            </div>

            {/* Category tabs */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {cmdCategories.length === 0 ? (
                <div style={{ padding: '10px', color: '#8fa8bf', fontStyle: 'italic' }}>Loading commands...</div>
              ) : cmdCategories.map((cat, i) => (
                <button
                  key={i}
                  className={`btn ${activeCategory === i ? 'btn-secondary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.75rem', padding: '5px 11px' }}
                  onClick={() => setActiveCategory(i)}
                >
                  {cat.title.split(' ')[0]}
                </button>
              ))}
            </div>

            {cmdCategories.length > 0 && (
              <>
                <div style={{ marginBottom: '8px', fontSize: '0.80rem', fontWeight: 700, color: '#546e8a' }}>
                  {cmdCategories[activeCategory]?.title}
                </div>
                <div className="cmd-ref-grid">
                  {cmdCategories[activeCategory]?.cmds.map(cmd => (
                    <div key={cmd} className="cmd-ref-item">
                      <span style={{ color: '#8CC0EB', fontSize: '0.80rem' }}>▸</span>
                      <span>"{cmd}"</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Status info */}
          <div className="glass-panel" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: '0.80rem', color: '#546e8a', lineHeight: 1.7 }}>
              <strong style={{ color: '#2c3e50', display: 'block', marginBottom: '6px' }}>💡 Voice Setup Guide</strong>
              <ul style={{ paddingLeft: '16px', margin: 0 }}>
                <li>Backend runs <code>python/voice_wakeword.py</code> as background thread</li>
                <li>Whisper tiny model processes audio blocks in &lt;500ms</li>
                <li>Say <code>{wakeword}</code> clearly then speak your command</li>
                <li>Ambient noise calibration runs automatically on startup</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default VoiceController;
