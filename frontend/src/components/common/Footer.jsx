import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function Footer() {
  const { isLight } = useTheme();

  return (
    <footer className={`border-t mt-20 ${isLight ? 'bg-[#f1eadc] border-[#d7cab2]' : 'bg-luxe-dark border-luxe-border'}`}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="font-display text-3xl text-gold-500 tracking-[0.3em]">LUXE</Link>
            <p className={`mt-3 font-body text-sm leading-relaxed max-w-xs ${isLight ? 'text-stone-600' : 'text-gray-500'}`}>
              Curating the finest products from around the world. Premium quality, timeless elegance.
            </p>
          </div>
          <div>
            <h4 className="font-sans text-xs tracking-widest uppercase text-gold-500 mb-4">Shop</h4>
            {['All Products', 'Fashion', 'Electronics', 'Jewelry', 'New Arrivals'].map(item => (
              <Link key={item} to="/products" className={`block font-sans text-sm mb-2 transition-colors ${isLight ? 'text-stone-600 hover:text-stone-900' : 'text-gray-500 hover:text-white'}`}>{item}</Link>
            ))}
          </div>
          <div>
            <h4 className="font-sans text-xs tracking-widest uppercase text-gold-500 mb-4">Support</h4>
            {['My Account', 'Order Tracking', 'Returns', 'Contact Us'].map(item => (
              <span key={item} className={`block font-sans text-sm mb-2 ${isLight ? 'text-stone-600' : 'text-gray-500'}`}>{item}</span>
            ))}
          </div>
        </div>
        <div className="gold-divider" />
        <p className={`text-center font-sans text-xs tracking-widest uppercase ${isLight ? 'text-stone-500' : 'text-gray-600'}`}>
          © 2026 LUXE · All rights reserved
        </p>
      </div>
    </footer>
  );
}
