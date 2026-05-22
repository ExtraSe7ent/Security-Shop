import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import ChatWidget from '../components/ChatWidget'
import Navbar from '../components/Navbar'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [reviews, setReviews] = useState({})
  const [reviewText, setReviewText] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [mode, setMode] = useState('secure')
  const [cartUpdated, setCartUpdated] = useState(0)
  const [addedToCart, setAddedToCart] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    // Lấy mode hiện tại từ backend
    axios.get('http://localhost:8000/').then(res => setMode(res.data.mode)).catch(() => {})
    // Lấy danh sách sản phẩm
    axios.get('http://localhost:8000/api/products/')
      .then(res => setProducts(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = async () => {
    if (!search.trim()) return
    try {
      const res = await axios.get('http://localhost:8000/api/products/search?q=' + search)
      setSearchResults(res.data)
    } catch (err) { console.error(err) }
  }

  const clearSearch = () => { setSearchResults(null); setSearch('') }

  const loadReviews = async (productId) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/reviews/${productId}`)
      setReviews(prev => ({ ...prev, [productId]: res.data }))
    } catch (err) { console.error(err) }
  }

  const submitReview = async (productId) => {
    const token = localStorage.getItem('token')
    if (!token) { alert('Please login to write a review'); return }
    if (!reviewText.trim()) return
    try {
      await axios.post('http://localhost:8000/api/reviews/', {
        product_id: productId, content: reviewText
      }, { headers: { Authorization: `Bearer ${token}` } })
      setReviewText('')
      loadReviews(productId)
    } catch (err) { console.error(err) }
  }

  const toggleReviews = (productId) => {
    if (selectedProduct === productId) {
      setSelectedProduct(null)
    } else {
      setSelectedProduct(productId)
      loadReviews(productId)
    }
  }

  const handleAddToCart = async (productId) => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }
    try {
      await axios.post('http://localhost:8000/api/cart/add',
        { product_id: productId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setAddedToCart(prev => ({ ...prev, [productId]: true }))
      setCartUpdated(v => v + 1) // trigger Navbar cart count refresh
      setTimeout(() => setAddedToCart(prev => ({ ...prev, [productId]: false })), 2000)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add to cart')
    }
  }

  const renderReviewContent = (content) => {
    if (mode === 'vuln') {
      // ⚠️ VULN: dangerouslySetInnerHTML → Stored XSS thực thi được
      return <p style={styles.reviewContent} dangerouslySetInnerHTML={{ __html: content }} />
    } else {
      // ✅ SECURE: Render plain text → XSS không thực thi (backend đã escape)
      return <p style={styles.reviewContent}>{content}</p>
    }
  }

  return (
    <div style={styles.page}>
      <Navbar onCartUpdate={cartUpdated} />

      {mode === 'vuln' && (
        <div style={styles.modeBanner}>
          ⚠️ <strong>VULNERABILITY MODE</strong> — Các lỗ hổng bảo mật đang được kích hoạt
        </div>
      )}
      {mode === 'secure' && (
        <div style={{ ...styles.modeBanner, background: '#1a6b3a', borderColor: '#2ecc71' }}>
          🛡️ <strong>SECURE MODE</strong> — Các biện pháp bảo mật đang hoạt động
        </div>
      )}

      <div style={styles.container}>
        <h2 style={styles.heading}>Our Products</h2>

        <div style={styles.searchBar}>
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Search products... (try SQL injection in vuln mode)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button style={styles.searchBtn} onClick={handleSearch}>Search</button>
          {searchResults && (
            <button style={{ ...styles.searchBtn, background: '#888' }} onClick={clearSearch}>Clear</button>
          )}
        </div>

        {searchResults && (
          <div style={styles.searchResultBox}>
            <p style={styles.searchResultLabel}>
              {searchResults.length} result(s) for: <strong>"{search}"</strong>
              {mode === 'vuln' && <span style={{ color: '#e74c3c', marginLeft: 8 }}>⚠️ SQL Injection possible!</span>}
            </p>
            {searchResults.length > 0 ? (
              <div style={styles.grid}>
                {searchResults.map((p, i) => (
                  <div key={i} style={{ ...styles.card, padding: '16px' }}>
                    <span style={styles.category}>{p.category || 'Data'}</span>
                    <h3 style={{ ...styles.productName, marginTop: '8px' }}>{p.name}</h3>
                    <p style={{ fontSize: '13px', color: '#e74c3c', fontWeight: '600', wordBreak: 'break-all' }}>{p.price}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#888', fontSize: '14px' }}>No results found.</p>
            )}
          </div>
        )}

        {loading ? (
          <p style={styles.loading}>Loading products...</p>
        ) : (
          <div style={styles.grid}>
            {products.map(product => (
              <div key={product.id} style={styles.card}>
                <img src={product.image_url} alt={product.name} style={styles.image} />
                <div style={styles.cardBody}>
                  <span style={styles.category}>{product.category}</span>
                  <h3 style={styles.productName}>{product.name}</h3>
                  <p style={styles.description}>{product.description}</p>
                  <div style={styles.footer}>
                    <span style={styles.price}>{product.price.toLocaleString()} VND</span>
                    <span style={styles.stock}>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</span>
                  </div>
                  <button
                    style={{
                      ...styles.addBtn,
                      background: addedToCart[product.id] ? '#27ae60' : '#0f3460',
                    }}
                    onClick={() => handleAddToCart(product.id)}
                    disabled={product.stock === 0}
                  >
                    {addedToCart[product.id] ? '✓ Added to Cart' : 'Add to Cart'}
                  </button>

                  {/* REVIEWS SECTION */}
                  <div style={styles.reviewSection}>
                    <button style={styles.reviewToggleBtn} onClick={() => toggleReviews(product.id)}>
                      💬 {selectedProduct === product.id ? 'Hide Reviews' : 'Show Reviews'}
                    </button>

                    {selectedProduct === product.id && (
                      <div style={{ marginTop: '10px' }}>
                        {(reviews[product.id] || []).length === 0 ? (
                          <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>No reviews yet. Be the first!</p>
                        ) : (
                          (reviews[product.id] || []).map((r, i) => (
                            <div key={i} style={styles.reviewItem}>
                              <strong style={styles.reviewUsername}>👤 {r.username}</strong>
                              {/* Render theo mode: vuln → dangerouslySetInnerHTML, secure → plain text */}
                              {renderReviewContent(r.content)}
                            </div>
                          ))
                        )}

                        {localStorage.getItem('token') ? (
                          <div style={styles.reviewForm}>
                            <input
                              style={styles.reviewInput}
                              placeholder={mode === 'vuln' ? 'Try: <img src=x onerror=alert(document.cookie)>' : 'Write a review...'}
                              value={selectedProduct === product.id ? reviewText : ''}
                              onChange={e => setReviewText(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && submitReview(product.id)}
                            />
                            <button style={styles.reviewSubmitBtn} onClick={() => submitReview(product.id)}>Post</button>
                          </div>
                        ) : (
                          <p style={{ fontSize: '11px', color: '#aaa', marginTop: '6px' }}>
                            <span style={{ color: '#0f3460', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/login')}>Login</span> to write a review
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ChatWidget />
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f5f5' },
  modeBanner: {
    background: '#7b1c1c',
    borderBottom: '2px solid #e74c3c',
    color: 'white',
    textAlign: 'center',
    padding: '8px 16px',
    fontSize: '13px',
  },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' },
  heading: { fontSize: '24px', fontWeight: '700', marginBottom: '16px', color: '#1a1a2e' },
  loading: { textAlign: 'center', color: '#666', padding: '60px' },
  searchBar: { display: 'flex', gap: '8px', marginBottom: '20px' },
  searchInput: { flex: 1, padding: '10px 16px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none' },
  searchBtn: { padding: '10px 20px', background: '#0f3460', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  searchResultBox: { background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '16px', marginBottom: '24px' },
  searchResultLabel: { fontSize: '13px', color: '#666', marginBottom: '12px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px', alignItems: 'stretch' },
  card: { background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column' },
  image: { width: '100%', height: '180px', objectFit: 'cover' },
  cardBody: { padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 },
  category: { fontSize: '11px', background: '#e8f0fe', color: '#0f3460', padding: '3px 8px', borderRadius: '4px', fontWeight: '600', textTransform: 'uppercase', alignSelf: 'flex-start' },
  productName: { fontSize: '16px', fontWeight: '700', margin: '8px 0 6px', color: '#1a1a2e' },
  description: { fontSize: '13px', color: '#666', lineHeight: '1.5', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', marginTop: 'auto' },
  price: { fontSize: '16px', fontWeight: '700', color: '#0f3460' },
  stock: { fontSize: '12px', color: '#888' },
  addBtn: { width: '100%', padding: '10px', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.3s' },
  reviewSection: { marginTop: '12px', borderTop: '1px solid #eee', paddingTop: '10px' },
  reviewToggleBtn: { fontSize: '12px', color: '#0f3460', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '600' },
  reviewItem: { background: '#f9f9f9', borderRadius: '6px', padding: '8px 10px', marginBottom: '6px' },
  reviewUsername: { fontSize: '12px', color: '#0f3460' },
  reviewContent: { fontSize: '12px', color: '#333', margin: '4px 0 0' },
  reviewForm: { display: 'flex', gap: '6px', marginTop: '8px' },
  reviewInput: { flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px', outline: 'none' },
  reviewSubmitBtn: { padding: '6px 14px', background: '#0f3460', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
}