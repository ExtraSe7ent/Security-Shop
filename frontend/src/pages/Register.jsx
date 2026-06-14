import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';

export default function Register() {
  const { register } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || t('error'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card text-center animate-fadeInUp">
          <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto var(--space-md)' }} />
          <h1 style={{ fontSize: '22px' }}>
            {t('register_title')} ✓
          </h1>
          <p className="text-secondary mt-sm">{t('loading')} {t('register_login_link')}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-fadeInUp" id="register-card">
        <h1>{t('register_title')}</h1>
        <p className="subtitle">{t('register_subtitle')}</p>

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
            <label htmlFor="reg-username">{t('register_username')}</label>
            <input
              id="reg-username"
              name="username"
              className="input"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="reg-email">{t('register_email')}</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              className="input"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="reg-password">{t('register_password')}</label>
            <input
              id="reg-password"
              name="password"
              type="password"
              className="input"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="reg-phone">{t('register_phone')}</label>
            <input
              id="reg-phone"
              name="phone"
              className="input"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label htmlFor="reg-address">{t('register_address')}</label>
            <input
              id="reg-address"
              name="address"
              className="input"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
            id="register-submit"
          >
            {loading ? t('loading') : (
              <>
                <UserPlus size={16} />
                {t('register_button')}
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          {t('register_has_account')}{' '}
          <Link to="/login">{t('register_login_link')}</Link>
        </div>
      </div>
    </div>
  );
}
