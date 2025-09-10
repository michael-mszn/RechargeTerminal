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

      const data = await res.json();

      if (!res.ok) {
        // Show server-side error
        addNotification(data.error || 'Login failed');
      } else {
        // Success: session cookie now set
        addNotification(`Welcome ${data.fullName}`);

        // Redirect after a small delay so notification is visible
        setTimeout(() => {
          window.location.href = '/charging';
        }, 200); // 0.2s is enough
      }
    } catch (err) {
      console.error(err);
      addNotification('Login request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="login-page">
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
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
