// Enhanced color palette - Premium Modern Finance App
export const Colors = {
  // Brand Colors - Sophisticated Indigo & Slate
  primary: '#4F46E5',      // Indigo 600
  primaryDark: '#3730A3',  // Indigo 800
  secondary: '#F43F5E',    // Rose 500 (more energetic than pink)
  accent: '#06B6D4',       // Cyan 500

  // Money colors - Semantic and clear
  income: '#10B981',       // Emerald 500
  incomeLight: '#ECFDF5',  // Emerald 50 bg
  expense: '#F43F5E',      // Rose 500
  expenseLight: '#FFF1F2', // Rose 50 bg

  // Backgrounds - Using Slate/Gray for depth
  background: '#F8FAFC',   // Slate 50
  backgroundDark: '#F1F5F9', // Slate 100
  card: '#FFFFFF',
  cardHover: '#F8FAFC',

  // Text - Optimal contrast and readability
  text: '#0F172A',         // Slate 900
  textSecondary: '#334155', // Slate 700
  textLight: '#64748B',    // Slate 500
  textMuted: '#94A3B8',     // Slate 400

  // Neutrals/Borders
  white: '#FFFFFF',
  black: '#000000',
  border: '#E2E8F0',       // Slate 200
  borderLight: '#F1F5F9',  // Slate 100
  overlay: 'rgba(15, 23, 42, 0.4)', // Softer overlay

  // Shared Account System
  shared: '#7C3AED',       // Violet 600
  sharedLight: '#F5F3FF',  // Violet 50 bg

  // Status System
  success: '#10B981',      // Emerald 500
  warning: '#F59E0B',      // Amber 500
  error: '#EF4444',        // Red 500
  info: '#3B82F6',         // Blue 500
};

// Professional Gradients - Carefully tuned starting/ending points
export const Gradients = {
  primary: ['#4F46E5', '#7C3AED'] as const,  // Indigo to Violet
  primarySoft: ['#818CF8', '#A78BFA'] as const,
  income: ['#059669', '#10B981'] as const,   // Emerald deep to medium
  expense: ['#E11D48', '#F43F5E'] as const,  // Rose deep to medium
  blue: ['#2563EB', '#3B82F6'] as const,
  orange: ['#D97706', '#F59E0B'] as const,
  purple: ['#7C3AED', '#8B5CF6'] as const,
  dark: ['#0F172A', '#1E293B'] as const,     // Slate 900 to 800
  card: ['#FFFFFF', '#F8FAFC'] as const,
};

// Minimal Shadow System — subtle and clean
export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  premium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Spacing system - standard 4px/8px grid
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
};

// Uniform border radius
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 9999,
  full: 9999,
};

// Animation Tuning
export const Animations = {
  durations: {
    fast: 150,
    normal: 250,
    slow: 450,
  },
  springs: {
    tight: { damping: 20, stiffness: 200 },
    bouncy: { damping: 10, stiffness: 100 },
    soft: { damping: 25, stiffness: 120 },
  }
};

// Glassmorphism System
export const Glass = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  medium: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dark: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
};

// Minimal Elevation — flatter, cleaner
export const Elevation = {
  level0: {
    shadowOpacity: 0,
    elevation: 0,
  },
  level1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  level2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  level3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  level4: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  level5: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 5,
  },
};

// Professional Typography Scale - Tighter tracking for titles
export const Typography = {
  hero: {
    fontSize: 40,
    fontWeight: '900' as const,
    letterSpacing: -1.5,
    lineHeight: 48,
  },
  h1: {
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: -1,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: -0.1,
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
    lineHeight: 16,
  },
};
