import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CommandPalette from './components/CommandPalette';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Trainer from './components/Trainer';
import VoiceController from './components/VoiceController';
import GesturesPage from './components/GesturesPage';
import MouseTailHUD from './components/MouseTailHUD';
import SectionParticles from './components/SectionParticles';
import BackendOfflineModal from './components/BackendOfflineModal';
import './App.css';


/**
 * DEXTRA — Root Application
 *
 * Route map:
 *   /          → Landing page (public marketing page)
 *   /app       → Dashboard
 *   /app/settings → Settings
 *   /app/trainer  → Gesture Trainer
 *   /app/voice    → Voice Engine
 *   /app/gestures → Gesture Library
 */

/* Global toast component */
const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div
      key={toast.id}
      className={`toast toast-${toast.type}`}
      role="status"
      aria-live="polite"
    >
      <span>{toast.message}</span>
    </div>
  );
};

/* 404 Page */
const NotFound = () => (
  <main style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', flex: 1, padding: '80px 20px', textAlign: 'center',
  }}>
    <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🤚</div>
    <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>404 — Page Not Found</h1>
    <p style={{ color: '#8fa8bf', marginBottom: '28px' }}>
      The page you're looking for doesn't exist.
    </p>
    <a href="/" className="btn btn-primary">← Back to DEXTRA</a>
  </main>
);

/* App shell — content (used for /app/* routes) */
const AppShell = ({ showToast, children }) => (
  <>
    {children}
  </>
);


/* Floating hotkey indicator badge */
const HotkeyBadge = () => {
  const [hasUsed, setHasUsed] = useState(() => {
    return localStorage.getItem('dextra_has_used_palette') === 'true';
  });

  useEffect(() => {
    if (hasUsed) return;

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        setHasUsed(true);
        localStorage.setItem('dextra_has_used_palette', 'true');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUsed]);

  if (hasUsed) return null;

  return (
    <div className="global-hotkey-badge" aria-hidden="true" title="Press Ctrl+K for commands">
      <span className="hotkey-keys"><kbd>Ctrl</kbd>+<kbd>K</kbd></span>
      <span className="hotkey-text">Command Menu</span>
    </div>
  );
};

const App = () => {
  const [toast, setToast] = useState(null);
  const [backendAlert, setBackendAlert] = useState({ isOpen: false, message: '' });

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const showBackendAlert = useCallback((message = '') => {
    setBackendAlert({ isOpen: true, message });
  }, []);

  const closeBackendAlert = useCallback(() => {
    setBackendAlert({ isOpen: false, message: '' });
  }, []);

  useEffect(() => {
    window.showBackendAlert = showBackendAlert;
    return () => {
      delete window.showBackendAlert;
    };
  }, [showBackendAlert]);

  return (
    <BrowserRouter>
      <CommandPalette showToast={showToast} showBackendAlert={showBackendAlert} />
      
      {/* Global Background Ambient Particles */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <SectionParticles particleCount={35} />
      </div>

      {/* Global Mouse Follow Tail HUD (Desktop only) */}
      <MouseTailHUD />

      <Routes>
        {/* ── Landing page (no navbar) ── */}
        <Route path="/" element={<Landing />} />

        {/* ── App routes (with navbar) ── */}
        <Route path="/app" element={
          <AppShell showToast={showToast}>
            <Dashboard showToast={showToast} showBackendAlert={showBackendAlert} />
          </AppShell>
        } />
        <Route path="/app/settings" element={
          <AppShell showToast={showToast}>
            <Settings showToast={showToast} showBackendAlert={showBackendAlert} />
          </AppShell>
        } />
        <Route path="/app/trainer" element={
          <AppShell showToast={showToast}>
            <Trainer showToast={showToast} showBackendAlert={showBackendAlert} />
          </AppShell>
        } />
        <Route path="/app/voice" element={
          <AppShell showToast={showToast}>
            <VoiceController showToast={showToast} showBackendAlert={showBackendAlert} />
          </AppShell>
        } />
        <Route path="/app/gestures" element={
          <AppShell showToast={showToast}>
            <GesturesPage />
          </AppShell>
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>

      <Toast toast={toast} />
      <HotkeyBadge />
      <BackendOfflineModal
        isOpen={backendAlert.isOpen}
        onClose={closeBackendAlert}
        actionMessage={backendAlert.message}
      />
    </BrowserRouter>
  );
};

export default App;
