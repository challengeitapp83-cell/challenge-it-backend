import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../contexts/api';
import { COLORS, SPACING, RADIUS, CATEGORIES, BADGE_CONFIG } from '../../contexts/theme';

export default function HomeScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeChallenges, setActiveChallenges] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [myChallenges, trendingData, leaderData] = await Promise.all([
        api.get('/api/my-challenges').catch(() => []),
        api.get('/api/challenges/trending?limit=6').catch(() => []),
        api.get('/api/leaderboard?limit=5').catch(() => []),
      ]);
      setActiveChallenges(myChallenges);
      setTrending(trendingData);
      setLeaderboard(leaderData);
    } catch (e) {
      console.error('Home fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), refreshUser()]);
    setRefreshing(false);
  };

  const getCategoryConfig = (cat: string) => CATEGORIES[cat] || CATEGORIES['Autre'];

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        testID="home-scroll"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* ===== USER HEADER ===== */}
        <View style={styles.header} testID="user-header">
          <View style={styles.headerLeft}>
            <View style={styles.avatarWrapper}>
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
                <Text style={styles.levelText}>{user?.level || 1}</Text>
              </View>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.greeting}>Salut,</Text>
              <Text style={styles.userName} numberOfLines={1}>{user?.name || 'Challenger'}</Text>
            </View>
          </View>
          <TouchableOpacity
            testID="notifications-btn"
            style={styles.notifBtn}
            onPress={() => {}}
          >
            <Ionicons name="notifications-outline" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ===== STATS ROW ===== */}
        <View style={styles.statsRow} testID="user-stats">
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#007AFF20', '#007AFF05']}
              style={styles.statGradient}
            >
              <Ionicons name="star" size={20} color={COLORS.primary} />
              <Text style={styles.statValue}>{user?.points || 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#FF6B3520', '#FF6B3505']}
              style={styles.statGradient}
            >
              <Ionicons name="flame" size={20} color="#FF6B35" />
              <Text style={styles.statValue}>{user?.streak || 0}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#9D4CDD20', '#9D4CDD05']}
              style={styles.statGradient}
            >
              <Ionicons name="heart" size={20} color={COLORS.secondary} />
              <Text style={styles.statValue}>{user?.reputation || 0}</Text>
              <Text style={styles.statLabel}>Réputation</Text>
            </LinearGradient>
          </View>
        </View>

        {/* ===== MES DÉFIS ACTIFS ===== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes Défis Actifs</Text>
            {activeChallenges.length > 0 && (
              <TouchableOpacity testID="see-all-challenges-btn" onPress={() => router.push('/(tabs)/challenges')}>
                <Text style={styles.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            )}
          </View>
          {activeChallenges.length === 0 ? (
            <TouchableOpacity
              testID="join-first-challenge-btn"
              onPress={() => router.push('/(tabs)/challenges')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#1E1E1E', '#252525']}
                style={styles.emptyCard}
              >
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="add-circle" size={40} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>Aucun défi actif</Text>
                <Text style={styles.emptySubtitle}>Rejoins ton premier défi pour commencer !</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            activeChallenges.slice(0, 3).map((uc: any) => {
              const challenge = uc.challenge;
              const catConfig = getCategoryConfig(challenge?.category);
              const progress = challenge?.duration_days
                ? (uc.completed_days || 0) / challenge.duration_days
                : 0;
              return (
                <TouchableOpacity
                  key={uc.user_challenge_id}
                  testID={`active-challenge-${uc.user_challenge_id}`}
                  onPress={() => router.push(`/challenge/${challenge?.challenge_id}`)}
                  activeOpacity={0.8}
                >
                  <View style={styles.challengeCard}>
                    <View style={styles.challengeCardTop}>
                      <View style={[styles.categoryDot, { backgroundColor: catConfig.color }]} />
                      <Text style={[styles.categoryLabel, { color: catConfig.color }]}>
                        {challenge?.category}
                      </Text>
                    </View>
                    <Text style={styles.challengeTitle}>{challenge?.title}</Text>
                    <View style={styles.progressSection}>
                      <View style={styles.progressInfo}>
                        <Text style={styles.progressDay}>
                          Jour {uc.current_day || 1}/{challenge?.duration_days}
                        </Text>
                        <Text style={styles.progressPercent}>
                          {Math.round(progress * 100)}%
                        </Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <LinearGradient
                          colors={[COLORS.success, '#28B446']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.progressBarFill, { width: `${Math.max(progress * 100, 2)}%` as any }]}
                        />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ===== DÉFIS TENDANCE ===== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Défis Tendance</Text>
            <TouchableOpacity testID="see-all-trending-btn" onPress={() => router.push('/(tabs)/challenges')}>
              <Ionicons name="arrow-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingScroll}
          >
            {trending.map((ch: any) => {
              const catConfig = getCategoryConfig(ch.category);
              return (
                <TouchableOpacity
                  key={ch.challenge_id}
                  testID={`trending-${ch.challenge_id}`}
                  onPress={() => router.push(`/challenge/${ch.challenge_id}`)}
                  activeOpacity={0.8}
                  style={styles.trendingCard}
                >
                  <View style={[styles.trendingIcon, { backgroundColor: catConfig.color + '20' }]}>
                    <Ionicons name={catConfig.icon as any} size={28} color={catConfig.color} />
                  </View>
                  <Text style={styles.trendingTitle} numberOfLines={2}>{ch.title}</Text>
                  <View style={styles.trendingMeta}>
                    <Ionicons name="people" size={14} color={COLORS.textMuted} />
                    <Text style={styles.trendingParticipants}>
                      {ch.participant_count || 0}
                    </Text>
                  </View>
                  <View style={[styles.trendingCatBadge, { backgroundColor: catConfig.color + '15' }]}>
                    <Text style={[styles.trendingCatText, { color: catConfig.color }]}>
                      {ch.category}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ===== CLASSEMENT ===== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Classement</Text>
            <TouchableOpacity testID="see-all-leaderboard-btn" onPress={() => router.push('/(tabs)/leaderboard')}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {leaderboard.length > 0 ? (
            <View style={styles.leaderboardCard}>
              {/* Top 3 Podium */}
              <View style={styles.podium}>
                {leaderboard.length > 1 && (
                  <View style={styles.podiumItem}>
                    <View style={[styles.podiumAvatar, styles.podium2]}>
                      {leaderboard[1]?.picture ? (
                        <Image source={{ uri: leaderboard[1].picture }} style={styles.podiumImg} />
                      ) : (
                        <Text style={styles.podiumInitial}>
                          {leaderboard[1]?.name?.charAt(0)?.toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.rankBadge, { backgroundColor: '#C0C0C0' }]}>
                      <Text style={styles.rankText}>2</Text>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[1]?.name}</Text>
                    <Text style={styles.podiumPoints}>{leaderboard[1]?.points} pts</Text>
                  </View>
                )}
                {leaderboard.length > 0 && (
                  <View style={[styles.podiumItem, styles.podiumFirst]}>
                    <Ionicons name="crown" size={24} color={COLORS.warning} style={styles.crown} />
                    <View style={[styles.podiumAvatar, styles.podium1]}>
                      {leaderboard[0]?.picture ? (
                        <Image source={{ uri: leaderboard[0].picture }} style={styles.podiumImg} />
                      ) : (
                        <Text style={styles.podiumInitial}>
                          {leaderboard[0]?.name?.charAt(0)?.toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.rankBadge, { backgroundColor: COLORS.warning }]}>
                      <Text style={styles.rankText}>1</Text>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[0]?.name}</Text>
                    <Text style={styles.podiumPoints}>{leaderboard[0]?.points} pts</Text>
                  </View>
                )}
                {leaderboard.length > 2 && (
                  <View style={styles.podiumItem}>
                    <View style={[styles.podiumAvatar, styles.podium3]}>
                      {leaderboard[2]?.picture ? (
                        <Image source={{ uri: leaderboard[2].picture }} style={styles.podiumImg} />
                      ) : (
                        <Text style={styles.podiumInitial}>
                          {leaderboard[2]?.name?.charAt(0)?.toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.rankBadge, { backgroundColor: '#CD7F32' }]}>
                      <Text style={styles.rankText}>3</Text>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[2]?.name}</Text>
                    <Text style={styles.podiumPoints}>{leaderboard[2]?.points} pts</Text>
                  </View>
                )}
              </View>
              {/* Remaining */}
              {leaderboard.slice(3).map((u: any, i: number) => (
                <View key={u.user_id} style={styles.leaderRow}>
                  <Text style={styles.leaderRank}>#{i + 4}</Text>
                  <View style={styles.leaderAvatar}>
                    {u.picture ? (
                      <Image source={{ uri: u.picture }} style={styles.leaderAvatarImg} />
                    ) : (
                      <Text style={styles.leaderAvatarText}>{u.name?.charAt(0)}</Text>
                    )}
                  </View>
                  <Text style={styles.leaderName} numberOfLines={1}>{u.name}</Text>
                  <Text style={styles.leaderPoints}>{u.points} pts</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptySmall}>
              <Text style={styles.emptySubtitle}>Le classement sera disponible bientôt</Text>
            </View>
          )}
        </View>

        {/* ===== BADGES ===== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Badges</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeScroll}>
            {Object.entries(BADGE_CONFIG).map(([id, badge]) => {
              const earned = user?.badges?.includes(id);
              return (
                <View key={id} style={[styles.badgeItem, !earned && styles.badgeLocked]}>
                  <View
                    style={[
                      styles.badgeCircle,
                      earned
                        ? { borderColor: badge.color, shadowColor: badge.color }
                        : { borderColor: COLORS.border },
                    ]}
                  >
                    <Ionicons
                      name={badge.icon as any}
                      size={28}
                      color={earned ? badge.color : COLORS.textMuted}
                    />
                  </View>
                  <Text style={[styles.badgeLabel, earned && { color: COLORS.textPrimary }]}>
                    {badge.label}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* ===== PUBLIER CTA ===== */}
        {activeChallenges.length > 0 && (
          <TouchableOpacity
            testID="home-publish-cta"
            onPress={() => router.push('/(tabs)/publish')}
            activeOpacity={0.8}
            style={styles.publishCTA}
          >
            <LinearGradient
              colors={['#007AFF', '#9D4CDD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.publishCTAGradient}
            >
              <Ionicons name="camera" size={24} color="#FFFFFF" />
              <Text style={styles.publishCTAText}>Publier une preuve</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // ===== HEADER =====
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ===== STATS =====
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  statGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // ===== SECTIONS =====
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  // ===== ACTIVE CHALLENGES =====
  challengeCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  challengeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  challengeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  progressSection: {
    gap: SPACING.xs,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressDay: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.success,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#2C2C2E',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  // ===== EMPTY STATE =====
  emptyCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.xl,
    marginHorizontal: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyIconWrap: {
    marginBottom: SPACING.xs,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  emptySmall: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  // ===== TRENDING =====
  trendingScroll: {
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.sm,
    gap: SPACING.sm,
  },
  trendingCard: {
    width: 160,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  trendingIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  trendingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  trendingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.sm,
  },
  trendingParticipants: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  trendingCatBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  trendingCatText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // ===== LEADERBOARD =====
  leaderboardCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingVertical: SPACING.md,
    gap: SPACING.lg,
  },
  podiumItem: {
    alignItems: 'center',
    width: 80,
  },
  podiumFirst: {
    marginBottom: SPACING.md,
  },
  crown: {
    marginBottom: SPACING.xs,
  },
  podiumAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    overflow: 'hidden',
  },
  podium1: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderColor: COLORS.warning,
    backgroundColor: COLORS.cardLight,
  },
  podium2: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderColor: '#C0C0C0',
    backgroundColor: COLORS.cardLight,
  },
  podium3: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderColor: '#CD7F32',
    backgroundColor: COLORS.cardLight,
  },
  podiumImg: {
    width: '100%',
    height: '100%',
  },
  podiumInitial: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000',
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  podiumPoints: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  leaderRank: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
    width: 30,
    textAlign: 'center',
  },
  leaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardLight,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  leaderAvatarImg: {
    width: 36,
    height: 36,
  },
  leaderAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  leaderName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  leaderPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  // ===== BADGES =====
  badgeScroll: {
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.sm,
    gap: SPACING.md,
  },
  badgeItem: {
    alignItems: 'center',
    width: 80,
    marginRight: SPACING.sm,
  },
  badgeLocked: {
    opacity: 0.4,
  },
  badgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  // ===== PUBLISH CTA =====
  publishCTA: {
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  publishCTAGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: SPACING.sm,
  },
  publishCTAText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
});
