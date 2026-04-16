import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Category configuration
export const CATEGORIES: Record<string, { color: string; icon: string; iconSet: 'ion' | 'mci' }> = {
  'Sport': { color: '#007AFF', icon: 'fitness', iconSet: 'ion' },
  'Santé': { color: '#32D74B', icon: 'heart', iconSet: 'ion' },
  'Habitudes': { color: '#9D4CDD', icon: 'time', iconSet: 'ion' },
  'Business': { color: '#FFD700', icon: 'briefcase', iconSet: 'ion' },
  'Autre': { color: '#A1A1AA', icon: 'star', iconSet: 'ion' },
};

// Badge configuration
export const BADGE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  'first_challenge': { icon: 'star', color: '#FFD700', label: 'Premier Défi' },
  'streak_7': { icon: 'flame', color: '#FF6B35', label: 'Semaine de Feu' },
  'streak_30': { icon: 'trophy', color: '#FFD700', label: 'Mois de Fer' },
  'points_100': { icon: 'medal', color: '#C0C0C0', label: 'Centurion' },
  'points_500': { icon: 'ribbon', color: '#007AFF', label: 'Champion' },
  'challenger_5': { icon: 'shield-checkmark', color: '#9D4CDD', label: 'Challenger' },
};

// Theme colors
export const COLORS = {
  background: '#0F0F0F',
  card: '#1E1E1E',
  cardLight: '#252525',
  primary: '#007AFF',
  secondary: '#9D4CDD',
  success: '#32D74B',
  warning: '#FFD700',
  error: '#FF3B30',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  border: '#27272A',
  tabBar: '#121212',
  gradient: ['#007AFF', '#9D4CDD'] as readonly [string, string],
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const RADIUS = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 9999,
};
