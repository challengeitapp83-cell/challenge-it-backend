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

const MOTTOS = [
  "Prouve que tu peux tenir.",
  "Le moment c'est maintenant.",
  "Deviens inarretable.",
  "Depasse tes limites.",
  "Gagne ou perds tout.",
];

function Fade({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
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

function daysLeft(c: string, d: number) {
  return Math.max(0, Math.ceil((new Date(c).getTime() + d * 864e5 - Date.now()) / 864e5));
}

export default function HomeScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [lb, setLb] = useState<any[]>([]);
  const [pressure, setPressure] = useState<any[]>([]);
  const [rankData, setRankData] = useState<any>(null);
  const [moneyStats, setMoneyStats] = useState<any>(null);
  const [triggers, setTriggers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [motto] = useState(MOTTOS[Math.floor(Math.random() * MOTTOS.length)]);

  const pulseGlow = useRef(new Animated.Value(0.5)).current;
  const moneyPulse = useRef(new Animated.Value(1)).current;
  const pressurePulse = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseGlow, { toValue: 1, duration: 1500, useNativeDriver: true }),
      Animated.timing(pulseGlow, { toValue: 0.5, duration: 1500, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(moneyPulse, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
      Animated.timing(moneyPulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pressurePulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(pressurePulse, { toValue: 0.7, duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);

  const xpPct = (user?.points || 0) % 100;

  const fetchData = useCallback(async () => {
    try {
      const [a, t, l, sp, rd, ms, tr2] = await Promise.all([
        api.get('/api/my-challenges').catch(() => []),
        api.get('/api/challenges/trending?limit=8').catch(() => []),
        api.get('/api/leaderboard?limit=5').catch(() => []),
        api.get('/api/social-pressure').catch(() => []),
        api.get('/api/user-rank').catch(() => null),
        api.get('/api/money-stats').catch(() => null),
        api.get('/api/daily-triggers').catch(() => []),
      ]);
      setActive(a); setTrending(t); setLb(l);
      setPressure(sp); setRankData(rd); setMoneyStats(ms); setTriggers(tr2);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), refreshUser()]);
    setRefreshing(false);
  };

  if (loading) return <View style={g.load}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={g.root}>
      <ScrollView
        testID="home-scroll"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ===== HERO HEADER ===== */}
        <Fade>
          <LinearGradient
            colors={['#0A1628', '#0D0D1A']}
            style={[hero.w, { paddingTop: insets.top + 8 }]}
          >
            <View style={hero.top}>
              <View style={hero.avW}>
                {user?.picture ? <Image source={{ uri: user.picture }} style={hero.av} /> :
                  <LinearGradient colors={['#007AFF', '#AF52DE']} style={hero.av}>
                    <Text style={hero.avI}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                  </LinearGradient>}
                <View style={hero.lvl}><Text style={hero.lvlN}>{user?.level || 1}</Text></View>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={hero.hi}>Salut, {user?.name?.split(' ')[0] || 'Challenger'}</Text>
                {/* Mini rank display */}
                {rankData && (
                  <View style={hero.rankRow}>
                    <Ionicons name="podium" size={12} color={COLORS.primary} />
                    <Text style={hero.rankT}>#{rankData.rank} sur {rankData.total_players}</Text>
                    {rankData.pts_to_next_rank > 0 && (
                      <Text style={hero.rankSub}>{rankData.pts_to_next_rank} pts du top</Text>
                    )}
                  </View>
                )}
              </View>
              <TouchableOpacity testID="notifications-btn" style={hero.notif}>
                <Ionicons name="notifications" size={20} color="#FFF" />
                {pressure.length > 0 && <View style={hero.notifDot} />}
              </TouchableOpacity>
            </View>

            {/* XP Bar */}
            <View style={hero.xpW}>
              <View style={hero.xpTop}>
                <Text style={hero.xpLvl}>Niv. {user?.level || 1}</Text>
                <Text style={hero.xpVal}>{xpPct}/100 XP</Text>
              </View>
              <View style={hero.xpBg}>
                <LinearGradient
                  colors={['#007AFF', '#AF52DE']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[hero.xpFill, { width: `${Math.max(xpPct, 3)}%` as any }]}
                />
              </View>
            </View>
          </LinearGradient>
        </Fade>

        {/* ===== MONEY BANNER (KEY ELEMENT) ===== */}
        {moneyStats && moneyStats.total_in_play > 0 && (
          <Fade delay={50}>
            <TouchableOpacity
              testID="money-banner"
              onPress={() => router.push('/(tabs)/challenges')}
              activeOpacity={0.85}
              style={money.w}
            >
              <LinearGradient
                colors={['#1A1200', '#2A1800', '#1A1200']}
                style={money.bg}
              />
              <View style={money.glowBar} />
              <Animated.View style={[money.inner, { transform: [{ scale: moneyPulse }] }]}>
                <View style={money.iconW}>
                  <Ionicons name="cash" size={28} color="#FFD700" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={money.amount}>{moneyStats.total_in_play.toLocaleString()}€</Text>
                  <Text style={money.label}>EN JEU MAINTENANT</Text>
                </View>
                <View style={money.right}>
                  <Text style={money.count}>{moneyStats.active_pot_count} defis</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFD700" />
                </View>
              </Animated.View>
              {moneyStats.user_money_at_stake > 0 && (
                <View style={money.stake}>
                  <Ionicons name="warning" size={12} color="#FF3B30" />
                  <Text style={money.stakeT}>Tu risques {moneyStats.user_money_at_stake}€</Text>
                </View>
              )}
            </TouchableOpacity>
          </Fade>
        )}

        {/* ===== DAILY TRIGGER (CRITICAL) ===== */}
        {triggers.length > 0 && triggers[0].type === 'validate' && (
          <Fade delay={80}>
            <TouchableOpacity
              testID="daily-trigger"
              onPress={() => router.push(`/challenge/${triggers[0].challenge_id}`)}
              activeOpacity={0.85}
              style={trig.w}
            >
              <LinearGradient colors={['#3B0000', '#1A0000']} style={trig.bg} />
              <Animated.View style={[trig.pulse, { opacity: pressurePulse }]} />
              <View style={trig.inner}>
                <View style={trig.iconW}>
                  <Ionicons name="alarm" size={24} color="#FF3B30" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={trig.title}>VALIDE TON DEFI !</Text>
                  <Text style={trig.sub}>{triggers[0].text}</Text>
                  {triggers[0].has_pot && (
                    <Text style={trig.pot}>{triggers[0].pot_total}€ en jeu</Text>
                  )}
                </View>
                <View style={trig.arrow}>
                  <Ionicons name="chevron-forward" size={20} color="#FF3B30" />
                </View>
              </View>
            </TouchableOpacity>
          </Fade>
        )}

        {/* ===== STATS ROW ===== */}
        <Fade delay={100}>
          <View style={stat.row}>
            {[
              { i: 'flame', c: '#FF6B35', v: user?.streak || 0, l: 'STREAK' },
              { i: 'trophy', c: '#FFD700', v: active.length, l: 'ACTIFS' },
              { i: 'podium', c: '#007AFF', v: user?.points || 0, l: 'XP' },
              { i: 'cash', c: '#34C759', v: `${user?.total_earnings || 0}€`, l: 'GAINS' },
            ].map((x, i) => (
              <View key={i} style={stat.card}>
                <Ionicons name={x.i as any} size={18} color={x.c} />
                <Text style={[stat.val, { color: x.c }]}>{x.v}</Text>
                <Text style={stat.lbl}>{x.l}</Text>
              </View>
            ))}
          </View>
        </Fade>

        {/* ===== SOCIAL PRESSURE FEED ===== */}
        {pressure.length > 0 && (
          <Fade delay={130}>
            <View style={sp.w}>
              <View style={sp.header}>
                <Animated.View style={{ opacity: pressurePulse }}>
                  <View style={sp.liveDot} />
                </Animated.View>
                <Text style={sp.headerT}>Activite en direct</Text>
              </View>
              {pressure.slice(0, 4).map((msg: any, i: number) => (
                <View key={i} style={[sp.card, msg.urgency === 'critical' && sp.cardCritical]}>
                  <View style={[sp.iconW, { backgroundColor: (msg.color || '#007AFF') + '18' }]}>
                    <Ionicons name={(msg.icon || 'flash') as any} size={18} color={msg.color || '#007AFF'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[sp.text, msg.urgency === 'critical' && { color: '#FF3B30' }]}>
                      {msg.text}
                    </Text>
                    {msg.sub ? <Text style={sp.sub}>{msg.sub}</Text> : null}
                  </View>
                  {msg.urgency === 'high' || msg.urgency === 'critical' ? (
                    <View style={[sp.urgBadge, { backgroundColor: (msg.color || '#FF3B30') + '20' }]}>
                      <Text style={[sp.urgText, { color: msg.color || '#FF3B30' }]}>!</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </Fade>
        )}

        {/* ===== MY ACTIVE CHALLENGES ===== */}
        {active.length > 0 && (
          <Fade delay={160}>
            <View style={sec.w}>
              <View style={sec.h}>
                <View style={sec.hL}>
                  <Ionicons name="flag" size={18} color={COLORS.primary} />
                  <Text style={sec.t}>Mes Defis en cours</Text>
                </View>
                <TouchableOpacity testID="see-all-btn" onPress={() => router.push('/(tabs)/challenges')}>
                  <Text style={sec.l}>Tout</Text>
                </TouchableOpacity>
              </View>
              {active.slice(0, 2).map((uc: any) => {
                const ch = uc.challenge;
                const cat = CATEGORIES[ch?.category] || CATEGORIES['Autre'];
                const p = ch?.duration_days ? (uc.completed_days || 0) / ch.duration_days : 0;
                const img = getChallengeImage(ch?.challenge_id, ch?.category, ch?.image);
                const rem = daysLeft(ch?.created_at, ch?.duration_days || 30);
                return (
                  <TouchableOpacity
                    key={uc.user_challenge_id}
                    testID={`active-ch-${uc.user_challenge_id}`}
                    onPress={() => router.push(`/challenge/${ch?.challenge_id}`)}
                    activeOpacity={0.85}
                    style={ac.w}
                  >
                    <View style={ac.card}>
                      <Image source={{ uri: img }} style={StyleSheet.absoluteFill} />
                      <LinearGradient
                        colors={['rgba(0,40,160,0.1)', 'rgba(12,12,24,0.95)']}
                        locations={[0.1, 0.8]}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={ac.topR}>
                        <View style={[ac.pill, { backgroundColor: cat.color + '45' }]}>
                          <Ionicons name={cat.icon as any} size={10} color={cat.color} />
                          <Text style={[ac.pillT, { color: cat.color }]}>{ch?.category}</Text>
                        </View>
                        <View style={ac.time}>
                          <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.7)" />
                          <Text style={ac.timeT}>{rem}j</Text>
                        </View>
                      </View>
                      <View style={ac.bot}>
                        <Text style={ac.title}>{ch?.title}</Text>
                        {ch?.has_pot && (
                          <View style={ac.potR}>
                            <Ionicons name="cash" size={14} color="#FFD700" />
                            <Text style={ac.potT}>{ch.pot_total || 0}€ en jeu</Text>
                          </View>
                        )}
                        <View style={ac.pRow}>
                          <Text style={ac.day}>Jour {uc.current_day || 1}/{ch?.duration_days}</Text>
                          <Text style={ac.pct}>{Math.round(p * 100)}%</Text>
                        </View>
                        <View style={ac.barBg}>
                          <LinearGradient
                            colors={['#007AFF', '#AF52DE']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={[ac.barF, { width: `${Math.max(p * 100, 4)}%` as any }]}
                          />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Fade>
        )}

        {/* ===== RANKING WIDGET ===== */}
        {rankData && rankData.nearby_rivals && rankData.nearby_rivals.length > 0 && (
          <Fade delay={190}>
            <View style={sec.w}>
              <View style={sec.h}>
                <View style={sec.hL}>
                  <Ionicons name="podium" size={18} color={COLORS.primary} />
                  <Text style={sec.t}>Ton classement</Text>
                </View>
                <TouchableOpacity
                  testID="see-leaderboard"
                  onPress={() => router.push('/(tabs)/leaderboard')}
                >
                  <Text style={sec.l}>Voir tout</Text>
                </TouchableOpacity>
              </View>

              {/* Position highlight */}
              <View style={rk.posCard}>
                <LinearGradient colors={['#007AFF15', '#AF52DE08']} style={rk.posCardBg} />
                <Text style={rk.posN}>#{rankData.rank}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={rk.posT}>Ta position</Text>
                  {rankData.pts_to_next_rank > 0 && (
                    <Text style={rk.posSub}>
                      Encore {rankData.pts_to_next_rank} pts pour monter
                    </Text>
                  )}
                </View>
                <View style={rk.ptsW}>
                  <Text style={rk.ptsV}>{rankData.points}</Text>
                  <Text style={rk.ptsL}>XP</Text>
                </View>
              </View>

              {/* Nearby rivals */}
              {rankData.nearby_rivals.map((r: any) => (
                <View key={r.user_id} style={[rk.row, r.is_me && rk.rowMe]}>
                  <Text style={[rk.rank, r.rank <= 3 && { color: '#FFD700' }]}>#{r.rank}</Text>
                  <View style={rk.avW}>
                    {r.picture ? <Image source={{ uri: r.picture }} style={rk.av} /> :
                      <LinearGradient colors={['#007AFF', '#AF52DE']} style={rk.av}>
                        <Text style={rk.avI}>{r.name?.charAt(0)?.toUpperCase()}</Text>
                      </LinearGradient>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[rk.name, r.is_me && { color: COLORS.primary }]}>
                      {r.name} {r.is_me ? '(Toi)' : ''}
                    </Text>
                  </View>
                  <Text style={[rk.pts, r.is_me && { color: COLORS.primary }]}>{r.points} XP</Text>
                </View>
              ))}
            </View>
          </Fade>
        )}

        {/* ===== BIGGEST POTS (MONEY MOTIVATION) ===== */}
        <Fade delay={220}>
          <View style={sec.w}>
            <View style={sec.h}>
              <View style={sec.hL}>
                <Ionicons name="cash" size={18} color="#FFD700" />
                <Text style={sec.t}>Cagnottes en jeu</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
            >
              {trending.filter((c: any) => c.has_pot).slice(0, 5).map((ch: any) => {
                const cat = CATEGORIES[ch.category] || CATEGORIES['Autre'];
                const img = getChallengeImage(ch.challenge_id, ch.category, ch.image);
                return (
                  <TouchableOpacity
                    key={ch.challenge_id}
                    testID={`pot-${ch.challenge_id}`}
                    onPress={() => router.push(`/challenge/${ch.challenge_id}`)}
                    activeOpacity={0.85}
                    style={pot.card}
                  >
                    <Image source={{ uri: img }} style={StyleSheet.absoluteFill} />
                    <LinearGradient
                      colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.95)']}
                      locations={[0.2, 1]}
                      style={StyleSheet.absoluteFill}
                    />
                    {/* Money glow badge */}
                    <View style={pot.moneyBadge}>
                      <Ionicons name="cash" size={14} color="#FFD700" />
                      <Text style={pot.moneyT}>{ch.pot_total || ch.pot_amount_per_person}€</Text>
                    </View>
                    <View style={pot.bot}>
                      <Text style={pot.title} numberOfLines={2}>{ch.title}</Text>
                      <View style={pot.meta}>
                        <View style={pot.mI}>
                          <Ionicons name="people" size={11} color="rgba(255,255,255,0.6)" />
                          <Text style={pot.mT}>{ch.participant_count}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {/* No pot challenges? Show all trending */}
              {trending.filter((c: any) => c.has_pot).length === 0 && trending.slice(0, 4).map((ch: any) => {
                const img = getChallengeImage(ch.challenge_id, ch.category, ch.image);
                return (
                  <TouchableOpacity
                    key={ch.challenge_id}
                    onPress={() => router.push(`/challenge/${ch.challenge_id}`)}
                    activeOpacity={0.85}
                    style={pot.card}
                  >
                    <Image source={{ uri: img }} style={StyleSheet.absoluteFill} />
                    <LinearGradient
                      colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.95)']}
                      locations={[0.2, 1]}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={pot.bot}>
                      <Text style={pot.title} numberOfLines={2}>{ch.title}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Fade>

        {/* ===== TRENDING CHALLENGES ===== */}
        <Fade delay={250}>
          <View style={sec.w}>
            <View style={sec.h}>
              <View style={sec.hL}>
                <Ionicons name="trending-up" size={18} color="#FF6B35" />
                <Text style={sec.t}>Tendance</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
            >
              {trending.slice(0, 6).map((ch: any) => {
                const cat = CATEGORIES[ch.category] || CATEGORIES['Autre'];
                const img = getChallengeImage(ch.challenge_id, ch.category, ch.image);
                return (
                  <TouchableOpacity
                    key={ch.challenge_id}
                    testID={`trend-${ch.challenge_id}`}
                    onPress={() => router.push(`/challenge/${ch.challenge_id}`)}
                    activeOpacity={0.85}
                    style={tr.card}
                  >
                    <Image source={{ uri: img }} style={StyleSheet.absoluteFill} />
                    <LinearGradient
                      colors={['rgba(0,30,120,0.15)', 'rgba(12,12,24,0.95)']}
                      locations={[0.15, 1]}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={tr.top}>
                      <View style={[ac.pill, { backgroundColor: cat.color + '50' }]}>
                        <Text style={[ac.pillT, { color: cat.color }]}>{ch.category}</Text>
                      </View>
                    </View>
                    <View style={tr.bot}>
                      <Text style={tr.title} numberOfLines={2}>{ch.title}</Text>
                      <View style={tr.meta}>
                        <View style={tr.mI}>
                          <Ionicons name="people" size={11} color="rgba(255,255,255,0.6)" />
                          <Text style={tr.mT}>{ch.participant_count}</Text>
                        </View>
                        {ch.has_pot && (
                          <View style={tr.mI}>
                            <Ionicons name="cash" size={11} color="#FFD700" />
                            <Text style={[tr.mT, { color: '#FFD700' }]}>
                              {ch.pot_total || ch.pot_amount_per_person}€
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Fade>

        {/* ===== CTA BUTTON ===== */}
        <Fade delay={280}>
          <View style={cta.w}>
            <Animated.View style={[cta.glow, { opacity: pulseGlow }]} />
            <TouchableOpacity
              testID="hero-create-btn"
              onPress={() => router.push('/create-challenge')}
              activeOpacity={0.85}
              style={{ zIndex: 2 }}
            >
              <LinearGradient
                colors={['#007AFF', '#AF52DE']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={cta.btn}
              >
                <Ionicons name="flash" size={22} color="#FFF" />
                <Text style={cta.btnT}>Lance un defi maintenant</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Fade>

        {/* ===== BADGES ===== */}
        <Fade delay={310}>
          <View style={sec.w}>
            <View style={sec.h}>
              <View style={sec.hL}>
                <Ionicons name="ribbon" size={18} color="#FFD700" />
                <Text style={sec.t}>Badges</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
            >
              {Object.entries(BADGE_CONFIG).map(([id, b]) => {
                const earned = user?.badges?.includes(id);
                return (
                  <View key={id} style={[bd.item, !earned && { opacity: 0.2 }]}>
                    <View style={[bd.circle, earned && { borderColor: b.color, borderWidth: 2 }]}>
                      <Ionicons
                        name={b.icon as any}
                        size={22}
                        color={earned ? b.color : 'rgba(255,255,255,0.2)'}
                      />
                    </View>
                    <Text style={[bd.label, earned && { color: '#FFF' }]}>{b.label}</Text>
                    {earned && (
                      <View style={[bd.xpBadge, { backgroundColor: b.color + '25' }]}>
                        <Text style={[bd.xpT, { color: b.color }]}>+5% XP</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </Fade>

        {/* ===== LEADERBOARD MINI ===== */}
        <Fade delay={340}>
          <View style={sec.w}>
            <View style={sec.h}>
              <View style={sec.hL}>
                <Ionicons name="podium" size={18} color={COLORS.primary} />
                <Text style={sec.t}>Top Challengers</Text>
              </View>
              <TouchableOpacity testID="see-all-lb-btn" onPress={() => router.push('/(tabs)/leaderboard')}>
                <Text style={sec.l}>Tout</Text>
              </TouchableOpacity>
            </View>
            {lb.length > 0 ? (
              <View style={lbs.list}>
                {lb.slice(0, 5).map((u: any, i: number) => {
                  const mc = ['#FFD700', '#C0C0C0', '#CD7F32', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.3)'];
                  const isMe = user?.user_id === u.user_id;
                  return (
                    <View key={u.user_id} style={[lbs.row, isMe && lbs.rowMe]}>
                      <View style={[lbs.medal, i < 3 && { backgroundColor: mc[i] + '18' }]}>
                        <Text style={[lbs.mN, { color: mc[i] }]}>#{i + 1}</Text>
                      </View>
                      <View style={[lbs.avOuter, { borderColor: mc[i] }]}>
                        {u.picture ? <Image source={{ uri: u.picture }} style={lbs.avImg} /> :
                          <LinearGradient
                            colors={i === 0 ? ['#007AFF', '#AF52DE'] : ['#333', '#444']}
                            style={lbs.avFallback}
                          >
                            <Text style={lbs.avChar}>{u.name?.charAt(0)?.toUpperCase()}</Text>
                          </LinearGradient>}
                      </View>
                      <View style={lbs.info}>
                        <Text style={lbs.name} numberOfLines={1}>
                          {u.name} {isMe ? '(Toi)' : ''}
                        </Text>
                        {(u.total_earnings || 0) > 0 && (
                          <Text style={lbs.earn}>{u.total_earnings}€ gagnes</Text>
                        )}
                      </View>
                      <Text style={[lbs.pts, i === 0 && { color: '#FFD700' }]}>{u.points}</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={lbs.empty}>
                <Text style={lbs.emptyT}>Bientot</Text>
              </View>
            )}
          </View>
        </Fade>
      </ScrollView>
    </View>
  );
}

// ===== STYLES =====
const GL = { backgroundColor: 'rgba(20,20,38,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' };

const g = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0C0C18' },
  load: { flex: 1, backgroundColor: '#0C0C18', justifyContent: 'center', alignItems: 'center' },
});

const hero = StyleSheet.create({
  w: { paddingHorizontal: 20, paddingBottom: 16 },
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avW: { position: 'relative' },
  av: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: '#007AFF' },
  avI: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  lvl: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#007AFF', borderRadius: 9, width: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0C0C18' },
  lvlN: { fontSize: 8, fontWeight: '900', color: '#FFF' },
  hi: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  rankT: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  rankSub: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.3)', marginLeft: 4 },
  notif: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,122,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  notifDot: { position: 'absolute', top: 8, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },
  xpW: { ...GL, borderRadius: 12, padding: 10 },
  xpTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  xpLvl: { fontSize: 12, fontWeight: '800', color: '#007AFF' },
  xpVal: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.35)' },
  xpBg: { height: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: 3 },
});

const money = StyleSheet.create({
  w: { marginHorizontal: 16, marginTop: 12, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)' },
  bg: { ...StyleSheet.absoluteFillObject },
  glowBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#FFD700' },
  inner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  iconW: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,215,0,0.12)', justifyContent: 'center', alignItems: 'center' },
  amount: { fontSize: 28, fontWeight: '900', color: '#FFD700', letterSpacing: -0.5 },
  label: { fontSize: 9, fontWeight: '800', color: 'rgba(255,215,0,0.5)', letterSpacing: 2, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  count: { fontSize: 11, fontWeight: '700', color: 'rgba(255,215,0,0.6)' },
  stake: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 0 },
  stakeT: { fontSize: 12, fontWeight: '700', color: '#FF3B30' },
});

const trig = StyleSheet.create({
  w: { marginHorizontal: 16, marginTop: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,59,48,0.3)' },
  bg: { ...StyleSheet.absoluteFillObject },
  pulse: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#FF3B30' },
  inner: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  iconW: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,59,48,0.15)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 14, fontWeight: '900', color: '#FF3B30', letterSpacing: 0.5 },
  sub: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  pot: { fontSize: 11, fontWeight: '700', color: '#FFD700', marginTop: 2 },
  arrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,59,48,0.12)', justifyContent: 'center', alignItems: 'center' },
});

const stat = StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: 16, gap: 7, marginTop: 14, marginBottom: 18 },
  card: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center', gap: 3, overflow: 'hidden', ...GL },
  val: { fontSize: 20, fontWeight: '900' },
  lbl: { fontSize: 7, fontWeight: '800', color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5 },
});

const sp = StyleSheet.create({
  w: { marginHorizontal: 16, marginBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },
  headerT: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, ...GL, borderRadius: 12, padding: 12, marginBottom: 6 },
  cardCritical: { borderColor: 'rgba(255,59,48,0.25)', backgroundColor: 'rgba(255,59,48,0.05)' },
  iconW: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  sub: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  urgBadge: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  urgText: { fontSize: 14, fontWeight: '900' },
});

const sec = StyleSheet.create({
  w: { marginBottom: 22 },
  h: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  hL: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  t: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  l: { fontSize: 13, fontWeight: '600', color: '#007AFF' },
});

const ac = StyleSheet.create({
  w: { marginHorizontal: 20, marginBottom: 10 },
  card: { borderRadius: 18, overflow: 'hidden', height: 155 },
  topR: { position: 'absolute', top: 12, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between', zIndex: 2 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pillT: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  time: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  timeT: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  bot: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 14 },
  title: { fontSize: 17, fontWeight: '900', color: '#FFF', marginBottom: 4 },
  potR: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  potT: { fontSize: 12, fontWeight: '700', color: '#FFD700' },
  pRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  day: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  pct: { fontSize: 11, fontWeight: '800', color: '#34C759' },
  barBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  barF: { height: '100%', borderRadius: 2 },
});

const rk = StyleSheet.create({
  posCard: { marginHorizontal: 20, borderRadius: 14, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, marginBottom: 8, ...GL },
  posCardBg: { ...StyleSheet.absoluteFillObject, borderRadius: 14 },
  posN: { fontSize: 32, fontWeight: '900', color: COLORS.primary },
  posT: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  posSub: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  ptsW: { alignItems: 'center' },
  ptsV: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  ptsL: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.3)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4 },
  rowMe: { backgroundColor: 'rgba(0,122,255,0.08)', borderWidth: 1, borderColor: 'rgba(0,122,255,0.2)' },
  rank: { fontSize: 13, fontWeight: '900', color: 'rgba(255,255,255,0.3)', width: 30 },
  avW: {},
  av: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avI: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  name: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  pts: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.5)' },
});

const pot = StyleSheet.create({
  card: { width: 160, height: 210, borderRadius: 18, overflow: 'hidden', marginRight: 10 },
  moneyBadge: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,215,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, zIndex: 2 },
  moneyT: { fontSize: 14, fontWeight: '900', color: '#FFD700' },
  bot: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 },
  title: { fontSize: 14, fontWeight: '900', color: '#FFF', lineHeight: 18, marginBottom: 6 },
  meta: { flexDirection: 'row', gap: 8 },
  mI: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  mT: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
});

const tr = StyleSheet.create({
  card: { width: 155, height: 200, borderRadius: 18, overflow: 'hidden', marginRight: 10 },
  top: { position: 'absolute', top: 10, left: 10, zIndex: 2 },
  bot: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 },
  title: { fontSize: 14, fontWeight: '900', color: '#FFF', lineHeight: 18, marginBottom: 6 },
  meta: { flexDirection: 'row', gap: 8 },
  mI: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  mT: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
});

const cta = StyleSheet.create({
  w: { marginHorizontal: 20, marginBottom: 24, position: 'relative' },
  glow: { position: 'absolute', bottom: -4, left: 8, right: 8, height: 56, borderRadius: 16, backgroundColor: '#007AFF' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, gap: 10 },
  btnT: { fontSize: 16, fontWeight: '800', color: '#FFF' },
});

const bd = StyleSheet.create({
  item: { alignItems: 'center', width: 68, marginRight: 8 },
  circle: { width: 50, height: 50, borderRadius: 25, ...GL, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  label: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.25)', textAlign: 'center' },
  xpBadge: { marginTop: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  xpT: { fontSize: 8, fontWeight: '800' },
});

const lbs = StyleSheet.create({
  list: { marginHorizontal: 20, gap: 5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, ...GL, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  rowMe: { borderColor: 'rgba(0,122,255,0.25)', backgroundColor: 'rgba(0,122,255,0.06)' },
  medal: { width: 28, alignItems: 'center', borderRadius: 6, paddingVertical: 1 },
  mN: { fontSize: 12, fontWeight: '900' },
  avOuter: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, overflow: 'hidden', backgroundColor: '#1E1E1E' },
  avImg: { width: 34, height: 34, borderRadius: 17 },
  avFallback: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  avChar: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  info: { flex: 1, gap: 1 },
  name: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  earn: { fontSize: 10, fontWeight: '600', color: '#34C759' },
  pts: { fontSize: 14, fontWeight: '900', color: '#007AFF' },
  empty: { ...GL, borderRadius: 14, padding: 18, marginHorizontal: 20, alignItems: 'center' },
  emptyT: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.25)' },
});
