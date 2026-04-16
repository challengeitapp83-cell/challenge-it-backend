import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, RefreshControl, ActivityIndicator, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../contexts/api';
import { COLORS, CATEGORIES, BADGE_CONFIG, getChallengeImage } from '../../contexts/theme';

const { width: W } = Dimensions.get('window');
const HERO_BG = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&h=1200&fit=crop&q=80';

// Animated wrapper for staggered entrance
function FadeSlide({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

export default function HomeScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeChallenges, setActiveChallenges] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [mc, td, ld, fd] = await Promise.all([
        api.get('/api/my-challenges').catch(() => []),
        api.get('/api/challenges/trending?limit=6').catch(() => []),
        api.get('/api/leaderboard?limit=5').catch(() => []),
        api.get('/api/proofs/feed?limit=5').catch(() => []),
      ]);
      setActiveChallenges(mc);
      setTrending(td);
      setLeaderboard(ld);
      setFeed(fd);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = async () => { setRefreshing(true); await Promise.all([fetchData(), refreshUser()]); setRefreshing(false); };

  if (loading) {
    return (
      <View style={s.loadWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* Full-screen hero background */}
      <Image source={{ uri: HERO_BG }} style={s.heroBg} blurRadius={3} />
      <LinearGradient
        colors={['rgba(15,15,25,0.55)', 'rgba(15,15,25,0.88)', 'rgba(15,15,15,0.98)', '#0F0F0F']}
        locations={[0, 0.28, 0.48, 0.65]}
        style={s.heroOverlay}
      />

      <ScrollView
        testID="home-scroll"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ===== HERO SECTION ===== */}
        <FadeSlide delay={0}>
          <View style={[s.hero, { paddingTop: insets.top + 12 }]}>
            {/* User row */}
            <View style={s.userRow}>
              <View style={s.avatarWrap}>
                {user?.picture ? (
                  <Image source={{ uri: user.picture }} style={s.avatar} />
                ) : (
                  <LinearGradient colors={['#007AFF', '#9D4CDD']} style={s.avatar}>
                    <Text style={s.avatarInit}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                  </LinearGradient>
                )}
                <View style={s.lvl}><Text style={s.lvlN}>{user?.level || 1}</Text></View>
              </View>
              <View style={s.userInfo}>
                <Text style={s.userGreet}>Salut, {user?.name?.split(' ')[0] || 'Challenger'}</Text>
                <Text style={s.heroTagline}>Push your limits.</Text>
              </View>
              <TouchableOpacity testID="notifications-btn" style={s.notifBtn} onPress={() => {}}>
                <Ionicons name="notifications-outline" size={22} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>

            {/* Hero text */}
            <View style={s.heroText}>
              <Text style={s.heroTitle}>Crée des défis.{'\n'}Compétitionne.{'\n'}Gagne.</Text>
            </View>

            {/* CTA */}
            <TouchableOpacity testID="hero-create-btn" onPress={() => router.push('/create-challenge')} activeOpacity={0.85}>
              <LinearGradient colors={['#007AFF', '#9D4CDD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.heroCTA}>
                <Ionicons name="flash" size={20} color="#FFF" />
                <Text style={s.heroCTAText}>Créer un défi</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </FadeSlide>

        {/* ===== STATS (Glass) ===== */}
        <FadeSlide delay={100}>
          <View style={s.statsRow} testID="user-stats">
            {[
              { icon: 'flame', color: '#FF6B35', val: user?.streak || 0, lbl: 'Streak' },
              { icon: 'trophy', color: COLORS.warning, val: activeChallenges.length, lbl: 'Actifs' },
              { icon: 'podium', color: COLORS.primary, val: user?.points || 0, lbl: 'Points' },
              { icon: 'star', color: COLORS.secondary, val: user?.level || 1, lbl: 'Niveau' },
            ].map((s2, i) => (
              <View key={i} style={s.statCard}>
                <Ionicons name={s2.icon as any} size={20} color={s2.color} />
                <Text style={s.statVal}>{s2.val}</Text>
                <Text style={s.statLbl}>{s2.lbl}</Text>
              </View>
            ))}
          </View>
        </FadeSlide>

        {/* ===== MES DÉFIS ACTIFS ===== */}
        <FadeSlide delay={200}>
          <View style={s.sec}>
            <View style={s.secHead}>
              <Text style={s.secTitle}>Mes Défis Actifs</Text>
              {activeChallenges.length > 0 && (
                <TouchableOpacity testID="see-all-challenges-btn" onPress={() => router.push('/(tabs)/challenges')}>
                  <Text style={s.secLink}>Voir tout</Text>
                </TouchableOpacity>
              )}
            </View>
            {activeChallenges.length === 0 ? (
              <TouchableOpacity testID="join-first-challenge-btn" onPress={() => router.push('/(tabs)/challenges')} activeOpacity={0.8}>
                <View style={s.emptyCard}>
                  <Ionicons name="add-circle" size={36} color={COLORS.primary} />
                  <Text style={s.emptyT}>Rejoins ton premier défi</Text>
                </View>
              </TouchableOpacity>
            ) : (
              activeChallenges.slice(0, 3).map((uc: any) => {
                const ch = uc.challenge;
                const cat = CATEGORIES[ch?.category] || CATEGORIES['Autre'];
                const prog = ch?.duration_days ? (uc.completed_days || 0) / ch.duration_days : 0;
                const img = getChallengeImage(ch?.challenge_id, ch?.category, ch?.image);
                return (
                  <TouchableOpacity key={uc.user_challenge_id} testID={`active-challenge-${uc.user_challenge_id}`}
                    onPress={() => router.push(`/challenge/${ch?.challenge_id}`)} activeOpacity={0.85} style={s.acWrap}>
                    <View style={s.acCard}>
                      <Image source={{ uri: img }} style={StyleSheet.absoluteFill} />
                      <LinearGradient colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.92)']} locations={[0.2, 1]} style={StyleSheet.absoluteFill} />
                      <View style={s.acContent}>
                        <View style={[s.pill, { backgroundColor: cat.color + '40' }]}>
                          <Ionicons name={cat.icon as any} size={11} color={cat.color} />
                          <Text style={[s.pillTxt, { color: cat.color }]}>{ch?.category}</Text>
                        </View>
                        <Text style={s.acTitle}>{ch?.title}</Text>
                        <View style={s.acProgRow}>
                          <Text style={s.acDay}>Jour {uc.current_day || 1}/{ch?.duration_days}</Text>
                          <Text style={s.acPct}>{Math.round(prog * 100)}%</Text>
                        </View>
                        <View style={s.barBg}>
                          <LinearGradient colors={[COLORS.success, '#28B446']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={[s.barFill, { width: `${Math.max(prog * 100, 4)}%` as any }]} />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </FadeSlide>

        {/* ===== DÉFIS TENDANCE ===== */}
        <FadeSlide delay={300}>
          <View style={s.sec}>
            <View style={s.secHead}>
              <Text style={s.secTitle}>Tendance</Text>
              <TouchableOpacity testID="see-all-trending-btn" onPress={() => router.push('/(tabs)/challenges')}>
                <Ionicons name="arrow-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}>
              {trending.map((ch: any) => {
                const cat = CATEGORIES[ch.category] || CATEGORIES['Autre'];
                const img = getChallengeImage(ch.challenge_id, ch.category, ch.image);
                return (
                  <TouchableOpacity key={ch.challenge_id} testID={`trending-${ch.challenge_id}`}
                    onPress={() => router.push(`/challenge/${ch.challenge_id}`)} activeOpacity={0.85} style={s.trCard}>
                    <Image source={{ uri: img }} style={StyleSheet.absoluteFill} />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} locations={[0.25, 1]} style={StyleSheet.absoluteFill} />
                    <View style={s.trTop}>
                      <View style={[s.pill, { backgroundColor: cat.color + '50' }]}>
                        <Text style={[s.pillTxt, { color: cat.color }]}>{ch.category}</Text>
                      </View>
                    </View>
                    <View style={s.trBot}>
                      <Text style={s.trTitle} numberOfLines={2}>{ch.title}</Text>
                      <View style={s.trMeta}>
                        <Ionicons name="people" size={13} color="rgba(255,255,255,0.7)" />
                        <Text style={s.trMetaTxt}>{ch.participant_count}</Text>
                        {ch.has_pot && (<><Ionicons name="cash" size={13} color={COLORS.warning} /><Text style={[s.trMetaTxt, { color: COLORS.warning }]}>{ch.pot_total || ch.pot_amount_per_person}€</Text></>)}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </FadeSlide>

        {/* ===== COMMUNITY FEED ===== */}
        <FadeSlide delay={400}>
          <View style={s.sec}>
            <View style={s.secHead}>
              <Text style={s.secTitle}>Activité</Text>
            </View>
            {feed.length === 0 ? (
              <View style={s.feedEmpty}>
                <Ionicons name="chatbubbles-outline" size={32} color={COLORS.textMuted} />
                <Text style={s.feedEmptyTxt}>Aucune activité récente</Text>
              </View>
            ) : (
              feed.slice(0, 4).map((p: any, i: number) => (
                <View key={p.proof_id || i} style={s.feedCard}>
                  <View style={s.feedAvWrap}>
                    {p.user_picture ? (
                      <Image source={{ uri: p.user_picture }} style={s.feedAv} />
                    ) : (
                      <LinearGradient colors={['#007AFF', '#9D4CDD']} style={s.feedAv}>
                        <Text style={s.feedAvInit}>{p.user_name?.charAt(0)?.toUpperCase()}</Text>
                      </LinearGradient>
                    )}
                  </View>
                  <View style={s.feedBody}>
                    <Text style={s.feedUser}>{p.user_name}</Text>
                    <Text style={s.feedAction} numberOfLines={1}>a publié une preuve pour <Text style={{ color: COLORS.primary }}>{p.challenge_title}</Text></Text>
                    <Text style={s.feedText} numberOfLines={2}>{p.text}</Text>
                  </View>
                  <View style={s.feedRight}>
                    <Text style={s.feedDay}>Jour {p.day_number}</Text>
                    <View style={s.feedLikes}>
                      <Ionicons name="heart" size={14} color={p.likes > 0 ? '#FF3B5C' : COLORS.textMuted} />
                      <Text style={s.feedLikeN}>{p.likes || 0}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </FadeSlide>

        {/* ===== CLASSEMENT ===== */}
        <FadeSlide delay={500}>
          <View style={s.sec}>
            <View style={s.secHead}>
              <Text style={s.secTitle}>Classement</Text>
              <TouchableOpacity testID="see-all-leaderboard-btn" onPress={() => router.push('/(tabs)/leaderboard')}>
                <Text style={s.secLink}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            {leaderboard.length > 0 ? (
              <View style={s.lbList}>
                {leaderboard.slice(0, 5).map((u: any, i: number) => {
                  const medals = [COLORS.warning, '#C0C0C0', '#CD7F32', COLORS.textMuted, COLORS.textMuted];
                  return (
                    <View key={u.user_id} style={s.lbRow}>
                      <View style={[s.lbMedal, i < 3 && { backgroundColor: medals[i] + '18' }]}>
                        <Text style={[s.lbMedalN, { color: medals[i] }]}>#{i + 1}</Text>
                      </View>
                      <View style={[s.lbAv, { borderColor: i < 3 ? medals[i] : COLORS.border }]}>
                        {u.picture ? (
                          <Image source={{ uri: u.picture }} style={s.lbAvImg} />
                        ) : (
                          <LinearGradient colors={i === 0 ? ['#007AFF', '#9D4CDD'] : ['#333', '#444']} style={s.lbAvGrad}>
                            <Text style={s.lbAvInit}>{u.name?.charAt(0)?.toUpperCase()}</Text>
                          </LinearGradient>
                        )}
                      </View>
                      <View style={s.lbInfo}>
                        <Text style={s.lbName} numberOfLines={1}>{u.name}</Text>
                        <View style={s.lbStreakRow}><Ionicons name="flame" size={12} color="#FF6B35" /><Text style={s.lbStreak}>{u.streak || 0}j</Text></View>
                      </View>
                      <Text style={[s.lbPts, i === 0 && { color: COLORS.warning }]}>{u.points} pts</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={s.feedEmpty}><Text style={s.feedEmptyTxt}>Classement bientôt disponible</Text></View>
            )}
          </View>
        </FadeSlide>

        {/* ===== BADGES ===== */}
        <FadeSlide delay={600}>
          <View style={s.sec}>
            <View style={s.secHead}><Text style={s.secTitle}>Badges</Text></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}>
              {Object.entries(BADGE_CONFIG).map(([id, badge]) => {
                const earned = user?.badges?.includes(id);
                return (
                  <View key={id} style={[s.bdItem, !earned && { opacity: 0.28 }]}>
                    <View style={[s.bdCircle, earned && { borderColor: badge.color }]}>
                      <Ionicons name={badge.icon as any} size={26} color={earned ? badge.color : COLORS.textMuted} />
                    </View>
                    <Text style={[s.bdLabel, earned && { color: '#FFF' }]}>{badge.label}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </FadeSlide>

        {/* ===== PUBLISH CTA ===== */}
        {activeChallenges.length > 0 && (
          <FadeSlide delay={700}>
            <TouchableOpacity testID="home-publish-cta" onPress={() => router.push('/(tabs)/publish')} activeOpacity={0.8} style={s.ctaWrap}>
              <LinearGradient colors={['#007AFF', '#9D4CDD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.ctaGrad}>
                <Ionicons name="camera" size={24} color="#FFF" />
                <Text style={s.ctaTxt}>Publier une preuve</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </FadeSlide>
        )}
      </ScrollView>
    </View>
  );
}

const GLASS = { backgroundColor: 'rgba(28,28,40,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' };

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F0F0F' },
  loadWrap: { flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center' },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 520, width: '100%' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 520 },
  // Hero section
  hero: { paddingHorizontal: 20, paddingBottom: 8 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: COLORS.primary },
  avatarInit: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  lvl: { position: 'absolute', bottom: -3, right: -3, backgroundColor: COLORS.primary, borderRadius: 10, width: 22, height: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: '#0F0F0F' },
  lvlN: { fontSize: 10, fontWeight: '900', color: '#FFF' },
  userInfo: { flex: 1 },
  userGreet: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  heroTagline: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  notifBtn: { width: 44, height: 44, borderRadius: 22, ...GLASS, justifyContent: 'center', alignItems: 'center' },
  heroText: { marginBottom: 20 },
  heroTitle: { fontSize: 32, fontWeight: '900', color: '#FFF', lineHeight: 38, letterSpacing: -0.5, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 12 },
  heroCTA: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, gap: 10 },
  heroCTAText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  // Stats (glass)
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginTop: 16, marginBottom: 28 },
  statCard: { flex: 1, ...GLASS, borderRadius: 14, paddingVertical: 14, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 22, fontWeight: '900', color: '#FFF' },
  statLbl: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.2 },
  // Section
  sec: { marginBottom: 28 },
  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 },
  secTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  secLink: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  // Active challenges
  acWrap: { marginHorizontal: 20, marginBottom: 12 },
  acCard: { borderRadius: 20, overflow: 'hidden', height: 165 },
  acContent: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 16 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 6 },
  pillTxt: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  acTitle: { fontSize: 19, fontWeight: '900', color: '#FFF', marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  acProgRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  acDay: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  acPct: { fontSize: 12, fontWeight: '800', color: COLORS.success },
  barBg: { height: 5, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  emptyCard: { ...GLASS, borderRadius: 20, padding: 32, marginHorizontal: 20, alignItems: 'center', gap: 10, borderStyle: 'dashed' },
  emptyT: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  // Trending
  trCard: { width: 170, height: 235, borderRadius: 20, overflow: 'hidden', marginRight: 12 },
  trTop: { position: 'absolute', top: 12, left: 12, zIndex: 2 },
  trBot: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  trTitle: { fontSize: 15, fontWeight: '900', color: '#FFF', lineHeight: 20, marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  trMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trMetaTxt: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  // Community feed
  feedEmpty: { ...GLASS, borderRadius: 16, padding: 24, marginHorizontal: 20, alignItems: 'center', gap: 8 },
  feedEmptyTxt: { fontSize: 14, fontWeight: '500', color: COLORS.textMuted },
  feedCard: { flexDirection: 'row', ...GLASS, borderRadius: 16, marginHorizontal: 20, marginBottom: 8, padding: 14, gap: 12 },
  feedAvWrap: {},
  feedAv: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  feedAvInit: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  feedBody: { flex: 1, gap: 2 },
  feedUser: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  feedAction: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  feedText: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  feedRight: { alignItems: 'flex-end', gap: 6 },
  feedDay: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  feedLikes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  feedLikeN: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  // Leaderboard
  lbList: { marginHorizontal: 20, gap: 6 },
  lbRow: { flexDirection: 'row', alignItems: 'center', gap: 12, ...GLASS, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 },
  lbMedal: { width: 32, alignItems: 'center', borderRadius: 8, paddingVertical: 2 },
  lbMedalN: { fontSize: 14, fontWeight: '900' },
  lbAv: { width: 44, height: 44, borderRadius: 22, borderWidth: 2.5, overflow: 'hidden', backgroundColor: '#1E1E1E' },
  lbAvImg: { width: 44, height: 44, borderRadius: 22 },
  lbAvGrad: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  lbAvInit: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  lbInfo: { flex: 1, gap: 2 },
  lbName: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  lbStreakRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lbStreak: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  lbPts: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  // Badges
  bdItem: { alignItems: 'center', width: 78, marginRight: 10 },
  bdCircle: { width: 60, height: 60, borderRadius: 30, ...GLASS, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  bdLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' },
  // CTA
  ctaWrap: { marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  ctaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  ctaTxt: { fontSize: 17, fontWeight: '700', color: '#FFF', flex: 1 },
});
