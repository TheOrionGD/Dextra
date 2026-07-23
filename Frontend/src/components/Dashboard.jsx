import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

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

const API = 'http://localhost:8000';

const Dashboard = () => {
  const [gestures, setGestures] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/all-gestures`)
      .then(r => r.json())
      .then(data => setGestures(data))
      .catch(e => console.error("Error fetching gestures", e));
      
    fetch(`${API}/api/system-status`)
      .then(r => r.json())
      .then(data => {
        setSystemStatus(data);
        if (data.engine === 'Standby' && !permissionDenied) {
          setShowPermissionModal(true);
        }
      })
      .catch(e => console.error("Error fetching system status", e));
  }, []);

  const startEngines = () => {
    setIsStarting(true);
    fetch(`${API}/api/engines/start`, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        setIsStarting(false);
        if (data.status === 'success') {
          setShowPermissionModal(false);
          // Refetch system status
          fetch(`${API}/api/system-status`)
            .then(r => r.json())
            .then(data => setSystemStatus(data));
        } else {
          console.error("Failed to start engines:", data.message);
        }
      })
      .catch(e => {
        setIsStarting(false);
        console.error("Error starting engines", e);
      });
  };

  const stats = systemStatus ? [
    { icon: '🤚', value: systemStatus.total_gestures.toString(), label: 'Gestures' },
    { icon: '🎙️', value: systemStatus.total_voice_commands.toString(), label: 'Voice Commands' },
    { icon: '⚡', value: '30+', label: 'FPS Tracking' },
    { icon: '🧠', value: '21', label: 'Hand Landmarks' },
  ] : [
    { icon: '🤚', value: '-', label: 'Gestures' },
    { icon: '🎙️', value: '-', label: 'Voice Commands' },
    { icon: '⚡', value: '-', label: 'FPS Tracking' },
    { icon: '🧠', value: '-', label: 'Hand Landmarks' },
  ];

  const sysStatusArray = systemStatus ? [
    { label: 'Engine', value: systemStatus.engine === 'Ready' ? '🟢 Ready' : '🟡 Standby', note: 'Run python main.py' },
    { label: 'Camera', value: `🔵 ${systemStatus.camera}`, note: 'Current capture device' },
    { label: 'Voice Module', value: systemStatus.voice_module === 'Ready' ? '🟢 Ready' : '🟡 Standby', note: 'Whisper pipeline' },
    { label: 'Smoothing', value: systemStatus.smoothing, note: 'Moving average buffer' },
    { label: 'Click Threshold', value: systemStatus.click_threshold, note: 'Pinch detection zone' },
    { label: 'Cooldown', value: systemStatus.cooldown, note: 'Action debounce period' },
  ] : [];

  return (
    <>
      {showPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 m-4">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-[#BFDDF0]/40 rounded-full flex items-center justify-center">
                <span className="text-3xl">🛡️</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-3" style={{ margin: '0 0 12px 0' }}>Hardware Access Required</h2>
            <p className="text-center text-slate-600 mb-8 leading-relaxed" style={{ marginBottom: '32px' }}>
              DEXTRA needs to access your Camera and Microphone to track hand gestures and listen for voice commands. Everything is processed locally and securely.
            </p>
            <div className="flex gap-4" style={{ display: 'flex', gap: '16px' }}>
              <button 
                onClick={() => {
                  setShowPermissionModal(false);
                  setPermissionDenied(true);
                }}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                disabled={isStarting}
              >
                Deny
              </button>
              <button 
                onClick={startEngines}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-700 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', backgroundColor: '#1e293b', color: 'white', cursor: 'pointer', border: 'none' }}
                disabled={isStarting}
              >
                {isStarting ? 'Starting...' : 'Allow Access'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {permissionDenied && systemStatus?.engine === 'Standby' && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex justify-between items-center text-amber-800 text-sm font-medium z-40 relative" style={{ backgroundColor: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#92400e', fontSize: '14px', fontWeight: 500 }}>
          <span>⚠️ Hardware access denied. Gestures and voice commands will not work.</span>
          <button 
            onClick={() => setShowPermissionModal(true)}
            className="px-4 py-1.5 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors"
            style={{ padding: '6px 16px', backgroundColor: '#fef3c7', borderRadius: '6px', border: 'none', cursor: 'pointer', color: '#92400e', fontWeight: 600 }}
          >
            Enable Access
          </button>
        </div>
      )}

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
          {stats.map(s => (
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
            {sysStatusArray.length === 0 ? (
              <div style={{ padding: '20px', color: '#8fa8bf', fontStyle: 'italic' }}>Loading system status from backend...</div>
            ) : sysStatusArray.map(item => (
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
          {gestures.length === 0 ? (
            <div style={{ padding: '20px', color: '#8fa8bf', fontStyle: 'italic' }}>Loading gesture dictionary from backend...</div>
          ) : gestures.slice(0, 20).map((g, i) => (
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
    </>
  );
};

export default Dashboard;
