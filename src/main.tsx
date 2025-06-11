import { render } from 'preact';
import Home from './pages/Home';

//import { App } from './App';

//render(<App />, document.getElementById('app') as HTMLElement);

const root = document.getElementById('react-root');
if (root) {
  render(<Home />, root);
}