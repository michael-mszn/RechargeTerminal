import { useState } from 'preact/hooks';
import '../css/Login.css';
import { addNotification } from '../main';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const res = await fetch('/api/ldap.php', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      });

      const text = await res.text();
      const jsonStrings = text.match(/\{[^{}]*\}$/);
      if (!jsonStrings) {
        addNotification('Invalid server response');
        setLoading(false);
        return;
      }

      let data;
      try {
        data = JSON.parse(jsonStrings[0]);
      } catch (err) {
        console.error('Failed to parse JSON:', err, 'from:', jsonStrings[0]);
        addNotification('Login failed');
        setLoading(false);
        return;
      }

      if (!res.ok) {
        addNotification(data.error || 'Login failed');
      } else {
        setTimeout(() => {
          window.location.href = '/charging';
        }, 200);
      }
    } catch (err) {
      console.error(err);
      addNotification('Login request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('guest', '1');

      const res = await fetch('/api/ldap.php', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      });

      const text = await res.text();
      const jsonStrings = text.match(/\{[^{}]*\}$/);
      if (!jsonStrings) {
        addNotification('Guest login failed: invalid server response');
        setLoading(false);
        return;
      }

      let data;
      try {
        data = JSON.parse(jsonStrings[0]);
      } catch (err) {
        console.error('Failed to parse JSON:', err, 'from:', jsonStrings[0]);
        addNotification('Guest login failed');
        setLoading(false);
        return;
      }

      if (!res.ok) {
        addNotification(data.error || 'Guest login failed');
      } else {
        window.location.href = '/charging';
      }
    } catch (err) {
      console.error(err);
      addNotification('Guest login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="login-page">
      <p class="welcome-text">Ellioth Terminal Login</p>
      <form class="login-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onInput={(e: any) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onInput={(e: any) => setPassword(e.target.value)}
          required
        />

        <p class="guest-text">
          Not an OTH Regensburg student?{' '}
          <span class="guest-link" onClick={handleGuestLogin}>
            Log in as a guest
          </span>
        </p>

        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
