export const COLORS = {
  // Primary gradient colors
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  primaryDark: '#5849C2',
  primaryGradientStart: '#667eea',
  primaryGradientEnd: '#764ba2',
  
  // Secondary gradients
  incomeGradientStart: '#11998e',
  incomeGradientEnd: '#38ef7d',
  expenseGradientStart: '#eb3349',
  expenseGradientEnd: '#f45c43',
  
  // Accent colors
  income: '#00D9A5',
  incomeLight: '#55EFC4',
  expense: '#FF6B6B',
  expenseLight: '#FFA8A8',
  accent: '#FD79A8',
  accentLight: '#FDCB6E',
  gold: '#FFD93D',
  
  // Neutral colors
  white: '#FFFFFF',
  background: '#F5F7FA',
  backgroundDark: '#0F0F23',
  card: '#FFFFFF',
  cardDark: '#1A1A2E',
  glass: 'rgba(255, 255, 255, 0.9)',
  glassDark: 'rgba(255, 255, 255, 0.1)',
  
  // Text colors
  text: '#1A1A2E',
  textSecondary: '#4A5568',
  textLight: '#718096',
  textMuted: '#A0AEC0',
  textDark: '#F7FAFC',
  
  // Border colors
  border: '#E2E8F0',
  borderLight: '#EDF2F7',
  borderDark: '#2D3748',
  
  // Status colors
  success: '#00D9A5',
  warning: '#FFD93D',
  error: '#FF6B6B',
  info: '#63B3ED',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

export const GRADIENTS = {
  primary: ['#667eea', '#764ba2'],
  purple: ['#6C5CE7', '#a855f7'],
  income: ['#11998e', '#38ef7d'],
  expense: ['#eb3349', '#f45c43'],
  gold: ['#f093fb', '#f5576c'],
  sunset: ['#fa709a', '#fee140'],
  ocean: ['#4facfe', '#00f2fe'],
  dark: ['#1A1A2E', '#16213E'],
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 28,
    xxxl: 36,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  glow: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
};

export const CATEGORIES = [
  { name: 'Jedzenie', emoji: '🍔', color: '#FF6B6B' },
  { name: 'Transport', emoji: '🚗', color: '#4ECDC4' },
  { name: 'Zakupy', emoji: '🛍️', color: '#A855F7' },
  { name: 'Rozrywka', emoji: '🎬', color: '#F59E0B' },
  { name: 'Rachunki', emoji: '📄', color: '#6366F1' },
  { name: 'Zdrowie', emoji: '💊', color: '#EC4899' },
  { name: 'Edukacja', emoji: '📚', color: '#14B8A6' },
  { name: 'Wynagrodzenie', emoji: '💼', color: '#10B981' },
  { name: 'Prezent', emoji: '🎁', color: '#F472B6' },
  { name: 'Oszczędności', emoji: '🏦', color: '#6C5CE7' },
  { name: 'Inwestycje', emoji: '📈', color: '#22D3EE' },
  { name: 'Inne', emoji: '📌', color: '#94A3B8' },
];

export const WALLET_EMOJIS = ['💰', '💵', '💳', '🏦', '💎', '🪙', '💸', '🤑', '👛', '🎯', '🚀', '⭐'];

export const GOAL_EMOJIS = ['🎯', '🏠', '🚗', '✈️', '💻', '📱', '🎓', '💍', '🏖️', '🎸', '🎮', '📷', '👶', '🐕', '🌴', '💪'];
