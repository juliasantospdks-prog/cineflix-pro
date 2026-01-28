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
    name: 'MENSAL',
    price: 19.90,
    period: '/mês',
    icon: '📅',
    featured: false,
    features: [
      'Acesso por 30 dias',
      'Todos os filmes e séries',
      'Qualidade HD',
      'Download offline limitado',
    ],
  },
  {
    id: 'trimestral',
    name: 'TRIMESTRAL',
    price: 49.90,
    period: '/3 meses',
    icon: '📆',
    featured: false,
    discount: 'ECONOMIA 17%',
    features: [
      'Acesso por 90 dias',
      'Todos os filmes e séries',
      'Qualidade Full HD',
      'Download offline ilimitado',
    ],
  },
  {
    id: 'anual',
    name: 'ANUAL',
    price: 149.90,
    period: '/ano',
    icon: '🗓️',
    featured: false,
    discount: 'ECONOMIA 37%',
    features: [
      'Acesso por 365 dias',
      'Todos os filmes e séries',
      'Qualidade 4K Ultra HD',
      'Download offline ilimitado',
      'Conteúdo exclusivo',
    ],
  },
  {
    id: 'vitalicio',
    name: 'APP VITALÍCIO',
    price: 49.90,
    period: 'único',
    icon: '🤖',
    featured: true,
    discount: '⚡ MELHOR OFERTA',
    features: [
      'Acesso vitalício ao app',
      'Todos os filmes e séries',
      'Atualizações constantes',
      'Qualidade 4K Ultra HD',
      'Download offline ilimitado',
      'Somente para Android',
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
  trimestral: 'https://pay.kirvano.com/90f879cc-111a-49df-aefe-6ec83ffcac37',
  anual: 'https://pay.kirvano.com/90f879cc-111a-49df-aefe-6ec83ffcac37',
  vitalicio: 'https://pay.kirvano.com/90f879cc-111a-49df-aefe-6ec83ffcac37',
};
