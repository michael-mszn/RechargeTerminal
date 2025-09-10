import { render } from 'preact';
import { Router, Route } from 'preact-router';
import { Link } from 'preact-router';
import { useState, useEffect } from 'preact/hooks';

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

// Notifications Component
const Notifications = () => {
  const [notifs, setNotifs] = useState<{ id: number; text: string }[]>([]);

  useEffect(() => {
    notifyCallback = (msg: string) => {
      const id = Date.now();
      setNotifs((prev) => [...prev, { id, text: msg }]);
      setTimeout(() => setNotifs((prev) => prev.filter((n) => n.id !== id)), 5000);
    };
    return () => { notifyCallback = null; };
  }, []);

  return (
    <div class="notifications-container">
      {notifs.map((n) => (
        <div key={n.id} class="notification">
          <button
            class="notif-close"
            onClick={() => setNotifs((prev) => prev.filter((m) => m.id !== n.id))}
          >
            ×
          </button>
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

  const AnyLink = Link as any;

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

  const handleHoldStart = (e: any) => { e.preventDefault(); setElliothHeld(true); };
  const handleHoldEnd = () => setElliothHeld(false);

  return (
    <div class="app">
      <Router onChange={(e) => setCurrentUrl(e.url)}>
        <Route path="/" component={Home} />
        <Route path="/profile" component={Profile} />
        <Route path="/charging" component={Charging} />
        <Route path="/login" component={Login} />
      </Router>

      {/* Notifications always mounted */}
      <Notifications />

      {/* Navbar hidden on root and login pages */}
      {currentUrl !== '/' && !currentUrl.startsWith('/login') && (
        <nav class="navbar">
          {navItems.map((item) => {
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
                >
                  <img src={item.icon} class="nav-icon" alt={item.label} />
                  <span>{item.label}</span>
                </div>
              );
            }

            return (
              <AnyLink
                key={item.href}
                href={item.href}
                class={`nav-button ${isActive ? 'active' : ''}`}
              >
                <img src={item.icon} class="nav-icon" alt={item.label} />
                <span>{item.label}</span>
              </AnyLink>
            );
          })}
        </nav>
      )}

      {/* Ellioth overlay */}
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
    </div>
  );
};

const root = document.getElementById('react-root');
if (root) render(<App />, root);
