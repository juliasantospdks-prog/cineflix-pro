export interface Movie {
  id: string;
  title: string;
  image: string;
  category: string;
  year: number;
  duration: string;
  rating: number;
  description: string;
  trailerUrl?: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  icon: string;
  featured?: boolean;
  discount?: string;
}

export interface Upsell {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  isTyping?: boolean;
  actions?: ChatAction[];
}

export interface ChatAction {
  label: string;
  action: string;
  variant?: 'cinema' | 'cinema-outline' | 'whatsapp';
}
