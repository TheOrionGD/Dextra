import { Link } from 'react-router-dom';
import './Dashboard.css';

/**
 * DEXTRA Dashboard — Landing overview page with hero, stats, quick actions,
 * gesture reference cheat-sheet, and live system status summary.
 */

const GESTURES = [
  { emoji: '☝️', name: 'Index Finger Up', action: 'Move Cursor' },
  { emoji: '🤏', name: 'Quick Pinch', action: 'Left Click' },
  { emoji: '🤏🤏', name: 'Double Pinch', action: 'Double Click' },
  { emoji: '✊', name: 'Hold Pinch + Move', action: 'Drag & Drop' },
  { emoji: '🖕', name: 'Middle + Thumb', action: 'Right Click' },
  { emoji: '🤌', name: 'Ring + Thumb', action: 'Middle Click' },
  { emoji: '👌', name: 'OK Sign', action: 'Confirm / Enter' },
  { emoji: '✌️', name: 'Two Fingers + Move', action: 'Vertical Scroll' },
  { emoji: '✌️↔', name: 'Two Fingers Lateral', action: 'Horizontal Scroll' },
  { emoji: '👋', name: 'Wrist Flick Left', action: 'Navigate Back' },
  { emoji: '👋', name: 'Wrist Flick Right', action: 'Navigate Forward' },
  { emoji: '🤏➡', name: 'Pinch Expand', action: 'Zoom In (Ctrl +)' },
  { emoji: '🤏⬅', name: 'Pinch Contract', action: 'Zoom Out (Ctrl −)' },
  { emoji: '🖖', name: 'V-Spread', action: 'Switch Window (Alt+Tab)' },
  { emoji: '✊', name: 'Closed Fist (still)', action: 'Minimize Window' },
  { emoji: '🖐', name: 'Four Fingers Up', action: 'Close Window (Alt+F4)' },
  { emoji: '🤟', name: 'Spider-Man Pose', action: 'Open Start Menu' },
  { emoji: '✋', name: 'Open Palm', action: 'Freeze / Rest Mode' },
  { emoji: '🤙', name: 'Shaka Sign', action: 'Toggle Voice Mode' },
  { emoji: '🤞', name: 'Crossed Fingers', action: 'Lock Screen' },
];

const STATS = [
  { icon: '🤚', value: '22', label: 'Gestures' },
  { icon: '🎙️', value: '40+', label: 'Voice Commands' },
  { icon: '⚡', value: '30+', label: 'FPS Tracking' },
  { icon: '🧠', value: '21', label: 'Hand Landmarks' },
];

const QUICK_ACTIONS = [
  {
    to: '/app/settings',
    icon: '⚙️',
    iconClass: 'icon-blue',
    title: 'System Settings',
    desc: 'Tune camera, smoothing, click thresholds, and feature toggles.',
  },
  {
    to: '/app/trainer',
    icon: '🎯',
    iconClass: 'icon-peach',
    title: 'Gesture Trainer',
    desc: 'Record custom gestures via live camera and map them to shortcuts.',
  },
  {
    to: '/app/voice',
    icon: '🎙️',
    iconClass: 'icon-cream',
    title: 'Voice Engine',
    desc: 'Configure wakeword, monitor mic status and command history.',
  },
  {
    to: '/app/gestures',
    icon: '🤚',
    iconClass: 'icon-sea',
    title: 'Custom Gestures',
    desc: 'Manage your saved custom gesture library and action mappings.',
  },
];

const SYS_STATUS = [
  { label: 'Engine', value: '🟡 Standby', note: 'Run python main.py' },
  { label: 'Camera', value: '🔵 Index 0', note: 'Built-in webcam' },
  { label: 'Voice Module', value: '🟢 Ready', note: 'Whisper tiny loaded' },
  { label: 'Smoothing', value: '5 frames', note: 'Moving average buffer' },
  { label: 'Click Threshold', value: '30 px', note: 'Pinch detection zone' },
  { label: 'Cooldown', value: '0.3 s', note: 'Action debounce period' },
];

const Dashboard = () => {
  return (
    <main className="dashboard">
      {/* ── Hero ── */}
      <section className="dash-hero animate-fade-up">
        <div className="hero-badge">
          <span className="hero-badge-dot" aria-hidden="true" />
          v1.0 — Powered by MediaPipe · React · FastAPI
        </div>

        <div className="hero-orb" role="img" aria-label="DEXTRA logo">
          <img src="/dextra-icon.png" alt="DEXTRA" style={{ width: '100px', height: '100px', objectFit: 'contain', filter: 'drop-shadow(0 6px 20px rgba(140,192,235,0.70))' }} />
        </div>

        <h1>DEXTRA</h1>
        <p className="dash-hero-sub">
          Gesture-driven computing reimagined. Control every mouse action, window, and system
          shortcut using only your hand and voice — no extra hardware required.
        </p>

        <div className="hero-cta-group">
          <Link to="/app/settings" className="btn btn-primary">⚙️ Open Settings</Link>
          <Link to="/app/trainer" className="btn btn-secondary">🎯 Launch Trainer</Link>
        </div>
      </section>

      {/* ── Stats ── */}
      <section aria-label="System statistics" style={{ marginBottom: '40px' }}>
        <div className="stats-grid">
          {STATS.map(s => (
            <div key={s.label} className="glass-card stat-card">
              <span className="stat-icon" aria-hidden="true">{s.icon}</span>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quick Actions ── */}
      <section aria-label="Quick actions" style={{ marginBottom: '40px' }}>
        <div className="section-title-row">
          <h2>Quick Navigation</h2>
        </div>
        <div className="quick-grid">
          {QUICK_ACTIONS.map(card => (
            <Link key={card.to} to={card.to} className="glass-card quick-card">
              <div className="quick-card-top">
                <div className={`quick-card-icon ${card.iconClass}`}>{card.icon}</div>
                <span className="quick-card-arrow">↗</span>
              </div>
              <div>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── System Status ── */}
      <section aria-label="System status" style={{ marginBottom: '40px' }}>
        <div className="glass-card system-panel">
          <div className="section-header">
            <div className="section-icon" aria-hidden="true">🔬</div>
            <div>
              <div className="section-title">Live System Overview</div>
              <div className="section-subtitle">Current configuration snapshot — edit in Settings</div>
            </div>
          </div>
          <div className="system-status-grid">
            {SYS_STATUS.map(item => (
              <div key={item.label} className="sys-item">
                <span className="sys-item-label">{item.label}</span>
                <span className="sys-item-value">{item.value}</span>
                <span style={{ fontSize: '0.73rem', color: '#8fa8bf' }}>{item.note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gesture Cheat Sheet ── */}
      <section aria-label="Gesture reference">
        <div className="section-title-row">
          <h2>🤚 Gesture Reference</h2>
          <Link to="/gestures" className="btn btn-ghost" style={{ fontSize: '0.82rem' }}>
            View All →
          </Link>
        </div>
        <div className="gesture-ref-grid">
          {GESTURES.map((g, i) => (
            <div key={i} className="gesture-chip">
              <span className="gesture-emoji" aria-hidden="true">{g.emoji}</span>
              <div className="gesture-info">
                <div className="gesture-name">{g.name}</div>
                <div className="gesture-action">{g.action}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
