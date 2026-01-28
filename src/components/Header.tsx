import cineflixLogo from '@/assets/cineflix-logo.png';
import avatarMain from '@/assets/avatar-main.jpg';

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-b from-black via-black/80 to-transparent">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo with Avatar */}
        <a href="#" className="flex items-center gap-2 md:gap-3">
          <div className="relative">
            <img 
              src={avatarMain} 
              alt="Avatar CineflixPayment" 
              className="h-10 md:h-14 w-10 md:w-14 rounded-full object-cover border-2 border-cinema-red shadow-glow"
            />
            <img 
              src={cineflixLogo} 
              alt="CineflixPayment" 
              className="absolute -bottom-1 -right-1 h-5 md:h-6 w-5 md:w-6 object-contain bg-cinema-dark rounded-full p-0.5"
            />
          </div>
          <span className="font-cinema text-sm sm:text-xl md:text-2xl text-white">
            CINEFLIX<span className="text-cinema-red">PAYMENT</span>
          </span>
        </a>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-white/80 hover:text-white transition-colors font-medium">Início</a>
          <a href="#filmes" className="text-white/80 hover:text-white transition-colors font-medium">Filmes</a>
          <a href="#series" className="text-white/80 hover:text-white transition-colors font-medium">Séries</a>
          <a href="#planos" className="text-white/80 hover:text-white transition-colors font-medium">Planos</a>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <button className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-cinema-red to-cinema-glow text-white font-bold hover:shadow-glow transition-all duration-300 hover:scale-105">
            Assinar
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
