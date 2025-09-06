// src/main.tsx
import { render } from 'preact';
import { Router, Route } from 'preact-router';
import { Link } from 'preact-router';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Charging from './pages/Charging';

const App = () => (
  <div class="app">
    <Router>
      <Route path="/" component={Home} />
      <Route path="/profile" component={Profile} />
      <Route path="/charging" component={Charging} />
    </Router>

    {/* Bottom navbar */}
    <nav class="navbar">
      {/* @ts-ignore */}
      <Link href="/profile" class="nav-button">Profile</Link>
      {/* @ts-ignore */}
      <Link href="/charging" class="nav-button">Charging</Link>
    </nav>
  </div>
);

const root = document.getElementById('react-root');
if (root) {
  render(<App />, root);
}
