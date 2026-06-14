import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useLang } from '../contexts/LangContext';
import { ordersAPI, paymentsAPI } from '../api';

export default function Checkout() {
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const { lang, t } = useLang();
  const navigate = useNavigate();

  const [savedCards, setSavedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [formData, setFormData] = useState({
    address: '',
    phone: '',
    card_number: '',
    card_holder: '',
    expiry: '',
    cvv: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (items.length === 0 && !success) {
      navigate('/');
      return;
    }
    // Fetch saved cards
    paymentsAPI.getCards()
      .then(res => setSavedCards(res.data.payment_methods || []))
      .catch(() => {});
  }, [user, items.length, navigate, success]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let paymentMethodId = selectedCard;

      // If user entered a new card, save it first
      if (!selectedCard && formData.card_number) {
        const cardData = {
          card_number: formData.card_number.replace(/\s/g, ''),
          card_holder: formData.card_holder,
          expiry: formData.expiry,
          card_type: 'visa',
        };
        const cardRes = await paymentsAPI.addCard(cardData);
        paymentMethodId = cardRes.data.id;
      }

      const orderData = {
        items: items.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        shipping_address: formData.address,
        shipping_phone: formData.phone,
        payment_method_id: paymentMethodId || undefined,
      };

      await ordersAPI.create(orderData);
      setSuccess(true);
      clearCart();
    } catch (err) {
      setError(err.response?.data?.detail || t('error'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page">
        <div className="container" style={{ maxWidth: '500px' }}>
          <div className="auth-card text-center animate-fadeInUp">
            <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto var(--space-lg)' }} />
            <h1 style={{ fontSize: '24px', marginBottom: 'var(--space-sm)' }}>{t('checkout_success')}</h1>
            <p className="text-secondary" style={{ marginBottom: 'var(--space-xl)' }}>
              {lang === 'vi'
                ? 'Đơn hàng của bạn đã được ghi nhận thành công.'
                : 'Your order has been recorded successfully.'}
            </p>
            <div className="flex gap-md justify-center">
              <button className="btn btn-primary" onClick={() => navigate('/orders')}>
                {t('nav_orders')}
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/')}>
                {t('cart_continue')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <h1 className="text-2xl font-bold" style={{ marginBottom: 'var(--space-xl)' }}>
          {t('checkout_title')}
        </h1>

        <div className="checkout-grid">
          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
            {/* Shipping */}
            <div className="card">
              <div className="card-body">
                <h2 className="text-lg font-semibold" style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={18} />
                  {t('checkout_shipping')}
                </h2>
                <div className="flex flex-col gap-md">
                  <div className="input-group">
                    <label htmlFor="address">{t('checkout_address')}</label>
                    <input
                      id="address"
                      name="address"
                      className="input"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="phone">{t('checkout_phone')}</label>
                    <input
                      id="phone"
                      name="phone"
                      className="input"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="card">
              <div className="card-body">
                <h2 className="text-lg font-semibold" style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={18} />
                  {t('checkout_payment')}
                </h2>

                {/* Saved Cards — IDOR Demo */}
                {savedCards.length > 0 && (
                  <div style={{ marginBottom: 'var(--space-md)' }}>
                    <p className="text-sm text-secondary" style={{ marginBottom: 'var(--space-sm)' }}>
                      {t('checkout_saved_cards')}
                    </p>
                    <div className="flex flex-col gap-sm">
                      {savedCards.map(card => (
                        <label
                          key={card.id}
                          className="flex items-center gap-md"
                          style={{
                            padding: 'var(--space-md)',
                            background: selectedCard === card.id ? 'var(--accent-light)' : 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            border: selectedCard === card.id ? '1px solid var(--accent)' : '1px solid transparent',
                            transition: 'all var(--transition-fast)',
                          }}
                        >
                          <input
                            type="radio"
                            name="saved_card"
                            value={card.id}
                            checked={selectedCard === card.id}
                            onChange={() => setSelectedCard(card.id)}
                          />
                          <div>
                            <div className="font-mono font-semibold">
                              •••• •••• •••• {card.last_four}
                            </div>
                            <div className="text-xs text-secondary">
                              {card.card_type} · {t('checkout_expiry')}: {card.expiry}
                            </div>
                          </div>
                        </label>
                      ))}
                      <label
                        className="flex items-center gap-md"
                        style={{
                          padding: 'var(--space-md)',
                          background: selectedCard === null ? 'var(--accent-light)' : 'var(--bg-tertiary)',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          border: selectedCard === null ? '1px solid var(--accent)' : '1px solid transparent',
                        }}
                      >
                        <input
                          type="radio"
                          name="saved_card"
                          checked={selectedCard === null}
                          onChange={() => setSelectedCard(null)}
                        />
                        <span>{t('checkout_use_new_card')}</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* New Card Fields */}
                {selectedCard === null && (
                  <div className="flex flex-col gap-md">
                    <div className="input-group">
                      <label htmlFor="card_number">{t('checkout_card_number')}</label>
                      <input
                        id="card_number"
                        name="card_number"
                        className="input font-mono"
                        placeholder="1234 5678 9012 3456"
                        value={formData.card_number}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="card_holder">{t('checkout_card_holder')}</label>
                      <input
                        id="card_holder"
                        name="card_holder"
                        className="input"
                        value={formData.card_holder}
                        onChange={handleChange}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                      <div className="input-group">
                        <label htmlFor="expiry">{t('checkout_expiry')}</label>
                        <input
                          id="expiry"
                          name="expiry"
                          className="input"
                          placeholder="MM/YY"
                          value={formData.expiry}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="input-group">
                        <label htmlFor="cvv">{t('checkout_cvv')}</label>
                        <input
                          id="cvv"
                          name="cvv"
                          className="input"
                          placeholder="123"
                          value={formData.cvv}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-sm" style={{ color: 'var(--error)', fontSize: '14px' }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              id="place-order-button"
            >
              {loading ? t('loading') : t('checkout_place_order')}
            </button>
          </form>

          {/* Order Summary */}
          <div className="checkout-summary">
            <h2 className="text-lg font-semibold" style={{ marginBottom: 'var(--space-md)' }}>
              {t('checkout_order_summary')}
            </h2>

            <div className="flex flex-col gap-sm">
              {items.map(item => {
                const name = lang === 'vi' && item.name_vi ? item.name_vi : item.name;
                return (
                  <div key={item.id} className="flex justify-between" style={{ fontSize: '14px' }}>
                    <span className="text-secondary">
                      {name} × {item.quantity}
                    </span>
                    <span className="font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid var(--border-primary)', margin: 'var(--space-md) 0', paddingTop: 'var(--space-md)' }}>
              <div className="flex justify-between" style={{ fontSize: '14px', marginBottom: '8px' }}>
                <span className="text-secondary">{t('checkout_subtotal')}</span>
                <span className="font-mono">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between" style={{ fontSize: '14px', marginBottom: '8px' }}>
                <span className="text-secondary">{t('checkout_shipping_fee')}</span>
                <span className="text-success">{t('checkout_free')}</span>
              </div>
              <div className="flex justify-between font-bold" style={{ fontSize: '18px', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--border-primary)' }}>
                <span>{t('cart_total')}</span>
                <span className="font-mono text-accent">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
