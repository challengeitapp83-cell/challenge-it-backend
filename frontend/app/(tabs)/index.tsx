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
const HERO_BG = 'https://images.unsplash.com/photo-1510338832017-d631474dbdd7?w=900&h=1200&fit=crop&q=80';

const MOTIVATIONAL = [
  "Dépasse tes limites.",
  "Chaque jour compte.",
  "Deviens inarrêtable.",
  "Prouve-le au monde.",
];

const SUGGESTIONS = [
  { title: '30 Jours Sans Sucre', cat: 'Santé', icon: 'heart', dur: 30 },
  { title: 'Lire 20 min/jour', cat: 'Habitudes', icon: 'book', dur: 21 },
  { title: '5km Chaque Matin', cat: 'Sport', icon: 'fitness', dur: 30 },
  { title: 'Cold Shower 30j', cat: 'Habitudes', icon: 'snow', dur: 30 },
];

function Fade({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const o = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(o, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity: o, transform: [{ translateY: y }] }}>{children}</Animated.View>;
}

function daysLeft(c: string, d: number) { return Math.max(0, Math.ceil((new Date(c).getTime() + d * 864e5 - Date.now()) / 864e5)); }

export default function HomeScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [lb, setLb] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mottoIdx] = useState(Math.floor(Math.random() * MOTIVATIONAL.length));

  const xpPct = ((user?.points || 0) % 100);
  const nextLvl = (user?.level || 1) + 1;

  const fetchData = useCallback(async () => {
    try {
      const [a, t, l, f] = await Promise.all([
        api.get('/api/my-challenges').catch(() => []),
        api.get('/api/challenges/trending?limit=8').catch(() => []),
        api.get('/api/leaderboard?limit=5').catch(() => []),
        api.get('/api/proofs/feed?limit=5').catch(() => []),
      ]);
      setActive(a); setTrending(t); setLb(l); setFeed(f);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = async () => { setRefreshing(true); await Promise.all([fetchData(), refreshUser()]); setRefreshing(false); };

  if (loading) return <View style={g.load}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  const dailyChallenge = trending[0];

  return (
    <View style={g.root}>
      <Image source={{ uri: HERO_BG }} style={g.bg} blurRadius={1} />
      <LinearGradient colors={['rgba(8,8,18,0.4)', 'rgba(8,8,18,0.82)', 'rgba(15,15,15,0.97)', '#0F0F0F']} locations={[0, 0.26, 0.46, 0.6]} style={g.ov} />

      <ScrollView testID="home-scroll" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>

        {/* ===== HERO ===== */}
        <Fade>
          <View style={[h.w, { paddingTop: insets.top + 8 }]}>
            <View style={h.top}>
              <View style={h.avW}>
                {user?.picture ? <Image source={{ uri: user.picture }} style={h.av} /> :
                  <LinearGradient colors={['#007AFF', '#9D4CDD']} style={h.av}><Text style={h.avI}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text></LinearGradient>}
                <View style={h.lvl}><Text style={h.lvlN}>{user?.level || 1}</Text></View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={h.hi}>Salut, {user?.name?.split(' ')[0] || 'Challenger'}</Text>
                <Text style={h.sub}>Prêt à tout donner ?</Text>
              </View>
              <TouchableOpacity testID="notifications-btn" style={h.notif}><Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.6)" /></TouchableOpacity>
            </View>

            {/* XP Bar */}
            <View style={h.xpW}>
              <View style={h.xpRow}>
                <Text style={h.xpLbl}>Niv. {user?.level || 1}</Text>
                <Text style={h.xpVal}>{xpPct}/100 XP</Text>
              </View>
              <View style={h.xpBg}>
                <LinearGradient colors={['#007AFF', '#9D4CDD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[h.xpFill, { width: `${Math.max(xpPct, 3)}%` as any }]} />
              </View>
              <Text style={h.xpHint}>{100 - xpPct} XP pour le niveau {nextLvl}</Text>
            </View>

            <Text style={h.motto}>{MOTIVATIONAL[mottoIdx]}</Text>
            <Text style={h.desc}>Crée des défis. Mise. Compétitionne. Gagne.</Text>

            <TouchableOpacity testID="hero-create-btn" onPress={() => router.push('/create-challenge')} activeOpacity={0.85}>
              <LinearGradient colors={['#007AFF', '#9D4CDD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={h.cta}>
                <Ionicons name="flash" size={20} color="#FFF" /><Text style={h.ctaT}>Créer un défi</Text><Ionicons name="arrow-forward" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Fade>

        {/* ===== STATS ===== */}
        <Fade delay={60}>
          <View style={s.row}>
            {[
              { i: 'flame', c: '#FF6B35', v: user?.streak || 0, l: 'Streak' },
              { i: 'trophy', c: COLORS.warning, v: active.length, l: 'Actifs' },
              { i: 'podium', c: COLORS.primary, v: user?.points || 0, l: 'XP' },
              { i: 'star', c: COLORS.secondary, v: user?.reputation || 0, l: 'Rep' },
            ].map((x, i) => (
              <View key={i} style={s.card}>
                <Ionicons name={x.i as any} size={17} color={x.c} />
                <Text style={s.val}>{x.v}</Text>
                <Text style={s.lbl}>{x.l}</Text>
              </View>
            ))}
          </View>
        </Fade>

        {/* ===== DÉFI DU JOUR ===== */}
        {dailyChallenge && (
          <Fade delay={120}>
            <View style={sec.w}>
              <View style={sec.h}><View style={sec.hLeft}><Ionicons name="sunny" size={18} color={COLORS.warning} /><Text style={sec.t}>Défi du Jour</Text></View></View>
              <TouchableOpacity testID="daily-challenge" onPress={() => router.push(`/challenge/${dailyChallenge.challenge_id}`)} activeOpacity={0.85} style={dc.w}>
                <Image source={{ uri: getChallengeImage(dailyChallenge.challenge_id, dailyChallenge.category, dailyChallenge.image) }} style={StyleSheet.absoluteFill} />
                <LinearGradient colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.92)']} locations={[0.15, 1]} style={StyleSheet.absoluteFill} />
                <View style={dc.badge}><Text style={dc.badgeT}>DAILY</Text></View>
                <View style={dc.content}>
                  <View style={dc.catRow}>
                    <View style={[pill.w, { backgroundColor: (CATEGORIES[dailyChallenge.category]?.color || '#007AFF') + '40' }]}>
                      <Ionicons name={(CATEGORIES[dailyChallenge.category]?.icon || 'star') as any} size={10} color={CATEGORIES[dailyChallenge.category]?.color || '#007AFF'} />
                      <Text style={[pill.t, { color: CATEGORIES[dailyChallenge.category]?.color }]}>{dailyChallenge.category}</Text>
                    </View>
                    {dailyChallenge.has_pot && <View style={dc.potBadge}><Ionicons name="cash" size={12} color={COLORS.warning} /><Text style={dc.potT}>{dailyChallenge.pot_total || dailyChallenge.pot_amount_per_person || 0}€ à gagner</Text></View>}
                  </View>
                  <Text style={dc.title}>{dailyChallenge.title}</Text>
                  <View style={dc.meta}>
                    <View style={dc.metaI}><Ionicons name="people" size={13} color="rgba(255,255,255,0.65)" /><Text style={dc.metaT}>{dailyChallenge.participant_count} participants</Text></View>
                    <View style={dc.metaI}><Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.65)" /><Text style={dc.metaT}>{dailyChallenge.duration_days}j</Text></View>
                  </View>
                  <TouchableOpacity testID="daily-join-btn" onPress={() => router.push(`/challenge/${dailyChallenge.challenge_id}`)} style={dc.joinBtn}>
                    <Text style={dc.joinT}>Rejoindre le défi</Text><Ionicons name="arrow-forward" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          </Fade>
        )}

        {/* ===== MES DÉFIS ACTIFS ===== */}
        {active.length > 0 && (
          <Fade delay={180}>
            <View style={sec.w}>
              <View style={sec.h}><Text style={sec.t}>Mes Défis</Text><TouchableOpacity testID="see-all-challenges-btn" onPress={() => router.push('/(tabs)/challenges')}><Text style={sec.l}>Tout</Text></TouchableOpacity></View>
              {active.slice(0, 2).map((uc: any) => {
                const ch = uc.challenge; const cat = CATEGORIES[ch?.category] || CATEGORIES['Autre'];
                const p = ch?.duration_days ? (uc.completed_days || 0) / ch.duration_days : 0;
                const img = getChallengeImage(ch?.challenge_id, ch?.category, ch?.image);
                const rem = daysLeft(ch?.created_at, ch?.duration_days || 30);
                return (
                  <TouchableOpacity key={uc.user_challenge_id} testID={`active-challenge-${uc.user_challenge_id}`}
                    onPress={() => router.push(`/challenge/${ch?.challenge_id}`)} activeOpacity={0.85} style={ac.w}>
                    <View style={ac.card}>
                      <Image source={{ uri: img }} style={StyleSheet.absoluteFill} />
                      <LinearGradient colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.92)']} locations={[0.15, 1]} style={StyleSheet.absoluteFill} />
                      <View style={ac.topRow}>
                        <View style={[pill.w, { backgroundColor: cat.color + '40' }]}><Ionicons name={cat.icon as any} size={10} color={cat.color} /><Text style={[pill.t, { color: cat.color }]}>{ch?.category}</Text></View>
                        <View style={ac.time}><Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.65)" /><Text style={ac.timeT}>{rem}j</Text></View>
                      </View>
                      <View style={ac.bot}>
                        <Text style={ac.title}>{ch?.title}</Text>
                        {ch?.has_pot && <View style={ac.potR}><Ionicons name="cash" size={13} color={COLORS.warning} /><Text style={ac.potT}>Gain : {ch.pot_total || 0}€</Text></View>}
                        <View style={ac.pRow}><Text style={ac.day}>Jour {uc.current_day || 1}/{ch?.duration_days}</Text><Text style={ac.pct}>{Math.round(p * 100)}%</Text></View>
                        <View style={ac.barBg}><LinearGradient colors={[COLORS.success, '#28B446']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[ac.barF, { width: `${Math.max(p * 100, 4)}%` as any }]} /></View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Fade>
        )}

        {/* ===== DÉFIS DU MOMENT ===== */}
        <Fade delay={250}>
          <View style={sec.w}>
            <View style={sec.h}><View style={sec.hLeft}><Ionicons name="trending-up" size={18} color={COLORS.primary} /><Text style={sec.t}>Du Moment</Text></View>
              <TouchableOpacity testID="see-all-trending-btn" onPress={() => router.push('/(tabs)/challenges')}><Ionicons name="arrow-forward" size={18} color={COLORS.textMuted} /></TouchableOpacity></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}>
              {trending.slice(0, 6).map((ch: any) => {
                const cat = CATEGORIES[ch.category] || CATEGORIES['Autre'];
                const img = getChallengeImage(ch.challenge_id, ch.category, ch.image);
                return (
                  <TouchableOpacity key={ch.challenge_id} testID={`moment-${ch.challenge_id}`}
                    onPress={() => router.push(`/challenge/${ch.challenge_id}`)} activeOpacity={0.85} style={tr.card}>
                    <Image source={{ uri: img }} style={StyleSheet.absoluteFill} />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} locations={[0.2, 1]} style={StyleSheet.absoluteFill} />
                    <View style={tr.top}><View style={[pill.w, { backgroundColor: cat.color + '50' }]}><Text style={[pill.t, { color: cat.color }]}>{ch.category}</Text></View></View>
                    <View style={tr.bot}>
                      <Text style={tr.title} numberOfLines={2}>{ch.title}</Text>
                      <View style={tr.meta}>
                        <View style={tr.mI}><Ionicons name="people" size={11} color="rgba(255,255,255,0.6)" /><Text style={tr.mT}>{ch.participant_count}</Text></View>
                        {ch.has_pot && <View style={tr.mI}><Ionicons name="cash" size={11} color={COLORS.warning} /><Text style={[tr.mT, { color: COLORS.warning }]}>{ch.pot_total || ch.pot_amount_per_person || 0}€</Text></View>}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Fade>

        {/* ===== SUGGESTIONS ===== */}
        <Fade delay={310}>
          <View style={sec.w}>
            <View style={sec.h}><View style={sec.hLeft}><Ionicons name="bulb" size={18} color={COLORS.warning} /><Text style={sec.t}>Suggestions</Text></View></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}>
              {SUGGESTIONS.map((sg, i) => {
                const cat = CATEGORIES[sg.cat] || CATEGORIES['Autre'];
                return (
                  <TouchableOpacity key={i} testID={`suggestion-${i}`} onPress={() => router.push('/create-challenge')} activeOpacity={0.85} style={su.card}>
                    <View style={[su.icon, { backgroundColor: cat.color + '18' }]}><Ionicons name={sg.icon as any} size={22} color={cat.color} /></View>
                    <Text style={su.title} numberOfLines={2}>{sg.title}</Text>
                    <View style={su.meta}><Text style={[su.catT, { color: cat.color }]}>{sg.cat}</Text><Text style={su.dur}>{sg.dur}j</Text></View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Fade>

        {/* ===== ACTIVITÉ ===== */}
        <Fade delay={370}>
          <View style={sec.w}>
            <View style={sec.h}><View style={sec.hLeft}><Ionicons name="pulse" size={18} color={COLORS.success} /><Text style={sec.t}>Activité</Text></View></View>
            {feed.length === 0 ? (
              <View style={fd.empty}><Ionicons name="chatbubbles-outline" size={26} color={COLORS.textMuted} /><Text style={fd.eT}>Aucune activité</Text></View>
            ) : feed.slice(0, 3).map((p: any, i: number) => (
              <View key={p.proof_id || i} style={fd.card}>
                {p.user_picture ? <Image source={{ uri: p.user_picture }} style={fd.av} /> :
                  <LinearGradient colors={['#007AFF', '#9D4CDD']} style={fd.av}><Text style={fd.avI}>{p.user_name?.charAt(0)?.toUpperCase()}</Text></LinearGradient>}
                <View style={fd.body}>
                  <Text style={fd.user} numberOfLines={1}>{p.user_name} <Text style={fd.act}>jour {p.day_number}</Text></Text>
                  <Text style={fd.ch}>{p.challenge_title}</Text>
                </View>
                <View style={fd.rt}><Ionicons name={p.likes > 0 ? 'heart' : 'heart-outline'} size={14} color={p.likes > 0 ? '#FF3B5C' : COLORS.textMuted} /><Text style={fd.ln}>{p.likes || 0}</Text></View>
              </View>
            ))}
          </View>
        </Fade>

        {/* ===== CLASSEMENT ===== */}
        <Fade delay={430}>
          <View style={sec.w}>
            <View style={sec.h}><View style={sec.hLeft}><Ionicons name="podium" size={18} color={COLORS.primary} /><Text style={sec.t}>Classement</Text></View>
              <TouchableOpacity testID="see-all-leaderboard-btn" onPress={() => router.push('/(tabs)/leaderboard')}><Text style={sec.l}>Tout</Text></TouchableOpacity></View>
            {lb.length > 0 ? (
              <View style={lbs.list}>
                {lb.slice(0, 5).map((u: any, i: number) => {
                  const mc = [COLORS.warning, '#C0C0C0', '#CD7F32', COLORS.textMuted, COLORS.textMuted];
                  return (
                    <View key={u.user_id} style={lbs.row}>
                      <View style={[lbs.medal, i < 3 && { backgroundColor: mc[i] + '15' }]}><Text style={[lbs.mN, { color: mc[i] }]}>#{i + 1}</Text></View>
                      <View style={[lbs.av, { borderColor: i < 3 ? mc[i] : COLORS.border }]}>{u.picture ? <Image source={{ uri: u.picture }} style={{ width: 38, height: 38, borderRadius: 19 }} /> :
                        <LinearGradient colors={i === 0 ? ['#007AFF', '#9D4CDD'] : ['#333', '#444']} style={{ width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 14, fontWeight: '800', color: '#FFF' }}>{u.name?.charAt(0)?.toUpperCase()}</Text></LinearGradient>}</View>
                      <View style={lbs.info}><Text style={lbs.name} numberOfLines={1}>{u.name}</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Ionicons name="flame" size={10} color="#FF6B35" /><Text style={lbs.streak}>{u.streak || 0}j</Text></View></View>
                      <Text style={[lbs.pts, i === 0 && { color: COLORS.warning }]}>{u.points}</Text>
                    </View>
                  );
                })}
              </View>
            ) : <View style={fd.empty}><Text style={fd.eT}>Bientôt</Text></View>}
          </View>
        </Fade>

        {/* ===== BADGES ===== */}
        <Fade delay={490}>
          <View style={sec.w}>
            <View style={sec.h}><View style={sec.hLeft}><Ionicons name="ribbon" size={18} color={COLORS.warning} /><Text style={sec.t}>Badges</Text></View></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}>
              {Object.entries(BADGE_CONFIG).map(([id, b]) => {
                const earned = user?.badges?.includes(id);
                return (
                  <View key={id} style={[bd.item, !earned && { opacity: 0.22 }]}>
                    <View style={[bd.circle, earned && { borderColor: b.color }]}><Ionicons name={b.icon as any} size={22} color={earned ? b.color : COLORS.textMuted} /></View>
                    <Text style={[bd.label, earned && { color: '#FFF' }]}>{b.label}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </Fade>
      </ScrollView>
    </View>
  );
}

const GL = { backgroundColor: 'rgba(22,22,36,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' } as const;
const g = StyleSheet.create({ root: { flex: 1, backgroundColor: '#0F0F0F' }, load: { flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center' }, bg: { position: 'absolute', top: 0, left: 0, right: 0, height: 500, width: '100%' }, ov: { position: 'absolute', top: 0, left: 0, right: 0, height: 500 } });

const h = StyleSheet.create({
  w: { paddingHorizontal: 20, paddingBottom: 4 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  avW: { position: 'relative' }, av: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: COLORS.primary }, avI: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  lvl: { position: 'absolute', bottom: -2, right: -2, backgroundColor: COLORS.primary, borderRadius: 9, width: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0F0F0F' }, lvlN: { fontSize: 8, fontWeight: '900', color: '#FFF' },
  hi: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.5)' }, sub: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  notif: { width: 40, height: 40, borderRadius: 20, ...GL, justifyContent: 'center', alignItems: 'center' },
  xpW: { ...GL, borderRadius: 14, padding: 12, marginBottom: 18 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  xpLbl: { fontSize: 12, fontWeight: '700', color: COLORS.primary }, xpVal: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  xpBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: 3 }, xpHint: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.3)', marginTop: 6, textAlign: 'center' },
  motto: { fontSize: 30, fontWeight: '900', color: '#FFF', lineHeight: 36, letterSpacing: -0.8, marginBottom: 6, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
  desc: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.55)', marginBottom: 16 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 14, gap: 8 }, ctaT: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});

const s = StyleSheet.create({ row: { flexDirection: 'row', paddingHorizontal: 20, gap: 7, marginTop: 12, marginBottom: 24 }, card: { flex: 1, ...GL, borderRadius: 12, paddingVertical: 11, alignItems: 'center', gap: 2 }, val: { fontSize: 18, fontWeight: '900', color: '#FFF' }, lbl: { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 } });
const sec = StyleSheet.create({ w: { marginBottom: 24 }, h: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 }, hLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 }, t: { fontSize: 18, fontWeight: '800', color: '#FFF' }, l: { fontSize: 13, fontWeight: '600', color: COLORS.primary } });
const pill = StyleSheet.create({ w: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }, t: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 } });

const dc = StyleSheet.create({ w: { marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', height: 200 }, badge: { position: 'absolute', top: 12, right: 12, backgroundColor: COLORS.warning, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, zIndex: 2 }, badgeT: { fontSize: 10, fontWeight: '900', color: '#000', letterSpacing: 1 }, content: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 16 }, catRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }, potBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.warning + '25', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }, potT: { fontSize: 11, fontWeight: '700', color: COLORS.warning }, title: { fontSize: 20, fontWeight: '900', color: '#FFF', marginBottom: 6, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 }, meta: { flexDirection: 'row', gap: 14, marginBottom: 10 }, metaI: { flexDirection: 'row', alignItems: 'center', gap: 4 }, metaT: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)' }, joinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, paddingVertical: 10, borderRadius: 10 }, joinT: { fontSize: 14, fontWeight: '700', color: '#FFF' } });

const ac = StyleSheet.create({ w: { marginHorizontal: 20, marginBottom: 10 }, card: { borderRadius: 18, overflow: 'hidden', height: 160 }, topRow: { position: 'absolute', top: 12, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between', zIndex: 2 }, time: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }, timeT: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.7)' }, bot: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 14 }, title: { fontSize: 17, fontWeight: '900', color: '#FFF', marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 5 }, potR: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }, potT: { fontSize: 12, fontWeight: '700', color: COLORS.warning }, pRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }, day: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)' }, pct: { fontSize: 11, fontWeight: '800', color: COLORS.success }, barBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }, barF: { height: '100%', borderRadius: 2 } });

const tr = StyleSheet.create({ card: { width: 155, height: 210, borderRadius: 18, overflow: 'hidden', marginRight: 10 }, top: { position: 'absolute', top: 10, left: 10, zIndex: 2 }, bot: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 }, title: { fontSize: 14, fontWeight: '900', color: '#FFF', lineHeight: 18, marginBottom: 6, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 5 }, meta: { flexDirection: 'row', gap: 8 }, mI: { flexDirection: 'row', alignItems: 'center', gap: 3 }, mT: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.5)' } });

const su = StyleSheet.create({ card: { width: 130, ...GL, borderRadius: 16, padding: 14, marginRight: 10, gap: 8 }, icon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }, title: { fontSize: 13, fontWeight: '800', color: '#FFF', lineHeight: 17 }, meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, catT: { fontSize: 10, fontWeight: '700' }, dur: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted } });

const fd = StyleSheet.create({ empty: { ...GL, borderRadius: 14, padding: 18, marginHorizontal: 20, alignItems: 'center', gap: 6 }, eT: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted }, card: { flexDirection: 'row', ...GL, borderRadius: 12, marginHorizontal: 20, marginBottom: 6, padding: 10, gap: 10 }, av: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' }, avI: { fontSize: 13, fontWeight: '800', color: '#FFF' }, body: { flex: 1, gap: 1 }, user: { fontSize: 12, fontWeight: '700', color: '#FFF' }, act: { fontWeight: '500', color: COLORS.textMuted }, ch: { fontSize: 11, fontWeight: '600', color: COLORS.primary }, rt: { alignItems: 'center', gap: 3 }, ln: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted } });

const lbs = StyleSheet.create({ list: { marginHorizontal: 20, gap: 5 }, row: { flexDirection: 'row', alignItems: 'center', gap: 10, ...GL, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 }, medal: { width: 28, alignItems: 'center', borderRadius: 6, paddingVertical: 1 }, mN: { fontSize: 12, fontWeight: '900' }, av: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, overflow: 'hidden', backgroundColor: '#1E1E1E' }, info: { flex: 1, gap: 1 }, name: { fontSize: 12, fontWeight: '700', color: '#FFF' }, streak: { fontSize: 9, fontWeight: '600', color: COLORS.textMuted }, pts: { fontSize: 14, fontWeight: '900', color: COLORS.primary } });

const bd = StyleSheet.create({ item: { alignItems: 'center', width: 66, marginRight: 8 }, circle: { width: 50, height: 50, borderRadius: 25, ...GL, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }, label: { fontSize: 9, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' } });
