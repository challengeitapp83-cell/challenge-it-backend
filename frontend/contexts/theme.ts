import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Category configuration
export const CATEGORIES: Record<string, { color: string; icon: string; iconSet: 'ion' | 'mci' }> = {
  'Sport': { color: '#007AFF', icon: 'fitness', iconSet: 'ion' },
  'Business': { color: '#FFD700', icon: 'briefcase', iconSet: 'ion' },
  'Argent': { color: '#32D74B', icon: 'cash', iconSet: 'ion' },
  'Discipline': { color: '#FF6B35', icon: 'flame', iconSet: 'ion' },
  'Santé': { color: '#32D74B', icon: 'heart', iconSet: 'ion' },
  'Social': { color: '#AF52DE', icon: 'people', iconSet: 'ion' },
  'Habitudes': { color: '#9D4CDD', icon: 'time', iconSet: 'ion' },
  'Général': { color: '#A1A1AA', icon: 'star', iconSet: 'ion' },
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

// Category images (Unsplash high quality - realistic, immersive, premium)
export const CATEGORY_IMAGES: Record<string, string> = {
  'Sport': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=500&fit=crop&q=80',
  'Santé': 'https://images.unsplash.com/photo-1524863479829-916d8e77f114?w=800&h=500&fit=crop&q=80',
  'Habitudes': 'https://images.unsplash.com/photo-1649945624740-69d73e3972aa?w=800&h=500&fit=crop&q=80',
  'Business': 'https://images.unsplash.com/photo-1770048532658-14834b7acef8?w=800&h=500&fit=crop&q=80',
  'Autre': 'https://images.unsplash.com/photo-1524863479829-916d8e77f114?w=800&h=500&fit=crop&q=80',
};

// Challenge-specific images (hand-picked for each challenge)
export const CHALLENGE_IMAGES: Record<string, string> = {
  'challenge_sport1': 'https://images.unsplash.com/photo-1603455778956-d71832eafa4e?w=800&h=500&fit=crop&q=80',
  'challenge_sante1': 'https://images.unsplash.com/photo-1524863479829-916d8e77f114?w=800&h=500&fit=crop&q=80',
  'challenge_habitudes1': 'https://images.unsplash.com/photo-1740210147580-513028fcf04a?w=800&h=500&fit=crop&q=80',
  'challenge_business1': 'https://images.unsplash.com/photo-1758874384315-995106662187?w=800&h=500&fit=crop&q=80',
  'challenge_sport2': 'https://images.unsplash.com/photo-1648235692910-947cb90ddd97?w=800&h=500&fit=crop&q=80',
};

// Get image for a challenge (specific > category default)
export const getChallengeImage = (challengeId?: string, category?: string, imageUrl?: string): string => {
  if (imageUrl) return imageUrl;
  if (challengeId && CHALLENGE_IMAGES[challengeId]) return CHALLENGE_IMAGES[challengeId];
  if (category && CATEGORY_IMAGES[category]) return CATEGORY_IMAGES[category];
  return CATEGORY_IMAGES['Autre'];
};
