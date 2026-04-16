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
const HERO_BG = 'https://images.unsplash.com/photo-1745588747406-cfb5e18f4584?w=900&h=1200&fit=crop&q=80';

function FadeSlide({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const o = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(o, { toValue: 1, duration: 450, delay, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 450, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity: o, transform: [{ translateY: y }] }}>{children}</Animated.View>;
}

function daysLeft(createdAt: string, durationDays: number): number {
  const created = new Date(createdAt);
  const end = new Date(created.getTime() + durationDays * 86400000);
  const now = new Date();
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
}

export default function HomeScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeChallenges, setActiveChallenges] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [popular, setPopular] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [mc, td, ld, fd] = await Promise.all([
        api.get('/api/my-challenges').catch(() => []),
        api.get('/api/challenges/trending?limit=8').catch(() => []),
        api.get('/api/leaderboard?limit=5').catch(() => []),
        api.get('/api/proofs/feed?limit=5').catch(() => []),
      ]);
      setActiveChallenges(mc);
      setTrending(td);
      setPopular(td.slice(0, 3));
      setLeaderboard(ld);
      setFeed(fd);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = async () => { setRefreshing(true); await Promise.all([fetchData(), refreshUser()]); setRefreshing(false); };

  if (loading) return <View style={g.load}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={g.root}>
      <Image source={{ uri: HERO_BG }} style={g.heroBg} blurRadius={1} />
      <LinearGradient
        colors={['rgba(10,10,20,0.45)', 'rgba(10,10,20,0.82)', 'rgba(15,15,15,0.97)', '#0F0F0F']}
        locations={[0, 0.28, 0.48, 0.62]}
        style={g.heroOv}
      />

      <ScrollView testID="home-scroll" showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>

        {/* ===== HERO ===== */}
        <FadeSlide delay={0}>
          <View style={[hero.wrap, { paddingTop: insets.top + 10 }]}>
            <View style={hero.userRow}>
              <View style={hero.avWrap}>
                {user?.picture ? <Image source={{ uri: user.picture }} style={hero.av} /> :
                  <LinearGradient colors={['#007AFF', '#9D4CDD']} style={hero.av}>
                    <Text style={hero.avInit}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                  </LinearGradient>}
                <View style={hero.lvl}><Text style={hero.lvlN}>{user?.level || 1}</Text></View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={hero.greet}>Salut, {user?.name?.split(' ')[0] || 'Challenger'}</Text>
                <Text style={hero.sub}>Prêt à relever des défis ?</Text>
              </View>
              <TouchableOpacity testID="notifications-btn" style={hero.notif}><Ionicons name="notifications-outline" size={22} color="rgba(255,255,255,0.7)" /></TouchableOpacity>
            </View>
            <Text style={hero.title}>Dépasse tes{'\n'}limites.</Text>
            <Text style={hero.desc}>Crée des défis. Mise. Compétitionne. Gagne.</Text>
            <TouchableOpacity testID="hero-create-btn" onPress={() => router.push('/create-challenge')} activeOpacity={0.85}>
              <LinearGradient colors={['#007AFF', '#9D4CDD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={hero.cta}>
                <Ionicons name="flash" size={20} color="#FFF" /><Text style={hero.ctaTxt}>Créer un défi</Text><Ionicons name="arrow-forward" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </FadeSlide>

        {/* ===== STATS ===== */}
        <FadeSlide delay={80}>
          <View style={st.row}>
            {[
              { icon: 'flame', color: '#FF6B35', val: user?.streak || 0, lbl: 'Streak' },
              { icon: 'trophy', color: COLORS.warning, val: activeChallenges.length, lbl: 'Actifs' },
              { icon: 'podium', color: COLORS.primary, val: user?.points || 0, lbl: 'Points' },
              { icon: 'star', color: COLORS.secondary, val: user?.level || 1, lbl: 'Niveau' },
            ].map((s, i) => (
              <View key={i} style={st.card}>
                <Ionicons name={s.icon as any} size={18} color={s.color} />
                <Text style={st.val}>{s.val}</Text>
                <Text style={st.lbl}>{s.lbl}</Text>
              </View>
            ))}
          </View>
        </FadeSlide>

        {/* ===== MES DÉFIS ===== */}
        {activeChallenges.length > 0 && (
          <FadeSlide delay={150}>
            <View style={sec.w}>
              <View style={sec.h}><Text style={sec.t}>Mes Défis Actifs</Text>
                <TouchableOpacity testID="see-all-challenges-btn" onPress={() => router.push('/(tabs)/challenges')}><Text style={sec.l}>Voir tout</Text></TouchableOpacity></View>
              {activeChallenges.slice(0, 2).map((uc: any) => {
                const ch = uc.challenge; const cat = CATEGORIES[ch?.category] || CATEGORIES['Autre'];
                const prog = ch?.duration_days ? (uc.completed_days || 0) / ch.duration_days : 0;
                const img = getChallengeImage(ch?.challenge_id, ch?.category, ch?.image);
                const remaining = daysLeft(ch?.created_at, ch?.duration_days || 30);
                return (
                  <TouchableOpacity key={uc.user_challenge_id} testID={`active-challenge-${uc.user_challenge_id}`}
                    onPress={() => router.push(`/challenge/${ch?.challenge_id}`)} activeOpacity={0.85} style={ac.wrap}>
                    <View style={ac.card}>
                      <Image source={{ uri: img }} style={StyleSheet.absoluteFill} />
                      <LinearGradient colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.92)']} locations={[0.15, 1]} style={StyleSheet.absoluteFill} />
                      <View style={ac.content}>
                        <View style={ac.topRow}>
                          <View style={[ac.pill, { backgroundColor: cat.color + '40' }]}>
                            <Ionicons name={cat.icon as any} size={10} color={cat.color} />
                            <Text style={[ac.pillT, { color: cat.color }]}>{ch?.category}</Text>
                          </View>
                          <View style={ac.timePill}><Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.7)" /><Text style={ac.timeT}>{remaining}j restants</Text></View>
                        </View>
                        <Text style={ac.title}>{ch?.title}</Text>
                        {ch?.has_pot && <View style={ac.potRow}><Ionicons name="cash" size={14} color={COLORS.warning} /><Text style={ac.potT}>Cagnotte : {ch.pot_total || 0}€</Text></View>}
                        <View style={ac.progRow}><Text style={ac.day}>Jour {uc.current_day || 1}/{ch?.duration_days}</Text><Text style={ac.pct}>{Math.round(prog * 100)}%</Text></View>
                        <View style={ac.barBg}><LinearGradient colors={[COLORS.success, '#28B446']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={[ac.barFill, { width: `${Math.max(prog * 100, 4)}%` as any }]} /></View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FadeSlide>
        )}

        {/* ===== DÉFIS POPULAIRES ===== */}
        <FadeSlide delay={220}>
          <View style={sec.w}>
            <View style={sec.h}><Text style={sec.t}>Défis Populaires</Text><TouchableOpacity testID="see-all-popular-btn" onPress={() => router.push('/(tabs)/challenges')}><Ionicons name="arrow-forward" size={20} color={COLORS.textSecondary} /></TouchableOpacity></View>
            {popular.map((ch: any) => {
              const cat = CATEGORIES[ch.category] || CATEGORIES['Autre'];
              const img = getChallengeImage(ch.challenge_id, ch.category, ch.image);
              const remaining = daysLeft(ch.created_at, ch.duration_days || 30);
              return (
                <TouchableOpacity key={ch.challenge_id} testID={`popular-${ch.challenge_id}`}
                  onPress={() => router.push(`/challenge/${ch.challenge_id}`)} activeOpacity={0.85} style={pop.wrap}>
                  <View style={pop.card}>
                    <Image source={{ uri: img }} style={pop.img} />
                    <View style={pop.body}>
                      <View style={pop.topRow}>
                        <View style={[ac.pill, { backgroundColor: cat.color + '30' }]}><Text style={[ac.pillT, { color: cat.color }]}>{ch.category}</Text></View>
                        {ch.has_pot && <View style={pop.potBadge}><Ionicons name="cash" size={12} color={COLORS.warning} /><Text style={pop.potT}>{ch.pot_total || ch.pot_amount_per_person || 0}€</Text></View>}
                      </View>
                      <Text style={pop.title} numberOfLines={1}>{ch.title}</Text>
                      <View style={pop.metaRow}>
                        <View style={pop.meta}><Ionicons name="people" size={13} color={COLORS.textMuted} /><Text style={pop.metaT}>{ch.participant_count}</Text></View>
                        <View style={pop.meta}><Ionicons name="time-outline" size={13} color={COLORS.textMuted} /><Text style={pop.metaT}>{remaining}j</Text></View>
                      </View>
                    </View>
                    <TouchableOpacity testID={`join-popular-${ch.challenge_id}`}
                      onPress={() => router.push(`/challenge/${ch.challenge_id}`)} style={pop.joinBtn}>
                      <Text style={pop.joinT}>Rejoindre</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </FadeSlide>

        {/* ===== DÉFIS DU MOMENT (Horizontal) ===== */}
        <FadeSlide delay={300}>
          <View style={sec.w}>
            <View style={sec.h}><Text style={sec.t}>Défis du Moment</Text></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}>
              {trending.slice(0, 6).map((ch: any) => {
                const cat = CATEGORIES[ch.category] || CATEGORIES['Autre'];
                const img = getChallengeImage(ch.challenge_id, ch.category, ch.image);
                return (
                  <TouchableOpacity key={ch.challenge_id} testID={`moment-${ch.challenge_id}`}
                    onPress={() => router.push(`/challenge/${ch.challenge_id}`)} activeOpacity={0.85} style={tr.card}>
                    <Image source={{ uri: img }} style={StyleSheet.absoluteFill} />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} locations={[0.2, 1]} style={StyleSheet.absoluteFill} />
                    <View style={tr.top}><View style={[ac.pill, { backgroundColor: cat.color + '50' }]}><Text style={[ac.pillT, { color: cat.color }]}>{ch.category}</Text></View></View>
                    <View style={tr.bot}>
                      <Text style={tr.title} numberOfLines={2}>{ch.title}</Text>
                      <View style={tr.meta}>
                        <View style={tr.metaI}><Ionicons name="people" size={12} color="rgba(255,255,255,0.65)" /><Text style={tr.metaT}>{ch.participant_count}</Text></View>
                        {ch.has_pot && <View style={tr.metaI}><Ionicons name="cash" size={12} color={COLORS.warning} /><Text style={[tr.metaT, { color: COLORS.warning }]}>{ch.pot_total || ch.pot_amount_per_person || 0}€</Text></View>}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </FadeSlide>

        {/* ===== ACTIVITÉ RÉCENTE ===== */}
        <FadeSlide delay={380}>
          <View style={sec.w}>
            <View style={sec.h}><Text style={sec.t}>Activité Récente</Text></View>
            {feed.length === 0 ? (
              <View style={fd.empty}><Ionicons name="chatbubbles-outline" size={28} color={COLORS.textMuted} /><Text style={fd.emptyT}>Aucune activité</Text></View>
            ) : (
              feed.slice(0, 4).map((p: any, i: number) => (
                <View key={p.proof_id || i} style={fd.card}>
                  <View style={fd.avW}>{p.user_picture ? <Image source={{ uri: p.user_picture }} style={fd.av} /> :
                    <LinearGradient colors={['#007AFF', '#9D4CDD']} style={fd.av}><Text style={fd.avI}>{p.user_name?.charAt(0)?.toUpperCase()}</Text></LinearGradient>}</View>
                  <View style={fd.body}>
                    <Text style={fd.user}>{p.user_name} <Text style={fd.action}>a complété le jour {p.day_number}</Text></Text>
                    <Text style={fd.chName}>{p.challenge_title}</Text>
                  </View>
                  <View style={fd.right}><Ionicons name="heart" size={14} color={p.likes > 0 ? '#FF3B5C' : COLORS.textMuted} /><Text style={fd.likeN}>{p.likes || 0}</Text></View>
                </View>
              ))
            )}
          </View>
        </FadeSlide>

        {/* ===== CLASSEMENT ===== */}
        <FadeSlide delay={450}>
          <View style={sec.w}>
            <View style={sec.h}><Text style={sec.t}>Classement</Text>
              <TouchableOpacity testID="see-all-leaderboard-btn" onPress={() => router.push('/(tabs)/leaderboard')}><Text style={sec.l}>Voir tout</Text></TouchableOpacity></View>
            {leaderboard.length > 0 ? (
              <View style={lb.list}>
                {leaderboard.slice(0, 5).map((u: any, i: number) => {
                  const mc = [COLORS.warning, '#C0C0C0', '#CD7F32', COLORS.textMuted, COLORS.textMuted];
                  return (
                    <View key={u.user_id} style={lb.row}>
                      <View style={[lb.medal, i < 3 && { backgroundColor: mc[i] + '15' }]}><Text style={[lb.medalN, { color: mc[i] }]}>#{i + 1}</Text></View>
                      <View style={[lb.av, { borderColor: i < 3 ? mc[i] : COLORS.border }]}>{u.picture ? <Image source={{ uri: u.picture }} style={lb.avI} /> :
                        <LinearGradient colors={i === 0 ? ['#007AFF', '#9D4CDD'] : ['#333', '#444']} style={lb.avG}><Text style={lb.avIn}>{u.name?.charAt(0)?.toUpperCase()}</Text></LinearGradient>}</View>
                      <View style={lb.info}><Text style={lb.name} numberOfLines={1}>{u.name}</Text><View style={lb.sRow}><Ionicons name="flame" size={11} color="#FF6B35" /><Text style={lb.streak}>{u.streak || 0}j</Text></View></View>
                      <Text style={[lb.pts, i === 0 && { color: COLORS.warning }]}>{u.points} pts</Text>
                    </View>
                  );
                })}
              </View>
            ) : <View style={fd.empty}><Text style={fd.emptyT}>Bientôt disponible</Text></View>}
          </View>
        </FadeSlide>

        {/* ===== BADGES ===== */}
        <FadeSlide delay={520}>
          <View style={sec.w}>
            <View style={sec.h}><Text style={sec.t}>Badges</Text></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}>
              {Object.entries(BADGE_CONFIG).map(([id, badge]) => {
                const earned = user?.badges?.includes(id);
                return (
                  <View key={id} style={[bd.item, !earned && { opacity: 0.25 }]}>
                    <View style={[bd.circle, earned && { borderColor: badge.color }]}><Ionicons name={badge.icon as any} size={24} color={earned ? badge.color : COLORS.textMuted} /></View>
                    <Text style={[bd.label, earned && { color: '#FFF' }]}>{badge.label}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </FadeSlide>
      </ScrollView>
    </View>
  );
}

const GL = { backgroundColor: 'rgba(24,24,38,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' };
const g = StyleSheet.create({ root: { flex: 1, backgroundColor: '#0F0F0F' }, load: { flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center' }, heroBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 520, width: '100%' }, heroOv: { position: 'absolute', top: 0, left: 0, right: 0, height: 520 } });
const hero = StyleSheet.create({ wrap: { paddingHorizontal: 20, paddingBottom: 8 }, userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }, avWrap: { position: 'relative' }, av: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: COLORS.primary }, avInit: { fontSize: 18, fontWeight: '800', color: '#FFF' }, lvl: { position: 'absolute', bottom: -3, right: -3, backgroundColor: COLORS.primary, borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0F0F0F' }, lvlN: { fontSize: 9, fontWeight: '900', color: '#FFF' }, greet: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.55)' }, sub: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.85)' }, notif: { width: 42, height: 42, borderRadius: 21, ...GL, justifyContent: 'center', alignItems: 'center' }, title: { fontSize: 34, fontWeight: '900', color: '#FFF', lineHeight: 40, letterSpacing: -0.8, marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 }, desc: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginBottom: 20 }, cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, gap: 10 }, ctaTxt: { fontSize: 16, fontWeight: '700', color: '#FFF' } });
const st = StyleSheet.create({ row: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginTop: 14, marginBottom: 28 }, card: { flex: 1, ...GL, borderRadius: 14, paddingVertical: 12, alignItems: 'center', gap: 3 }, val: { fontSize: 20, fontWeight: '900', color: '#FFF' }, lbl: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1 } });
const sec = StyleSheet.create({ w: { marginBottom: 26 }, h: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 }, t: { fontSize: 19, fontWeight: '800', color: '#FFF' }, l: { fontSize: 13, fontWeight: '600', color: COLORS.primary } });
const ac = StyleSheet.create({ wrap: { marginHorizontal: 20, marginBottom: 10 }, card: { borderRadius: 20, overflow: 'hidden', height: 175 }, content: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 16 }, topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'absolute', top: 14, left: 14, right: 14 }, pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }, pillT: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 }, timePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }, timeT: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)' }, title: { fontSize: 19, fontWeight: '900', color: '#FFF', marginBottom: 6, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 }, potRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 }, potT: { fontSize: 13, fontWeight: '700', color: COLORS.warning }, progRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }, day: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.65)' }, pct: { fontSize: 12, fontWeight: '800', color: COLORS.success }, barBg: { height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }, barFill: { height: '100%', borderRadius: 3 } });
const pop = StyleSheet.create({ wrap: { marginHorizontal: 20, marginBottom: 10 }, card: { flexDirection: 'row', ...GL, borderRadius: 16, overflow: 'hidden', height: 90 }, img: { width: 90, height: '100%' }, body: { flex: 1, padding: 12, justifyContent: 'center', gap: 4 }, topRow: { flexDirection: 'row', alignItems: 'center', gap: 6 }, potBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.warning + '18', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }, potT: { fontSize: 10, fontWeight: '700', color: COLORS.warning }, title: { fontSize: 15, fontWeight: '800', color: '#FFF' }, metaRow: { flexDirection: 'row', gap: 12 }, meta: { flexDirection: 'row', alignItems: 'center', gap: 4 }, metaT: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted }, joinBtn: { backgroundColor: COLORS.primary + '15', justifyContent: 'center', paddingHorizontal: 14, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.04)' }, joinT: { fontSize: 12, fontWeight: '700', color: COLORS.primary } });
const tr = StyleSheet.create({ card: { width: 165, height: 225, borderRadius: 20, overflow: 'hidden', marginRight: 12 }, top: { position: 'absolute', top: 12, left: 12, zIndex: 2 }, bot: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 }, title: { fontSize: 15, fontWeight: '900', color: '#FFF', lineHeight: 20, marginBottom: 6, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 }, meta: { flexDirection: 'row', gap: 10 }, metaI: { flexDirection: 'row', alignItems: 'center', gap: 4 }, metaT: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.55)' } });
const fd = StyleSheet.create({ empty: { ...GL, borderRadius: 14, padding: 20, marginHorizontal: 20, alignItems: 'center', gap: 6 }, emptyT: { fontSize: 13, fontWeight: '500', color: COLORS.textMuted }, card: { flexDirection: 'row', ...GL, borderRadius: 14, marginHorizontal: 20, marginBottom: 6, padding: 12, gap: 10 }, avW: {}, av: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' }, avI: { fontSize: 14, fontWeight: '800', color: '#FFF' }, body: { flex: 1, gap: 1 }, user: { fontSize: 13, fontWeight: '700', color: '#FFF' }, action: { fontWeight: '500', color: COLORS.textMuted }, chName: { fontSize: 12, fontWeight: '600', color: COLORS.primary }, right: { alignItems: 'center', gap: 4 }, likeN: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted } });
const lb = StyleSheet.create({ list: { marginHorizontal: 20, gap: 6 }, row: { flexDirection: 'row', alignItems: 'center', gap: 10, ...GL, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 12 }, medal: { width: 30, alignItems: 'center', borderRadius: 8, paddingVertical: 2 }, medalN: { fontSize: 13, fontWeight: '900' }, av: { width: 40, height: 40, borderRadius: 20, borderWidth: 2.5, overflow: 'hidden', backgroundColor: '#1E1E1E' }, avI: { width: 40, height: 40, borderRadius: 20 }, avG: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }, avIn: { fontSize: 15, fontWeight: '800', color: '#FFF' }, info: { flex: 1, gap: 1 }, name: { fontSize: 13, fontWeight: '700', color: '#FFF' }, sRow: { flexDirection: 'row', alignItems: 'center', gap: 3 }, streak: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted }, pts: { fontSize: 15, fontWeight: '900', color: COLORS.primary } });
const bd = StyleSheet.create({ item: { alignItems: 'center', width: 72, marginRight: 10 }, circle: { width: 56, height: 56, borderRadius: 28, ...GL, justifyContent: 'center', alignItems: 'center', marginBottom: 5 }, label: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' } });
