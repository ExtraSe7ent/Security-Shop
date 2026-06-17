import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { productsAPI } from '../api';
import { useLang } from '../contexts/LangContext';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useLang();
  const debounceTimer = useRef(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productsAPI.getAll();
      setProducts(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearch(query);

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      if (!query.trim()) {
        fetchProducts();
        return;
      }
      try {
        const res = await productsAPI.search(query);
        setProducts(res.data.results || res.data);
      } catch (err) {
        console.error('Search failed:', err);
      }
    }, 400);
  };

  return (
    <div className="page">
      <div className="container">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-glow" />
          <h1>
            {t('hero_title_1')}<br />
            <span className="gradient">{t('hero_title_2')}</span>
          </h1>
          <p>{t('hero_subtitle')}</p>

          {/* Search Bar — SQLi Demo */}
          <div className="search-bar" id="search-bar">
            <Search />
            <input
              type="text"
              placeholder={t('hero_search_placeholder')}
              value={search}
              onChange={handleSearch}
              id="search-input"
            />
          </div>
        </section>

        {/* Products Grid */}
        <section style={{ marginTop: 'var(--space-2xl)' }}>
          <h2 className="text-xl font-bold" style={{ marginBottom: 'var(--space-lg)' }}>
            {t('products_title')}
          </h2>

          {loading ? (
            <div className="grid grid-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '350px' }} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center" style={{ padding: 'var(--space-3xl)' }}>
              <p className="text-error">{t('error')}</p>
              <button className="btn btn-secondary mt-md" onClick={fetchProducts}>
                {t('retry')}
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center" style={{ padding: 'var(--space-3xl)' }}>
              <p className="text-secondary">{t('products_no_results')}</p>
            </div>
          ) : (
            <div className="grid grid-3 stagger">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
