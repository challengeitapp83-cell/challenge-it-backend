import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, RefreshControl, ActivityIndicator, ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../contexts/api';
import { COLORS, SPACING, RADIUS, CATEGORIES, BADGE_CONFIG, getChallengeImage } from '../../contexts/theme';

const HERO_BG = 'https://images.unsplash.com/photo-1607702713064-0143212236ae?w=900&h=1600&fit=crop&q=75';

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
      const [mc, td, ld] = await Promise.all([
        api.get('/api/my-challenges').catch(() => []),
        api.get('/api/challenges/trending?limit=6').catch(() => []),
        api.get('/api/leaderboard?limit=5').catch(() => []),
      ]);
      setActiveChallenges(mc);
      setTrending(td);
      setLeaderboard(ld);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = async () => { setRefreshing(true); await Promise.all([fetchData(), refreshUser()]); setRefreshing(false); };

  if (loading) {
    return (
      <View style={[g.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <View style={g.container}>
      {/* ===== HERO BACKGROUND IMAGE ===== */}
      <Image source={{ uri: HERO_BG }} style={g.heroBg} blurRadius={2} />
      {/* Multi-layer overlay: top dark, bottom very dark */}
      <LinearGradient
        colors={['rgba(15,15,15,0.65)', 'rgba(15,15,15,0.88)', 'rgba(15,15,15,0.97)', '#0F0F0F']}
        locations={[0, 0.3, 0.5, 0.7]}
        style={g.heroOverlay}
      />

      <ScrollView
        testID="home-scroll"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: insets.top }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ===== USER HEADER ===== */}
        <View style={h.header} testID="user-header">
          <View style={h.left}>
            <View style={h.avatarWrap}>
              {user?.picture ? (
                <Image source={{ uri: user.picture }} style={h.avatar} />
              ) : (
                <LinearGradient colors={['#007AFF', '#9D4CDD']} style={h.avatar}>
                  <Text style={h.avatarInit}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                </LinearGradient>
              )}
              <View style={h.lvlBadge}><Text style={h.lvlNum}>{user?.level || 1}</Text></View>
            </View>
            <View style={h.info}>
              <Text style={h.greet}>Salut,</Text>
              <Text style={h.name} numberOfLines={1}>{user?.name || 'Challenger'}</Text>
            </View>
          </View>
          <TouchableOpacity testID="notifications-btn" style={h.notif} onPress={() => {}}>
            <Ionicons name="notifications-outline" size={22} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        {/* ===== STATS (glass effect) ===== */}
        <View style={st.row} testID="user-stats">
          {[
            { icon: 'star', color: COLORS.primary, val: user?.points || 0, lbl: 'Points' },
            { icon: 'flame', color: '#FF6B35', val: user?.streak || 0, lbl: 'Streak' },
            { icon: 'heart', color: COLORS.secondary, val: user?.reputation || 0, lbl: 'Réputation' },
          ].map((s, i) => (
            <View key={i} style={st.card}>
              <View style={[st.iconBg, { backgroundColor: s.color + '20' }]}>
                <Ionicons name={s.icon as any} size={18} color={s.color} />
              </View>
              <Text style={st.val}>{s.val}</Text>
              <Text style={st.lbl}>{s.lbl}</Text>
            </View>
          ))}
        </View>

        {/* ===== MES DÉFIS ACTIFS ===== */}
        <View style={sec.wrap}>
          <View style={sec.head}>
            <Text style={sec.title}>Mes Défis Actifs</Text>
            {activeChallenges.length > 0 && (
              <TouchableOpacity testID="see-all-challenges-btn" onPress={() => router.push('/(tabs)/challenges')}>
                <Text style={sec.link}>Voir tout</Text>
              </TouchableOpacity>
            )}
          </View>
          {activeChallenges.length === 0 ? (
            <TouchableOpacity testID="join-first-challenge-btn" onPress={() => router.push('/(tabs)/challenges')} activeOpacity={0.8}>
              <View style={ac.empty}>
                <Ionicons name="add-circle" size={40} color={COLORS.primary} />
                <Text style={ac.emptyT}>Aucun défi actif</Text>
                <Text style={ac.emptyS}>Rejoins ton premier défi !</Text>
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
                  onPress={() => router.push(`/challenge/${ch?.challenge_id}`)} activeOpacity={0.85} style={ac.wrap}>
                  <View style={ac.card}>
                    <Image source={{ uri: img }} style={StyleSheet.absoluteFill} />
                    <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.92)']} locations={[0.2, 1]} style={StyleSheet.absoluteFill} />
                    <View style={ac.content}>
                      <View style={[ac.catPill, { backgroundColor: cat.color + '40' }]}>
                        <Ionicons name={cat.icon as any} size={11} color={cat.color} />
                        <Text style={[ac.catTxt, { color: cat.color }]}>{ch?.category}</Text>
                      </View>
                      <Text style={ac.title}>{ch?.title}</Text>
                      <View style={ac.progRow}>
                        <Text style={ac.day}>Jour {uc.current_day || 1}/{ch?.duration_days}</Text>
                        <Text style={ac.pct}>{Math.round(prog * 100)}%</Text>
                      </View>
                      <View style={ac.barBg}>
                        <LinearGradient colors={[COLORS.success, '#28B446']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={[ac.barFill, { width: `${Math.max(prog * 100, 4)}%` as any }]} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ===== DÉFIS TENDANCE ===== */}
        <View style={sec.wrap}>
          <View style={sec.head}>
            <Text style={sec.title}>Défis Tendance</Text>
            <TouchableOpacity testID="see-all-trending-btn" onPress={() => router.push('/(tabs)/challenges')}>
              <Ionicons name="arrow-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tr.scroll}>
            {trending.map((ch: any) => {
              const cat = CATEGORIES[ch.category] || CATEGORIES['Autre'];
              const img = getChallengeImage(ch.challenge_id, ch.category, ch.image);
              return (
                <TouchableOpacity key={ch.challenge_id} testID={`trending-${ch.challenge_id}`}
                  onPress={() => router.push(`/challenge/${ch.challenge_id}`)} activeOpacity={0.85} style={tr.card}>
                  <Image source={{ uri: img }} style={StyleSheet.absoluteFill} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} locations={[0.25, 1]} style={StyleSheet.absoluteFill} />
                  <View style={tr.top}>
                    <View style={[tr.catPill, { backgroundColor: cat.color + '50' }]}>
                      <Text style={[tr.catTxt, { color: cat.color }]}>{ch.category}</Text>
                    </View>
                  </View>
                  <View style={tr.bot}>
                    <Text style={tr.title} numberOfLines={2}>{ch.title}</Text>
                    <View style={tr.meta}>
                      <View style={tr.metaRow}><Ionicons name="people" size={13} color="rgba(255,255,255,0.7)" /><Text style={tr.metaTxt}>{ch.participant_count}</Text></View>
                      <View style={tr.metaRow}><Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.7)" /><Text style={tr.metaTxt}>{ch.duration_days}j</Text></View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ===== CLASSEMENT ===== */}
        <View style={sec.wrap}>
          <View style={sec.head}>
            <Text style={sec.title}>Classement</Text>
            <TouchableOpacity testID="see-all-leaderboard-btn" onPress={() => router.push('/(tabs)/leaderboard')}>
              <Text style={sec.link}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {leaderboard.length > 0 ? (
            <View style={lb.list}>
              {leaderboard.slice(0, 5).map((u: any, i: number) => {
                const medals = [COLORS.warning, '#C0C0C0', '#CD7F32', COLORS.textMuted, COLORS.textMuted];
                const sz = i < 3 ? 48 : 40;
                return (
                  <View key={u.user_id} style={lb.row}>
                    <View style={[lb.medal, i < 3 && { backgroundColor: medals[i] + '18' }]}>
                      <Text style={[lb.medalTxt, { color: medals[i] }]}>#{i + 1}</Text>
                    </View>
                    <View style={[lb.av, { width: sz, height: sz, borderRadius: sz / 2, borderColor: i < 3 ? medals[i] : COLORS.border }]}>
                      {u.picture ? (
                        <Image source={{ uri: u.picture }} style={{ width: sz, height: sz, borderRadius: sz / 2 }} />
                      ) : (
                        <LinearGradient colors={i === 0 ? ['#007AFF', '#9D4CDD'] : ['#333', '#444']}
                          style={{ width: sz, height: sz, borderRadius: sz / 2, justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={[lb.avInit, { fontSize: sz * 0.38 }]}>{u.name?.charAt(0)?.toUpperCase()}</Text>
                        </LinearGradient>
                      )}
                    </View>
                    <View style={lb.info}>
                      <Text style={lb.name} numberOfLines={1}>{u.name}</Text>
                      <View style={lb.streakRow}><Ionicons name="flame" size={12} color="#FF6B35" /><Text style={lb.streak}>{u.streak || 0} jours</Text></View>
                    </View>
                    <Text style={[lb.pts, i === 0 && { color: COLORS.warning }]}>{u.points} pts</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={{ paddingHorizontal: 20, paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>Le classement sera disponible bientôt</Text>
            </View>
          )}
        </View>

        {/* ===== BADGES ===== */}
        <View style={sec.wrap}>
          <View style={sec.head}><Text style={sec.title}>Badges</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={bd.scroll}>
            {Object.entries(BADGE_CONFIG).map(([id, badge]) => {
              const earned = user?.badges?.includes(id);
              return (
                <View key={id} style={[bd.item, !earned && { opacity: 0.3 }]}>
                  <View style={[bd.circle, earned && { borderColor: badge.color }]}>
                    <Ionicons name={badge.icon as any} size={26} color={earned ? badge.color : COLORS.textMuted} />
                  </View>
                  <Text style={[bd.label, earned && { color: '#FFF' }]}>{badge.label}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* ===== PUBLIER CTA ===== */}
        {activeChallenges.length > 0 && (
          <TouchableOpacity testID="home-publish-cta" onPress={() => router.push('/(tabs)/publish')} activeOpacity={0.8} style={cta.wrap}>
            <LinearGradient colors={['#007AFF', '#9D4CDD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={cta.grad}>
              <Ionicons name="camera" size={24} color="#FFF" />
              <Text style={cta.txt}>Publier une preuve</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// ===== STYLES =====
const g = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 500, width: '100%' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 500 },
});

const h = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: COLORS.primary },
  avatarInit: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  lvlBadge: { position: 'absolute', bottom: -3, right: -3, backgroundColor: COLORS.primary, borderRadius: 10, width: 22, height: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: '#0F0F0F' },
  lvlNum: { fontSize: 10, fontWeight: '900', color: '#FFF' },
  info: { flex: 1 },
  greet: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  name: { fontSize: 22, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  notif: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
});

const st = StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginTop: 12, marginBottom: 24 },
  card: { flex: 1, backgroundColor: 'rgba(30,30,30,0.65)', borderRadius: 14, paddingVertical: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  iconBg: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  val: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  lbl: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1 },
});

const sec = StyleSheet.create({
  wrap: { marginBottom: 24 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 },
  title: { fontSize: 21, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  link: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
});

const ac = StyleSheet.create({
  wrap: { marginHorizontal: 20, marginBottom: 12 },
  card: { borderRadius: 18, overflow: 'hidden', height: 170 },
  content: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 16 },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 6 },
  catTxt: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  title: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: -0.3, marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  progRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  day: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },
  pct: { fontSize: 13, fontWeight: '800', color: COLORS.success },
  barBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  empty: { borderRadius: 18, padding: 32, marginHorizontal: 20, alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed', backgroundColor: 'rgba(30,30,30,0.5)' },
  emptyT: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  emptyS: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
});

const tr = StyleSheet.create({
  scroll: { paddingLeft: 20, paddingRight: 8 },
  card: { width: 175, height: 240, borderRadius: 18, overflow: 'hidden', marginRight: 12 },
  top: { position: 'absolute', top: 12, left: 12, zIndex: 2 },
  catPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  catTxt: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  bot: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  title: { fontSize: 16, fontWeight: '900', color: '#FFF', lineHeight: 21, marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  meta: { flexDirection: 'row', gap: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },
});

const lb = StyleSheet.create({
  list: { marginHorizontal: 20, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(30,30,30,0.6)', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  medal: { width: 32, alignItems: 'center', borderRadius: 8, paddingVertical: 2 },
  medalTxt: { fontSize: 15, fontWeight: '900' },
  av: { justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, overflow: 'hidden', backgroundColor: '#1E1E1E' },
  avInit: { fontWeight: '800', color: '#FFF' },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streak: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  pts: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
});

const bd = StyleSheet.create({
  scroll: { paddingLeft: 20, paddingRight: 8 },
  item: { alignItems: 'center', width: 80, marginRight: 10 },
  circle: { width: 62, height: 62, borderRadius: 31, backgroundColor: 'rgba(30,30,30,0.6)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' },
});

const cta = StyleSheet.create({
  wrap: { marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  grad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  txt: { fontSize: 17, fontWeight: '700', color: '#FFF', flex: 1 },
});
