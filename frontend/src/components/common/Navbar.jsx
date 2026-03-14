import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiSearch, FiMenu, FiX, FiLogOut, FiSettings, FiBriefcase, FiSun, FiMoon } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar() {
  const { user, logout, isAdmin, isSeller } = useAuth();
  const { cart } = useCart();
  const { isLight, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navShell = isLight ? 'bg-[#f8f3e9]/95 border-[#d7cab2]' : 'bg-luxe-black/95 border-luxe-border';
  const navText = isLight ? 'text-stone-600 hover:text-stone-900' : 'text-gray-400 hover:text-white';
  const navActive = isLight ? 'text-gold-700' : 'text-gold-500';
  const iconTone = isLight ? 'text-stone-600 hover:text-gold-700' : 'text-gray-400 hover:text-gold-500';
  const dropdownShell = isLight ? 'bg-[#fffaf1] border-[#d7cab2]' : 'bg-luxe-card border-luxe-border';
  const dropdownItem = isLight ? 'text-stone-700 hover:text-gold-700 hover:bg-[#f1e8d6]' : 'text-gray-300 hover:text-gold-500 hover:bg-luxe-dark';

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b ${navShell}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="font-display text-2xl text-gold-500 tracking-[0.3em] uppercase">
            LUXE
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {['/', '/products', '/products?category=Fashion', '/products?category=Electronics'].map((path, i) => {
              const labels = ['Home', 'All Products', 'Fashion', 'Electronics'];
              return (
                <Link key={i} to={path}
                  className={`font-sans text-xs tracking-widest uppercase transition-colors duration-200 
                    ${location.pathname === path.split('?')[0] && !path.includes('?') ? navActive : navText}`}>
                  {labels[i]}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className={`border border-gold-500/50 text-sm px-3 py-1.5 outline-none w-48 ${isLight ? 'bg-[#f1e8d6] text-stone-900 placeholder:text-stone-500' : 'bg-luxe-dark text-white placeholder:text-gray-500'}`} />
                <button type="button" onClick={() => setSearchOpen(false)} className={`ml-2 transition-colors ${navText}`}>
                  <FiX size={18} />
                </button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} className={`transition-colors ${iconTone}`}>
                <FiSearch size={20} />
              </button>
            )}

            {/* Cart */}
            <Link to="/cart" className={`relative transition-colors ${iconTone}`}>
              <FiShoppingCart size={20} />
              {cart.itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gold-500 text-luxe-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {cart.itemCount > 9 ? '9+' : cart.itemCount}
                </span>
              )}
            </Link>

            <button
              onClick={toggleTheme}
              className="theme-icon-btn"
              aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
              title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {isLight ? <FiMoon size={18} /> : <FiSun size={18} />}
            </button>

            {/* User */}
            {user ? (
              <div className="relative group">
                <button className={`flex items-center gap-2 transition-colors ${iconTone}`}>
                  <FiUser size={20} />
                  <span className="hidden md:block font-sans text-xs">{user.fullName?.split(' ')[0]}</span>
                </button>
                <div className={`absolute right-0 top-full mt-2 w-44 border shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ${dropdownShell}`}>
                  <Link to="/orders" className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors ${dropdownItem}`}>
                    <FiUser size={14} /> My Orders
                  </Link>
                  {isSeller && (
                    <Link to="/seller" className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors ${dropdownItem}`}>
                      <FiBriefcase size={14} /> Seller Studio
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors ${dropdownItem}`}>
                      <FiSettings size={14} /> Admin Panel
                    </Link>
                  )}
                  <button onClick={logout} className={`w-full flex items-center gap-2 px-4 py-3 text-sm transition-colors border-t ${isLight ? 'border-[#d7cab2] text-stone-700 hover:text-red-500 hover:bg-[#f1e8d6]' : 'border-luxe-border text-gray-300 hover:text-red-400 hover:bg-luxe-dark'}`}>
                    <FiLogOut size={14} /> Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="btn-outline text-xs px-4 py-2">Login</Link>
            )}

            {/* Mobile menu */}
            <button onClick={() => setMenuOpen(!menuOpen)} className={`md:hidden transition-colors ${navText}`}>
              {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className={`md:hidden border-t py-4 animate-fade-in ${isLight ? 'border-[#d7cab2]' : 'border-luxe-border'}`}>
            {[
              { path: '/', label: 'Home' },
              { path: '/products', label: 'Products' },
              ...(user ? [{ path: '/orders', label: 'My Orders' }] : []),
              ...(isSeller ? [{ path: '/seller', label: 'Seller Studio' }] : []),
              ...(isAdmin ? [{ path: '/admin', label: 'Admin Panel' }] : []),
            ].map((item) => (
              <Link key={item.path} to={item.path} onClick={() => setMenuOpen(false)}
                className={`block py-3 text-xs tracking-widest uppercase ${isLight ? 'text-stone-600 hover:text-gold-700' : 'text-gray-400 hover:text-gold-500'}`}>
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
