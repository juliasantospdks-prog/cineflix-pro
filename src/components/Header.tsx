import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { LogOut, User, Menu, X, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import cineflixLogo from '@/assets/cineflix-logo.png';

const navLinks = [
  { label: 'Início', href: '#' },
  { label: 'Filmes', href: '#filmes' },
  { label: 'Séries', href: '#series' },
  { label: 'App', href: '#app' },
  { label: 'Planos', href: '#planos' },
];

const Header = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.header 
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-500 ${
          scrolled 
            ? 'bg-black/95 backdrop-blur-xl border-b border-white/5 shadow-lg' 
            : 'bg-gradient-to-b from-black/90 via-black/50 to-transparent'
        }`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 md:gap-3 group">
            <motion.img 
              src={cineflixLogo} 
              alt="Logo CineflixPayment" 
              className="h-8 md:h-12 w-auto object-contain group-hover:scale-105 transition-transform"
              whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
              transition={{ duration: 0.5 }}
            />
            <span className="font-cinema text-sm sm:text-xl md:text-2xl text-white">
              CINEFLIX<span className="text-cinema-red">PAYMENT</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link, i) => (
              <motion.a 
                key={link.label}
                href={link.href} 
                className="relative px-4 py-2 text-white/70 hover:text-white transition-colors font-medium text-sm group"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-cinema-red group-hover:w-3/4 transition-all duration-300 rounded-full" />
              </motion.a>
            ))}
          </nav>

          {/* Auth + Mobile Toggle */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" aria-label="Painel Admin" className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-cinema-red/20 border border-cinema-red/40 text-white text-xs font-bold hover:bg-cinema-red/30 transition-all">
                    <Shield className="w-3.5 h-3.5" /> <span className="hidden sm:inline">ADMIN</span>
                  </Link>
                )}
                <span className="hidden sm:flex items-center gap-2 text-white/60 text-sm bg-white/5 px-3 py-1.5 rounded-full">
                  <User className="w-3.5 h-3.5" />
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
                <button
                  onClick={() => signOut()}
                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all duration-300 flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="hidden sm:block px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all"
                >
                  Entrar
                </Link>
                <Link
                  to="/auth"
                  className="px-4 py-2 rounded-lg bg-cinema-red hover:bg-cinema-glow text-white font-bold text-sm hover:shadow-glow transition-all duration-300"
                >
                  Cadastrar
                </Link>
              </>
            )}
            
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
              className="md:hidden w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center"
            >
              {mobileOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="fixed inset-x-0 top-[56px] z-30 bg-black/95 backdrop-blur-xl border-b border-white/10 md:hidden overflow-hidden"
          >
            <nav className="flex flex-col p-4 gap-1">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all font-medium"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {link.label}
                </motion.a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;

