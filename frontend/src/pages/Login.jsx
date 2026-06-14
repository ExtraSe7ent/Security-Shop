import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || t('login_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fadeInUp" id="login-card">
        <h1>{t('login_title')}</h1>
        <p className="subtitle">{t('login_subtitle')}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-center gap-sm" style={{
              padding: '10px 14px',
              background: 'var(--error-light)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--error)',
              fontSize: '14px',
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="login-email">{t('login_email')}</label>
            <input
              id="login-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alice@example.com"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="login-password">{t('login_password')}</label>
            <input
              id="login-password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
            id="login-submit"
          >
            {loading ? t('loading') : (
              <>
                <LogIn size={16} />
                {t('login_button')}
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          {t('login_no_account')}{' '}
          <Link to="/register">{t('login_register_link')}</Link>
        </div>
      </div>
    </div>
  );
}
