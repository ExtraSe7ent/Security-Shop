import { X, ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useLang } from '../contexts/LangContext';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice, totalItems } = useCart();
  const { lang, t } = useLang();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCheckout = () => {
    setIsOpen(false);
    navigate('/checkout');
  };

  return (
    <>
      <div className="overlay" onClick={() => setIsOpen(false)} />
      <div className="cart-drawer" id="cart-drawer">
        <div className="cart-drawer-header">
          <h2>{t('cart_title')} ({totalItems})</h2>
          <button className="btn btn-ghost btn-icon" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <ShoppingBag size={48} />
            <p>{t('cart_empty')}</p>
            <p className="text-sm text-tertiary">{t('cart_empty_subtitle')}</p>
            <button className="btn btn-primary" onClick={() => { setIsOpen(false); navigate('/'); }}>
              {t('cart_continue')}
            </button>
          </div>
        ) : (
          <>
            <div className="cart-drawer-items">
              {items.map(item => {
                const name = lang === 'vi' && item.name_vi ? item.name_vi : item.name;
                return (
                  <div key={item.id} className="cart-item animate-fadeIn">
                    <div className="cart-item-image">
                      <img src={item.image_url} alt={name} />
                    </div>
                    <div className="cart-item-info">
                      <div className="cart-item-name">{name}</div>
                      <div className="cart-item-price">${(item.price * item.quantity).toFixed(2)}</div>
                      <div className="cart-item-qty">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                          <Minus size={12} />
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => removeItem(item.id)}
                      style={{ color: 'var(--error)', flexShrink: 0 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="cart-drawer-footer">
              <div className="cart-total">
                <span>{t('cart_total')}</span>
                <span className="amount">${totalPrice.toFixed(2)}</span>
              </div>
              <button
                className="btn btn-primary btn-lg w-full"
                onClick={handleCheckout}
                id="checkout-button"
              >
                {t('cart_checkout')}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
