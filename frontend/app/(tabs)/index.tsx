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
import { BrandLogoImage, BrandIcon } from '../../components/BrandLogo';

const { width: W, height: H } = Dimensions.get('window');
const HERO_BG = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1000&h=1400&fit=crop&q=80';

function Fade({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const o = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(o, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity: o, transform: [{ translateY: y }] }}>{children}</Animated.View>;
}

export default function HomeScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [trending, setTrending] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [active, setActive] = useState<any[]>([]);
  const [lb, setLb] = useState<any[]>([]);
  const [pressure, setPressure] = useState<any[]>([]);
  const [rankData, setRankData] = useState<any>(null);
  const [moneyStats, setMoneyStats] = useState<any>(null);
  const [triggers, setTriggers] = useState<any[]>([]);
  const [recentGains, setRecentGains] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Animations
  const heroScale = useRef(new Animated.Value(1.08)).current;
  const moneyGlow = useRef(new Animated.Value(0.7)).current;
  const trigPulse = useRef(new Animated.Value(1)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Parallax zoom
    Animated.loop(Animated.sequence([
      Animated.timing(heroScale, { toValue: 1.15, duration: 12000, useNativeDriver: true }),
      Animated.timing(heroScale, { toValue: 1.08, duration: 12000, useNativeDriver: true }),
    ])).start();
    // Money pulse
    Animated.loop(Animated.sequence([
      Animated.timing(moneyGlow, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.timing(moneyGlow, { toValue: 0.7, duration: 1200, useNativeDriver: true }),
    ])).start();
    // Trigger pulse
    Animated.loop(Animated.sequence([
      Animated.timing(trigPulse, { toValue: 1.02, duration: 800, useNativeDriver: true }),
      Animated.timing(trigPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);

  const xpPct = (user?.points || 0) % 100;

  const fetchData = useCallback(async () => {
    try {
      const [t, tpl, ac2, l, sp, rd, ms, tr2, rg] = await Promise.all([
        api.get('/api/challenges/trending?limit=8').catch(() => []),
        api.get('/api/challenge-templates').catch(() => []),
        api.get('/api/my-challenges').catch(() => []),
        api.get('/api/leaderboard?limit=5').catch(() => []),
        api.get('/api/social-pressure').catch(() => []),
        api.get('/api/user-rank').catch(() => null),
        api.get('/api/money-stats').catch(() => null),
        api.get('/api/daily-triggers').catch(() => []),
        api.get('/api/recent-gains').catch(() => []),
      ]);
      setTrending(t); setTemplates(tpl); setActive(ac2); setLb(l);
      setPressure(sp); setRankData(rd); setMoneyStats(ms); setTriggers(tr2); setRecentGains(rg);
      setPressure(sp); setRankData(rd); setMoneyStats(ms); setTriggers(tr2);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = async () => { setRefreshing(true); await Promise.all([fetchData(), refreshUser()]); setRefreshing(false); };

  if (loading) return <View style={g.load}><ActivityIndicator size="large" color="#007AFF" /></View>;

  return (
    <View style={g.root}>
      {/* ===== HERO BG WITH PARALLAX ===== */}
      <Animated.View style={[g.heroBg, { transform: [{ scale: heroScale }] }]}>
        <Image source={{ uri: HERO_BG }} style={g.heroImg} blurRadius={1} />
      </Animated.View>
      <LinearGradient
        colors={['rgba(0,80,255,0.30)', 'rgba(160,40,220,0.25)', 'rgba(255,120,0,0.12)', 'rgba(12,12,28,0.75)', '#0C0C1A']}
        locations={[0, 0.15, 0.3, 0.55, 0.72]}
        style={g.heroOverlay}
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        {/* ===== HERO SECTION ===== */}
        <View style={[h.w, { paddingTop: insets.top + 12 }]}>
          {/* 1. TOP BAR — avatar left, notif right */}
          <Fade>
            <View style={h.topBar}>
              <View style={h.avW}>
                {user?.picture ? <Image source={{ uri: user.picture }} style={h.av} /> :
                  <LinearGradient colors={['#00D4FF', '#C850C0']} style={h.av}>
                    <Text style={h.avI}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                  </LinearGradient>}
                <View style={h.lvlBadge}><Text style={h.lvlN}>{user?.level || 1}</Text></View>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={h.greeting}>Salut, {user?.name?.split(' ')[0] || 'Challenger'}</Text>
                {rankData && (
                  <View style={h.rankRow}>
                    <Text style={h.rankT}>#{rankData.rank}</Text>
                    <Text style={h.rankSep}> sur {rankData.total_players}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => router.push('/notifications')} style={h.notifBtn}>
                <Ionicons name="notifications" size={22} color="#FFF" />
                {pressure.length > 0 && <View style={h.notifDot} />}
              </TouchableOpacity>
            </View>
          </Fade>

          {/* 2. LOGO — CENTERED, BIG, clean */}
          <Fade delay={80}>
            <View style={h.logoCenter}>
              <BrandIcon size={80} />
            </View>
          </Fade>

          {/* 3. TEXT — centered under logo */}
          <Fade delay={150}>
            <View style={h.textCenter}>
              <Text style={h.brandName}>CHALLENGE <Text style={h.brandCyan}>I</Text><Text style={h.brandMag}>T</Text></Text>
              <Text style={h.tagline}>Mise. Challenge. Gagne.</Text>
              <Text style={h.motto}>Depasse tes limites.</Text>
            </View>
          </Fade>

          {/* 4. XP bar */}
          <Fade delay={220}>
            <View style={h.xpCard}>
              <View style={h.xpRow}>
                <Text style={h.xpLvl}>Niv. {user?.level || 1}</Text>
                <Text style={h.xpVal}>{xpPct}/100 XP</Text>
              </View>
              <View style={h.xpBg}>
                <LinearGradient colors={['#00D4FF', '#C850C0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[h.xpFill, { width: `${Math.max(xpPct, 4)}%` as any }]} />
              </View>
            </View>
          </Fade>
        </View>

        {/* ===== MONEY BANNER ===== */}
        {moneyStats && moneyStats.total_in_play > 0 && (
          <Fade delay={180}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/challenges')} activeOpacity={0.85} style={m.w}>
              <LinearGradient colors={['#2A1800', '#1A1000', '#0F0A00']} style={m.bg} />
              <View style={m.glowLine} />
              <Animated.View style={[m.inner, { transform: [{ scale: moneyGlow.interpolate({ inputRange: [0.7, 1], outputRange: [1, 1.03] }) }] }]}>
                <View style={m.iconW}>
                  <Ionicons name="cash" size={28} color="#FFD700" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={m.amount}>{moneyStats.total_in_play.toLocaleString()}€</Text>
                  <Text style={m.label}>EN JEU MAINTENANT</Text>
                </View>
                <View style={m.arrow}><Ionicons name="chevron-forward" size={18} color="#FFD700" /></View>
              </Animated.View>
              {moneyStats.user_money_at_stake > 0 && (
                <View style={m.riskRow}>
                  <Ionicons name="warning" size={13} color="#FF3B30" />
                  <Text style={m.riskT}>Tu risques {moneyStats.user_money_at_stake}€</Text>
                </View>
              )}
            </TouchableOpacity>
          </Fade>
        )}

        {/* ===== TRIGGER CTA ===== */}
        {triggers.length > 0 && triggers[0].type === 'validate' && (
          <Fade delay={200}>
            <Animated.View style={{ transform: [{ scale: trigPulse }] }}>
              <TouchableOpacity onPress={() => router.push(`/challenge/${triggers[0].challenge_id}`)} activeOpacity={0.85} style={tr.w}>
                <LinearGradient colors={['#4A0000', '#2A0000', '#180000']} style={tr.bg} />
                <View style={tr.glowLine} />
                <View style={tr.inner}>
                  <View style={tr.iconW}><Ionicons name="alarm" size={26} color="#FF3B30" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={tr.title}>VALIDE TON DEFI !</Text>
                    <Text style={tr.sub}>{triggers[0].text}</Text>
                    {triggers[0].has_pot && <Text style={tr.pot}>{triggers[0].pot_total}€ en jeu</Text>}
                  </View>
                  <View style={tr.arrowW}><Ionicons name="arrow-forward" size={18} color="#FF3B30" /></View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </Fade>
        )}

        {/* ===== MES DEFIS EN COURS ===== */}
        {active.length > 0 && (
          <Fade delay={215}>
            <View style={sec.w}>
              <View style={sec.h}>
                <View style={sec.hL}><Ionicons name="flag" size={18} color="#00D4FF" /><Text style={sec.t}>Mes defis en cours</Text></View>
                <TouchableOpacity onPress={() => router.push('/(tabs)/challenges')}><Text style={sec.l}>Tout</Text></TouchableOpacity>
              </View>
              {active.slice(0, 3).map((uc: any) => {
                const ch = uc.challenge;
                const pct = ch?.duration_days ? Math.round(((uc.completed_days || 0) / ch.duration_days) * 100) : 0;
                const cat = CATEGORIES[ch?.category] || CATEGORIES['Autre'];
                return (
                  <TouchableOpacity key={uc.user_challenge_id} onPress={() => router.push(`/challenge/${ch?.challenge_id}`)} activeOpacity={0.85} style={ac.card}>
                    <View style={[ac.catDot, { backgroundColor: cat.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={ac.title} numberOfLines={1}>{ch?.title}</Text>
                      <View style={ac.meta}>
                        <Text style={ac.day}>Jour {uc.current_day || 1}/{ch?.duration_days}</Text>
                        {ch?.has_pot && <><Ionicons name="cash" size={11} color="#FFD700" /><Text style={ac.pot}>{ch.pot_total}€</Text></>}
                      </View>
                    </View>
                    <View style={ac.pctW}>
                      <Text style={[ac.pctT, pct >= 50 && { color: '#34C759' }]}>{pct}%</Text>
                    </View>
                    <View style={ac.barBg}><View style={[ac.barFill, { width: `${Math.max(pct, 3)}%` as any }]} /></View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Fade>
        )}

        {/* ===== STATS ===== */}
        <Fade delay={230}>
          <View style={st.row}>
            {[
              { i: 'flame', c: '#FF6B35', v: user?.streak || 0, l: 'STREAK' },
              { i: 'trophy', c: '#FFD700', v: user?.challenges_won || 0, l: 'VICTOIRES' },
              { i: 'podium', c: '#007AFF', v: user?.points || 0, l: 'XP' },
              { i: 'cash', c: '#34C759', v: `${user?.total_earnings || 0}€`, l: 'GAINS' },
            ].map((x, i) => (
              <View key={i} style={st.card}>
                <Ionicons name={x.i as any} size={20} color={x.c} />
                <Text style={[st.val, { color: x.c }]}>{x.v}</Text>
                <Text style={st.lbl}>{x.l}</Text>
              </View>
            ))}
          </View>
        </Fade>

        {/* ===== DEFIS POPULAIRES (TEMPLATES) ===== */}
        {templates.length > 0 && (
          <Fade delay={245}>
            <View style={sec.w}>
              <View style={sec.h}>
                <View style={sec.hL}><Ionicons name="flame" size={18} color="#FF6B35" /><Text style={sec.t}>Defis populaires</Text></View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}>
                {templates.map((tpl: any) => (
                  <TouchableOpacity
                    key={tpl.id}
                    onPress={() => router.push({
                      pathname: '/create-challenge',
                      params: { tplTitle: tpl.title, tplDesc: tpl.description, tplCat: tpl.category, tplDays: String(tpl.duration_days) },
                    })}
                    activeOpacity={0.85}
                    style={tp.card}
                  >
                    <Image source={{ uri: tpl.image }} style={StyleSheet.absoluteFill} />
                    <LinearGradient colors={['rgba(0,30,100,0.1)', 'rgba(12,12,24,0.93)']} locations={[0.2, 1]} style={StyleSheet.absoluteFill} />
                    {/* Badge */}
                    <View style={[tp.badge, { backgroundColor: tpl.badge_color + '25', borderColor: tpl.badge_color + '40' }]}>
                      <Text style={[tp.badgeT, { color: tpl.badge_color }]}>{tpl.badge}</Text>
                    </View>
                    <View style={tp.bot}>
                      <Text style={tp.title} numberOfLines={2}>{tpl.title}</Text>
                      <Text style={tp.desc} numberOfLines={1}>{tpl.description}</Text>
                      <View style={tp.meta}>
                        <View style={tp.metaI}><Ionicons name="time" size={11} color="rgba(255,255,255,0.5)" /><Text style={tp.metaT}>{tpl.duration_days}j</Text></View>
                        <View style={tp.launchBtn}>
                          <Text style={tp.launchT}>Lancer</Text>
                          <Ionicons name="arrow-forward" size={12} color="#FFF" />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Fade>
        )}

        {/* ===== LIVE ACTIVITY ===== */}
        {pressure.length > 0 && (
          <Fade delay={260}>
            <View style={sp.w}>
              <View style={sp.header}>
                <View style={sp.liveDot} />
                <Text style={sp.headerT}>Activite en direct</Text>
              </View>
              {pressure.slice(0, 4).map((msg: any, i: number) => (
                <View key={i} style={[sp.card, msg.urgency === 'critical' && sp.cardCrit]}>
                  <View style={[sp.iconW, { backgroundColor: (msg.color || '#007AFF') + '18' }]}>
                    <Ionicons name={(msg.icon || 'flash') as any} size={18} color={msg.color || '#007AFF'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[sp.text, msg.urgency === 'critical' && { color: '#FF3B30' }]}>{msg.text}</Text>
                    {msg.sub ? <Text style={sp.sub}>{msg.sub}</Text> : null}
                  </View>
                  {(msg.urgency === 'high' || msg.urgency === 'critical') && (
                    <View style={[sp.urgBadge, { backgroundColor: (msg.color || '#FF3B30') + '20' }]}>
                      <Text style={[sp.urgT, { color: msg.color || '#FF3B30' }]}>!</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </Fade>
        )}

        {/* ===== RANKING WIDGET ===== */}
        {rankData && rankData.nearby_rivals?.length > 0 && (
          <Fade delay={290}>
            <View style={sec.w}>
              <View style={sec.h}>
                <View style={sec.hL}><Ionicons name="podium" size={18} color="#007AFF" /><Text style={sec.t}>Ton classement</Text></View>
                <TouchableOpacity onPress={() => router.push('/(tabs)/leaderboard')}><Text style={sec.l}>Voir tout</Text></TouchableOpacity>
              </View>
              <View style={rk.posCard}>
                <Text style={rk.posN}>#{rankData.rank}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={rk.posT}>Ta position</Text>
                  {rankData.pts_to_next_rank > 0 && <Text style={rk.posSub}>Encore {rankData.pts_to_next_rank} pts pour monter</Text>}
                </View>
                <View style={rk.ptsW}><Text style={rk.ptsV}>{rankData.points}</Text><Text style={rk.ptsL}>XP</Text></View>
              </View>
              {rankData.nearby_rivals.map((r: any) => (
                <View key={r.user_id} style={[rk.row, r.is_me && rk.rowMe]}>
                  <Text style={[rk.rank, r.rank <= 3 && { color: '#FFD700' }]}>#{r.rank}</Text>
                  {r.picture ? <Image source={{ uri: r.picture }} style={rk.av} /> :
                    <LinearGradient colors={['#007AFF', '#AF52DE']} style={rk.av}>
                      <Text style={rk.avI}>{r.name?.charAt(0)?.toUpperCase()}</Text>
                    </LinearGradient>}
                  <Text style={[rk.name, r.is_me && { color: '#007AFF' }]} numberOfLines={1}>{r.name} {r.is_me ? '(Toi)' : ''}</Text>
                  <Text style={[rk.pts, r.is_me && { color: '#007AFF' }]}>{r.points}</Text>
                </View>
              ))}
            </View>
          </Fade>
        )}

        {/* ===== TRENDING ===== */}
        <Fade delay={320}>
          <View style={sec.w}>
            <View style={sec.h}>
              <View style={sec.hL}><Ionicons name="trending-up" size={18} color="#FF6B35" /><Text style={sec.t}>Tendance</Text></View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}>
              {trending.slice(0, 6).map((ch: any) => {
                const cat = CATEGORIES[ch.category] || CATEGORIES['Autre'];
                const img = getChallengeImage(ch.challenge_id, ch.category, ch.image);
                return (
                  <TouchableOpacity key={ch.challenge_id} onPress={() => router.push(`/challenge/${ch.challenge_id}`)} activeOpacity={0.85} style={tc.card}>
                    <Image source={{ uri: img }} style={StyleSheet.absoluteFill} />
                    <LinearGradient colors={['rgba(0,40,160,0.15)', 'rgba(12,12,24,0.92)']} locations={[0.2, 1]} style={StyleSheet.absoluteFill} />
                    {ch.has_pot && (
                      <View style={tc.potBadge}><Ionicons name="cash" size={12} color="#FFD700" /><Text style={tc.potT}>{ch.pot_total}€</Text></View>
                    )}
                    <View style={tc.bot}>
                      <View style={[tc.catPill, { backgroundColor: cat.color + '40' }]}><Text style={[tc.catT, { color: cat.color }]}>{ch.category}</Text></View>
                      <Text style={tc.title} numberOfLines={2}>{ch.title}</Text>
                      <View style={tc.meta}><Ionicons name="people" size={11} color="rgba(255,255,255,0.5)" /><Text style={tc.metaT}>{ch.participant_count}</Text></View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Fade>

        {/* ===== CTA ===== */}
        <Fade delay={350}>
          <View style={cta.w}>
            <TouchableOpacity onPress={() => router.push('/create-challenge')} activeOpacity={0.85}>
              <LinearGradient colors={['#00D4FF', '#007AFF', '#C850C0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={cta.btn}>
                <Ionicons name="flash" size={22} color="#FFF" />
                <Text style={cta.btnT}>Lance un defi</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Fade>

        {/* ===== GAINS RECENTS ===== */}
        {recentGains.length > 0 && (
          <Fade delay={360}>
            <View style={sec.w}>
              <View style={sec.h}>
                <View style={sec.hL}><Ionicons name="cash" size={18} color="#34C759" /><Text style={sec.t}>Gains recents</Text></View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}>
                {recentGains.slice(0, 6).map((g: any) => (
                  <View key={g.id} style={gn.card}>
                    <View style={gn.avW}>
                      <LinearGradient colors={['#34C759', '#28A745']} style={gn.av}>
                        <Text style={gn.avI}>{g.user_name?.charAt(0)}</Text>
                      </LinearGradient>
                    </View>
                    <Text style={gn.amount}>+{g.amount}€</Text>
                    <Text style={gn.name} numberOfLines={1}>{g.user_name}</Text>
                    <Text style={gn.ch} numberOfLines={1}>{g.challenge_title}</Text>
                    <Text style={gn.time}>{g.days_ago === 0 ? "Aujourd'hui" : `Il y a ${g.days_ago}j`}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </Fade>
        )}

        {/* ===== TOP CHALLENGERS ===== */}
        <Fade delay={380}>
          <View style={sec.w}>
            <View style={sec.h}>
              <View style={sec.hL}><Ionicons name="trophy" size={18} color="#FFD700" /><Text style={sec.t}>Top Challengers</Text></View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/leaderboard')}><Text style={sec.l}>Tout</Text></TouchableOpacity>
            </View>
            {lb.slice(0, 5).map((u: any, i: number) => {
              const mc = ['#FFD700', '#C0C0C0', '#CD7F32', '#555', '#555'];
              return (
                <View key={u.user_id} style={lbr.row}>
                  <Text style={[lbr.rank, { color: mc[i] }]}>#{i + 1}</Text>
                  {u.picture ? <Image source={{ uri: u.picture }} style={lbr.av} /> :
                    <LinearGradient colors={i === 0 ? ['#007AFF', '#AF52DE'] : ['#333', '#444']} style={lbr.av}>
                      <Text style={lbr.avI}>{u.name?.charAt(0)?.toUpperCase()}</Text>
                    </LinearGradient>}
                  <View style={{ flex: 1 }}><Text style={lbr.name} numberOfLines={1}>{u.name}</Text></View>
                  <Text style={[lbr.pts, i === 0 && { color: '#FFD700' }]}>{u.points}</Text>
                </View>
              );
            })}
          </View>
        </Fade>
      </Animated.ScrollView>
    </View>
  );
}

// ========== STYLES ==========
const GL = { backgroundColor: 'rgba(25,30,60,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' };
const g = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0C0C1A' },
  load: { flex: 1, backgroundColor: '#0C0C1A', justifyContent: 'center', alignItems: 'center' },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, height: H * 0.55 },
  heroImg: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: H * 0.55 },
});

const h = StyleSheet.create({
  w: { paddingHorizontal: 20, paddingBottom: 24, minHeight: H * 0.42 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  avW: { position: 'relative' },
  av: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: '#00D4FF' },
  avI: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  lvlBadge: { position: 'absolute', bottom: -3, right: -3, backgroundColor: '#00D4FF', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0C0C1A' },
  lvlN: { fontSize: 9, fontWeight: '900', color: '#FFF' },
  greeting: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  rankRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  rankT: { fontSize: 14, fontWeight: '900', color: '#00D4FF' },
  rankSep: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  notifBtn: { width: 44, height: 44, borderRadius: 22, ...GL, justifyContent: 'center', alignItems: 'center' },
  notifDot: { position: 'absolute', top: 8, right: 10, width: 9, height: 9, borderRadius: 5, backgroundColor: '#FF3B30' },
  // Logo centered
  logoCenter: { alignItems: 'center', marginBottom: 20 },
  // Text centered
  textCenter: { alignItems: 'center', marginBottom: 24, gap: 6 },
  brandName: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: 2.5, textAlign: 'center' },
  brandCyan: { color: '#00D4FF' },
  brandMag: { color: '#C850C0' },
  tagline: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
  motto: { fontSize: 22, fontWeight: '800', color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontStyle: 'italic' },
  // XP
  xpCard: { ...GL, borderRadius: 14, padding: 12 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  xpLvl: { fontSize: 13, fontWeight: '800', color: '#00D4FF' },
  xpVal: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.35)' },
  xpBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: 3 },
});

const m = StyleSheet.create({
  w: { marginHorizontal: 16, marginTop: 14, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)' },
  bg: { ...StyleSheet.absoluteFillObject },
  glowLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#FFD700' },
  inner: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  iconW: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,215,0,0.12)', justifyContent: 'center', alignItems: 'center' },
  amount: { fontSize: 30, fontWeight: '900', color: '#FFD700', letterSpacing: -0.5 },
  label: { fontSize: 9, fontWeight: '800', color: 'rgba(255,215,0,0.45)', letterSpacing: 2.5, marginTop: 3 },
  arrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,215,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  riskRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingBottom: 14 },
  riskT: { fontSize: 13, fontWeight: '700', color: '#FF3B30' },
});

const tr = StyleSheet.create({
  w: { marginHorizontal: 16, marginTop: 14, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,59,48,0.35)' },
  bg: { ...StyleSheet.absoluteFillObject },
  glowLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#FF3B30' },
  inner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  iconW: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,59,48,0.15)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '900', color: '#FF3B30', letterSpacing: 0.5 },
  sub: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.45)', marginTop: 3 },
  pot: { fontSize: 12, fontWeight: '700', color: '#FFD700', marginTop: 3 },
  arrowW: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,59,48,0.12)', justifyContent: 'center', alignItems: 'center' },
});

const ac = StyleSheet.create({
  card: { marginHorizontal: 20, ...GL, borderRadius: 16, padding: 14, marginBottom: 8, position: 'relative', overflow: 'hidden' },
  catDot: { width: 4, height: 36, borderRadius: 2, position: 'absolute', left: 0, top: 18 },
  title: { fontSize: 15, fontWeight: '700', color: '#FFF', marginLeft: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8, marginTop: 4 },
  day: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  pot: { fontSize: 12, fontWeight: '700', color: '#FFD700' },
  pctW: { position: 'absolute', right: 14, top: 14 },
  pctT: { fontSize: 16, fontWeight: '900', color: 'rgba(255,255,255,0.5)' },
  barBg: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.05)' },
  barFill: { height: '100%', backgroundColor: '#00D4FF' },
});

const st = StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginTop: 18, marginBottom: 22 },
  card: { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center', gap: 4, ...GL },
  val: { fontSize: 22, fontWeight: '900' },
  lbl: { fontSize: 7, fontWeight: '800', color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5 },
});

const sp = StyleSheet.create({
  w: { marginHorizontal: 16, marginBottom: 22 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  liveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#FF3B30' },
  headerT: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 1 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, ...GL, borderRadius: 14, padding: 14, marginBottom: 6 },
  cardCrit: { borderColor: 'rgba(255,59,48,0.25)', backgroundColor: 'rgba(255,59,48,0.05)' },
  iconW: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  sub: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  urgBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  urgT: { fontSize: 15, fontWeight: '900' },
});

const sec = StyleSheet.create({
  w: { marginBottom: 24 },
  h: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 },
  hL: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  t: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  l: { fontSize: 14, fontWeight: '600', color: '#007AFF' },
});

const rk = StyleSheet.create({
  posCard: { marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, marginBottom: 10, ...GL, borderColor: 'rgba(0,122,255,0.15)' },
  posN: { fontSize: 34, fontWeight: '900', color: '#007AFF' },
  posT: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  posSub: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  ptsW: { alignItems: 'center' },
  ptsV: { fontSize: 20, fontWeight: '900', color: '#007AFF' },
  ptsL: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.3)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4 },
  rowMe: { backgroundColor: 'rgba(0,122,255,0.08)', borderWidth: 1, borderColor: 'rgba(0,122,255,0.2)', borderRadius: 12 },
  rank: { fontSize: 13, fontWeight: '900', color: 'rgba(255,255,255,0.3)', width: 32 },
  av: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  avI: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  name: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.7)', flex: 1 },
  pts: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.5)' },
});

const tc = StyleSheet.create({
  card: { width: 160, height: 215, borderRadius: 20, overflow: 'hidden', marginRight: 10 },
  potBadge: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,215,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, zIndex: 2 },
  potT: { fontSize: 14, fontWeight: '900', color: '#FFD700' },
  bot: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  catPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginBottom: 6 },
  catT: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 15, fontWeight: '900', color: '#FFF', lineHeight: 19, marginBottom: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaT: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
});

const cta = StyleSheet.create({
  w: { marginHorizontal: 20, marginBottom: 28 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 18, gap: 10 },
  btnT: { fontSize: 17, fontWeight: '800', color: '#FFF' },
});

const lbr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, ...GL, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 14, marginBottom: 6 },
  rank: { fontSize: 13, fontWeight: '900', width: 28 },
  av: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  avI: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  name: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  pts: { fontSize: 15, fontWeight: '900', color: '#007AFF' },
});

const tp = StyleSheet.create({
  card: { width: 175, height: 230, borderRadius: 20, overflow: 'hidden', marginRight: 12 },
  badge: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, zIndex: 2 },
  badgeT: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  bot: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  title: { fontSize: 16, fontWeight: '900', color: '#FFF', lineHeight: 20, marginBottom: 4 },
  desc: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)', lineHeight: 15, marginBottom: 8 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaI: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaT: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  launchBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  launchT: { fontSize: 12, fontWeight: '700', color: '#FFF' },
});

const gn = StyleSheet.create({
  card: { width: 120, alignItems: 'center', ...GL, borderRadius: 16, padding: 14, marginRight: 10, borderColor: 'rgba(52,199,89,0.12)' },
  avW: { marginBottom: 8 },
  av: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avI: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  amount: { fontSize: 20, fontWeight: '900', color: '#34C759', marginBottom: 4 },
  name: { fontSize: 12, fontWeight: '700', color: '#FFF', marginBottom: 2 },
  ch: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.35)', textAlign: 'center' },
  time: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.2)', marginTop: 4 },
});