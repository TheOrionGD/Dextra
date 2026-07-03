import { useState, useEffect, useCallback } from 'react';
import './Settings.css';

/**
 * DEXTRA Settings Page
 * 
 * Reads from GET /settings and writes via POST /settings.
 * Falls back to local defaults when the backend is not reachable.
 */

const API = 'http://localhost:8000';

const DEFAULTS = {
  camera_index: 0,
  cursor_smoothing: 5,
  click_threshold_px: 30,
  drag_hold_time_sec: 0.6,
  double_click_time_sec: 0.35,
  cooldown_period_sec: 0.3,
  voice_commands_enabled: true,
  gesture_trainer_enabled: true,
};

/* ── Reusable sub-components ── */

function Toggle({ value, onChange }) {
  return (
    <div
      className={`toggle-track${value ? ' active' : ''}`}
      role="switch"
      aria-checked={value}
      tabIndex={0}
      onClick={() => onChange(!value)}
      onKeyDown={e => e.key === ' ' && onChange(!value)}
    >
      <div className="toggle-thumb" />
    </div>
  );
}

function Slider({ id, label, sublabel, value, min, max, step, unit, onChange }) {
  const pct = Math.round(((value - min) / (max - min)) * 100);

  return (
    <div className="slider-container form-group">
      <label htmlFor={id} className="form-label">{label}</label>
      {sublabel && <span style={{ fontSize: '0.76rem', color: '#8fa8bf' }}>{sublabel}</span>}
      <div className="slider-header">
        <span style={{ fontSize: '0.80rem', color: '#546e8a' }}>{min}{unit}</span>
        <span className="slider-value">{value}{unit}</span>
        <span style={{ fontSize: '0.80rem', color: '#546e8a' }}>{max}{unit}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ '--val': `${pct}%` }}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
      />
    </div>
  );
}

/* ── Main Component ── */

