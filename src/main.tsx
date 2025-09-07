import { render } from 'preact';
import { Router, Route } from 'preact-router';
import { Link } from 'preact-router';
import { useState, useEffect, useMemo } from 'preact/hooks';

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

interface BarProps {
  heightPercent: number;
  duration: number;
  delay: number;
}

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

  // Randomized bars generated once per hold
  const bars: BarProps[] = useMemo(() => {
    return Array.from({ length: 8 }).map(() => ({
      heightPercent: 20 + Math.random() * 80, // 20% → 100%
      duration: 0.4 + Math.random() * 0.3,    // 0.4s → 0.7s
      delay: Math.random() * 0.5               // random delay
    }));
  }, [isElliothHeld]); // recalc each time we hold

  const navItems = [
    { href: '/profile', label: 'PROFILE', icon: profileIcon },
    { href: '/disconnect', label: 'DISCONNECT', icon: disconnectIcon },
    { label: 'ELLIOTH', icon: micIcon, isEllioth: true },
    { href: '/charging', label: 'HOME', icon: homeIcon },
  ];

  const handleHoldStart = (e: any) => {
    e.preventDefault();
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
          <div class="page-dim"></div>
          <div class="ellioth-overlay-text">Ellioth is listening ...</div>
          <div class="ellioth-bars">
            {bars.map((bar, i) => (
              <div
                key={i}
                class="ellioth-bar"
                style={{
                  height: `${bar.heightPercent}%`,
                  animation: `bounce-js ${bar.duration}s infinite ease-in-out`,
                  animationDelay: `${bar.delay}s`
                }}
              ></div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const root = document.getElementById('react-root');
if (root) render(<App />, root);
