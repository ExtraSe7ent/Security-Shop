import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function CartPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)
  const [cartUpdated, setCartUpdated] = useState(0)
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const fetchCart = async () => {
    if (!token) { navigate('/login'); return }
    try {
      const res = await axios.get('http://localhost:8000/api/cart/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setItems(res.data)
    } catch { navigate('/login') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchCart() }, [])

  const removeItem = async (itemId) => {
    try {
      await axios.delete(`http://localhost:8000/api/cart/remove/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCartUpdated(v => v + 1)
      fetchCart()
    } catch (err) { alert(err.response?.data?.detail || 'Failed to remove item') }
  }

  const checkout = async () => {
    setCheckingOut(true)
    try {
      const res = await axios.post('http://localhost:8000/api/orders/create', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      navigate('/orders', { state: { newOrderId: res.data.order_id } })
    } catch (err) {
      alert(err.response?.data?.detail || 'Checkout failed')
    } finally { setCheckingOut(false) }
  }

  const total = items.reduce((sum, i) => sum + i.subtotal, 0)

  if (loading) return (
    <div style={styles.page}>
      <Navbar onCartUpdate={cartUpdated} />
      <p style={styles.center}>Loading cart...</p>
    </div>
  )

  return (
    <div style={styles.page}>
      <Navbar onCartUpdate={cartUpdated} />
      <div style={styles.container}>
        <h2 style={styles.heading}>🛒 Shopping Cart</h2>

        {items.length === 0 ? (
          <div style={styles.emptyBox}>
            <p style={styles.emptyText}>Your cart is empty.</p>
            <button style={styles.primaryBtn} onClick={() => navigate('/products')}>Browse Products</button>
          </div>
        ) : (
          <div style={styles.layout}>
            {/* Items list */}
            <div style={styles.itemsCol}>
              {items.map(item => (
                <div key={item.id} style={styles.itemCard}>
                  <div style={styles.itemInfo}>
                    <span style={styles.itemName}>{item.product_name}</span>
                    <span style={styles.itemQty}>Qty: {item.quantity}</span>
                  </div>
                  <div style={styles.itemRight}>
                    <span style={styles.itemPrice}>{item.subtotal.toLocaleString()} VND</span>
                    <button style={styles.removeBtn} onClick={() => removeItem(item.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary box */}
            <div style={styles.summaryBox}>
              <h3 style={styles.summaryTitle}>Order Summary</h3>
              <div style={styles.summaryRow}>
                <span>Items ({items.length})</span>
                <span>{total.toLocaleString()} VND</span>
              </div>
              <div style={styles.summaryRow}>
                <span>Shipping</span>
                <span style={{ color: '#27ae60' }}>Free</span>
              </div>
              <div style={styles.summaryDivider} />
              <div style={{ ...styles.summaryRow, fontWeight: '700', fontSize: '16px' }}>
                <span>Total</span>
                <span style={{ color: '#0f3460' }}>{total.toLocaleString()} VND</span>
              </div>
              <button
                style={{ ...styles.primaryBtn, width: '100%', marginTop: '16px', opacity: checkingOut ? 0.7 : 1 }}
                onClick={checkout}
                disabled={checkingOut}
              >
                {checkingOut ? 'Processing...' : '✓ Place Order'}
              </button>
              <button style={styles.secondaryBtn} onClick={() => navigate('/products')}>
                ← Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f5f5' },
  container: { maxWidth: '900px', margin: '0 auto', padding: '32px 24px' },
  heading: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', marginBottom: '24px' },
  center: { textAlign: 'center', padding: '60px', color: '#666' },
  emptyBox: { textAlign: 'center', background: 'white', borderRadius: '16px', padding: '60px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  emptyText: { fontSize: '16px', color: '#888', marginBottom: '20px' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' },
  itemsCol: { display: 'flex', flexDirection: 'column', gap: '12px' },
  itemCard: { background: 'white', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  itemInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  itemName: { fontWeight: '600', fontSize: '15px', color: '#1a1a2e' },
  itemQty: { fontSize: '13px', color: '#888' },
  itemRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  itemPrice: { fontWeight: '700', fontSize: '15px', color: '#0f3460' },
  removeBtn: { background: '#fee', border: 'none', color: '#e74c3c', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', fontSize: '13px', fontWeight: '700' },
  summaryBox: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', position: 'sticky', top: '88px' },
  summaryTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '16px' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#555', marginBottom: '10px' },
  summaryDivider: { borderTop: '1px solid #eee', margin: '12px 0' },
  primaryBtn: { padding: '12px 24px', background: '#0f3460', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  secondaryBtn: { width: '100%', marginTop: '10px', padding: '10px', background: 'transparent', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px', color: '#666', cursor: 'pointer' },
}
