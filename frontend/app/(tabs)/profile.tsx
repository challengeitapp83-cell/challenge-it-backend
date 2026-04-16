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

  const progressPct = ((user?.points || 0) % 100);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Profile Header with gradient bg */}
        <LinearGradient colors={['#007AFF15', '#9D4CDD10', COLORS.background]} style={styles.profileBg}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrap}>
              {user?.picture ? (
                <Image source={{ uri: user.picture }} style={styles.avatar} />
              ) : (
                <LinearGradient colors={['#007AFF', '#9D4CDD']} style={styles.avatar}>
                  <Text style={styles.avatarInitial}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                </LinearGradient>
              )}
              <View style={styles.levelBadge}>
                <Text style={styles.levelNum}>{user?.level || 1}</Text>
              </View>
            </View>
            <Text style={styles.name}>{user?.name || 'Challenger'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((s, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: s.color + '18' }]}>
                <Ionicons name={s.icon as any} size={20} color={s.color} />
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
                <View key={id} style={[styles.badgeItem, !earned && { opacity: 0.3 }]}>
                  <View style={[styles.badgeCircle, earned && { borderColor: badge.color }]}>
                    <Ionicons name={badge.icon as any} size={22} color={earned ? badge.color : COLORS.textMuted} />
                  </View>
                  <Text style={[styles.badgeLabel, earned && { color: '#FFF' }]}>{badge.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progression</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <Text style={styles.progressLabel}>Niveau {user?.level || 1}</Text>
              <Text style={styles.progressLabel}>{progressPct}/100 pts</Text>
            </View>
            <View style={styles.progressBg}>
              <LinearGradient colors={[COLORS.primary, COLORS.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${Math.max(progressPct, 2)}%` as any }]} />
            </View>
            <Text style={styles.progressHint}>{100 - progressPct} points pour le niveau suivant</Text>
          </View>
        </View>

        {/* Logout */}
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
  profileBg: { paddingBottom: 24 },
  profileHeader: { alignItems: 'center', paddingTop: 32 },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.primary },
  avatarInitial: { fontSize: 40, fontWeight: '800', color: '#FFF' },
  levelBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.background },
  levelNum: { fontSize: 13, fontWeight: '900', color: '#FFF' },
  name: { fontSize: 26, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  email: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 14, paddingVertical: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: COLORS.border },
  statIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900', color: '#FFF' },
  statLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: '#FFF', marginBottom: 14 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  badgeItem: { alignItems: 'center', width: 72 },
  badgeCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.card, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  badgeLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' },
  progressCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  progressBg: { height: 10, backgroundColor: '#2C2C2E', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  progressHint: { fontSize: 12, color: COLORS.textMuted, marginTop: 10, textAlign: 'center' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.error + '25' },
  logoutText: { fontSize: 16, fontWeight: '600', color: COLORS.error },
});
