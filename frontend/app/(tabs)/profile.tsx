import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Alert, Animated, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../contexts/api';
import { COLORS, BADGE_CONFIG, CATEGORIES, getChallengeImage } from '../../contexts/theme';

const BG = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=400&fit=crop&q=70';

function Fade({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const o = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(16)).current;
  useEffect(() => { Animated.parallel([Animated.timing(o, { toValue: 1, duration: 400, delay, useNativeDriver: true }), Animated.timing(y, { toValue: 0, duration: 400, delay, useNativeDriver: true })]).start(); }, []);
  return <Animated.View style={{ opacity: o, transform: [{ translateY: y }] }}>{children}</Animated.View>;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChallenges, setActiveChallenges] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [s, h, f, ac] = await Promise.all([
          api.get('/api/users/me/stats').catch(() => null),
          api.get('/api/users/me/history').catch(() => []),
          api.get('/api/friends').catch(() => []),
          api.get('/api/my-challenges').catch(() => []),
        ]);
        setStats(s); setHistory(h); setFriends(f); setActiveChallenges(ac);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const xpPct = (user?.points || 0) % 100;

  return (
    <View style={g.root}>
      {/* Hero BG */}
      <Image source={{ uri: BG }} style={g.bg} blurRadius={8} />
      <LinearGradient colors={['rgba(15,15,15,0.4)', 'rgba(15,15,15,0.9)', '#0F0F0F']} locations={[0, 0.35, 0.55]} style={g.ov} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120, paddingTop: insets.top }}>
        {/* ===== PROFILE HEADER ===== */}
        <Fade>
          <View style={hd.w}>
            {/* Settings button */}
            <TouchableOpacity onPress={() => router.push('/settings')} style={hd.settingsBtn}>
              <Ionicons name="settings-outline" size={22} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
            <View style={hd.avWrap}>
              {user?.picture ? <Image source={{ uri: user.picture }} style={hd.av} /> :
                <LinearGradient colors={['#00D4FF', '#C850C0']} style={hd.av}><Text style={hd.avI}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text></LinearGradient>}
              <View style={hd.lvl}><Text style={hd.lvlN}>{user?.level || 1}</Text></View>
            </View>
            <Text style={hd.name}>{user?.name || 'Challenger'}</Text>
            <Text style={hd.email}>{user?.email}</Text>
            {/* Win rate */}
            {stats && (stats.challenges_won || 0) + (stats.challenges_lost || 0) > 0 && (
              <View style={hd.winRate}>
                <Text style={hd.winRateVal}>{Math.round(((stats.challenges_won || 0) / ((stats.challenges_won || 0) + (stats.challenges_lost || 0))) * 100)}%</Text>
                <Text style={hd.winRateLbl}>taux de reussite</Text>
              </View>
            )}
            {/* XP Bar */}
            <View style={hd.xpW}>
              <View style={hd.xpRow}>
                <Text style={hd.xpLbl}>Niveau {user?.level || 1}</Text>
                <Text style={hd.xpVal}>{xpPct}/100 XP</Text>
              </View>
              <View style={hd.xpBg}>
                <LinearGradient colors={['#007AFF', '#9D4CDD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[hd.xpFill, { width: `${Math.max(xpPct, 3)}%` as any }]} />
              </View>
            </View>
          </View>
        </Fade>

        {/* ===== STATS GRID ===== */}
        <Fade delay={80}>
          <View style={st.grid}>
            {[
              { icon: 'star', c: COLORS.primary, v: user?.points || 0, l: 'XP Total' },
              { icon: 'flame', c: '#FF6B35', v: user?.streak || 0, l: 'Streak' },
              { icon: 'trophy', c: COLORS.warning, v: stats?.challenges_won || 0, l: 'Gagnés' },
              { icon: 'close-circle', c: '#FF3B30', v: stats?.challenges_lost || 0, l: 'Perdus' },
              { icon: 'cash', c: COLORS.success, v: `${user?.total_earnings || 0}€`, l: 'Gains' },
              { icon: 'people', c: COLORS.secondary, v: friends.length, l: 'Amis' },
              { icon: 'checkmark-done', c: '#5AC8FA', v: stats?.proofs_submitted || 0, l: 'Preuves' },
              { icon: 'heart', c: '#FF2D55', v: user?.reputation || 0, l: 'Réputation' },
            ].map((s2, i) => (
              <View key={i} style={st.card}>
                <Ionicons name={s2.icon as any} size={18} color={s2.c} />
                <Text style={st.val}>{s2.v}</Text>
                <Text style={st.lbl}>{s2.l}</Text>
              </View>
            ))}
          </View>
        </Fade>

        {/* ===== BADGES ===== */}
        <Fade delay={150}>
          <View style={sec.w}>
            <Text style={sec.t}>Badges ({user?.badges?.length || 0}/6)</Text>
            <View style={bd.grid}>
              {Object.entries(BADGE_CONFIG).map(([id, b]) => {
                const earned = user?.badges?.includes(id);
                return (
                  <View key={id} style={[bd.item, !earned && { opacity: 0.25 }]}>
                    <View style={[bd.circle, earned && { borderColor: b.color }]}>
                      <Ionicons name={b.icon as any} size={22} color={earned ? b.color : COLORS.textMuted} />
                    </View>
                    <Text style={[bd.label, earned && { color: '#FFF' }]}>{b.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </Fade>

        {/* ===== DEFIS EN COURS ===== */}
        {activeChallenges.length > 0 && (
          <Fade delay={215}>
            <View style={sec.w}>
              <Text style={sec.t}>Defis en cours ({activeChallenges.length})</Text>
              {activeChallenges.slice(0, 5).map((uc: any) => {
                const ch = uc.challenge;
                const pct = ch?.duration_days ? Math.round(((uc.completed_days || 0) / ch.duration_days) * 100) : 0;
                return (
                  <TouchableOpacity key={uc.user_challenge_id} onPress={() => router.push(`/challenge/${ch?.challenge_id}`)} activeOpacity={0.85} style={acd.card}>
                    <View style={{ flex: 1 }}>
                      <Text style={acd.title} numberOfLines={1}>{ch?.title}</Text>
                      <Text style={acd.sub}>Jour {uc.current_day || 1}/{ch?.duration_days} · {pct}%</Text>
                    </View>
                    {ch?.has_pot && <Text style={acd.pot}>{ch.pot_total}€</Text>}
                    <View style={acd.barBg}><View style={[acd.barFill, { width: `${Math.max(pct, 3)}%` as any }]} /></View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Fade>
        )}

        {/* ===== FRIENDS ===== */}
        <Fade delay={220}>
          <View style={sec.w}>
            <View style={sec.hRow}>
              <Text style={sec.t}>Amis ({friends.length})</Text>
              <TouchableOpacity testID="open-social-btn" onPress={() => router.push('/social')}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.primary }}>Social</Text>
              </TouchableOpacity>
            </View>
            {friends.length === 0 ? (
              <TouchableOpacity onPress={() => router.push('/social')} activeOpacity={0.85}>
                <View style={fr.empty}>
                  <Ionicons name="people-outline" size={28} color={COLORS.textMuted} />
                  <Text style={fr.emptyT}>Invite tes amis a relever des defis !</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, backgroundColor: COLORS.primary + '15', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}>
                    <Ionicons name="search" size={14} color={COLORS.primary} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.primary }}>Trouver des joueurs</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}>
                {friends.map((f: any) => (
                  <TouchableOpacity key={f.user_id} onPress={() => router.push({ pathname: '/challenge-friend', params: { targetId: f.user_id, targetName: f.name, targetPicture: f.picture || '' } })} style={fr.card} activeOpacity={0.8}>
                    {f.picture ? <Image source={{ uri: f.picture }} style={fr.av} /> :
                      <LinearGradient colors={['#007AFF', '#9D4CDD']} style={fr.av}><Text style={fr.avI}>{f.name?.charAt(0)}</Text></LinearGradient>}
                    <Text style={fr.name} numberOfLines={1}>{f.name?.split(' ')[0]}</Text>
                    <Text style={fr.pts}>{f.points} pts</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </Fade>

        {/* ===== HISTORY ===== */}
        <Fade delay={290}>
          <View style={sec.w}>
            <Text style={sec.t}>Historique</Text>
            {history.length === 0 ? (
              <View style={fr.empty}><Ionicons name="time-outline" size={28} color={COLORS.textMuted} /><Text style={fr.emptyT}>Aucun défi terminé</Text></View>
            ) : (
              history.slice(0, 5).map((h: any) => {
                const ch = h.challenge;
                const cat = CATEGORIES[ch?.category] || CATEGORIES['Autre'];
                const img = getChallengeImage(ch?.challenge_id, ch?.category, ch?.image);
                return (
                  <TouchableOpacity key={h.user_challenge_id} onPress={() => router.push(`/challenge/${ch?.challenge_id}`)} style={hi.card} activeOpacity={0.8}>
                    <Image source={{ uri: img }} style={hi.img} />
                    <View style={hi.body}>
                      <Text style={hi.title} numberOfLines={1}>{ch?.title}</Text>
                      <View style={hi.meta}><View style={[hi.catPill, { backgroundColor: cat.color + '20' }]}><Text style={[hi.catT, { color: cat.color }]}>{ch?.category}</Text></View>
                        <Text style={hi.days}>Jour {h.completed_days}/{ch?.duration_days}</Text></View>
                    </View>
                    <View style={h.is_completed ? hi.doneBadge : hi.activeBadge}>
                      <Ionicons name={h.is_completed ? 'checkmark' : 'time-outline'} size={14} color={h.is_completed ? COLORS.success : COLORS.warning} />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </Fade>

        {/* ===== ACTIONS ===== */}
        <Fade delay={360}>
          <View style={act.w}>
            <TouchableOpacity testID="logout-btn" onPress={() => Alert.alert('Déconnexion', 'Êtes-vous sûr ?', [{ text: 'Annuler', style: 'cancel' }, { text: 'Déconnexion', style: 'destructive', onPress: logout }])} style={act.btn}>
              <Ionicons name="log-out-outline" size={20} color="#FF3B30" /><Text style={act.btnT}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        </Fade>
      </ScrollView>
    </View>
  );
}

const GL = { backgroundColor: 'rgba(22,22,36,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' };
const g = StyleSheet.create({ root: { flex: 1, backgroundColor: '#0F0F0F' }, bg: { position: 'absolute', top: 0, left: 0, right: 0, height: 300, width: '100%' }, ov: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 } });

const hd = StyleSheet.create({
  w: { alignItems: 'center', paddingTop: 24, paddingBottom: 16, paddingHorizontal: 20, position: 'relative' },
  settingsBtn: { position: 'absolute', top: 24, right: 20, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(25,30,60,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  avWrap: { position: 'relative', marginBottom: 14 },
  av: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#00D4FF' },
  avI: { fontSize: 36, fontWeight: '800', color: '#FFF' },
  lvl: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#00D4FF', borderRadius: 14, width: 28, height: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#0F0F0F' },
  lvlN: { fontSize: 12, fontWeight: '900', color: '#FFF' },
  name: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  email: { fontSize: 13, color: COLORS.textMuted, marginTop: 3 },
  winRate: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: 'rgba(52,199,89,0.1)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(52,199,89,0.15)' },
  winRateVal: { fontSize: 18, fontWeight: '900', color: '#34C759' },
  winRateLbl: { fontSize: 12, fontWeight: '600', color: 'rgba(52,199,89,0.7)' },
  xpW: { ...GL, borderRadius: 14, padding: 12, marginTop: 16, width: '100%' },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  xpLbl: { fontSize: 12, fontWeight: '700', color: '#00D4FF' },
  xpVal: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },
  xpBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: 3 },
});

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginBottom: 24 },
  card: { width: '23%' as any, ...GL, borderRadius: 14, paddingVertical: 12, alignItems: 'center', gap: 3, flexGrow: 1, flexBasis: '22%' as any },
  val: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  lbl: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 },
});

const sec = StyleSheet.create({
  w: { marginBottom: 24, paddingHorizontal: 20 },
  hRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  t: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 12 },
});

const bd = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  item: { alignItems: 'center', width: 66 },
  circle: { width: 52, height: 52, borderRadius: 26, ...GL, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  label: { fontSize: 9, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' },
});

const fr = StyleSheet.create({
  empty: { ...GL, borderRadius: 14, padding: 20, alignItems: 'center', gap: 8 },
  emptyT: { fontSize: 13, fontWeight: '500', color: COLORS.textMuted },
  card: { alignItems: 'center', width: 72, marginRight: 10, gap: 4 },
  av: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avI: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  name: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  pts: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },
});

const hi = StyleSheet.create({
  card: { flexDirection: 'row', ...GL, borderRadius: 14, overflow: 'hidden', marginBottom: 8, alignItems: 'center' },
  img: { width: 60, height: 60 },
  body: { flex: 1, padding: 10, gap: 4 },
  title: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  catT: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  days: { fontSize: 11, fontWeight: '500', color: COLORS.textMuted },
  doneBadge: { marginRight: 12 },
  activeBadge: { marginRight: 12 },
});

const act = StyleSheet.create({
  w: { paddingHorizontal: 20 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, ...GL, borderRadius: 14, borderColor: '#FF3B3020' },
  btnT: { fontSize: 15, fontWeight: '600', color: '#FF3B30' },
});

const acd = StyleSheet.create({
  card: { ...GL, borderRadius: 16, padding: 14, marginHorizontal: 20, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden' },
  title: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  sub: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.4)', marginTop: 3 },
  pot: { fontSize: 16, fontWeight: '900', color: '#FFD700' },
  barBg: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.05)' },
  barFill: { height: '100%', backgroundColor: '#00D4FF' },
});