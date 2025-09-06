import { render } from 'preact';
import { Router, Route } from 'preact-router';
import Home from './pages/Home';
import Profile from './pages/Profile';

const root = document.getElementById('react-root');
if (root) {
  render(
    <Router>
      <Route path="/" component={Home} />
      <Route path="/profile" component={Profile} />
    </Router>,
    root
  );
}
