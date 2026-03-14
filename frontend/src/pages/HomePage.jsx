import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productApi } from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { FiArrowRight, FiTruck, FiShield, FiRefreshCw, FiStar } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const { isLight } = useTheme();

  useEffect(() => {
    productApi.getAll({ page: 0, size: 8, sortBy: 'createdAt', sortDir: 'desc' })
      .then(r => setFeatured(r.data.content || []))
      .catch(() => {});
    productApi.getCategories()
      .then(r => setCategories(r.data || []))
      .catch(() => {});
  }, []);

  return (
    <div className="page-enter">
      {/* Hero */}
      <section className={`relative min-h-screen flex items-center justify-center overflow-hidden ${isLight ? 'home-hero-light' : 'home-hero-dark'}`}>
        <div className={`absolute inset-0 ${isLight ? 'home-hero-light-base' : 'home-hero-dark-base'}`} />
        <div className="absolute inset-0 home-hero-pattern" />

        {/* Decorative lines */}
        <div className="absolute left-8 top-1/4 w-px h-32 bg-gradient-to-b from-transparent via-gold-500/30 to-transparent" />
        <div className="absolute right-8 top-1/3 w-px h-48 bg-gradient-to-b from-transparent via-gold-500/20 to-transparent" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <p className="font-sans text-gold-500 text-xs tracking-[0.5em] uppercase mb-6 animate-fade-in">
            Premium · Curated · Exclusive
          </p>
          <h1 className={`font-display text-6xl md:text-8xl leading-none mb-6 animate-slide-up ${isLight ? 'text-stone-900' : 'text-white'}`}>
            Discover
            <span className="block text-gold-500 italic">Luxury</span>
          </h1>
          <p className={`font-body text-xl md:text-2xl mb-10 max-w-2xl mx-auto leading-relaxed ${isLight ? 'text-stone-700' : 'text-gray-400'}`}>
            From haute couture to cutting-edge electronics — every product, curated for the discerning eye.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products" className="btn-gold inline-flex items-center gap-2">
              Shop Now <FiArrowRight />
            </Link>
            <Link to="/products" className="btn-outline inline-flex items-center gap-2">
              Explore Collections
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className={`font-sans text-xs tracking-widest uppercase ${isLight ? 'text-stone-500' : 'text-gray-600'}`}>Scroll</span>
          <div className={`w-px h-8 bg-gradient-to-b ${isLight ? 'from-stone-500' : 'from-gray-600'} to-transparent`} />
        </div>
      </section>

      {/* Features */}
      <section className={`${isLight ? 'bg-[#f1eadc]' : 'bg-luxe-dark'} border-y border-luxe-border py-8`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: FiTruck, text: 'Free Shipping', sub: 'Orders over ₹999' },
              { icon: FiShield, text: 'Secure Payments', sub: '100% protected' },
              { icon: FiRefreshCw, text: 'Easy Returns', sub: '30-day policy' },
              { icon: FiStar, text: 'Premium Quality', sub: 'Curated selection' },
            ].map(({ icon: Icon, text, sub }) => (
              <div key={text} className="flex items-center gap-3 p-4">
                <Icon size={24} className="text-gold-500 shrink-0" />
                <div>
                  <p className={`font-sans text-sm font-semibold ${isLight ? 'text-stone-900' : 'text-white'}`}>{text}</p>
                  <p className={`font-sans text-xs ${isLight ? 'text-stone-600' : 'text-gray-500'}`}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="font-sans text-xs text-gold-500 tracking-widest uppercase mb-2">Browse By</p>
              <h2 className="section-title">Categories</h2>
            </div>
            <Link to="/products" className="font-sans text-xs text-gray-400 hover:text-gold-500 tracking-widest uppercase transition-colors flex items-center gap-1">
              All <FiArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((cat, i) => (
              <Link key={cat} to={`/products?category=${cat}`}
                className="card-luxe p-6 text-center group cursor-pointer"
                style={{ animationDelay: `${i * 0.1}s` }}>
                <p className="font-display text-2xl text-white group-hover:text-gold-500 transition-colors">{cat}</p>
                <p className="font-sans text-xs text-gray-500 mt-1 tracking-widest uppercase">Shop Now →</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="font-sans text-xs text-gold-500 tracking-widest uppercase mb-2">Hand Picked</p>
            <h2 className="section-title">Featured Products</h2>
          </div>
          <Link to="/products" className="font-sans text-xs text-gray-400 hover:text-gold-500 tracking-widest uppercase transition-colors flex items-center gap-1">
            View All <FiArrowRight size={12} />
          </Link>
        </div>
        {featured.length === 0 ? (
          <div className="text-center py-20 text-gray-500 font-sans">
            <p className="text-lg mb-2">No products yet</p>
            <p className="text-sm">Add products via the Admin Panel</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Banner */}
      <section className="mx-4 md:mx-8 my-16 relative overflow-hidden">
        <div className={`${isLight ? 'bg-gradient-to-r from-[#f6efdf] to-[#efe3cc]' : 'bg-gradient-to-r from-luxe-dark to-luxe-card'} border border-gold-500/30 p-12 md:p-20 text-center`}>
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, #C9A84C 0, #C9A84C 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }} />
          <p className="font-sans text-xs text-gold-500 tracking-[0.5em] uppercase mb-4 relative">Limited Time</p>
          <h2 className={`font-display text-4xl md:text-6xl mb-4 relative ${isLight ? 'text-stone-900' : 'text-white'}`}>New Season Sale</h2>
          <p className={`font-body text-xl mb-8 relative ${isLight ? 'text-stone-700' : 'text-gray-400'}`}>Up to 60% off on premium collections</p>
          <Link to="/products" className="btn-gold relative inline-flex items-center gap-2">
            Shop The Sale <FiArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
}
