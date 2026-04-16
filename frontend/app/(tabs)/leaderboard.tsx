import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Image, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../contexts/api';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING, RADIUS } from '../../contexts/theme';

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const data = await api.get('/api/leaderboard?limit=20');
      setLeaderboard(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);
  const onRefresh = async () => { setRefreshing(true); await fetchLeaderboard(); setRefreshing(false); };

  const renderAvatar = (u: any, size: number) => {
    if (u?.picture) {
      return <Image source={{ uri: u.picture }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
    }
    return (
      <LinearGradient colors={['#007AFF', '#9D4CDD']} style={{ width: size, height: size, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: size * 0.38, fontWeight: '800', color: '#FFF' }}>{u?.name?.charAt(0)?.toUpperCase()}</Text>
      </LinearGradient>
    );
  };

  const medals = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const medalIcons = ['trophy', 'medal', 'medal'] as const;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Classement</Text>
        <Text style={styles.subtitle}>Top challengers de la communauté</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 80 }} />
        ) : leaderboard.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="trophy" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Aucun classement disponible</Text>
          </View>
        ) : (
          <>
            {/* ===== TOP 3 PODIUM ===== */}
            <View style={styles.podiumSection}>
              {/* 2nd place */}
              {leaderboard.length > 1 && (
                <View style={styles.podiumItem}>
                  <View style={[styles.podiumRing, { borderColor: medals[1] }]}>
                    {renderAvatar(leaderboard[1], 60)}
                  </View>
                  <View style={[styles.podiumBadge, { backgroundColor: medals[1] }]}>
                    <Text style={styles.podiumBadgeText}>2</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[1].name}</Text>
                  <Text style={styles.podiumPts}>{leaderboard[1].points} pts</Text>
                </View>
              )}
              {/* 1st place */}
              {leaderboard.length > 0 && (
                <View style={[styles.podiumItem, { marginTop: -24 }]}>
                  <Ionicons name="trophy" size={28} color={COLORS.warning} style={{ marginBottom: 6 }} />
                  <View style={[styles.podiumRing, styles.podiumRingFirst, { borderColor: medals[0] }]}>
                    {renderAvatar(leaderboard[0], 76)}
                  </View>
                  <View style={[styles.podiumBadge, styles.podiumBadgeFirst, { backgroundColor: medals[0] }]}>
                    <Text style={[styles.podiumBadgeText, { fontSize: 14 }]}>1</Text>
                  </View>
                  <Text style={[styles.podiumName, { fontSize: 15 }]} numberOfLines={1}>{leaderboard[0].name}</Text>
                  <Text style={[styles.podiumPts, { color: COLORS.warning, fontWeight: '900' }]}>{leaderboard[0].points} pts</Text>
                </View>
              )}
              {/* 3rd place */}
              {leaderboard.length > 2 && (
                <View style={styles.podiumItem}>
                  <View style={[styles.podiumRing, { borderColor: medals[2] }]}>
                    {renderAvatar(leaderboard[2], 56)}
                  </View>
                  <View style={[styles.podiumBadge, { backgroundColor: medals[2] }]}>
                    <Text style={styles.podiumBadgeText}>3</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[2].name}</Text>
                  <Text style={styles.podiumPts}>{leaderboard[2].points} pts</Text>
                </View>
              )}
            </View>

            {/* ===== REST OF LIST ===== */}
            <View style={styles.listSection}>
              {leaderboard.slice(3).map((u: any, i: number) => {
                const isMe = user?.user_id === u.user_id;
                return (
                  <View key={u.user_id} style={[styles.row, isMe && styles.rowMe]}>
                    <Text style={styles.rowRank}>#{i + 4}</Text>
                    <View style={styles.rowAvatarWrap}>
                      {renderAvatar(u, 44)}
                    </View>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowName} numberOfLines={1}>{u.name}{isMe ? ' (Vous)' : ''}</Text>
                      <View style={styles.rowStreakRow}>
                        <Ionicons name="flame" size={13} color="#FF6B35" />
                        <Text style={styles.rowStreak}>{u.streak || 0} jours</Text>
                      </View>
                    </View>
                    <Text style={[styles.rowPts, isMe && { color: COLORS.warning }]}>{u.points} pts</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontWeight: '500', color: COLORS.textMuted, marginTop: 4 },
  // Podium
  podiumSection: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', paddingVertical: 28, paddingHorizontal: 20, gap: 20 },
  podiumItem: { alignItems: 'center', width: 95 },
  podiumRing: { borderWidth: 3, borderRadius: 50, padding: 3, marginBottom: -14 },
  podiumRingFirst: { borderWidth: 3.5, borderRadius: 50 },
  podiumBadge: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: COLORS.background },
  podiumBadgeFirst: { width: 30, height: 30, borderRadius: 15 },
  podiumBadgeText: { fontSize: 12, fontWeight: '900', color: '#000' },
  podiumName: { fontSize: 13, fontWeight: '700', color: '#FFF', marginTop: 8, textAlign: 'center' },
  podiumPts: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginTop: 2 },
  // List
  listSection: { paddingHorizontal: 20, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.card, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border },
  rowMe: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  rowRank: { fontSize: 15, fontWeight: '800', color: COLORS.textMuted, width: 34, textAlign: 'center' },
  rowAvatarWrap: {},
  rowInfo: { flex: 1, gap: 3 },
  rowName: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  rowStreakRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowStreak: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  rowPts: { fontSize: 17, fontWeight: '900', color: COLORS.primary },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.textMuted },
});
