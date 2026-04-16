import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Image, StyleSheet,
  Animated, Dimensions, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../contexts/api';
import { useAuth } from '../contexts/AuthContext';
import { BrandLogoImage } from '../components/BrandLogo';

const { width: W, height: H } = Dimensions.get('window');

const HERO_IMG = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1000&h=1400&fit=crop&q=80';
const STEP1_IMG = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=1000&fit=crop&q=80';
const STEP2_IMG = 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=1000&fit=crop&q=80';

const QUICK_CHALLENGES = [
  { title: '20 pompes par jour', cat: 'Sport', icon: 'fitness' },
  { title: 'Se lever a 6h', cat: 'Motivation', icon: 'alarm' },
  { title: '1h de focus', cat: 'Business', icon: 'briefcase' },
  { title: '10 min de meditation', cat: 'Sante', icon: 'heart' },
  { title: '30 min de course', cat: 'Sport', icon: 'walk' },
  { title: 'Pas de sucre', cat: 'Nourriture', icon: 'restaurant' },
];

const DURATIONS = [3, 7, 14, 30];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [selectedChallenge, setSelectedChallenge] = useState(QUICK_CHALLENGES[0]);
  const [duration, setDuration] = useState(7);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [createdId, setCreatedId] = useState('');

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(1.1)).current;
  const celebScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(heroScale, { toValue: 1.18, duration: 10000, useNativeDriver: true }),
      Animated.timing(heroScale, { toValue: 1.1, duration: 10000, useNativeDriver: true }),
    ])).start();
  }, []);

  const goNext = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setStep(s => s + 1);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const ch = await api.post('/api/challenges', {
        title: selectedChallenge.title,
        description: `Defi rapide : ${selectedChallenge.title} pendant ${duration} jours`,
        category: selectedChallenge.cat,
        duration_days: duration,
        challenge_type: 'community',
        has_pot: false,
        pot_amount_per_person: 0,
        max_participants: 0,
        difficulty: 'moyen',
        validation_type: 'photo',
      });
      setCreatedId(ch.challenge_id);
      setCreated(true);
      goNext();
      Animated.spring(celebScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    } catch (e: any) {
      Alert.alert('Erreur', 'Impossible de creer le defi');
    } finally { setCreating(false); }
  };

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('onboarded', 'true');
    await refreshUser();
    router.replace('/(tabs)');
  };

  const skipOnboarding = async () => {
    await AsyncStorage.setItem('onboarded', 'true');
    router.replace('/(tabs)');
  };

  return (
    <View style={g.root}>
      {/* Background */}
      <Animated.View style={[g.bgW, { transform: [{ scale: heroScale }] }]}>
        <Image source={{ uri: step <= 1 ? HERO_IMG : step === 2 ? STEP1_IMG : STEP2_IMG }} style={g.bgImg} blurRadius={step === 0 ? 1 : 2} />
      </Animated.View>
      <LinearGradient
        colors={['rgba(0,60,255,0.25)', 'rgba(140,30,220,0.2)', 'rgba(12,12,28,0.7)', '#0C0C1A']}
        locations={[0, 0.15, 0.45, 0.65]}
        style={g.bgOverlay}
      />

      <Animated.View style={[g.content, { paddingTop: insets.top + 16, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* ===== STEP 0: HOOK ===== */}
        {step === 0 && (
          <View style={g.stepW}>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <BrandLogoImage height={44} />
              <Text style={s0.title}>Depasse{'\n'}tes limites.</Text>
              <Text style={s0.sub}>Prouve que tu peux tenir.</Text>
              <View style={s0.tagRow}>
                <View style={s0.tag}><Ionicons name="flash" size={14} color="#FFD700" /><Text style={s0.tagT}>Defis</Text></View>
                <View style={s0.tag}><Ionicons name="cash" size={14} color="#34C759" /><Text style={s0.tagT}>Mises</Text></View>
                <View style={s0.tag}><Ionicons name="trophy" size={14} color="#FF6B35" /><Text style={s0.tagT}>Victoires</Text></View>
              </View>
            </View>
            <View style={g.botArea}>
              <TouchableOpacity onPress={goNext} activeOpacity={0.85}>
                <LinearGradient colors={['#007AFF', '#AF52DE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={g.ctaBtn}>
                  <Text style={g.ctaT}>Commencer</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={skipOnboarding} style={g.skipBtn}><Text style={g.skipT}>Passer</Text></TouchableOpacity>
            </View>
          </View>
        )}

        {/* ===== STEP 1: EXPLAIN 1 ===== */}
        {step === 1 && (
          <View style={g.stepW}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <View style={s1.iconW}><Ionicons name="flag" size={40} color="#007AFF" /></View>
              <Text style={s1.title}>Fixe un defi simple</Text>
              <Text style={s1.sub}>Choisis un objectif et engage-toi{'\n'}a le tenir chaque jour.</Text>
              <View style={s1.exRow}>
                {['20 pompes', '6h du mat', 'Pas de sucre'].map((e, i) => (
                  <View key={i} style={s1.ex}><Text style={s1.exT}>{e}</Text></View>
                ))}
              </View>
            </View>
            <View style={g.botArea}>
              <TouchableOpacity onPress={goNext} activeOpacity={0.85}>
                <LinearGradient colors={['#007AFF', '#AF52DE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={g.ctaBtn}>
                  <Text style={g.ctaT}>Suivant</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
              <View style={g.dots}>{[0,1,2].map(i => <View key={i} style={[g.dot, i === 0 && g.dotActive]} />)}</View>
            </View>
          </View>
        )}

        {/* ===== STEP 2: EXPLAIN 2 ===== */}
        {step === 2 && (
          <View style={g.stepW}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <View style={[s1.iconW, { backgroundColor: 'rgba(52,199,89,0.15)' }]}><Ionicons name="checkmark-circle" size={40} color="#34C759" /></View>
              <Text style={s1.title}>Valide chaque jour</Text>
              <Text style={s1.sub}>Envoie une preuve photo ou video{'\n'}pour prouver que tu as tenu.</Text>
              <View style={s2.streakRow}>
                {[1,2,3,4,5,6,7].map(d => (
                  <View key={d} style={[s2.day, d <= 4 && s2.dayDone]}>
                    {d <= 4 ? <Ionicons name="checkmark" size={14} color="#FFF" /> : <Text style={s2.dayN}>{d}</Text>}
                  </View>
                ))}
              </View>
              <Text style={s2.streakT}>Streak de 4 jours</Text>
            </View>
            <View style={g.botArea}>
              <TouchableOpacity onPress={goNext} activeOpacity={0.85}>
                <LinearGradient colors={['#007AFF', '#AF52DE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={g.ctaBtn}>
                  <Text style={g.ctaT}>Lance ton premier defi</Text>
                  <Ionicons name="flash" size={20} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
              <View style={g.dots}>{[0,1,2].map(i => <View key={i} style={[g.dot, i === 1 && g.dotActive]} />)}</View>
            </View>
          </View>
        )}

        {/* ===== STEP 3: QUICK CREATE ===== */}
        {step === 3 && (
          <View style={g.stepW}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={s3.title}>Choisis ton defi</Text>
              <Text style={s3.sub}>Rapide, simple, efficace</Text>

              {/* Challenge options */}
              <View style={s3.grid}>
                {QUICK_CHALLENGES.map((ch, i) => (
                  <TouchableOpacity key={i} onPress={() => setSelectedChallenge(ch)}
                    style={[s3.card, selectedChallenge.title === ch.title && s3.cardSel]} activeOpacity={0.8}>
                    <Ionicons name={ch.icon as any} size={24} color={selectedChallenge.title === ch.title ? '#007AFF' : '#888'} />
                    <Text style={[s3.cardT, selectedChallenge.title === ch.title && { color: '#FFF' }]}>{ch.title}</Text>
                    <Text style={s3.cardCat}>{ch.cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Duration */}
              <Text style={s3.label}>Duree</Text>
              <View style={s3.durRow}>
                {DURATIONS.map(d => (
                  <TouchableOpacity key={d} onPress={() => setDuration(d)}
                    style={[s3.durChip, duration === d && s3.durSel]} activeOpacity={0.8}>
                    <Text style={[s3.durT, duration === d && { color: '#FFF' }]}>{d}j</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={g.botArea}>
              <TouchableOpacity onPress={handleCreate} disabled={creating} activeOpacity={0.85}>
                <LinearGradient colors={['#007AFF', '#AF52DE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={g.ctaBtn}>
                  {creating ? <ActivityIndicator color="#FFF" /> : (
                    <><Ionicons name="flash" size={22} color="#FFF" /><Text style={g.ctaT}>Lancer le defi</Text></>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <View style={g.dots}>{[0,1,2].map(i => <View key={i} style={[g.dot, i === 2 && g.dotActive]} />)}</View>
            </View>
          </View>
        )}

        {/* ===== STEP 4: CELEBRATION ===== */}
        {step === 4 && (
          <View style={g.stepW}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Animated.View style={{ transform: [{ scale: celebScale }] }}>
                <View style={s4.iconW}><Ionicons name="checkmark-circle" size={64} color="#34C759" /></View>
              </Animated.View>
              <Text style={s4.title}>Defi lance !</Text>
              <Text style={s4.sub}>Jour 1 commence maintenant</Text>
              <View style={s4.challengeCard}>
                <Ionicons name={(selectedChallenge.icon || 'flash') as any} size={24} color="#007AFF" />
                <View style={{ flex: 1 }}>
                  <Text style={s4.chTitle}>{selectedChallenge.title}</Text>
                  <Text style={s4.chDur}>{duration} jours · {selectedChallenge.cat}</Text>
                </View>
              </View>
              <View style={s4.hookCard}>
                <Ionicons name="flame" size={20} color="#FF6B35" />
                <Text style={s4.hookT}>Reviens demain pour continuer ton streak</Text>
              </View>
              <Text style={s4.warnT}>Si tu laches, tu perds</Text>
            </View>
            <View style={g.botArea}>
              <TouchableOpacity onPress={finishOnboarding} activeOpacity={0.85}>
                <LinearGradient colors={['#34C759', '#28A745']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={g.ctaBtn}>
                  <Ionicons name="rocket" size={22} color="#FFF" />
                  <Text style={g.ctaT}>C'est parti !</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const GL = { backgroundColor: 'rgba(25,30,60,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' };

const g = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0C0C1A' },
  bgW: { position: 'absolute', top: 0, left: 0, right: 0, height: H * 0.6 },
  bgImg: { width: '100%', height: '100%' },
  bgOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: H * 0.6 },
  content: { flex: 1 },
  stepW: { flex: 1, paddingHorizontal: 24 },
  botArea: { paddingBottom: 20, gap: 14 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 18, gap: 10 },
  ctaT: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipT: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.35)' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)' },
  dotActive: { backgroundColor: '#007AFF', width: 24 },
});

const s0 = StyleSheet.create({
  title: { fontSize: 44, fontWeight: '900', color: '#FFF', lineHeight: 50, letterSpacing: -1.5 },
  sub: { fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginTop: 12, lineHeight: 24 },
  tagRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, ...GL, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  tagT: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
});

const s1 = StyleSheet.create({
  iconW: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(0,122,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 30, fontWeight: '900', color: '#FFF', textAlign: 'center', marginBottom: 12 },
  sub: { fontSize: 16, fontWeight: '500', color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 23 },
  exRow: { flexDirection: 'row', gap: 10, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' },
  ex: { ...GL, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  exT: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
});

const s2 = StyleSheet.create({
  streakRow: { flexDirection: 'row', gap: 8, marginTop: 28 },
  day: { width: 38, height: 38, borderRadius: 12, ...GL, justifyContent: 'center', alignItems: 'center' },
  dayDone: { backgroundColor: '#34C759', borderColor: '#34C759' },
  dayN: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.3)' },
  streakT: { fontSize: 14, fontWeight: '700', color: '#FF6B35', marginTop: 12 },
});

const s3 = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '900', color: '#FFF', marginTop: 8 },
  sub: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.4)', marginTop: 4, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: (W - 58) / 2, ...GL, borderRadius: 16, padding: 16, gap: 8 },
  cardSel: { borderColor: '#007AFF', backgroundColor: 'rgba(0,122,255,0.12)' },
  cardT: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  cardCat: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.25)' },
  label: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 12 },
  durRow: { flexDirection: 'row', gap: 10 },
  durChip: { flex: 1, ...GL, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  durSel: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  durT: { fontSize: 18, fontWeight: '800', color: 'rgba(255,255,255,0.4)' },
});

const s4 = StyleSheet.create({
  iconW: { width: 100, height: 100, borderRadius: 30, backgroundColor: 'rgba(52,199,89,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 34, fontWeight: '900', color: '#FFF', marginBottom: 8 },
  sub: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: 28 },
  challengeCard: { flexDirection: 'row', alignItems: 'center', gap: 14, ...GL, borderRadius: 18, padding: 18, width: '100%', marginBottom: 16 },
  chTitle: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  chDur: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  hookCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,107,53,0.1)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.2)', borderRadius: 14, padding: 14, width: '100%', marginBottom: 12 },
  hookT: { fontSize: 14, fontWeight: '700', color: '#FF6B35', flex: 1 },
  warnT: { fontSize: 14, fontWeight: '700', color: '#FF3B30' },
});
