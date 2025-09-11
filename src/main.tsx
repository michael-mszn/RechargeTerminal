import { render } from 'preact';
import { Router, Route } from 'preact-router';
import { Link } from 'preact-router';
import { useState, useEffect, useRef } from 'preact/hooks';

import Home from './pages/Home';
import Profile from './pages/Profile';
import Charging from './pages/Charging';
import Login from './pages/Login';

import './css/Navbar.css';

/* @ts-ignore */
import homeIcon from './images/home.png';
/* @ts-ignore */
import profileIcon from './images/profile.png';
/* @ts-ignore */
import micIcon from './images/mic.png';
/* @ts-ignore */
import disconnectIcon from './images/disconnect.png';

let notifyCallback: ((msg: string) => void) | null = null;

export function addNotification(msg: string) {
  if (notifyCallback) notifyCallback(msg);
}

const PositionOverlay = ({ onCleared }: { onCleared: () => void }) => {
  const [freePositions, setFreePositions] = useState<number[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    document.body.classList.add('no-scroll');
    return () => document.body.classList.remove('no-scroll');
  }, []);

  useEffect(() => {
    let mounted = true;

    fetch('/api/get-current-position.php', { credentials: 'same-origin' })
      .then(res => res.json())
      .then(data => {
        if (!mounted) return;
        if (data.position) onCleared();
        else fetchFreePositions();
      })
      .catch(() => fetchFreePositions())
      .finally(() => { if (!mounted) return; setLoading(false); });

    return () => { mounted = false; };
  }, []);

  const fetchFreePositions = () => {
    setError('');
    setLoading(true);
    fetch('/api/get-free-positions.php', { credentials: 'same-origin' })
      .then(res => res.json())
      .then(data => setFreePositions(data.free_positions || []))
      .catch(() => setError('Error loading positions.'))
      .finally(() => setLoading(false));
  };

  const submitPosition = () => {
    setError('');
    if (!selected) { setError('Please choose a valid position.'); return; }

    fetch('/api/claim-position.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position: selected }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') onCleared();
        else setError(data.message || 'Could not reserve this position.');
      })
      .catch(() => setError('Error with the request.'));
  };

  return (
    <div class="position-overlay-backdrop" role="dialog" aria-modal="true">
      <div class="position-overlay" aria-live="polite">
        <h2>Please choose your position</h2>
        {loading ? (
          <div class="position-loading">Loading positions…</div>
        ) : (
          <>
            <select value={selected} onChange={(e: any) => setSelected(e.target.value)}>
              <option disabled value="">Choose a free slot</option>
              {freePositions.map(pos => (
                <option key={pos} value={String(pos)}>Position {pos}</option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
              <button onClick={submitPosition} class="primary">Confirm</button>
              <button onClick={fetchFreePositions} class="secondary">Refresh</button>
            </div>

            {error && <div class="position-error">{error}</div>}
          </>
        )}
      </div>
    </div>
  );
};

const Notifications = () => {
  const [notifs, setNotifs] = useState<{ id: number; text: string }[]>([]);

  useEffect(() => {
    notifyCallback = (msg: string) => {
      const id = Date.now();
      setNotifs(prev => [...prev, { id, text: msg }]);
      setTimeout(() => setNotifs(prev => prev.filter(n => n.id !== id)), 5000);
    };
    return () => { notifyCallback = null; };
  }, []);

  return (
    <div class="notifications-container">
      {notifs.map(n => (
        <div key={n.id} class="notification">
          <button
            class="notif-close"
            onClick={() => setNotifs(prev => prev.filter(m => m.id !== n.id))}
          >×</button>
          <span class="notif-text">{n.text}</span>
          <div class="notif-progress"></div>
        </div>
      ))}
    </div>
  );
};

const App = () => {
  const [currentUrl, setCurrentUrl] = useState('/');
  const [isElliothHeld, setElliothHeld] = useState(false);
  const [needsPosition, setNeedsPosition] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null); // null = loading
  const recognitionRef = useRef<any>(null);

  const AnyLink = Link as any;

  function hasSessionCookie(): boolean {
    return document.cookie.split(';').some(c => c.trim().startsWith('current_qr_code='));
  }

  // --- Check authorization based on cookie ---
  useEffect(() => {
    const authorized = hasSessionCookie();
    setIsAuthorized(authorized);

    if (!authorized && window.location.pathname !== '/login') {
      window.location.replace('/login');
    }
  }, []);

  // --- Initialize connection status (separate from isAuthorized) ---
  useEffect(() => {
    fetch("https://ellioth.othdb.de/api/get-name.php")
      .then(res => res.json())
      .then(data => setIsConnected(data.name && data.name !== "No Session Found"))
      .catch(() => setIsConnected(false));
  }, []);

  useEffect(() => {
    if (isElliothHeld) document.body.classList.add('no-scroll');
    else document.body.classList.remove('no-scroll');
  }, [isElliothHeld]);

  const navItems = [
    { href: '/profile', label: 'PROFILE', icon: profileIcon },
    { href: '/disconnect', label: 'DISCONNECT', icon: disconnectIcon },
    { label: 'ELLIOTH', icon: micIcon, isEllioth: true },
    { href: '/charging', label: 'HOME', icon: homeIcon },
  ];

  const startSpeechRecognition = () => {
    if (!isConnected) {
      addNotification("You need to be connected to use Ellioth.");
      return;
    }

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = function(event: any) {
      const transcript = event.results[0][0].transcript;
      fetch("/api/chatgpt.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: transcript }),
      }).then(async res => {
        const text = await res.text();
        try { console.log("API JSON response:", JSON.parse(text)); }
        catch { console.warn("Non-JSON response from server:", text); }
      }).catch(err => console.error("Error sending to API:", err));
    };

    recognition.onerror = function(event: any) { console.error('Speech recognition error:', event.error); };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const handleHoldStart = (e: any) => {
    e.preventDefault();
    if (!isConnected) {
      addNotification("You need to be connected to use Ellioth.");
      return;
    }
    setElliothHeld(true);
    startSpeechRecognition();
  };

  const handleHoldEnd = () => {
    setElliothHeld(false);
    stopSpeechRecognition();
  };

  const handleDisconnect = async () => {
    if (!isConnected) {
      addNotification("You are already disconnected.");
      return;
    }

    try {
      const res = await fetch('/api/disconnect.php', { method: 'POST', credentials: 'same-origin' });
      if (res.ok) {
        setIsConnected(false);
        addNotification('Disconnected. Scan the QR code again to access the terminal.');
      } else {
        addNotification('You are already disconnected.');
      }
    } catch {
      addNotification('You are already disconnected.');
    }
  };

  const showNavbar = currentUrl !== '/' && !currentUrl.startsWith('/login');

  // --- Prevent rendering pages until authorization is known ---
  if (isAuthorized === null) return null;
  if (!isAuthorized && window.location.pathname !== '/login') return null;

  return (
    <div class="app">
      <Router onChange={e => setCurrentUrl(e.url)}>
        <Route path="/" component={Home} />
        <Route path="/profile" component={Profile} />
        <Route path="/charging" component={Charging} />
        <Route path="/login" component={Login} />
      </Router>

      <Notifications />

      {showNavbar && (
        <nav class="navbar">
          {navItems.map(item => {
            const isActive = item.href === currentUrl;
            const isHeld = item.isEllioth && isElliothHeld;

            if (item.isEllioth) {
              return (
                <div
                  key={item.label}
                  class={`nav-button ${isActive ? 'active' : ''} ${isHeld ? 'held' : ''}`}
                  onMouseDown={handleHoldStart}
                  onMouseUp={handleHoldEnd}
                  onMouseLeave={handleHoldEnd}
                  onTouchStart={handleHoldStart}
                  onTouchEnd={handleHoldEnd}
                  style={{ pointerEvents: isConnected ? 'auto' : 'none', opacity: isConnected ? 1 : 0.5 }}
                >
                  <img src={item.icon} class="nav-icon" alt={item.label} />
                  <span>{item.label}</span>
                </div>
              );
            }

            if (item.label === 'DISCONNECT') {
              return (
                <div key={item.label} class="nav-button disconnect-btn" onClick={handleDisconnect}>
                  <img src={item.icon} class="nav-icon" alt={item.label} />
                  <span>{item.label}</span>
                </div>
              );
            }

            return (
              <AnyLink key={item.href} href={item.href} class={`nav-button ${isActive ? 'active' : ''}`}>
                <img src={item.icon} class="nav-icon" alt={item.label} />
                <span>{item.label}</span>
              </AnyLink>
            );
          })}
        </nav>
      )}

      {isElliothHeld && (
        <>
          <div class="page-dim"></div>
          <div class="ellioth-overlay-text">Ellioth is listening ...</div>
          <div class="ellioth-bars">
            {Array.from({ length: 8 }).map((_, i) => {
              const minScale = 0.2 + Math.random() * 0.1;
              const maxScale = 0.6 + Math.random() * 0.3;
              const duration = 0.4 + Math.random() * 0.3;
              const delay = Math.random() * 0.5;
              return (
                <div
                  key={i}
                  class="ellioth-bar"
                  style={{
                    ['--min-scale' as any]: `${minScale}`,
                    ['--max-scale' as any]: `${maxScale}`,
                    animationDuration: `${duration}s`,
                    animationDelay: `${delay}s`,
                  }}
                ></div>
              );
            })}
          </div>
        </>
      )}

      {showNavbar && needsPosition && (
        <PositionOverlay onCleared={() => setNeedsPosition(false)} />
      )}
    </div>
  );
};

const root = document.getElementById('react-root');
if (root) render(<App />, root);
