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

// Category images (Unsplash high quality)
export const CATEGORY_IMAGES: Record<string, string> = {
  'Sport': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=500&fit=crop&q=80',
  'Santé': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=500&fit=crop&q=80',
  'Habitudes': 'https://images.unsplash.com/photo-1628002067566-829b37d5da69?w=800&h=500&fit=crop&q=80',
  'Business': 'https://images.unsplash.com/photo-1672094272561-3d4e3685a3fa?w=800&h=500&fit=crop&q=80',
  'Autre': 'https://images.unsplash.com/photo-1545311320-2877261da159?w=800&h=500&fit=crop&q=80',
};

// Challenge-specific images
export const CHALLENGE_IMAGES: Record<string, string> = {
  'challenge_sport1': 'https://images.unsplash.com/photo-1758521959972-83d0bd10a152?w=800&h=500&fit=crop&q=80',
  'challenge_sante1': 'https://images.unsplash.com/photo-1759951611066-d208d302e886?w=800&h=500&fit=crop&q=80',
  'challenge_habitudes1': 'https://images.unsplash.com/photo-1774185644417-b32c25456aae?w=800&h=500&fit=crop&q=80',
  'challenge_business1': 'https://images.unsplash.com/photo-1672094272561-3d4e3685a3fa?w=800&h=500&fit=crop&q=80',
  'challenge_sport2': 'https://images.unsplash.com/photo-1648235692910-947cb90ddd97?w=800&h=500&fit=crop&q=80',
};

// Get image for a challenge (specific > category default)
export const getChallengeImage = (challengeId?: string, category?: string, imageUrl?: string): string => {
  if (imageUrl) return imageUrl;
  if (challengeId && CHALLENGE_IMAGES[challengeId]) return CHALLENGE_IMAGES[challengeId];
  if (category && CATEGORY_IMAGES[category]) return CATEGORY_IMAGES[category];
  return CATEGORY_IMAGES['Autre'];
};