const Settings = ({ showToast, showBackendAlert }) => {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [isBackendOffline, setIsBackendOffline] = useState(false);

  // Load settings from backend
  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API}/settings`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...DEFAULTS, ...data });
        setIsBackendOffline(false);
      } else {
        setIsBackendOffline(true);
      }
    } catch {
      setIsBackendOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const update = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
    setDirty(true);
  };

  // Save to backend
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        showToast('✅ Settings saved successfully!', 'success');
        setDirty(false);
        setIsBackendOffline(false);
      } else {
        showToast('⚠️ Server error — settings not saved.', 'error');
      }
    } catch {
      setIsBackendOffline(true);
      showToast('🔌 Backend offline — settings not persisted.', 'error');
      const triggerAlert = showBackendAlert || window.showBackendAlert;
      if (triggerAlert) {
        triggerAlert('Save Settings request failed: Backend server is offline or inactive. Backend process not yet created.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULTS);
    setDirty(true);
    showToast('🔄 Reset to defaults (unsaved)', 'info');
  };

  if (loading) {
    return (
      <main className="settings-page">
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#8fa8bf' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          Loading settings…
        </div>
      </main>
    );
  }

  return (
    <main className="settings-page">
      {isBackendOffline && (
        <div
          style={{
            background: 'rgba(255, 107, 107, 0.12)',
            border: '1px solid rgba(255, 107, 107, 0.4)',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, color: '#ff8b8b', fontSize: '0.92rem' }}>
                Backend Server Offline or Inactive
              </div>
              <div style={{ fontSize: '0.82rem', color: '#e2f1ff' }}>
                Backend process not yet created. Run <code>python main.py</code> to sync changes.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '6px 14px', borderColor: 'rgba(255,107,107,0.4)', color: '#ff8b8b' }}
            onClick={() => {
              const triggerAlert = showBackendAlert || window.showBackendAlert;
              if (triggerAlert) triggerAlert('Backend status verification requested.');
            }}
          >
            View Diagnostics
          </button>
        </div>
      )}

      <div className="section-header" style={{ marginBottom: '8px' }}>
        <div className="section-icon" aria-hidden="true">⚙️</div>
        <div>
          <h1>System Settings</h1>
        </div>
      </div>
      <p className="settings-intro">
        Tune every parameter of the DEXTRA gesture engine. Changes are sent to{' '}
        <code>POST /settings</code> and persisted in <code>dextra_settings.json</code>.
      </p>

      {/* ── Camera ── */}
      <div className="glass-card settings-card">
        <div className="section-header">
          <div className="section-icon" aria-hidden="true">📷</div>
          <div>
            <div className="section-title">Camera Input</div>
            <div className="section-subtitle">Select the webcam device index used for hand tracking</div>
          </div>
        </div>

        <div className="camera-grid" role="radiogroup" aria-label="Camera selection">
          {[
            { idx: 0, name: 'Camera 0', sub: 'Built-in / Default', icon: '💻' },
            { idx: 1, name: 'Camera 1', sub: 'External USB', icon: '📷' },
            { idx: 2, name: 'Camera 2', sub: 'Secondary USB', icon: '🎥' },
            { idx: 3, name: 'Camera 3', sub: 'Virtual / OBS', icon: '🎬' },
          ].map(cam => (
            <div
              key={cam.idx}
              className={`camera-option${settings.camera_index === cam.idx ? ' selected' : ''}`}
              onClick={() => update('camera_index', cam.idx)}
              role="radio"
              aria-checked={settings.camera_index === cam.idx}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && update('camera_index', cam.idx)}
              id={`camera-option-${cam.idx}`}
            >
              <span className="camera-option-icon" aria-hidden="true">{cam.icon}</span>
              <span className="camera-option-name">{cam.name}</span>
              <span className="camera-option-sub">{cam.sub}</span>
              {settings.camera_index === cam.idx && (
                <span style={{ fontSize: '0.70rem', color: '#27ae60', fontWeight: 700 }}>✓ Active</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Cursor & Smoothing ── */}
      <div className="glass-card settings-card">
        <div className="section-header">
          <div className="section-icon" aria-hidden="true">🖱️</div>
          <div>
            <div className="section-title">Cursor & Interaction</div>
            <div className="section-subtitle">Control cursor smoothness and gesture sensitivity thresholds</div>
          </div>
        </div>

        <div className="sliders-grid">
          <Slider
            id="cursor-smoothing"
            label="Cursor Smoothing"
            sublabel="Moving average frame buffer — higher = smoother but laggier"
            value={settings.cursor_smoothing}
            min={1} max={15} step={1} unit=" frames"
            onChange={v => update('cursor_smoothing', v)}
          />
          <Slider
            id="click-threshold"
            label="Click Threshold"
            sublabel="Max pixel distance for a pinch to register as a click"
            value={settings.click_threshold_px}
            min={10} max={80} step={5} unit=" px"
            onChange={v => update('click_threshold_px', v)}
          />
          <Slider
            id="cooldown-period"
            label="Action Cooldown"
            sublabel="Minimum time between consecutive gesture actions"
            value={settings.cooldown_period_sec}
            min={0.1} max={1.5} step={0.05} unit=" s"
            onChange={v => update('cooldown_period_sec', v)}
          />
        </div>
      </div>

      {/* ── Click & Timing ── */}
      <div className="glass-card settings-card">
        <div className="section-header">
          <div className="section-icon" aria-hidden="true">⏱️</div>
          <div>
            <div className="section-title">Click Timing</div>
            <div className="section-subtitle">Fine-tune drag and double-click detection windows</div>
          </div>
        </div>

        <div className="sliders-grid">
          <Slider
            id="drag-hold"
            label="Drag Hold Time"
            sublabel="Seconds a pinch must be held before drag-and-drop activates"
            value={settings.drag_hold_time_sec}
            min={0.2} max={2.0} step={0.05} unit=" s"
            onChange={v => update('drag_hold_time_sec', v)}
          />
          <Slider
            id="double-click"
            label="Double-Click Window"
            sublabel="Max interval between two pinches to register a double-click"
            value={settings.double_click_time_sec}
            min={0.1} max={0.8} step={0.05} unit=" s"
            onChange={v => update('double_click_time_sec', v)}
          />
        </div>
      </div>

      {/* ── Feature Toggles ── */}
      <div className="glass-card settings-card">
        <div className="section-header">
          <div className="section-icon" aria-hidden="true">🔧</div>
          <div>
            <div className="section-title">Feature Toggles</div>
            <div className="section-subtitle">Enable or disable DEXTRA modules</div>
          </div>
        </div>

        <div className="toggles-grid">
          {[
            {
              key: 'voice_commands_enabled',
              title: '🎙️ Voice Commands',
              desc: 'Background Whisper STT engine — listens for "DEXTRA" wakeword',
            },
            {
              key: 'gesture_trainer_enabled',
              title: '🎯 Gesture Trainer',
              desc: 'Enable live camera trainer and custom gesture recording',
            },
          ].map(toggle => (
            <div key={toggle.key} className="toggle-row">
              <div className="toggle-row-info">
                <div className="toggle-row-title">{toggle.title}</div>
                <div className="toggle-row-desc">{toggle.desc}</div>
              </div>
              <Toggle
                value={settings[toggle.key]}
                onChange={v => update(toggle.key, v)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="settings-actions">
        <button
          id="settings-save-btn"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving || !dirty}
          aria-busy={saving}
        >
          {saving ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving…</> : '💾 Save Settings'}
        </button>
        <button
          id="settings-reset-btn"
          className="btn btn-ghost"
          onClick={handleReset}
        >
          🔄 Reset Defaults
        </button>
        {dirty && (
          <span className="save-note">● Unsaved changes</span>
        )}
      </div>
    </main>
  );
};

export default Settings;
