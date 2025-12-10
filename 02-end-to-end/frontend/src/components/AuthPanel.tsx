import { FormEvent, useState } from 'react';
import { Session } from '../types';

interface AuthPanelProps {
  session: Session | null;
  onLogin: (username: string, password: string) => Promise<void>;
  onSignup: (username: string, password: string) => Promise<void>;
  onLogout: () => void;
}

type AuthMode = 'login' | 'signup';

const AuthPanel = ({ session, onLogin, onSignup, onLogout }: AuthPanelProps) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (mode === 'login') {
        await onLogin(username, password);
      } else {
        await onSignup(username, password);
      }
      setUsername('');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to authenticate');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (session) {
    return (
      <div className="panel auth-panel">
        <h2>Account</h2>
        <p>You are logged in as {session.user.username}.</p>
        <button onClick={onLogout}>Log out</button>
      </div>
    );
  }

  return (
    <div className="panel auth-panel">
      <div className="auth-header">
        <h2>{mode === 'login' ? 'Log in' : 'Sign up'}</h2>
        <div className="tab-group">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => setMode('signup')}
          >
            Sign up
          </button>
        </div>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="captain"
            autoComplete="username"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Processing…' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </form>
    </div>
  );
};

export default AuthPanel;
