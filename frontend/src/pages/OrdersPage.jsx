import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('secure')
  // IDOR demo
  const [idorInput, setIdorInput] = useState('')
  const [idorResult, setIdorResult] = useState(null)
  const [idorError, setIdorError] = useState('')
  const [idorLoading, setIdorLoading] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')
  const newOrderId = location.state?.newOrderId

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    axios.get('http://localhost:8000/').then(res => setMode(res.data.mode)).catch(() => {})
    fetchMyOrders()
  }, [])

  const fetchMyOrders = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setOrders(res.data)
    } catch { navigate('/login') }
    finally { setLoading(false) }
  }

  const testIdor = async () => {
    if (!idorInput.trim()) return
    setIdorLoading(true)
    setIdorResult(null)
    setIdorError('')
    try {
      const res = await axios.get(`http://localhost:8000/api/orders/${idorInput}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setIdorResult(res.data)
    } catch (err) {
      setIdorError(`${err.response?.status} — ${err.response?.data?.detail || err.message}`)
    } finally { setIdorLoading(false) }
  }

  const statusColor = (s) => s === 'pending' ? '#f39c12' : s === 'completed' ? '#27ae60' : '#888'

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>
        {newOrderId && (
          <div style={styles.successBanner}>
            ✅ Order #{newOrderId} placed successfully!
          </div>
        )}

        <h2 style={styles.heading}>📦 My Orders</h2>

        {/* IDOR DEMO BOX */}
        <div style={{ ...styles.demoBox, borderColor: mode === 'vuln' ? '#e74c3c' : '#27ae60' }}>
          <div style={styles.demoHeader}>
            <span style={{ ...styles.demoBadge, background: mode === 'vuln' ? '#e74c3c' : '#27ae60' }}>
              {mode === 'vuln' ? '⚠️ IDOR Demo — Vuln Mode' : '🛡️ IDOR Demo — Secure Mode'}
            </span>
            <p style={styles.demoDesc}>
              {mode === 'vuln'
                ? 'Nhập bất kỳ Order ID nào → xem được đơn hàng của người khác (IDOR Attack!)'
                : 'Nhập Order ID của người khác → bị chặn với lỗi 403 (IDOR được phòng thủ!)'}
            </p>
          </div>
          <div style={styles.demoInputRow}>
            <input
              style={styles.demoInput}
              type="number"
              placeholder="Nhập Order ID bất kỳ (ví dụ: 1, 2, 3...)"
              value={idorInput}
              onChange={e => setIdorInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && testIdor()}
            />
            <button
              style={{ ...styles.demoBtn, background: mode === 'vuln' ? '#e74c3c' : '#27ae60' }}
              onClick={testIdor}
              disabled={idorLoading}
            >
              {idorLoading ? '...' : 'Fetch Order'}
            </button>
          </div>
          {idorResult && (
            <div style={styles.demoSuccess}>
              <p style={{ fontWeight: '700', color: '#c0392b', marginBottom: 6 }}>
                ⚠️ IDOR thành công! Thông tin đơn hàng Order #{idorResult.order_id} (User ID: {idorResult.user_id}):
              </p>
              <pre style={styles.demoCode}>{JSON.stringify(idorResult, null, 2)}</pre>
            </div>
          )}
          {idorError && (
            <div style={styles.demoBlocked}>
              🛡️ <strong>Bị chặn:</strong> {idorError}
            </div>
          )}
        </div>

        {/* MY ORDERS LIST */}
        {loading ? (
          <p style={styles.center}>Loading orders...</p>
        ) : orders.length === 0 ? (
          <div style={styles.emptyBox}>
            <p style={styles.emptyText}>No orders yet.</p>
            <button style={styles.primaryBtn} onClick={() => navigate('/products')}>Start Shopping</button>
          </div>
        ) : (
          <div style={styles.ordersList}>
            {orders.map(o => (
              <div key={o.order_id} style={styles.orderCard}>
                <div style={styles.orderLeft}>
                  <span style={styles.orderId}>Order #{o.order_id}</span>
                  <span style={styles.orderDate}>{new Date(o.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
                <div style={styles.orderRight}>
                  <span style={{ ...styles.orderStatus, color: statusColor(o.status) }}>● {o.status}</span>
                  <span style={styles.orderTotal}>{o.total_price.toLocaleString()} VND</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f5f5' },
  container: { maxWidth: '800px', margin: '0 auto', padding: '32px 24px' },
  heading: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', marginBottom: '20px' },
  successBanner: { background: '#d4edda', border: '1px solid #27ae60', color: '#155724', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontWeight: '600' },
  demoBox: { background: 'white', borderRadius: '12px', border: '2px solid', padding: '20px', marginBottom: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  demoHeader: { marginBottom: '14px' },
  demoBadge: { color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' },
  demoDesc: { marginTop: '8px', fontSize: '13px', color: '#555' },
  demoInputRow: { display: 'flex', gap: '10px' },
  demoInput: { flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none' },
  demoBtn: { padding: '10px 20px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  demoSuccess: { marginTop: '12px', background: '#fff5f5', border: '1px solid #fcc', borderRadius: '8px', padding: '12px' },
  demoCode: { background: '#f8f8f8', padding: '10px', borderRadius: '6px', fontSize: '12px', overflow: 'auto' },
  demoBlocked: { marginTop: '12px', background: '#f0fff4', border: '1px solid #c3e6cb', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#155724' },
  center: { textAlign: 'center', padding: '60px', color: '#666' },
  emptyBox: { textAlign: 'center', background: 'white', borderRadius: '16px', padding: '60px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  emptyText: { fontSize: '16px', color: '#888', marginBottom: '20px' },
  ordersList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  orderCard: { background: 'white', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  orderLeft: { display: 'flex', flexDirection: 'column', gap: '4px' },
  orderId: { fontWeight: '700', fontSize: '15px', color: '#1a1a2e' },
  orderDate: { fontSize: '12px', color: '#aaa' },
  orderRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' },
  orderStatus: { fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' },
  orderTotal: { fontWeight: '700', fontSize: '15px', color: '#0f3460' },
  primaryBtn: { padding: '12px 24px', background: '#0f3460', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
}
