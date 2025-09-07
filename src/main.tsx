import { render } from 'preact';
import { Router, Route } from 'preact-router';
import { Link } from 'preact-router';
import { useState, useEffect } from 'preact/hooks';

import Home from './pages/Home';
import Profile from './pages/Profile';
import Charging from './pages/Charging';

import './css/Navbar.css';

/* @ts-ignore */
import homeIcon from './images/home.png';
/* @ts-ignore */
import profileIcon from './images/profile.png';
/* @ts-ignore */
import micIcon from './images/mic.png';
/* @ts-ignore */
import disconnectIcon from './images/disconnect.png';

const App = () => {
  const [currentUrl, setCurrentUrl] = useState('/');
  const [isElliothHeld, setElliothHeld] = useState(false);

  const AnyLink = Link as any;

  // Prevent scrolling while holding Ellioth
  useEffect(() => {
    if (isElliothHeld) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
  }, [isElliothHeld]);

  const navItems = [
    { href: '/profile', label: 'PROFILE', icon: profileIcon },
    { href: '/disconnect', label: 'DISCONNECT', icon: disconnectIcon },
    { label: 'ELLIOTH', icon: micIcon, isEllioth: true },
    { href: '/charging', label: 'HOME', icon: homeIcon },
  ];

  // Handle hold-only behavior
  const handleHoldStart = (e: any) => {
    e.preventDefault(); // prevent clicks
    setElliothHeld(true);
  };
  const handleHoldEnd = () => setElliothHeld(false);

  return (
    <div class="app">
      <Router onChange={(e) => setCurrentUrl(e.url)}>
        <Route path="/" component={Home} />
        <Route path="/profile" component={Profile} />
        <Route path="/charging" component={Charging} />
      </Router>

      {currentUrl !== '/' && (
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

      {isElliothHeld && (
        <>
          {/* Dim background */}
          <div class="page-dim"></div>

          {/* Overlay text */}
          <div class="ellioth-overlay-text">
            Ellioth is listening ...
          </div>

          {/* Animated bars */}
          <div class="ellioth-bars">
            {Array.from({ length: 8 }).map((_, i) => {
              const heightPercent = 20 + Math.random() * 80;
              const duration = 0.4 + Math.random() * 0.3;
              const delay = Math.random() * 0.5;

              return (
                <div
                  key={i}
                  class="ellioth-bar"
                  style={{
                    height: `${heightPercent}%`,
                    animation: `bounce-js ${duration}s infinite ease-in-out`,
                    animationDelay: `${delay}s`
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
