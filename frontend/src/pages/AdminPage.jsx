import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function AdminPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('secure')
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const username = localStorage.getItem('username')

  useEffect(() => {
    axios.get('http://localhost:8000/').then(res => setMode(res.data.mode)).catch(() => {})
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.get('http://localhost:8000/api/auth/admin/users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      setUsers(res.data)
    } catch (err) {
      setError(`${err.response?.status} — ${err.response?.data?.detail || err.message}`)
    } finally { setLoading(false) }
  }

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <h2 style={styles.heading}>⚙️ Admin Panel</h2>
          <span style={{ ...styles.modeBadge, background: mode === 'vuln' ? '#e74c3c' : '#27ae60' }}>
            {mode === 'vuln' ? '⚠️ VULN MODE' : '🛡️ SECURE MODE'}
          </span>
        </div>

        {/* Explanation box */}
        <div style={{ ...styles.infoBox, borderColor: mode === 'vuln' ? '#e74c3c' : '#27ae60', background: mode === 'vuln' ? '#fff5f5' : '#f0fff4' }}>
          <p style={{ fontSize: '13px', color: '#555', margin: 0 }}>
            {mode === 'vuln' ? (
              <>
                <strong style={{ color: '#e74c3c' }}>⚠️ Broken Access Control (VULN):</strong> Endpoint <code>/api/auth/admin/users</code> không kiểm tra
                token hay quyền admin. Bất kỳ ai cũng gọi được và thấy toàn bộ danh sách user!
                {' '}Bạn đang đăng nhập là: <strong>{username || 'Guest (không cần login!)'}</strong>
              </>
            ) : (
              <>
                <strong style={{ color: '#27ae60' }}>🛡️ Access Control (SECURE):</strong> Endpoint yêu cầu Bearer token hợp lệ VÀ
                tài khoản phải có quyền <code>is_admin = true</code>. User thường sẽ nhận lỗi <strong>403 Forbidden</strong>.
              </>
            )}
          </p>
        </div>

        {loading && <p style={styles.center}>Loading...</p>}

        {error && (
          <div style={styles.errorBox}>
            <p style={{ fontWeight: '700', marginBottom: '6px' }}>
              {mode === 'secure' ? '🛡️ Truy cập bị chặn (SECURE MODE hoạt động đúng!)' : '❌ Lỗi:'}
            </p>
            <code style={styles.errorCode}>{error}</code>
            {mode === 'secure' && (
              <p style={{ fontSize: '12px', color: '#555', marginTop: '8px' }}>
                Chỉ có tài khoản admin (<code>is_admin = true</code> trong DB) mới xem được danh sách này.
                Để test: cập nhật <code>UPDATE users SET is_admin=true WHERE username='your_username';</code> trong PostgreSQL.
              </p>
            )}
          </div>
        )}

        {!loading && !error && users.length > 0 && (
          <>
            <div style={styles.warningBanner}>
              ⚠️ <strong>Broken Access Control!</strong> Toàn bộ {users.length} user đã bị lộ mà không cần quyền admin!
            </div>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHead}>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Username</th>
                    <th style={styles.th}>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={styles.tableRow}>
                      <td style={styles.td}>{u.id}</td>
                      <td style={styles.td}><strong>{u.username}</strong></td>
                      <td style={styles.td}>{u.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div style={styles.demoActions}>
          <button style={styles.refetchBtn} onClick={fetchUsers}>🔄 Refetch (Demo)</button>
          <button style={styles.backBtn} onClick={() => navigate('/products')}>← Back to Products</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f5f5' },
  container: { maxWidth: '900px', margin: '0 auto', padding: '32px 24px' },
  headerRow: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' },
  heading: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', margin: 0 },
  modeBadge: { color: 'white', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' },
  infoBox: { border: '1px solid', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' },
  center: { textAlign: 'center', padding: '40px', color: '#666' },
  errorBox: { background: '#f0fff4', border: '1px solid #c3e6cb', borderRadius: '10px', padding: '16px', marginBottom: '20px' },
  errorCode: { background: '#e8f5e9', padding: '6px 10px', borderRadius: '6px', fontSize: '13px', color: '#2e7d32' },
  warningBanner: { background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', color: '#856404', fontWeight: '500', fontSize: '14px' },
  tableWrapper: { background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: '20px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHead: { background: '#0f3460' },
  th: { padding: '12px 16px', textAlign: 'left', color: 'white', fontWeight: '600', fontSize: '13px' },
  tableRow: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#333' },
  demoActions: { display: 'flex', gap: '12px' },
  refetchBtn: { padding: '10px 20px', background: '#0f3460', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  backBtn: { padding: '10px 20px', background: 'transparent', border: '1px solid #ddd', color: '#666', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
}
