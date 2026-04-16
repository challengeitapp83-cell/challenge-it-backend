import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING, RADIUS, BADGE_CONFIG } from '../../contexts/theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: logout },
    ]);
  };

  const stats = [
    { icon: 'star', color: COLORS.primary, value: user?.points || 0, label: 'Points' },
    { icon: 'flame', color: '#FF6B35', value: user?.streak || 0, label: 'Streak' },
    { icon: 'trophy', color: COLORS.warning, value: user?.level || 1, label: 'Niveau' },
    { icon: 'heart', color: COLORS.secondary, value: user?.reputation || 0, label: 'Réputation' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user?.picture ? (
              <Image source={{ uri: user.picture }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={['#007AFF', '#9D4CDD']} style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </LinearGradient>
            )}
            <View style={styles.levelBadge}>
              <Text style={styles.levelNum}>{user?.level || 1}</Text>
            </View>
          </View>
          <Text style={styles.name}>{user?.name || 'Challenger'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((s, i) => (
            <View key={i} style={styles.statItem}>
              <View style={[styles.statIconWrap, { backgroundColor: s.color + '15' }]}>
                <Ionicons name={s.icon as any} size={22} color={s.color} />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes Badges</Text>
          <View style={styles.badgeGrid}>
            {Object.entries(BADGE_CONFIG).map(([id, badge]) => {
              const earned = user?.badges?.includes(id);
              return (
                <View key={id} style={[styles.badgeItem, !earned && styles.badgeLocked]}>
                  <View style={[styles.badgeCircle, earned && { borderColor: badge.color }]}>
                    <Ionicons name={badge.icon as any} size={24} color={earned ? badge.color : COLORS.textMuted} />
                  </View>
                  <Text style={[styles.badgeLabel, earned && { color: COLORS.textPrimary }]}>{badge.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progression</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Niveau {user?.level || 1}</Text>
              <Text style={styles.progressLabel}>
                {(user?.points || 0) % 100}/100 pts
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${((user?.points || 0) % 100)}%` as any }]}
              />
            </View>
            <Text style={styles.progressHint}>
              {100 - ((user?.points || 0) % 100)} points pour le niveau suivant
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity testID="logout-btn" onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  profileHeader: {
    alignItems: 'center', paddingTop: SPACING.xl, paddingBottom: SPACING.lg,
  },
  avatarContainer: { position: 'relative', marginBottom: SPACING.md },
  avatar: {
    width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: COLORS.primary,
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#FFF' },
  levelBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: COLORS.primary, borderRadius: 14, width: 28, height: 28,
    justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.background,
  },
  levelNum: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  name: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  email: { fontSize: 14, color: COLORS.textMuted, marginTop: SPACING.xs },
  statsGrid: {
    flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statItem: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    padding: SPACING.md, alignItems: 'center', gap: SPACING.xs,
    borderWidth: 1, borderColor: COLORS.border,
  },
  statIconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase' },
  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.md },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  badgeItem: { alignItems: 'center', width: 72 },
  badgeLocked: { opacity: 0.35 },
  badgeCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.card,
    borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  badgeLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' },
  progressCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  progressLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  progressBarBg: { height: 10, backgroundColor: '#2C2C2E', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 5 },
  progressHint: { fontSize: 12, color: COLORS.textMuted, marginTop: SPACING.sm, textAlign: 'center' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.md, backgroundColor: COLORS.card,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.error + '30',
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: COLORS.error },
});
