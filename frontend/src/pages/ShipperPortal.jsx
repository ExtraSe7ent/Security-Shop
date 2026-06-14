import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Search, CheckCircle, XCircle, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { shipperAPI } from '../api';

export default function ShipperPortal() {
  const { user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [orderId, setOrderId] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Protect route
  useEffect(() => {
    if (!user || user.role !== 'shipper') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await shipperAPI.getOrder(orderId);
      const newOrder = res.data;
      
      // Prevent duplicates in the list
      if (!orders.find(o => o.id === newOrder.id)) {
        setOrders(prev => [newOrder, ...prev]);
      } else {
        setError('Order is already in the list below.');
      }
      setOrderId('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch order details. Invalid ID?');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await shipperAPI.updateStatus(id, status);
      // Update local state
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    } catch {
      alert('Failed to update status');
    }
  };

  if (!user || user.role !== 'shipper') return null;

  return (
    <div className="page" style={{ backgroundColor: '#f0f9ff', minHeight: '100vh', padding: 'var(--space-xl) 0' }}>
      <div className="container" style={{ maxWidth: '600px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: '50%', marginBottom: '1rem' }}>
            <Truck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-primary">Shipper Portal</h1>
          <p className="text-secondary">Scan QR code or enter Order ID to view customer details.</p>
        </div>

        <div style={{ background: 'white', padding: 'var(--space-xl)', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', marginBottom: 'var(--space-xl)' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Enter Order ID or Scan QR..."
              className="input"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              style={{ flex: 1, fontSize: '1.1rem', padding: '12px' }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0 24px' }}>
              {loading ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '3px' }}></div> : <Search size={20} />}
            </button>
          </form>
          {error && <p className="text-error" style={{ marginTop: '10px', fontSize: '0.9rem' }}>{error}</p>}
        </div>

        <div className="flex flex-col gap-md">
          {orders.map(order => (
            <div key={order.id} className="animate-fadeIn" style={{ background: 'white', padding: 'var(--space-lg)', borderRadius: '12px', borderLeft: '4px solid var(--color-primary)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: '#111827' }}>Order #{order.id}</h3>
                  <span className={`badge ${order.status === 'delivered' ? 'badge-success' : order.status === 'cancelled' ? 'badge-error' : 'badge-warning'}`} style={{ marginTop: '4px' }}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-accent font-mono font-bold">${order.total?.toFixed(2)}</div>
              </div>

              <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 10px 0', color: '#111827', fontWeight: '500' }}>
                  <span style={{ color: '#6b7280', fontSize: '0.85rem', display: 'block' }}>Tên khách hàng (Thật)</span>
                  {order.customer_name}
                </p>

                {/* Show both virtual (from label) and real phone side by side */}
                <div style={{ marginBottom: '10px', padding: '10px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <span style={{ color: '#6b7280', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>📞 Điện thoại</span>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#9ca3af', display: 'block' }}>Số in trên vận đơn (ẢO)</span>
                      <span style={{ fontFamily: 'monospace', color: '#6b7280', textDecoration: 'line-through' }}>
                        0287-{String(order.id).padStart(3, '0')}{String((order.id * 17 + 42) % 1000).padStart(3, '0')}
                      </span>
                    </div>
                    <span style={{ color: '#d1d5db' }}>→</span>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#059669', display: 'block' }}>Chuyển về số THẬT</span>
                      <a href={`tel:${order.shipping_phone}`} style={{ color: '#059669', fontWeight: '600', fontFamily: 'monospace' }}>
                        {order.shipping_phone}
                      </a>
                    </div>
                  </div>
                </div>

                <p style={{ margin: '0', color: '#111827', fontWeight: '500' }}>
                  <span style={{ color: '#6b7280', fontSize: '0.85rem', display: 'block' }}>Địa chỉ giao hàng (Đầy đủ - chỉ shipper thấy)</span>
                  {order.shipping_address}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, backgroundColor: '#10b981', border: 'none' }}
                  onClick={() => handleUpdateStatus(order.id, 'delivered')}
                  disabled={order.status === 'delivered' || order.status === 'cancelled'}
                >
                  <CheckCircle size={18} style={{ marginRight: '6px' }} />
                  Delivered
                </button>
                <button 
                  className="btn btn-outline" 
                  style={{ flex: 1, borderColor: '#ef4444', color: '#ef4444' }}
                  onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                  disabled={order.status === 'delivered' || order.status === 'cancelled'}
                >
                  <XCircle size={18} style={{ marginRight: '6px' }} />
                  Cancel
                </button>
              </div>
            </div>
          ))}

          {orders.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>No orders scanned yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
