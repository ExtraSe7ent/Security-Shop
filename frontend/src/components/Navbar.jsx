import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Shield, Home, Package, LogIn, LogOut, UserPlus, Globe, Truck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useLang } from '../contexts/LangContext';
import { useMode } from '../contexts/ModeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems, setIsOpen } = useCart();
  const { toggleLang, t } = useLang();
  const { mode, toggleMode, loading: modeLoading } = useMode();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'navbar-link active' : 'navbar-link';

  return (
    <>
      <div className={`mode-bar ${mode}`} />
      <nav className="navbar" id="main-navbar">
        <div className="navbar-inner">
          {/* Brand */}
          <Link to="/" className="navbar-brand">
            <Shield size={22} />
            Security Shop - Secure E-Commerce
          </Link>

          {/* Navigation Links */}
          <div className="navbar-links">
            <Link to="/" className={isActive('/')}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Home size={15} />
                {t('nav_home')}
              </span>
            </Link>
            {user && (
              <Link to="/orders" className={isActive('/orders')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={15} />
                  {t('nav_orders')}
                </span>
              </Link>
            )}
            {user && user.role === 'shipper' && (
              <Link to="/shipper" className={isActive('/shipper')}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Truck size={15} />
                  Shipper Portal
                </span>
              </Link>
            )}
          </div>

          {/* Actions */}
          <div className="navbar-actions">
            {/* Mode Toggle */}
            <div className="mode-toggle">
              <button
                className={mode === 'base' ? 'active-base' : ''}
                onClick={() => mode !== 'base' && toggleMode()}
                disabled={modeLoading}
              >
                {t('mode_base')}
              </button>
              <button
                className={mode === 'secure' ? 'active-secure' : ''}
                onClick={() => mode !== 'secure' && toggleMode()}
                disabled={modeLoading}
              >
                {t('mode_secure')}
              </button>
            </div>

            {/* Language Toggle */}
            <button className="btn btn-ghost btn-icon" onClick={toggleLang} title="Toggle language">
              <Globe size={18} />
            </button>

            {/* Cart */}
            <button
              className="btn btn-ghost btn-icon relative"
              onClick={() => setIsOpen(true)}
              id="cart-button"
            >
              <ShoppingCart size={18} />
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </button>

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-sm">
                <span className="text-sm text-secondary">{user.username}</span>
                <button className="btn btn-ghost btn-sm" onClick={logout}>
                  <LogOut size={15} />
                  {t('nav_logout')}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-xs">
                <Link to="/login" className="btn btn-ghost btn-sm">
                  <LogIn size={15} />
                  {t('nav_login')}
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  <UserPlus size={15} />
                  {t('nav_register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
