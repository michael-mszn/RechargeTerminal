import { render } from 'preact';
import { Router, Route } from 'preact-router';
import { Link } from 'preact-router';
import { useState } from 'preact/hooks';

import Home from './pages/Home';
import Profile from './pages/Profile';
import Charging from './pages/Charging';

import './css/Navbar.css';

{/* @ts-ignore */}
import homeIcon from './images/home.png';
{/* @ts-ignore */}
import profileIcon from './images/profile.png';
{/* @ts-ignore */}
import micIcon from './images/mic.png';
{/* @ts-ignore */}
import disconnectIcon from './images/disconnect.png';

const App = () => {
  const [currentUrl, setCurrentUrl] = useState<string>('/');

  //TS will complain if Link isn't cast to any. A library that would fix this is deprecated.
  const AnyLink = Link as any;

  return (
    <div class="app">
      <Router onChange={(e) => setCurrentUrl(e.url)}>
        <Route path="/" component={Home} />
        <Route path="/profile" component={Profile} />
        <Route path="/charging" component={Charging} />
      </Router>

      {currentUrl !== '/' && (
        <nav class="navbar">
          {/* Slot 1: Profile */}
          <AnyLink
            href="/profile"
            class={`nav-button ${currentUrl === '/profile' ? 'active' : ''}`}
          >
            <img src={profileIcon} class="nav-icon" alt="Profile" />
            <span>PROFILE</span>
          </AnyLink>

          {/* Slot 2: Disconnect */}
          <AnyLink
            href="/disconnect"
            class={`nav-button ${currentUrl === '/disconnect' ? 'active' : ''}`}
          >
            <img src={disconnectIcon} class="nav-icon" alt="Disconnect" />
            <span>DISCONNECT</span>
          </AnyLink>

          {/* Slot 3: Mic */}
          <AnyLink
            href="/mic"
            class={`nav-button ${currentUrl === '/mic' ? 'active' : ''}`}
          >
            <img src={micIcon} class="nav-icon" alt="Mic" />
            <span>ELLIOTH</span>
          </AnyLink>

          {/* Slot 4: Charging */}
          <AnyLink
            href="/charging"
            class={`nav-button ${currentUrl === '/charging' ? 'active' : ''}`}
          >
            <img src={homeIcon} class="nav-icon" alt="Home" />
            <span>HOME</span>
          </AnyLink>
        </nav>
      )}
    </div>
  );
};

const root = document.getElementById('react-root');
if (root) {
  render(<App />, root);
}
