import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform,
  Image, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../contexts/theme';
import { BrandLogoImage } from '../../components/BrandLogo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { api } from '../../contexts/api';
import { useAuth } from '../../contexts/AuthContext';

const { width: W, height: H } = Dimensions.get('window');
const BG_IMG = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&h=1600&fit=crop&q=80';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser, setToken } = useAuth();

  // ===== ANIMATIONS =====
  const bgScale = useRef(new Animated.Value(1.15)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const proofOpacity = useRef(new Animated.Value(0)).current;
  const proofSlide = useRef(new Animated.Value(20)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(30)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(20)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaSlide = useRef(new Animated.Value(20)).current;
  const impactOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Cinematic slow zoom on hero image
    Animated.timing(bgScale, { toValue: 1, duration: 12000, useNativeDriver: true }).start();
    // Hero fade in
    Animated.timing(heroOpacity, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    // Social proof (delay 400ms)
    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(proofOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(proofSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
    // Title text (delay 600ms)
    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(textSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();
    // Challenge card preview (delay 900ms)
    Animated.sequence([
      Animated.delay(900),
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(cardSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
    // CTA buttons (delay 1200ms)
    Animated.sequence([
      Animated.delay(1200),
      Animated.parallel([
        Animated.timing(ctaOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(ctaSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
    // Impact phrase (delay 1800ms)
    Animated.sequence([
      Animated.delay(1800),
      Animated.timing(impactOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
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
      {/* ===== ANIMATED HERO BACKGROUND ===== */}
      <Animated.View style={[s.bgWrap, { opacity: heroOpacity }]}>
        <Animated.Image source={{ uri: BG_IMG }} style={[s.bgImg, { transform: [{ scale: bgScale }] }]} />
      </Animated.View>
      <LinearGradient
        colors={['rgba(0,60,255,0.25)', 'rgba(140,30,220,0.2)', 'rgba(10,10,25,0.65)', 'rgba(10,10,22,0.92)']}
        locations={[0, 0.25, 0.55, 0.78]}
        style={s.overlay}
      />

      {/* ===== CONTENT ===== */}
      <View style={s.content}>
        <View style={{ flex: 1 }} />

        {/* Social proof */}
        <Animated.View style={[s.proofRow, { opacity: proofOpacity, transform: [{ translateY: proofSlide }] }]}>
          {[
            { icon: 'flash', color: COLORS.warning, num: '10 000+', label: 'défis' },
            { icon: 'people', color: COLORS.primary, num: '2 500+', label: 'joueurs' },
            { icon: 'cash', color: COLORS.success, num: '50K€+', label: 'gagnés' },
          ].map((p, i) => (
            <View key={i} style={s.proofItem}>
              <Ionicons name={p.icon as any} size={14} color={p.color} />
              <Text style={s.proofNum}>{p.num}</Text>
              <Text style={s.proofLabel}>{p.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Hero text */}
        <Animated.View style={[s.textBlock, { opacity: textOpacity, transform: [{ translateY: textSlide }] }]}>
          <BrandLogoImage height={42} />
          <Text style={s.title}>Dépasse{'\n'}tes limites.</Text>
          <Text style={s.subtitle}>Crée des défis. Mise. Gagne.</Text>
          <Text style={s.hook}>Transforme tes objectifs en résultats réels.</Text>
        </Animated.View>

        {/* Challenge preview card */}
        <Animated.View style={[s.previewCard, { opacity: cardOpacity, transform: [{ translateY: cardSlide }] }]}>
          <View style={s.previewLeft}>
            <View style={s.previewLive}><View style={s.liveDot} /><Text style={s.liveText}>EN COURS</Text></View>
            <Text style={s.previewTitle}>100 Pompes / Jour</Text>
            <View style={s.previewMeta}>
              <View style={s.previewMetaItem}><Ionicons name="people" size={12} color="rgba(255,255,255,0.5)" /><Text style={s.previewMetaText}>8 joueurs</Text></View>
              <View style={s.previewMetaItem}><Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.5)" /><Text style={s.previewMetaText}>12j restants</Text></View>
            </View>
          </View>
          <View style={s.previewRight}>
            <Text style={s.potAmount}>120€</Text>
            <Text style={s.potLabel}>Cagnotte</Text>
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View style={[s.ctaBlock, { opacity: ctaOpacity, transform: [{ translateY: ctaSlide }] }]}>
          {/* Primary CTA */}
          <TouchableOpacity testID="google-login-button" onPress={handleGoogleLogin} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={['#007AFF', '#9D4CDD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.primaryBtn}>
              {loading ? <ActivityIndicator color="#FFF" size="small" /> : (
                <><Text style={s.primaryTxt}>Commencer</Text><Ionicons name="arrow-forward" size={20} color="#FFF" /></>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Social logins */}
          <View style={s.socialRow}>
            <TouchableOpacity testID="apple-btn" onPress={handleGoogleLogin} style={s.socialBtn} activeOpacity={0.8}>
              <Ionicons name="logo-apple" size={20} color="#FFF" /><Text style={s.socialTxt}>Apple</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="google-btn" onPress={handleGoogleLogin} style={s.socialBtn} activeOpacity={0.8}>
              <Ionicons name="logo-google" size={18} color="#FFF" /><Text style={s.socialTxt}>Google</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Impact phrase */}
        <Animated.View style={[s.impactRow, { opacity: impactOpacity }]}>
          <Text style={s.impactText}>Tu abandonnes tes objectifs ? Ici tu paies si tu échoues.</Text>
        </Animated.View>

        {/* Terms */}
        <Text style={s.terms}>En continuant, tu acceptes nos <Text style={s.termsLink}>conditions</Text></Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#06060E' },
  bgWrap: { position: 'absolute', width: W, height: H, overflow: 'hidden' },
  bgImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  overlay: { ...StyleSheet.absoluteFillObject },
  content: { flex: 1, paddingHorizontal: 22, paddingBottom: 32 },

  // Social proof
  proofRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  proofItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  proofNum: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  proofLabel: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.4)' },

  // Title
  textBlock: { marginBottom: 18 },
  title: { fontSize: 42, fontWeight: '900', color: '#FFF', lineHeight: 48, letterSpacing: -1.5, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 14 },
  subtitle: { fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginTop: 10 },
  hook: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.45)', marginTop: 5 },

  // Preview card
  previewCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center' },
  previewLeft: { flex: 1, gap: 6 },
  previewLive: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF3B30' },
  liveText: { fontSize: 10, fontWeight: '800', color: '#FF3B30', letterSpacing: 1 },
  previewTitle: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  previewMeta: { flexDirection: 'row', gap: 14 },
  previewMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  previewMetaText: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.45)' },
  previewRight: { alignItems: 'center', backgroundColor: COLORS.warning + '15', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14 },
  potAmount: { fontSize: 26, fontWeight: '900', color: COLORS.warning },
  potLabel: { fontSize: 10, fontWeight: '700', color: COLORS.warning, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 },

  // CTA
  ctaBlock: { marginBottom: 14 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, gap: 10, marginBottom: 12 },
  primaryTxt: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  socialTxt: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  // Impact
  impactRow: { marginBottom: 14, alignItems: 'center' },
  impactText: { fontSize: 13, fontWeight: '600', color: '#FF3B30', textAlign: 'center', fontStyle: 'italic' },

  // Terms
  terms: { fontSize: 10, fontWeight: '400', color: 'rgba(255,255,255,0.25)', textAlign: 'center' },
  termsLink: { color: 'rgba(255,255,255,0.4)', textDecorationLine: 'underline' },
});
