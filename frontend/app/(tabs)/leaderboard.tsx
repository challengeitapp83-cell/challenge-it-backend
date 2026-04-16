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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboard();
    setRefreshing(false);
  };

  const renderAvatar = (u: any, size: number) => {
    if (u?.picture) {
      return <Image source={{ uri: u.picture }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
    }
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: COLORS.cardLight, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: size * 0.4, fontWeight: '800', color: COLORS.textPrimary }}>
          {u?.name?.charAt(0)?.toUpperCase()}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Classement</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
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
            {/* Top 3 Podium */}
            <View style={styles.podiumSection}>
              {/* 2nd */}
              {leaderboard.length > 1 && (
                <View style={styles.podiumItem}>
                  <View style={[styles.podiumAvatarWrap, { borderColor: '#C0C0C0' }]}>
                    {renderAvatar(leaderboard[1], 60)}
                  </View>
                  <View style={[styles.rankCircle, { backgroundColor: '#C0C0C0' }]}>
                    <Text style={styles.rankNum}>2</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[1].name}</Text>
                  <Text style={styles.podiumPts}>{leaderboard[1].points} pts</Text>
                  <View style={[styles.podiumBar, { height: 60, backgroundColor: '#C0C0C020' }]} />
                </View>
              )}
              {/* 1st */}
              {leaderboard.length > 0 && (
                <View style={[styles.podiumItem, { marginTop: -20 }]}>
                  <Ionicons name="trophy" size={28} color={COLORS.warning} style={{ marginBottom: 4 }} />
                  <View style={[styles.podiumAvatarWrap, { borderColor: COLORS.warning }]}>
                    {renderAvatar(leaderboard[0], 72)}
                  </View>
                  <View style={[styles.rankCircle, { backgroundColor: COLORS.warning }]}>
                    <Text style={styles.rankNum}>1</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[0].name}</Text>
                  <Text style={[styles.podiumPts, { color: COLORS.warning }]}>{leaderboard[0].points} pts</Text>
                  <View style={[styles.podiumBar, { height: 80, backgroundColor: COLORS.warning + '20' }]} />
                </View>
              )}
              {/* 3rd */}
              {leaderboard.length > 2 && (
                <View style={styles.podiumItem}>
                  <View style={[styles.podiumAvatarWrap, { borderColor: '#CD7F32' }]}>
                    {renderAvatar(leaderboard[2], 56)}
                  </View>
                  <View style={[styles.rankCircle, { backgroundColor: '#CD7F32' }]}>
                    <Text style={styles.rankNum}>3</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[2].name}</Text>
                  <Text style={styles.podiumPts}>{leaderboard[2].points} pts</Text>
                  <View style={[styles.podiumBar, { height: 40, backgroundColor: '#CD7F3220' }]} />
                </View>
              )}
            </View>

            {/* Rest of leaderboard */}
            <View style={styles.listSection}>
              {leaderboard.slice(3).map((u: any, i: number) => {
                const isMe = user?.user_id === u.user_id;
                return (
                  <View key={u.user_id} style={[styles.row, isMe && styles.rowMe]}>
                    <Text style={styles.rowRank}>#{i + 4}</Text>
                    <View style={styles.rowAvatar}>
                      {renderAvatar(u, 40)}
                    </View>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowName} numberOfLines={1}>
                        {u.name} {isMe && '(Vous)'}
                      </Text>
                      <View style={styles.rowStats}>
                        <Ionicons name="flame" size={14} color="#FF6B35" />
                        <Text style={styles.rowStreak}>{u.streak || 0}</Text>
                      </View>
                    </View>
                    <Text style={styles.rowPts}>{u.points} pts</Text>
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
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  podiumSection: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end',
    paddingVertical: SPACING.xl, paddingHorizontal: SPACING.lg, gap: SPACING.md,
  },
  podiumItem: { alignItems: 'center', width: 100 },
  podiumAvatarWrap: {
    borderWidth: 3, borderRadius: 50, padding: 2, marginBottom: -12,
  },
  rankCircle: {
    width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.background,
  },
  rankNum: { fontSize: 12, fontWeight: '800', color: '#000' },
  podiumName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginTop: SPACING.xs, textAlign: 'center' },
  podiumPts: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginBottom: SPACING.xs },
  podiumBar: { width: '100%', borderRadius: RADIUS.sm },
  listSection: { paddingHorizontal: SPACING.lg },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md,
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border,
  },
  rowMe: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  rowRank: { fontSize: 16, fontWeight: '800', color: COLORS.textMuted, width: 36, textAlign: 'center' },
  rowAvatar: { },
  rowInfo: { flex: 1, gap: 2 },
  rowName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  rowStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowStreak: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  rowPts: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.textMuted },
});
