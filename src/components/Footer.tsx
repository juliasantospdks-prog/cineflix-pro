import { Link } from 'react-router-dom';
import { Mail, Instagram, Youtube, MessageCircle } from 'lucide-react';
import cineflixLogo from '@/assets/cineflix-logo.png';
import { WHATSAPP_NUMBER } from '@/data/cineflix';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-cinema-dark border-t border-white/10">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src={cineflixLogo} alt="Logo CineflixPayment" className="w-12 h-12 object-contain" />
              <span className="text-xl font-bold text-white">CINEFLIXPAYMENT</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              Um catálogo direto ao ponto para encontrar o que assistir e escolher seu período de acesso.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Navegação</h4>
            <ul className="space-y-2">
              <li><a href="#filmes" className="text-white/60 hover:text-cinema-red transition-colors text-sm">Em alta</a></li>
              <li><a href="#planos" className="text-white/60 hover:text-cinema-red transition-colors text-sm">Planos</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Suporte</h4>
            <ul className="space-y-2">
              <li><Link to="/faq" className="text-white/60 hover:text-cinema-red transition-colors text-sm">Central de Ajuda / FAQ</Link></li>
              <li><Link to="/termos" className="text-white/60 hover:text-cinema-red transition-colors text-sm">Termos de Uso</Link></li>
              <li><Link to="/privacidade" className="text-white/60 hover:text-cinema-red transition-colors text-sm">Política de Privacidade</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contato</h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white/60 hover:text-green-400 transition-colors text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              </li>
              <li>
                <a 
                  href="mailto:contato@cineflixpayment.com"
                  className="flex items-center gap-2 text-white/60 hover:text-cinema-red transition-colors text-sm"
                >
                  <Mail className="w-4 h-4" />
                  contato@cineflixpayment.com
                </a>
              </li>
            </ul>

            {/* Social media */}
            <div className="flex gap-3 mt-6">
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-cinema-red flex items-center justify-center transition-colors"
              >
                <Instagram className="w-5 h-5 text-white" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-cinema-red flex items-center justify-center transition-colors"
              >
                <Youtube className="w-5 h-5 text-white" />
              </a>
              <a 
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-green-500 flex items-center justify-center transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm text-center md:text-left">
            © {currentYear} CineflixPayment. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Bandeira Visa" className="h-6 opacity-50" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b7/MasterCard_Logo.svg" alt="Bandeira Mastercard" className="h-6 opacity-50" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg" alt="Bandeira American Express" className="h-6 opacity-50" />
            <span className="text-white/40 text-xs">Pagamento 100% Seguro</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
