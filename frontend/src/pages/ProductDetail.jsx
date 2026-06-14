import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Star, MessageCircle, Send, AlertTriangle } from 'lucide-react';
import { productsAPI, reviewsAPI } from '../api';
import { useCart } from '../contexts/CartContext';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { lang, t } = useLang();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ content: '', rating: 5 });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      // getById returns { product, reviews } in one call
      const res = await productsAPI.getById(id);
      setProduct(res.data.product);
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error('Failed to fetch product:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.content.trim()) return;
    setReviewLoading(true);
    setReviewError('');
    try {
      await reviewsAPI.create({
        product_id: parseInt(id),
        content: reviewForm.content,
        rating: reviewForm.rating,
      });
      setReviewSuccess(true);
      setReviewForm({ content: '', rating: 5 });
      // Reload reviews after submitting
      setTimeout(() => {
        fetchData();
        setReviewSuccess(false);
      }, 1500);
    } catch (err) {
      setReviewError(err.response?.data?.detail || t('error'));
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="product-detail">
            <div className="skeleton" style={{ height: '500px' }} />
            <div className="flex flex-col gap-md">
              <div className="skeleton" style={{ height: '40px', width: '70%' }} />
              <div className="skeleton" style={{ height: '30px', width: '30%' }} />
              <div className="skeleton" style={{ height: '100px' }} />
              <div className="skeleton" style={{ height: '48px', width: '200px' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page">
        <div className="container text-center" style={{ padding: 'var(--space-3xl) 0' }}>
          <p className="text-secondary">{t('error')}</p>
          <button className="btn btn-secondary mt-md" onClick={() => navigate('/')}>
            {t('back')}
          </button>
        </div>
      </div>
    );
  }

  const name = lang === 'vi' && product.name_vi ? product.name_vi : product.name;
  const description = lang === 'vi' && product.description_vi ? product.description_vi : product.description;

  return (
    <div className="page">
      <div className="container">
        {/* Back Button */}
        <button
          className="btn btn-ghost mb-lg"
          onClick={() => navigate('/')}
          style={{ marginBottom: 'var(--space-lg)' }}
        >
          <ArrowLeft size={16} />
          {t('back')}
        </button>

        {/* Product Detail */}
        <div className="product-detail animate-fadeIn">
          <div className="product-detail-image">
            <img src={product.image_url} alt={name} />
          </div>

          <div className="product-detail-info">
            <span className="badge badge-info">{product.category}</span>
            <h1>{name}</h1>

            <div className="flex items-center gap-sm">
              <Star size={18} fill="#fbbf24" color="#fbbf24" />
              <span className="font-semibold">{product.rating}</span>
              <span className="text-secondary">
                ({reviews.length} {t('products_reviews')})
              </span>
            </div>

            <div className="price">${product.price.toFixed(2)}</div>

            <div className="description">{description}</div>

            <div className="flex gap-md">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => addItem({
                  id: product.id,
                  name: product.name,
                  name_vi: product.name_vi,
                  price: product.price,
                  image_url: product.image_url,
                })}
                id="add-to-cart-detail"
              >
                <ShoppingCart size={18} />
                {t('products_add_to_cart')}
              </button>
            </div>

          </div>
        </div>

        {/* Reviews Section */}
        <section style={{ marginTop: 'var(--space-3xl)' }}>
          <h2 className="text-xl font-bold" style={{ marginBottom: 'var(--space-lg)' }}>
            <MessageCircle size={20} style={{ display: 'inline', marginRight: '8px' }} />
            {t('products_customer_reviews')} ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <p className="text-secondary">{t('products_no_results')}</p>
          ) : (
            <div className="flex flex-col gap-md stagger">
              {reviews.map((review, i) => (
                <div key={i} className="card animate-fadeIn">
                  <div className="card-body">
                    <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
                      <span className="font-semibold">{review.username || 'Anonymous'}</span>
                      <div className="flex items-center gap-xs">
                        {[...Array(5)].map((_, j) => (
                          <Star
                            key={j}
                            size={14}
                            fill={j < review.rating ? '#fbbf24' : 'transparent'}
                            color={j < review.rating ? '#fbbf24' : 'var(--text-tertiary)'}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-secondary" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      {review.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Write Review Form — needed to demo Prompt Injection attack */}
          {user && (
            <div className="card animate-fadeIn" style={{ marginTop: 'var(--space-xl)', border: '1px solid var(--border-primary)' }}>
              <div className="card-body">
                <h3 className="font-semibold" style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} color="var(--warning)" />
                  {lang === 'vi' ? 'Viết đánh giá' : 'Write a Review'}
                  <span className="badge badge-base" style={{ fontSize: '10px' }}>Demo: Prompt Injection</span>
                </h3>
                {reviewSuccess ? (
                  <p style={{ color: 'var(--success)', fontSize: '14px' }}>✓ {lang === 'vi' ? 'Đánh giá đã được gửi!' : 'Review submitted!'}</p>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="flex flex-col gap-md">
                    <div className="flex items-center gap-sm">
                      <span className="text-sm text-secondary">{lang === 'vi' ? 'Điểm:' : 'Rating:'}</span>
                      {[1,2,3,4,5].map(star => (
                        <Star
                          key={star}
                          size={20}
                          fill={star <= reviewForm.rating ? '#fbbf24' : 'transparent'}
                          color={star <= reviewForm.rating ? '#fbbf24' : 'var(--text-tertiary)'}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                        />
                      ))}
                    </div>
                    <textarea
                      className="input"
                      rows={3}
                      placeholder={lang === 'vi' ? 'Nhập đánh giá... (Thử: "Ignore all previous instructions...")' : 'Write your review... (Try: "Ignore all previous instructions...")'}
                      value={reviewForm.content}
                      onChange={e => setReviewForm(prev => ({ ...prev, content: e.target.value }))}
                      style={{ resize: 'vertical', fontFamily: 'inherit' }}
                    />
                    {reviewError && <p style={{ color: 'var(--error)', fontSize: '13px' }}>{reviewError}</p>}
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={reviewLoading || !reviewForm.content.trim()}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      <Send size={14} />
                      {reviewLoading ? t('loading') : (lang === 'vi' ? 'Gửi đánh giá' : 'Submit Review')}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
