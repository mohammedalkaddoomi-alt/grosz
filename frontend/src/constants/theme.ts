// Enhanced color palette - Modern Finance App
export const Colors = {
  // Main colors
  primary: '#6366F1',      // Indigo - more modern
  primaryDark: '#4F46E5',  // Darker indigo
  secondary: '#EC4899',    // Pink
  accent: '#06B6D4',       // Cyan
  
  // Money colors
  income: '#10B981',       // Green
  incomeLight: '#D1FAE5',  // Light green bg
  expense: '#EF4444',      // Red
  expenseLight: '#FEE2E2', // Light red bg
  
  // Background
  background: '#F8FAFC',
  backgroundDark: '#F1F5F9',
  card: '#FFFFFF',
  cardHover: '#F8FAFC',
  
  // Text
  text: '#0F172A',
  textSecondary: '#334155',
  textLight: '#64748B',
  textMuted: '#94A3B8',
  
  // Others
  white: '#FFFFFF',
  black: '#000000',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  overlay: 'rgba(15, 23, 42, 0.6)',
  
  // Joint/Shared account colors
  shared: '#8B5CF6',       // Purple for shared
  sharedLight: '#EDE9FE',  // Light purple bg
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

// Enhanced Gradients - typed as tuples for LinearGradient compatibility
export const Gradients = {
  primary: ['#6366F1', '#8B5CF6'] as const,
  primarySoft: ['#818CF8', '#A78BFA'] as const,
  income: ['#10B981', '#34D399'] as const,
  expense: ['#EF4444', '#F87171'] as const,
  blue: ['#3B82F6', '#60A5FA'] as const,
  orange: ['#F59E0B', '#FBBF24'] as const,
  purple: ['#8B5CF6', '#A78BFA'] as const,
  dark: ['#1E293B', '#334155'] as const,
  card: ['#FFFFFF', '#F8FAFC'] as const,
};

// Shadows for depth
export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Spacing constants
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Border radius
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};
