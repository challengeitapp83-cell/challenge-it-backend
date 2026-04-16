import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform,
  Image, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../contexts/theme';
import { BrandIcon } from '../../components/BrandLogo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { api } from '../../contexts/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: W, height: H } = Dimensions.get('window');
const BG_IMG = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&h=1600&fit=crop&q=80';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setUser, setToken } = useAuth();

  const bgScale = useRef(new Animated.Value(1.15)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconGlow = useRef(new Animated.Value(0.3)).current;
  const titleOp = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(30)).current;
  const cardsOp = useRef(new Animated.Value(0)).current;
  const cardsY = useRef(new Animated.Value(25)).current;
  const ctaOp = useRef(new Animated.Value(0)).current;
  const ctaY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // BG zoom
    Animated.timing(bgScale, { toValue: 1, duration: 14000, useNativeDriver: true }).start();
    // Icon spring
    Animated.sequence([
      Animated.delay(200),
      Animated.spring(iconScale, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
    ]).start();
    // Glow loop
    Animated.loop(Animated.sequence([
      Animated.timing(iconGlow, { toValue: 0.7, duration: 1500, useNativeDriver: true }),
      Animated.timing(iconGlow, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
    ])).start();
    // Title
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(titleOp, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
    // Cards
    Animated.sequence([
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(cardsOp, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(cardsY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
    // CTA
    Animated.sequence([
      Animated.delay(1100),
      Animated.parallel([
        Animated.timing(ctaOp, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(ctaY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        const redirectUrl = window.location.origin + '/auth-callback';
        window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
      } else {
        const returnUrl = Linking.createURL('/auth-callback');
        const result = await WebBrowser.openAuthSessionAsync(
          `https://auth.emergentagent.com/?redirect=${encodeURIComponent(returnUrl)}`,
          returnUrl
        );
        if (result.type === 'success' && result.url) {
          const hash = result.url.split('#')[1] || '';
          const params = new URLSearchParams(hash);
          const sid = params.get('session_id');
          if (sid) {
            const data = await api.post('/api/auth/session', { session_id: sid });
            if (data.session_token) await setToken(data.session_token);
            if (data.user) setUser(data.user);
            router.replace('/(tabs)');
          }
        }
      }
    } catch (e) { console.error('Login error:', e); }
    finally { setLoading(false); }
  };

  return (
    <View style={s.root}>
      {/* BG */}
      <Animated.View style={s.bgW}>
        <Animated.Image source={{ uri: BG_IMG }} style={[s.bgImg, { transform: [{ scale: bgScale }] }]} />
      </Animated.View>
      <LinearGradient
        colors={['rgba(0,60,255,0.2)', 'rgba(140,30,220,0.18)', 'rgba(8,8,22,0.72)', 'rgba(6,6,14,0.95)']}
        locations={[0, 0.2, 0.5, 0.72]}
        style={s.overlay}
      />

      <View style={[s.content, { paddingTop: insets.top + 20 }]}>
        {/* Spacer */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {/* Logo Icon with Glow */}
          <Animated.View style={[s.logoW, { transform: [{ scale: iconScale }] }]}>
            <Animated.View style={[s.logoGlow, { opacity: iconGlow }]} />
            <BrandIcon size={88} />
          </Animated.View>

          {/* Title */}
          <Animated.View style={[s.titleW, { opacity: titleOp, transform: [{ translateY: titleY }] }]}>
            <Text style={s.brand}>CHALLENGE IT</Text>
            <Text style={s.tagline}>Depasse tes limites.</Text>
            <Text style={s.sub}>Cree des defis. Mise. Gagne.</Text>
          </Animated.View>
        </View>

        {/* Stats */}
        <Animated.View style={[s.statsRow, { opacity: cardsOp, transform: [{ translateY: cardsY }] }]}>
          {[
            { icon: 'flash', c: '#FFD700', n: '10K+', l: 'defis' },
            { icon: 'people', c: '#00D4FF', n: '2.5K+', l: 'joueurs' },
            { icon: 'cash', c: '#34C759', n: '50K€', l: 'gagnes' },
          ].map((p, i) => (
            <View key={i} style={s.stat}>
              <Ionicons name={p.icon as any} size={16} color={p.c} />
              <Text style={s.statN}>{p.n}</Text>
              <Text style={s.statL}>{p.l}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Preview card */}
        <Animated.View style={[s.previewCard, { opacity: cardsOp, transform: [{ translateY: cardsY }] }]}>
          <View style={s.pvLeft}>
            <View style={s.pvLive}><View style={s.pvDot} /><Text style={s.pvLiveT}>EN COURS</Text></View>
            <Text style={s.pvTitle}>100 Pompes / Jour</Text>
            <View style={s.pvMeta}>
              <Ionicons name="people" size={11} color="rgba(255,255,255,0.4)" />
              <Text style={s.pvMetaT}>8 joueurs</Text>
              <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.4)" />
              <Text style={s.pvMetaT}>12j</Text>
            </View>
          </View>
          <View style={s.pvPot}>
            <Text style={s.pvPotN}>120€</Text>
            <Text style={s.pvPotL}>CAGNOTTE</Text>
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View style={[s.ctaW, { opacity: ctaOp, transform: [{ translateY: ctaY }] }]}>
          <TouchableOpacity onPress={handleGoogleLogin} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={['#00D4FF', '#007AFF', '#C850C0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.mainBtn}>
              {loading ? <ActivityIndicator color="#FFF" /> : (
                <><Ionicons name="flash" size={20} color="#FFF" /><Text style={s.mainBtnT}>Commencer</Text><Ionicons name="arrow-forward" size={18} color="#FFF" /></>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={s.socRow}>
            <TouchableOpacity onPress={handleGoogleLogin} style={s.socBtn} activeOpacity={0.8}>
              <Ionicons name="logo-apple" size={20} color="#FFF" /><Text style={s.socT}>Apple</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleGoogleLogin} style={s.socBtn} activeOpacity={0.8}>
              <Ionicons name="logo-google" size={18} color="#FFF" /><Text style={s.socT}>Google</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.impact}>Tu abandonnes tes objectifs ? Ici tu paies si tu echoues.</Text>
          <Text style={s.terms}>En continuant, tu acceptes nos <Text style={s.termsL}>conditions</Text></Text>
        </Animated.View>
      </View>
    </View>
  );
}

const GL = { backgroundColor: 'rgba(25,30,60,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' };

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#06060E' },
  bgW: { position: 'absolute', width: W, height: H, overflow: 'hidden' },
  bgImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  overlay: { ...StyleSheet.absoluteFillObject },
  content: { flex: 1, paddingHorizontal: 24, paddingBottom: 28 },

  // Logo
  logoW: { alignItems: 'center', marginBottom: 24, position: 'relative' },
  logoGlow: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: '#007AFF' },

  // Title
  titleW: { alignItems: 'center', gap: 6 },
  brand: { fontSize: 32, fontWeight: '900', color: '#FFF', letterSpacing: 3 },
  tagline: { fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  sub: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.4)' },

  // Stats
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', ...GL, borderRadius: 16, padding: 14, marginBottom: 14 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statN: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  statL: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.35)' },

  // Preview
  previewCard: { flexDirection: 'row', ...GL, borderRadius: 18, padding: 16, marginBottom: 18, alignItems: 'center' },
  pvLeft: { flex: 1, gap: 5 },
  pvLive: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' },
  pvDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF3B30' },
  pvLiveT: { fontSize: 9, fontWeight: '800', color: '#FF3B30', letterSpacing: 1 },
  pvTitle: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  pvMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pvMetaT: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.4)' },
  pvPot: { alignItems: 'center', backgroundColor: 'rgba(255,215,0,0.1)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)' },
  pvPotN: { fontSize: 24, fontWeight: '900', color: '#FFD700' },
  pvPotL: { fontSize: 8, fontWeight: '800', color: '#FFD700', opacity: 0.6, letterSpacing: 1.5 },

  // CTA
  ctaW: { gap: 12 },
  mainBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 18, gap: 10 },
  mainBtnT: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  socRow: { flexDirection: 'row', gap: 10 },
  socBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, ...GL },
  socT: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  impact: { fontSize: 13, fontWeight: '600', color: '#FF3B30', textAlign: 'center', fontStyle: 'italic' },
  terms: { fontSize: 10, fontWeight: '400', color: 'rgba(255,255,255,0.2)', textAlign: 'center' },
  termsL: { color: 'rgba(255,255,255,0.35)', textDecorationLine: 'underline' },
});
