import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, Image, StyleSheet,
  RefreshControl, ActivityIndicator, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../contexts/api';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../contexts/theme';

const { width: W } = Dimensions.get('window');
const BG = 'https://images.unsplash.com/photo-1763854413165-1713bc5a7f4a?w=900&h=1200&fit=crop&q=75';

// Gradient colors per user for consistent "avatar"
const AVATAR_GRADIENTS: [string, string][] = [
  ['#FF6B35', '#FF2D55'], ['#007AFF', '#5856D6'], ['#34C759', '#30B0C7'],
  ['#FF9500', '#FF2D55'], ['#AF52DE', '#5856D6'], ['#FF3B30', '#FF6B35'],
  ['#5AC8FA', '#007AFF'], ['#FFCC00', '#FF9500'], ['#32D74B', '#007AFF'],
  ['#FF2D55', '#AF52DE'], ['#5856D6', '#007AFF'], ['#30B0C7', '#34C759'],
];

const MEDAL_COLORS = { 0: '#FFD700', 1: '#C0C0C0', 2: '#CD7F32' };
const MEDAL_GLOW = { 0: '#FFD70040', 1: '#C0C0C030', 2: '#CD7F3230' };
const MEDAL_ICONS: Record<number, string> = { 0: 'trophy', 1: 'medal', 2: 'medal' };

