import { useState } from 'react';
import './BackendOfflineModal.css';

/**
 * DEXTRA BackendOfflineModal
 * 
 * Displayed whenever a user performs an action, clicks a button, or triggers a process
 * that requests backend endpoints (e.g., Save Settings, Connect Camera, Start Voice Engine)
 * when the Python server is offline, inactive, or the backend process has not yet been created.
 */
const BackendOfflineModal = ({ isOpen, onClose, actionMessage }) => {
  const [checking, setChecking] = useState(false);
  const [retryResult, setRetryResult] = useState(null);

  if (!isOpen) return null;

  const handleRetry = async () => {
    setChecking(true);
    setRetryResult(null);
    try {
      const res = await fetch('http://localhost:8000/health', { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        setRetryResult({ success: true, text: '✅ Backend connected successfully!' });
        setTimeout(() => {
          setChecking(false);
          onClose();
        }, 1200);
        return;
      }
    } catch {
      // Backend still offline
    }
    setRetryResult({ success: false, text: '🔴 Still unreachable. Is python main.py running?' });
    setChecking(false);
  };

  return (
    <div className="backend-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="backend-modal-card animate-scale-up">
        <div className="backend-modal-glow" />

        <div className="backend-modal-header">
          <div className="backend-modal-icon-box" aria-hidden="true">
            🔌
          </div>
          <div>
            <h2 id="modal-title" className="backend-modal-title">
              Backend Offline or Inactive
            </h2>
            <p className="backend-modal-subtitle">
              Backend process not yet created / Server unreachable
            </p>
          </div>
        </div>

        <div className="backend-modal-status-badge">
          <span className="backend-modal-status-dot" />
          <span>Endpoint: http://localhost:8000 (Disconnected)</span>
        </div>

        <div className="backend-modal-body">
          {actionMessage ? (
            <p style={{ fontWeight: 600, color: '#ff8b8b', marginBottom: '10px' }}>
              ⚠️ Action Failed: {actionMessage}
            </p>
          ) : null}
          <p style={{ margin: '0 0 10px 0' }}>
            The requested action relies on the DEXTRA Python backend server, which is currently inactive or has not been started yet.
          </p>
          <p style={{ margin: 0, color: '#a3c1dd', fontSize: '0.88rem' }}>
            To enable real-time MediaPipe AI tracking, WebSocket camera streams, Whisper voice commands, and settings persistence, start the backend engine:
          </p>

          <div className="backend-modal-code-box">
            <code>python main.py</code>
            <span style={{ fontSize: '0.75rem', color: '#546e8a' }}>Terminal</span>
          </div>
        </div>

        {retryResult && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.86rem',
              fontWeight: 600,
              background: retryResult.success ? 'rgba(76, 217, 100, 0.15)' : 'rgba(255, 107, 107, 0.15)',
              color: retryResult.success ? '#4cd964' : '#ff8b8b',
              border: `1px solid ${retryResult.success ? 'rgba(76, 217, 100, 0.3)' : 'rgba(255, 107, 107, 0.3)'}`,
            }}
          >
            {retryResult.text}
          </div>
        )}

        <div className="backend-modal-footer">
          <button
            type="button"
            className="btn-modal-dismiss"
            onClick={onClose}
          >
            Dismiss / Continue Offline
          </button>
          <button
            type="button"
            className="btn-modal-retry"
            onClick={handleRetry}
            disabled={checking}
          >
            {checking ? '🔄 Checking...' : '🔄 Check Connection'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackendOfflineModal;
