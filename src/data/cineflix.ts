import movie1 from '@/assets/movie-1.jpg';
import movie2 from '@/assets/movie-2.jpg';
import movie3 from '@/assets/movie-3.jpg';
import movie4 from '@/assets/movie-4.jpg';
import movie5 from '@/assets/movie-5.jpg';
import movie6 from '@/assets/movie-6.jpg';
import { Movie, Plan, Upsell } from '@/types';

export const movies: Movie[] = [
  {
    id: '1',
    title: 'Vingador das Sombras',
    image: movie1,
    category: 'Ação',
    year: 2026,
    duration: '2h 15min',
    rating: 9.2,
    description: 'Um herói emerge das sombras para enfrentar o mal que ameaça destruir a cidade.',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '2',
    title: 'Além das Estrelas',
    image: movie2,
    category: 'Ficção Científica',
    year: 2026,
    duration: '2h 45min',
    rating: 9.5,
    description: 'Uma jornada épica através do espaço em busca de um novo lar para a humanidade.',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '3',
    title: 'Amor Eterno',
    image: movie3,
    category: 'Romance',
    year: 2025,
    duration: '1h 58min',
    rating: 8.8,
    description: 'Uma história de amor que transcende o tempo e desafia todas as probabilidades.',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '4',
    title: 'A Casa Maldita',
    image: movie4,
    category: 'Terror',
    year: 2026,
    duration: '1h 45min',
    rating: 8.5,
    description: 'Segredos sombrios se escondem dentro das paredes de uma mansão centenária.',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '5',
    title: 'O Cavaleiro Vermelho',
    image: movie5,
    category: 'Super-Herói',
    year: 2026,
    duration: '2h 30min',
    rating: 9.7,
    description: 'O herói mais poderoso da cidade enfrenta seu maior desafio até agora.',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: '6',
    title: 'Noite de Crime',
    image: movie6,
    category: 'Crime',
    year: 2025,
    duration: '2h 10min',
    rating: 9.0,
    description: 'Um detetive solitário persegue um criminoso misterioso pelas ruas chuvosas.',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
];

export const plans: Plan[] = [
  {
    id: 'mensal',
    name: 'PLANO MENSAL',
    price: 29.90,
    period: '/mês',
    icon: '📱',
    features: [
      '30 dias de acesso completo',
      'Todos os filmes e séries',
      '1 tela simultânea',
      'Qualidade Full HD',
    ],
  },
  {
    id: 'trimestral',
    name: 'PLANO TRIMESTRAL',
    price: 120.00,
    period: '/trimestre',
    icon: '💎',
    featured: true,
    discount: 'ECONOMIZE 20%',
    features: [
      '90 dias de acesso completo',
      'Todos os filmes e séries',
      '2 telas simultâneas',
      'Qualidade 4K Ultra HD',
      'Download offline',
    ],
  },
  {
    id: 'anual',
    name: 'PLANO ANUAL VIP',
    price: 300.00,
    period: '/ano',
    icon: '👑',
    discount: 'MELHOR OFERTA',
    features: [
      '365 dias de acesso completo',
      'Todos os filmes e séries',
      '4 telas simultâneas',
      'Qualidade 4K Ultra HD',
      'Download offline ilimitado',
      'Acesso antecipado a lançamentos',
    ],
  },
];

export const upsells: Upsell[] = [
  {
    id: 'acesso_extra',
    name: '+1 Acesso Extra',
    description: 'Assista em 2 telas simultâneas',
    price: 9.90,
  },
  {
    id: 'adultos_herois',
    name: 'Pacote Adultos + Heróis 2025',
    description: 'Conteúdo exclusivo + lançamentos',
    price: 7.90,
  },
  {
    id: 'combo_completo',
    name: 'COMBO COMPLETO',
    description: 'Todos os adicionais juntos',
    price: 14.90,
  },
];

export const WHATSAPP_NUMBER = '5598981465166';

export const KIRVANO_LINKS: Record<string, string> = {
  mensal: 'https://pay.kirvano.com/90f879cc-111a-49df-aefe-6ec83ffcac37',
  trimestral: 'https://pay.kirvano.com/96b90dc1-dd98-49c9-9524-1ed68f2aaa2d',
  anual: 'https://pay.kirvano.com/5d43cc3c-301c-43ea-8cb5-6021eae434e9',
};
