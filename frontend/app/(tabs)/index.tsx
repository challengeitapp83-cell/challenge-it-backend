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
import { COLORS, SPACING, RADIUS, CATEGORIES, BADGE_CONFIG, getChallengeImage } from '../../contexts/theme';

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
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), refreshUser()]);
    setRefreshing(false);
  };

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ===== USER HEADER ===== */}
        <View style={styles.header} testID="user-header">
          <View style={styles.headerLeft}>
            <View style={styles.avatarWrapper}>
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
            <View style={styles.headerInfo}>
              <Text style={styles.greeting}>Salut,</Text>
              <Text style={styles.userName} numberOfLines={1}>{user?.name || 'Challenger'}</Text>
            </View>
          </View>
          <TouchableOpacity testID="notifications-btn" style={styles.notifBtn} onPress={() => {}}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ===== STATS ===== */}
        <View style={styles.statsRow} testID="user-stats">
          {[
            { icon: 'star', color: COLORS.primary, value: user?.points || 0, label: 'Points' },
            { icon: 'flame', color: '#FF6B35', value: user?.streak || 0, label: 'Streak' },
            { icon: 'heart', color: COLORS.secondary, value: user?.reputation || 0, label: 'Réputation' },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: s.color + '18' }]}>
                <Ionicons name={s.icon as any} size={18} color={s.color} />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
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
            <TouchableOpacity testID="join-first-challenge-btn" onPress={() => router.push('/(tabs)/challenges')} activeOpacity={0.8}>
              <View style={styles.emptyCard}>
                <Ionicons name="add-circle" size={40} color={COLORS.primary} />
                <Text style={styles.emptyTitle}>Aucun défi actif</Text>
                <Text style={styles.emptySub}>Rejoins ton premier défi pour commencer !</Text>
              </View>
            </TouchableOpacity>
          ) : (
            activeChallenges.slice(0, 3).map((uc: any) => {
              const ch = uc.challenge;
              const cat = CATEGORIES[ch?.category] || CATEGORIES['Autre'];
              const progress = ch?.duration_days ? (uc.completed_days || 0) / ch.duration_days : 0;
              const img = getChallengeImage(ch?.challenge_id, ch?.category, ch?.image);
              return (
                <TouchableOpacity key={uc.user_challenge_id} testID={`active-challenge-${uc.user_challenge_id}`}
                  onPress={() => router.push(`/challenge/${ch?.challenge_id}`)} activeOpacity={0.85} style={styles.activeWrap}>
                  <View style={styles.activeCard}>
                    <Image source={{ uri: img }} style={StyleSheet.absoluteFill} />
                    <LinearGradient colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.92)']} locations={[0.25, 1]} style={StyleSheet.absoluteFill} />
                    <View style={styles.activeContent}>
                      <View style={[styles.catPill, { backgroundColor: cat.color + '40' }]}>
                        <Ionicons name={cat.icon as any} size={11} color={cat.color} />
                        <Text style={[styles.catPillText, { color: cat.color }]}>{ch?.category}</Text>
                      </View>
                      <Text style={styles.activeTitle}>{ch?.title}</Text>
                      <View style={styles.progressRow}>
                        <Text style={styles.progressDay}>Jour {uc.current_day || 1}/{ch?.duration_days}</Text>
                        <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
                      </View>
                      <View style={styles.progressBg}>
                        <LinearGradient colors={[COLORS.success, '#28B446']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={[styles.progressFill, { width: `${Math.max(progress * 100, 4)}%` as any }]} />
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendScroll}>
            {trending.map((ch: any) => {
              const cat = CATEGORIES[ch.category] || CATEGORIES['Autre'];
              const img = getChallengeImage(ch.challenge_id, ch.category, ch.image);
              return (
                <TouchableOpacity key={ch.challenge_id} testID={`trending-${ch.challenge_id}`}
                  onPress={() => router.push(`/challenge/${ch.challenge_id}`)} activeOpacity={0.85} style={styles.trendCard}>
                  <Image source={{ uri: img }} style={StyleSheet.absoluteFill} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} locations={[0.25, 1]} style={StyleSheet.absoluteFill} />
                  {/* Top badge */}
                  <View style={styles.trendTopRow}>
                    <View style={[styles.trendCatPill, { backgroundColor: cat.color + '50' }]}>
                      <Text style={[styles.trendCatText, { color: cat.color }]}>{ch.category}</Text>
                    </View>
                  </View>
                  {/* Bottom content */}
                  <View style={styles.trendBottom}>
                    <Text style={styles.trendTitle} numberOfLines={2}>{ch.title}</Text>
                    <View style={styles.trendMeta}>
                      <View style={styles.trendMetaRow}>
                        <Ionicons name="people" size={13} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.trendMetaText}>{ch.participant_count}</Text>
                      </View>
                      <View style={styles.trendMetaRow}>
                        <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.trendMetaText}>{ch.duration_days}j</Text>
                      </View>
                    </View>
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
            <View style={styles.lbCard}>
              {/* Top 3 in a compact row */}
              {leaderboard.slice(0, 3).map((u: any, i: number) => {
                const medals = [COLORS.warning, '#C0C0C0', '#CD7F32'];
                const sizes = [56, 46, 46];
                return (
                  <View key={u.user_id} style={styles.lbRow}>
                    <View style={[styles.lbMedal, { backgroundColor: medals[i] + '20' }]}>
                      <Text style={[styles.lbMedalText, { color: medals[i] }]}>#{i + 1}</Text>
                    </View>
                    <View style={[styles.lbAvatar, { width: sizes[i], height: sizes[i], borderRadius: sizes[i] / 2, borderColor: medals[i] }]}>
                      {u.picture ? (
                        <Image source={{ uri: u.picture }} style={{ width: sizes[i], height: sizes[i], borderRadius: sizes[i] / 2 }} />
                      ) : (
                        <Text style={[styles.lbInitial, { fontSize: sizes[i] * 0.38 }]}>{u.name?.charAt(0)?.toUpperCase()}</Text>
                      )}
                    </View>
                    <View style={styles.lbInfo}>
                      <Text style={styles.lbName} numberOfLines={1}>{u.name}</Text>
                      <View style={styles.lbStreakRow}>
                        <Ionicons name="flame" size={12} color="#FF6B35" />
                        <Text style={styles.lbStreak}>{u.streak || 0} jours</Text>
                      </View>
                    </View>
                    <Text style={[styles.lbPts, i === 0 && { color: COLORS.warning }]}>{u.points} pts</Text>
                  </View>
                );
              })}
              {leaderboard.slice(3).map((u: any, i: number) => (
                <View key={u.user_id} style={styles.lbRow}>
                  <View style={styles.lbMedal}>
                    <Text style={styles.lbMedalTextGrey}>#{i + 4}</Text>
                  </View>
                  <View style={[styles.lbAvatar, { width: 40, height: 40, borderRadius: 20, borderColor: COLORS.border }]}>
                    {u.picture ? (
                      <Image source={{ uri: u.picture }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                    ) : (
                      <Text style={[styles.lbInitial, { fontSize: 15 }]}>{u.name?.charAt(0)?.toUpperCase()}</Text>
                    )}
                  </View>
                  <View style={styles.lbInfo}>
                    <Text style={styles.lbName} numberOfLines={1}>{u.name}</Text>
                  </View>
                  <Text style={styles.lbPts}>{u.points} pts</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptySmall}>
              <Text style={styles.emptySub}>Le classement sera disponible bientôt</Text>
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
                <View key={id} style={[styles.badgeItem, !earned && { opacity: 0.3 }]}>
                  <View style={[styles.badgeCircle, earned && { borderColor: badge.color }]}>
                    <Ionicons name={badge.icon as any} size={26} color={earned ? badge.color : COLORS.textMuted} />
                  </View>
                  <Text style={[styles.badgeLabel, earned && { color: COLORS.textPrimary }]}>{badge.label}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* ===== PUBLIER CTA ===== */}
        {activeChallenges.length > 0 && (
          <TouchableOpacity testID="home-publish-cta" onPress={() => router.push('/(tabs)/publish')} activeOpacity={0.8} style={styles.ctaWrap}>
            <LinearGradient colors={['#007AFF', '#9D4CDD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
              <Ionicons name="camera" size={24} color="#FFF" />
              <Text style={styles.ctaText}>Publier une preuve</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: COLORS.primary },
  avatarInitial: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  levelBadge: { position: 'absolute', bottom: -3, right: -3, backgroundColor: COLORS.primary, borderRadius: 10, width: 22, height: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: COLORS.background },
  levelNum: { fontSize: 10, fontWeight: '900', color: '#FFF' },
  headerInfo: { flex: 1 },
  greeting: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  userName: { fontSize: 22, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  notifBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginTop: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 14, paddingVertical: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: COLORS.border },
  statIconBg: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 },
  sectionTitle: { fontSize: 21, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  seeAll: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  // Active challenge cards
  activeWrap: { marginHorizontal: 20, marginBottom: 12 },
  activeCard: { borderRadius: 18, overflow: 'hidden', height: 170 },
  activeContent: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 16 },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 6 },
  catPillText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  activeTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: -0.3, marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressDay: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },
  progressPct: { fontSize: 13, fontWeight: '800', color: COLORS.success },
  progressBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  // Empty
  emptyCard: { borderRadius: 18, padding: 32, marginHorizontal: 20, alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed', backgroundColor: COLORS.card },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  emptySub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  emptySmall: { paddingHorizontal: 20, paddingVertical: 20, alignItems: 'center' },
  // Trending
  trendScroll: { paddingLeft: 20, paddingRight: 8 },
  trendCard: { width: 175, height: 240, borderRadius: 18, overflow: 'hidden', marginRight: 12 },
  trendTopRow: { position: 'absolute', top: 12, left: 12, zIndex: 2 },
  trendCatPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  trendCatText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  trendBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  trendTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', lineHeight: 21, marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  trendMeta: { flexDirection: 'row', gap: 14 },
  trendMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendMetaText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },
  // Leaderboard (redesigned - no podium bars)
  lbCard: { marginHorizontal: 20, gap: 6 },
  lbRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.card, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.border },
  lbMedal: { width: 32, alignItems: 'center' },
  lbMedalText: { fontSize: 15, fontWeight: '900' },
  lbMedalTextGrey: { fontSize: 14, fontWeight: '800', color: COLORS.textMuted },
  lbAvatar: { justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, overflow: 'hidden', backgroundColor: COLORS.cardLight },
  lbInitial: { fontWeight: '800', color: '#FFF' },
  lbInfo: { flex: 1, gap: 2 },
  lbName: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  lbStreakRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lbStreak: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  lbPts: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  // Badges
  badgeScroll: { paddingLeft: 20, paddingRight: 8 },
  badgeItem: { alignItems: 'center', width: 80, marginRight: 10 },
  badgeCircle: { width: 62, height: 62, borderRadius: 31, backgroundColor: COLORS.card, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  badgeLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' },
  // CTA
  ctaWrap: { marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  ctaText: { fontSize: 17, fontWeight: '700', color: '#FFF', flex: 1 },
});
