import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useLang } from '../contexts/LangContext';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { lang, t } = useLang();

  const name = lang === 'vi' && product.name_vi ? product.name_vi : product.name;


  const handleAddToCart = (e) => {
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      name_vi: product.name_vi,
      price: product.price,
      image_url: product.image_url,
    });
  };

  return (
    <div
      className="product-card animate-fadeIn"
      onClick={() => navigate(`/products/${product.id}`)}
      id={`product-card-${product.id}`}
    >
      <div className="product-card-image">
        <img
          src={product.image_url}
          alt={name}
          loading="lazy"
        />
      </div>
      <div className="product-card-body">
        <span className="product-card-category">{product.category}</span>
        <h3 className="product-card-name">{name}</h3>
        <div className="product-card-rating">
          <Star size={14} className="star" fill="#fbbf24" />
          <span>{product.rating}</span>
        </div>
        <div className="flex justify-between items-center" style={{ marginTop: '4px' }}>
          <span className="product-card-price">${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}</span>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleAddToCart}
            id={`add-to-cart-${product.id}`}
          >
            <ShoppingCart size={14} />
            {t('products_add_to_cart')}
          </button>
        </div>
      </div>
    </div>
  );
}