function FadeRow({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const o = useRef(new Animated.Value(0)).current;
  const x = useRef(new Animated.Value(-20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(o, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(x, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity: o, transform: [{ translateX: x }] }}>{children}</Animated.View>;
}

function UserAvatar({ user, size, index }: { user: any; size: number; index: number }) {
  const grad = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  if (user?.picture && !user.picture.includes('placeholder')) {
    return <Image source={{ uri: user.picture }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <LinearGradient colors={grad} style={{ width: size, height: size, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: size * 0.4, fontWeight: '800', color: '#FFF' }}>{user?.name?.charAt(0)?.toUpperCase()}</Text>
    </LinearGradient>
  );
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    try { setLeaderboard(await api.get('/api/leaderboard?limit=20')); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);
  const onRefresh = async () => { setRefreshing(true); await fetchLeaderboard(); setRefreshing(false); };

  return (
    <View style={g.root}>
      {/* Background */}
      <Image source={{ uri: BG }} style={g.bg} blurRadius={6} />
      <LinearGradient colors={['rgba(10,10,18,0.7)', 'rgba(10,10,18,0.92)', '#0F0F0F']} locations={[0, 0.35, 0.55]} style={g.ov} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120, paddingTop: insets.top }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>

        {/* Header */}
        <View style={hd.w}>
          <Text style={hd.title}>Classement</Text>
          <Text style={hd.sub}>Top challengers de la communauté</Text>
        </View>

        {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 80 }} /> :
        leaderboard.length === 0 ? (
          <View style={hd.empty}><Ionicons name="trophy" size={48} color={COLORS.textMuted} /><Text style={hd.emptyT}>Aucun classement</Text></View>
        ) : (
          <>
            {/* ===== TOP 3 PODIUM ===== */}
            <View style={p.wrap}>
              {/* 2nd */}
              {leaderboard.length > 1 && (
                <FadeRow delay={200}>
                  <View style={p.item}>
                    <View style={[p.ring, { borderColor: MEDAL_COLORS[1], shadowColor: MEDAL_COLORS[1] }]}>
                      <UserAvatar user={leaderboard[1]} size={62} index={1} />
                    </View>
                    <View style={[p.badge, { backgroundColor: MEDAL_COLORS[1] }]}>
                      <Ionicons name="medal" size={12} color="#000" />
                      <Text style={p.badgeN}>2</Text>
                    </View>
                    <Text style={p.name} numberOfLines={1}>{leaderboard[1].name}</Text>
                    <Text style={p.pts}>{leaderboard[1].points} pts</Text>
                    <View style={p.streakRow}><Ionicons name="flame" size={11} color="#FF6B35" /><Text style={p.streak}>{leaderboard[1].streak || 0}j</Text></View>
                    <View style={[p.bar, { height: 50, backgroundColor: MEDAL_GLOW[1] }]} />
                  </View>
                </FadeRow>
              )}
              {/* 1st */}
              {leaderboard.length > 0 && (
                <FadeRow delay={100}>
                  <View style={[p.item, { marginTop: -28 }]}>
                    <View style={p.crownWrap}><Ionicons name="trophy" size={30} color={COLORS.warning} /></View>
                    <View style={[p.ring, p.ring1, { borderColor: MEDAL_COLORS[0], shadowColor: MEDAL_COLORS[0] }]}>
                      <UserAvatar user={leaderboard[0]} size={78} index={0} />
                    </View>
                    <View style={[p.badge, p.badge1, { backgroundColor: MEDAL_COLORS[0] }]}>
                      <Ionicons name="trophy" size={12} color="#000" />
                      <Text style={[p.badgeN, { fontSize: 13 }]}>1</Text>
                    </View>
                    <Text style={[p.name, { fontSize: 15 }]} numberOfLines={1}>{leaderboard[0].name}</Text>
                    <Text style={[p.pts, { color: COLORS.warning, fontSize: 16 }]}>{leaderboard[0].points} pts</Text>
                    <View style={p.streakRow}><Ionicons name="flame" size={12} color="#FF6B35" /><Text style={[p.streak, { fontWeight: '700' }]}>{leaderboard[0].streak || 0}j streak</Text></View>
                    <View style={[p.bar, { height: 70, backgroundColor: MEDAL_GLOW[0] }]} />
                  </View>
                </FadeRow>
              )}
              {/* 3rd */}
              {leaderboard.length > 2 && (
                <FadeRow delay={300}>
                  <View style={p.item}>
                    <View style={[p.ring, { borderColor: MEDAL_COLORS[2], shadowColor: MEDAL_COLORS[2] }]}>
                      <UserAvatar user={leaderboard[2]} size={58} index={2} />
                    </View>
                    <View style={[p.badge, { backgroundColor: MEDAL_COLORS[2] }]}>
                      <Ionicons name="medal" size={12} color="#000" />
                      <Text style={p.badgeN}>3</Text>
                    </View>
                    <Text style={p.name} numberOfLines={1}>{leaderboard[2].name}</Text>
                    <Text style={p.pts}>{leaderboard[2].points} pts</Text>
                    <View style={p.streakRow}><Ionicons name="flame" size={11} color="#FF6B35" /><Text style={p.streak}>{leaderboard[2].streak || 0}j</Text></View>
                    <View style={[p.bar, { height: 35, backgroundColor: MEDAL_GLOW[2] }]} />
                  </View>
                </FadeRow>
              )}
            </View>

            {/* ===== SEPARATOR ===== */}
            <View style={sep.w}>
              <View style={sep.line} /><Text style={sep.txt}>CLASSEMENT GLOBAL</Text><View style={sep.line} />
            </View>

            {/* ===== REMAINING LIST ===== */}
            <View style={ls.wrap}>
              {leaderboard.slice(3).map((u: any, i: number) => {
                const isMe = user?.user_id === u.user_id;
                const rank = i + 4;
                const grad = AVATAR_GRADIENTS[(i + 3) % AVATAR_GRADIENTS.length];
                return (
                  <FadeRow key={u.user_id} delay={350 + i * 60}>
                    <View style={[ls.row, isMe && ls.rowMe]}>
                      <Text style={[ls.rank, rank <= 5 && { color: COLORS.primary }]}>#{rank}</Text>
                      <View style={[ls.avRing, { borderColor: grad[0] + '50' }]}>
                        <UserAvatar user={u} size={44} index={i + 3} />
                      </View>
                      <View style={ls.info}>
                        <View style={ls.nameRow}>
                          <Text style={ls.name} numberOfLines={1}>{u.name}</Text>
                          {isMe && <View style={ls.youBadge}><Text style={ls.youTxt}>VOUS</Text></View>}
                        </View>
                        <View style={ls.metaRow}>
                          <View style={ls.metaItem}><Ionicons name="flame" size={12} color="#FF6B35" /><Text style={ls.metaTxt}>{u.streak || 0}j</Text></View>
                          <View style={ls.metaItem}><Ionicons name="star" size={12} color={COLORS.secondary} /><Text style={ls.metaTxt}>Niv. {u.level || 1}</Text></View>
                        </View>
                        {/* XP progress bar */}
                        <View style={ls.xpBg}>
                          <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={[ls.xpFill, { width: `${Math.min((u.points || 0) / (leaderboard[0]?.points || 1) * 100, 100)}%` as any }]} />
                        </View>
                      </View>
                      <View style={ls.ptsCol}>
                        <Text style={[ls.pts, isMe && { color: COLORS.warning }]}>{u.points}</Text>
                        <Text style={ls.ptsLbl}>pts</Text>
                      </View>
                    </View>
                  </FadeRow>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const GL = { backgroundColor: 'rgba(22,22,36,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' };
const g = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F0F0F' },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, height: 420, width: '100%' },
  ov: { position: 'absolute', top: 0, left: 0, right: 0, height: 420 },
});

const hd = StyleSheet.create({
  w: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  title: { fontSize: 30, fontWeight: '900', color: '#FFF', letterSpacing: -0.8 },
  sub: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.45)', marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyT: { fontSize: 16, fontWeight: '600', color: COLORS.textMuted },
});

const p = StyleSheet.create({
  wrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', paddingVertical: 24, paddingHorizontal: 16, gap: 14 },
  item: { alignItems: 'center', width: (W - 60) / 3 },
  crownWrap: { marginBottom: 6 },
  ring: { borderWidth: 3, borderRadius: 50, padding: 3, marginBottom: -14, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 16, elevation: 10 },
  ring1: { borderWidth: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 2.5, borderColor: '#0F0F0F' },
  badge1: { paddingHorizontal: 10, paddingVertical: 4 },
  badgeN: { fontSize: 11, fontWeight: '900', color: '#000' },
  name: { fontSize: 13, fontWeight: '700', color: '#FFF', marginTop: 10, textAlign: 'center' },
  pts: { fontSize: 14, fontWeight: '800', color: COLORS.textMuted, marginTop: 2 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  streak: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },
  bar: { width: '100%', borderRadius: 10, marginTop: 8 },
});

const sep = StyleSheet.create({
  w: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16, gap: 12 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  txt: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.25)', letterSpacing: 2 },
});

const ls = StyleSheet.create({
  wrap: { paddingHorizontal: 20, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, ...GL, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 14 },
  rowMe: { borderColor: COLORS.primary + '40', backgroundColor: COLORS.primary + '08' },
  rank: { fontSize: 15, fontWeight: '900', color: COLORS.textMuted, width: 32, textAlign: 'center' },
  avRing: { borderWidth: 2, borderRadius: 24, padding: 1 },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 15, fontWeight: '700', color: '#FFF', flexShrink: 1 },
  youBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  youTxt: { fontSize: 8, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  metaRow: { flexDirection: 'row', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaTxt: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  xpBg: { height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginTop: 2 },
  xpFill: { height: '100%', borderRadius: 2 },
  ptsCol: { alignItems: 'center' },
  pts: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  ptsLbl: { fontSize: 9, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase' },
});
