import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

export default function Navbar({ onCartUpdate }) {
  const navigate = useNavigate()
  const username = localStorage.getItem('username')
  const token = localStorage.getItem('token')
  const [cartCount, setCartCount] = useState(0)

  const fetchCartCount = async () => {
    if (!token) { setCartCount(0); return }
    try {
      const res = await axios.get('http://localhost:8000/api/cart/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCartCount(res.data.length)
    } catch {
      setCartCount(0)
    }
  }

  useEffect(() => {
    fetchCartCount()
  }, [token, onCartUpdate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    navigate('/login')
  }

  return (
    <nav style={styles.nav}>
      <Link to="/products" style={styles.logo}>🛡️ SecurityShop</Link>
      <div style={styles.navRight}>
        {token ? (
          <>
            <Link to="/cart" style={styles.navLink}>
              🛒 Cart
              {cartCount > 0 && <span style={styles.badge}>{cartCount}</span>}
            </Link>
            <Link to="/orders" style={styles.navLink}>📦 Orders</Link>
            <Link to="/admin" style={styles.navLink}>⚙️ Admin</Link>
            <span style={styles.divider}>|</span>
            <span style={styles.navUser}>👤 {username}</span>
            <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <button style={styles.btnOutline} onClick={() => navigate('/login')}>Sign In</button>
            <button style={styles.btnPrimary} onClick={() => navigate('/register')}>Register</button>
          </>
        )}
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    background: 'linear-gradient(90deg, #0f3460 0%, #16213e 100%)',
    padding: '0 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '64px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    color: 'white',
    fontSize: '20px',
    fontWeight: '700',
    textDecoration: 'none',
    letterSpacing: '-0.3px',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  navLink: {
    color: 'rgba(255,255,255,0.85)',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    padding: '6px 12px',
    borderRadius: '8px',
    position: 'relative',
    transition: 'background 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  badge: {
    background: '#e94560',
    color: 'white',
    borderRadius: '50%',
    width: '18px',
    height: '18px',
    fontSize: '11px',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    color: 'rgba(255,255,255,0.3)',
    margin: '0 4px',
  },
  navUser: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '13px',
    padding: '0 4px',
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.3)',
    color: 'white',
    padding: '6px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'background 0.2s',
    marginLeft: '8px',
  },
  btnOutline: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.5)',
    color: 'white',
    padding: '7px 18px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  btnPrimary: {
    background: '#e94560',
    border: 'none',
    color: 'white',
    padding: '7px 18px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    marginLeft: '4px',
  },
}
