import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Calendar, Truck, ShoppingBag, QrCode, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { ordersAPI } from '../api';
import QRCode from 'react-qr-code';
import { virtualPhone } from '../utils/virtualPhone';

// Safe helper: convert any value to displayable string
const safeStr = (v) => (v == null ? '' : String(v));
// Safe helper: get QR value (must be non-empty string)
const qrValue = (order) => {
  const uuid = safeStr(order?.order_uuid);
  if (uuid) return uuid;
  const id = safeStr(order?.id);
  if (id) return id;
  return 'ORDER';
};

export default function Orders() {
  const { user } = useAuth();
  const { lang, t } = useLang();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [labelOrder, setLabelOrder] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    ordersAPI.getAll()
      .then(res => setOrders(res.data.orders || []))
      .catch(err => console.error('Failed to fetch orders:', err))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const statusBadge = (status) => {
    const map = {
      confirmed: 'badge-info',
      shipped: 'badge-warning',
      delivered: 'badge-success',
      cancelled: 'badge-error',
    };
    const labelMap = {
      confirmed: t('status_confirmed'),
      shipped: t('status_shipped'),
      delivered: t('status_delivered'),
      cancelled: t('status_cancelled'),
    };
    return (
      <span className={`badge ${map[status] || 'badge-info'}`}>
        {labelMap[status] || status}
      </span>
    );
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 className="text-2xl font-bold" style={{ marginBottom: 'var(--space-xl)' }}>
          <Package size={28} style={{ display: 'inline', marginRight: '8px', verticalAlign: '-4px' }} />
          {t('orders_title')}
        </h1>

        {loading ? (
          <div className="flex flex-col gap-md">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '180px' }} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center" style={{ padding: 'var(--space-3xl) 0' }}>
            <ShoppingBag size={64} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-lg)', opacity: 0.3 }} />
            <p className="text-secondary text-lg">{t('orders_empty')}</p>
            <p className="text-tertiary text-sm" style={{ marginBottom: 'var(--space-xl)' }}>
              {t('orders_empty_subtitle')}
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              {t('cart_continue')}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-lg stagger">
            {orders.map((order) => (
              <div key={order.id} className="order-card animate-fadeIn" id={`order-${order.id}`}>
                <div className="order-header">
                  <div>
                    <span className="order-id">{t('orders_id')} #{order.id}</span>
                    <div className="flex items-center gap-sm mt-sm">
                      <Calendar size={14} className="text-tertiary" />
                      <span className="text-sm text-secondary">
                        {new Date(order.created_at).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  {statusBadge(order.status)}
                </div>

                <div style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                  <button 
                    className="btn btn-outline btn-sm" 
                    onClick={() => setLabelOrder(order)}
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                  >
                    <QrCode size={14} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }} />
                    <span style={{ verticalAlign: 'middle' }}>{lang === 'vi' ? 'In Vận Đơn (Mô phỏng)' : 'Print Label (Demo)'}</span>
                  </button>
                </div>

                <div className="order-items-list">
                  {order.items?.map((item, j) => (
                    <div key={j} className="order-item-row">
                      <span className="text-secondary">
                        {lang === 'vi' && item.name_vi ? item.name_vi : item.name}
                        {' '}× {item.quantity}
                      </span>
                      <span className="font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {order.shipping_address && (
                  <div className="flex items-center gap-sm text-sm text-secondary">
                    <Truck size={14} />
                    {t('orders_shipping_to')}: {typeof order.shipping_address === 'string' ? order.shipping_address : JSON.stringify(order.shipping_address)}
                  </div>
                )}

                <div className="order-total">
                  <span>{t('orders_total')}</span>
                  <span className="font-mono text-accent">${order.total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Shipping Label Modal — shows VIRTUAL/FAKE info, not real customer data */}
        {labelOrder && (
          <div className="modal" style={{ display: 'flex', zIndex: 1000 }}>
            <div className="modal-content animate-scaleIn" style={{ maxWidth: '420px', width: '100%', padding: '0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--surface-border)' }}>
                <h3 className="text-lg font-bold">🏷️ Nhãn Vận Đơn (Mô phỏng)</h3>
                <button className="btn-icon" onClick={() => setLabelOrder(null)}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ padding: '1.5rem', backgroundColor: '#f9fafb' }}>
                {/* ---- SIMULATED SHIPPING LABEL ---- */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '2px dashed #d1d5db' }}>

                  {/* QR Code */}
                  <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                    <QRCode value={qrValue(labelOrder)} size={140} style={{ margin: '0 auto' }} />
                    <p style={{ marginTop: '6px', fontSize: '0.75rem', color: '#6b7280' }}>
                      Mã QR — Shipper quét để xem địa chỉ thật
                    </p>
                  </div>

                  <hr style={{ borderColor: '#e5e7eb', marginBottom: '1rem' }} />

                  {/* Masked / Virtual Info */}
                  <div style={{ fontSize: '0.9rem', color: '#374151' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '14px', borderBottom: '1px dashed #e5e7eb', paddingBottom: '10px' }}>
                      ĐƠN HÀNG #{labelOrder.id ?? labelOrder.order_uuid?.slice(0,8)}
                    </p>

                    {/* Virtual name — anonymous, not real customer name */}
                    <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#6b7280', minWidth: '80px' }}>👤 Người nhận:</span>
                      <span style={{ fontFamily: 'monospace', color: '#374151', fontWeight: '600' }}>
                        Khách hàng #{labelOrder.id ?? '???'}
                      </span>
                      <span style={{ fontSize: '0.7rem', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px' }}>ẨN DANH</span>
                    </div>

                    {/* Virtual Phone */}
                    <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#6b7280', minWidth: '80px' }}>📞 SĐT:</span>
                      <span style={{ fontFamily: 'monospace', color: '#059669', fontWeight: '600' }}>
                        {virtualPhone(labelOrder.id ?? 0)}
                      </span>
                      <span style={{ fontSize: '0.7rem', background: '#ecfdf5', color: '#059669', padding: '2px 6px', borderRadius: '4px' }}>SỐ ẢO</span>
                    </div>

                    {/* Masked address */}
                    <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#6b7280', minWidth: '80px', marginTop: '2px' }}>📍 Địa chỉ:</span>
                      <div>
                        <span style={{ fontFamily: 'monospace', color: '#374151', fontWeight: '600' }}>
                          {(() => {
                            const addr = typeof labelOrder.shipping_address === 'string'
                              ? labelOrder.shipping_address : '';
                            return addr
                              ? `***, ${addr.split(',').slice(-1)[0].trim()}`
                              : '***, TP.HCM';
                          })()}
                        </span>
                        <span style={{ fontSize: '0.7rem', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>ĐỊA CHỈ ẨN</span>
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem', padding: '10px', background: '#fef3c7', borderRadius: '8px', fontSize: '0.78rem', color: '#92400e' }}>
                      🔒 <strong>Bảo mật PII:</strong> Đây là thông tin in trên nắp hộp hàng. Tên, SĐT và địa chỉ đều được ẩn danh hóa — người lạ cầm hộp không biết thông tin thật của bạn. Shipper quét mã QR trên App nội bộ mới xem được địa chỉ thật để giao hàng.
                    </div>
                  </div>
                </div>

                {/* Explanation note */}
                <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#6b7280', textAlign: 'center' }}>
                  Shipper dùng App/Web nội bộ → đăng nhập → quét QR → xem địa chỉ thật
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

