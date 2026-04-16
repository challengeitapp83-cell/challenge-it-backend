import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, Image, StyleSheet,
  RefreshControl, ActivityIndicator, Animated, Dimensions, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../contexts/api';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, BADGE_CONFIG } from '../../contexts/theme';

const { width: W } = Dimensions.get('window');
const BG = 'https://images.unsplash.com/photo-1763854413165-1713bc5a7f4a?w=900&h=1200&fit=crop&q=75';

const MEDAL = { 0: '#FFD700', 1: '#C0C0C0', 2: '#CD7F32' } as Record<number, string>;
const GLOW = { 0: '#FFD70050', 1: '#C0C0C035', 2: '#CD7F3230' } as Record<number, string>;
const AVATAR_GRAD: [string, string][] = [['#FF6B35', '#FF2D55'], ['#007AFF', '#5856D6'], ['#34C759', '#30B0C7'], ['#FF9500', '#FF2D55'], ['#AF52DE', '#5856D6'], ['#FF3B30', '#FF6B35'], ['#5AC8FA', '#007AFF'], ['#FFCC00', '#FF9500']];

function Fade({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const o = useRef(new Animated.Value(0)).current;
  const x = useRef(new Animated.Value(-16)).current;
  useEffect(() => { Animated.parallel([Animated.timing(o, { toValue: 1, duration: 380, delay, useNativeDriver: true }), Animated.timing(x, { toValue: 0, duration: 380, delay, useNativeDriver: true })]).start(); }, []);
  return <Animated.View style={{ opacity: o, transform: [{ translateX: x }] }}>{children}</Animated.View>;
}

function Avatar({ u, size, idx }: { u: any; size: number; idx: number }) {
  const g = AVATAR_GRAD[idx % AVATAR_GRAD.length];
  if (u?.picture) return <Image source={{ uri: u.picture }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  return <LinearGradient colors={g} style={{ width: size, height: size, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: size * 0.4, fontWeight: '800', color: '#FFF' }}>{u?.name?.charAt(0)?.toUpperCase()}</Text></LinearGradient>;
}

function BadgeRow({ badges }: { badges: string[] }) {
  if (!badges || badges.length === 0) return null;
  return (
    <View style={br.row}>
      {badges.slice(0, 4).map((b) => {
        const cfg = BADGE_CONFIG[b];
        if (!cfg) return null;
        return (
          <View key={b} style={[br.badge, { backgroundColor: cfg.color + '18', borderColor: cfg.color + '30' }]}>
            <Ionicons name={cfg.icon as any} size={10} color={cfg.color} />
          </View>
        );
      })}
      {badges.length > 4 && <Text style={br.more}>+{badges.length - 4}</Text>}
    </View>
  );
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [lb, setLb] = useState<any[]>([]);
  const [tab, setTab] = useState<'global' | 'friends'>('global');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const endpoint = tab === 'friends' ? '/api/friends/leaderboard' : '/api/leaderboard?limit=20';
      setLb(await api.get(endpoint));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { setLoading(true); fetch(); }, [fetch]);
  const onRefresh = async () => { setRefreshing(true); await fetch(); setRefreshing(false); };

  return (
    <View style={g.root}>
      <Image source={{ uri: BG }} style={g.bg} blurRadius={8} />
      <LinearGradient colors={['rgba(8,8,16,0.65)', 'rgba(8,8,16,0.92)', '#0F0F0F']} locations={[0, 0.32, 0.52]} style={g.ov} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120, paddingTop: insets.top }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>

        {/* Header */}
        <View style={hd.w}>
          <Text style={hd.t}>Classement</Text>
          <Text style={hd.s}>Qui sera le champion ?</Text>
        </View>

        {/* Tabs */}
        <View style={tb.w}>
          <TouchableOpacity testID="lb-global" onPress={() => setTab('global')} style={[tb.tab, tab === 'global' && tb.tabA]}>
            <Ionicons name="earth" size={16} color={tab === 'global' ? COLORS.primary : COLORS.textMuted} /><Text style={[tb.tabT, tab === 'global' && tb.tabTA]}>Global</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="lb-friends" onPress={() => setTab('friends')} style={[tb.tab, tab === 'friends' && tb.tabF]}>
            <Ionicons name="people" size={16} color={tab === 'friends' ? COLORS.secondary : COLORS.textMuted} /><Text style={[tb.tabT, tab === 'friends' && { color: COLORS.secondary }]}>Amis</Text>
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} /> :
        lb.length === 0 ? (
          <View style={hd.empty}><Ionicons name="trophy" size={48} color={COLORS.textMuted} /><Text style={hd.emptyT}>{tab === 'friends' ? 'Ajoutez des amis pour comparer' : 'Classement bientôt disponible'}</Text></View>
        ) : (
          <>
            {/* ===== TOP 3 ===== */}
            <View style={p.w}>
              {/* #2 */}
              {lb.length > 1 && (
                <Fade delay={150}>
                  <View style={p.item}>
                    <View style={[p.ring, { borderColor: MEDAL[1] }]}>
                      <Avatar u={lb[1]} size={64} idx={1} />
                    </View>
                    <View style={[p.badge, { backgroundColor: MEDAL[1] }]}><Text style={p.badgeN}>2</Text></View>
                    <Text style={p.name} numberOfLines={1}>{lb[1].name}</Text>
                    <Text style={p.pts}>{lb[1].points} <Text style={p.ptsU}>XP</Text></Text>
                    <BadgeRow badges={lb[1].badges} />
                    <View style={p.metaRow}>
                      <Ionicons name="flame" size={11} color="#FF6B35" /><Text style={p.metaT}>{lb[1].streak}j</Text>
                      {(lb[1].total_earnings || 0) > 0 && (<><Ionicons name="cash" size={11} color={COLORS.success} /><Text style={[p.metaT, { color: COLORS.success }]}>{lb[1].total_earnings}€</Text></>)}
                    </View>
                    <View style={[p.bar, { height: 45, backgroundColor: GLOW[1] }]} />
                  </View>
                </Fade>
              )}
              {/* #1 */}
              {lb.length > 0 && (
                <Fade delay={50}>
                  <View style={[p.item, { marginTop: -24 }]}>
                    <Ionicons name="trophy" size={32} color={COLORS.warning} style={{ marginBottom: 4 }} />
                    <View style={[p.ring, p.ring1, { borderColor: MEDAL[0] }]}>
                      <Avatar u={lb[0]} size={82} idx={0} />
                    </View>
                    <View style={[p.badge, p.badge1, { backgroundColor: MEDAL[0] }]}><Ionicons name="trophy" size={11} color="#000" /><Text style={[p.badgeN, { fontSize: 13 }]}>1</Text></View>
                    <Text style={[p.name, { fontSize: 16, fontWeight: '900' }]} numberOfLines={1}>{lb[0].name}</Text>
                    <Text style={[p.pts, { color: COLORS.warning, fontSize: 18 }]}>{lb[0].points} <Text style={p.ptsU}>XP</Text></Text>
                    <BadgeRow badges={lb[0].badges} />
                    <View style={p.metaRow}>
                      <Ionicons name="flame" size={12} color="#FF6B35" /><Text style={[p.metaT, { fontWeight: '700' }]}>{lb[0].streak}j</Text>
                      <Ionicons name="trophy" size={12} color={COLORS.warning} /><Text style={[p.metaT, { color: COLORS.warning }]}>{lb[0].challenges_won || 0}W</Text>
                      {(lb[0].total_earnings || 0) > 0 && (<><Ionicons name="cash" size={12} color={COLORS.success} /><Text style={[p.metaT, { color: COLORS.success, fontWeight: '700' }]}>{lb[0].total_earnings}€</Text></>)}
                    </View>
                    <View style={[p.bar, { height: 65, backgroundColor: GLOW[0] }]} />
                  </View>
                </Fade>
              )}
              {/* #3 */}
              {lb.length > 2 && (
                <Fade delay={250}>
                  <View style={p.item}>
                    <View style={[p.ring, { borderColor: MEDAL[2] }]}>
                      <Avatar u={lb[2]} size={60} idx={2} />
                    </View>
                    <View style={[p.badge, { backgroundColor: MEDAL[2] }]}><Text style={p.badgeN}>3</Text></View>
                    <Text style={p.name} numberOfLines={1}>{lb[2].name}</Text>
                    <Text style={p.pts}>{lb[2].points} <Text style={p.ptsU}>XP</Text></Text>
                    <BadgeRow badges={lb[2].badges} />
                    <View style={p.metaRow}>
                      <Ionicons name="flame" size={11} color="#FF6B35" /><Text style={p.metaT}>{lb[2].streak}j</Text>
                    </View>
                    <View style={[p.bar, { height: 30, backgroundColor: GLOW[2] }]} />
                  </View>
                </Fade>
              )}
            </View>

            {/* Separator */}
            <View style={sep.w}><View style={sep.line} /><Text style={sep.t}>TOUS LES CHALLENGERS</Text><View style={sep.line} /></View>

            {/* ===== LIST ===== */}
            <View style={ls.w}>
              {lb.slice(3).map((u: any, i: number) => {
                const isMe = user?.user_id === u.user_id;
                const rank = i + 4;
                const relPts = lb[0]?.points ? u.points / lb[0].points : 0;
                return (
                  <Fade key={u.user_id} delay={300 + i * 50}>
                    <View style={[ls.row, isMe && ls.rowMe]}>
                      <Text style={[ls.rank, rank <= 5 && { color: COLORS.primary }]}>#{rank}</Text>
                      <View style={ls.avW}>
                        <Avatar u={u} size={48} idx={i + 3} />
                      </View>
                      <View style={ls.info}>
                        <View style={ls.nameRow}>
                          <Text style={ls.name} numberOfLines={1}>{u.name}</Text>
                          {isMe && <View style={ls.youBadge}><Text style={ls.youT}>VOUS</Text></View>}
                        </View>
                        <View style={ls.meta}>
                          <View style={ls.metaI}><Ionicons name="flame" size={11} color="#FF6B35" /><Text style={ls.metaT}>{u.streak || 0}j</Text></View>
                          <View style={ls.metaI}><Ionicons name="star" size={11} color={COLORS.secondary} /><Text style={ls.metaT}>Niv.{u.level}</Text></View>
                          {(u.total_earnings || 0) > 0 && <View style={ls.metaI}><Ionicons name="cash" size={11} color={COLORS.success} /><Text style={[ls.metaT, { color: COLORS.success }]}>{u.total_earnings}€</Text></View>}
                        </View>
                        {/* Badges inline */}
                        <BadgeRow badges={u.badges} />
                        {/* XP bar */}
                        <View style={ls.xpBg}>
                          <LinearGradient colors={AVATAR_GRAD[(i + 3) % AVATAR_GRAD.length]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={[ls.xpFill, { width: `${Math.max(relPts * 100, 3)}%` as any }]} />
                        </View>
                      </View>
                      <View style={ls.ptsCol}>
                        <Text style={[ls.pts, isMe && { color: COLORS.warning }]}>{u.points}</Text>
                        <Text style={ls.ptsLbl}>XP</Text>
                      </View>
                    </View>
                  </Fade>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const GL = { backgroundColor: 'rgba(20,20,34,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' };
const g = StyleSheet.create({ root: { flex: 1, backgroundColor: '#0F0F0F' }, bg: { position: 'absolute', top: 0, left: 0, right: 0, height: 400, width: '100%' }, ov: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 } });
const hd = StyleSheet.create({ w: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 }, t: { fontSize: 30, fontWeight: '900', color: '#FFF', letterSpacing: -0.8 }, s: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.4)', marginTop: 4 }, empty: { alignItems: 'center', paddingTop: 60, gap: 12 }, emptyT: { fontSize: 14, fontWeight: '500', color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 40 } });
const tb = StyleSheet.create({ w: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: 'rgba(20,20,34,0.6)', borderRadius: 14, padding: 4, marginBottom: 8, marginTop: 10 }, tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 }, tabA: { backgroundColor: COLORS.primary + '18' }, tabF: { backgroundColor: COLORS.secondary + '18' }, tabT: { fontSize: 14, fontWeight: '700', color: COLORS.textMuted }, tabTA: { color: COLORS.primary } });
const p = StyleSheet.create({ w: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', paddingVertical: 20, paddingHorizontal: 10, gap: 10 }, item: { alignItems: 'center', width: (W - 50) / 3 }, ring: { borderWidth: 3.5, borderRadius: 50, padding: 3, marginBottom: -14 }, ring1: { borderWidth: 4 }, badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 12, borderWidth: 2.5, borderColor: '#0F0F0F' }, badge1: { paddingHorizontal: 10, paddingVertical: 4 }, badgeN: { fontSize: 11, fontWeight: '900', color: '#000' }, name: { fontSize: 13, fontWeight: '700', color: '#FFF', marginTop: 10, textAlign: 'center' }, pts: { fontSize: 15, fontWeight: '800', color: 'rgba(255,255,255,0.7)', marginTop: 2 }, ptsU: { fontSize: 10, fontWeight: '600' }, metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }, metaT: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted }, bar: { width: '100%', borderRadius: 10, marginTop: 6 } });
const br = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4, justifyContent: 'center', flexWrap: 'wrap' }, badge: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 1 }, more: { fontSize: 9, fontWeight: '700', color: COLORS.textMuted } });
const sep = StyleSheet.create({ w: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14, marginTop: 4, gap: 10 }, line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' }, t: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.2)', letterSpacing: 2 } });
const ls = StyleSheet.create({ w: { paddingHorizontal: 20, gap: 8 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12, ...GL, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 14 }, rowMe: { borderColor: COLORS.primary + '40', backgroundColor: COLORS.primary + '08' }, rank: { fontSize: 15, fontWeight: '900', color: COLORS.textMuted, width: 32, textAlign: 'center' }, avW: {}, info: { flex: 1, gap: 3 }, nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, name: { fontSize: 15, fontWeight: '700', color: '#FFF', flexShrink: 1 }, youBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }, youT: { fontSize: 8, fontWeight: '900', color: '#FFF', letterSpacing: 1 }, meta: { flexDirection: 'row', gap: 10 }, metaI: { flexDirection: 'row', alignItems: 'center', gap: 3 }, metaT: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted }, xpBg: { height: 3, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', marginTop: 2 }, xpFill: { height: '100%', borderRadius: 2 }, ptsCol: { alignItems: 'center' }, pts: { fontSize: 18, fontWeight: '900', color: COLORS.primary }, ptsLbl: { fontSize: 9, fontWeight: '700', color: COLORS.textMuted } });
