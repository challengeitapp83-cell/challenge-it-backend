import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView,
  Animated, Dimensions, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../contexts/api';
import { COLORS } from '../contexts/theme';

const { width: W } = Dimensions.get('window');
const CREATE_BG = 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=900&h=1200&fit=crop&q=75';

// ===== DATA =====
const TYPES = [
  { id: 'solo', label: 'Solo', desc: 'Affronte-toi toi-même', icon: 'person', grad: ['#007AFF', '#0055CC'] as [string, string] },
  { id: 'friends', label: 'Entre amis', desc: 'Défie tes proches', icon: 'people', grad: ['#AF52DE', '#7C3AED'] as [string, string] },
  { id: 'community', label: 'Mondial', desc: 'Affronte le monde entier', icon: 'earth', grad: ['#FF6B35', '#FF2D55'] as [string, string] },
];

const DURATIONS = [1, 7, 14, 30];
const PARTICIPANTS = [2, 5, 10, 0]; // 0 = illimité

const CATEGORIES = [
  { id: 'Sport', icon: 'fitness', color: '#007AFF', emoji: '💪' },
  { id: 'Esport', icon: 'game-controller', color: '#AF52DE', emoji: '🎮' },
  { id: 'Business', icon: 'briefcase', color: '#FFD700', emoji: '💼' },
  { id: 'Art', icon: 'color-palette', color: '#FF2D55', emoji: '🎨' },
  { id: 'Santé', icon: 'heart', color: '#34C759', emoji: '🧠' },
  { id: 'Nourriture', icon: 'restaurant', color: '#FF9500', emoji: '🍔' },
  { id: 'Général', icon: 'star', color: '#5AC8FA', emoji: '🌐' },
  { id: 'Motivation', icon: 'flash', color: '#FF6B35', emoji: '🚀' },
];

const STAKES = [
  { id: 'money', label: 'Argent', desc: 'Mise entre participants', icon: 'cash', color: '#34C759', emoji: '💰' },
  { id: 'dare', label: 'Gage', desc: 'Punition pour le perdant', icon: 'warning', color: '#FF9500', emoji: '🎯' },
  { id: 'none', label: 'Rien', desc: 'Défi simple', icon: 'ribbon', color: '#71717A', emoji: '⚪' },
];

const POT_AMOUNTS = [5, 10, 20, 50, 100];

// ===== ANIMATION WRAPPER =====
function Fade({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const o = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(o, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 350, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity: o, transform: [{ translateY: y }] }}>{children}</Animated.View>;
}

// ===== SCALE ON PRESS =====
function ScalePress({ children, onPress, testID, style, disabled }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  return (
    <TouchableOpacity testID={testID} onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1} disabled={disabled}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </TouchableOpacity>
  );
}

export default function CreateChallengeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ tplTitle?: string; tplDesc?: string; tplCat?: string; tplDays?: string }>();

  const [step, setStep] = useState(0);
  const [type, setType] = useState('');
  const [duration, setDuration] = useState(7);
  const [maxPart, setMaxPart] = useState(0);
  const [timeLimited, setTimeLimited] = useState(true);
  const [category, setCategory] = useState('');
  const [stake, setStake] = useState('');
  const [potAmount, setPotAmount] = useState(10);
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill from template params
  useEffect(() => {
    if (params.tplTitle) {
      setTitle(params.tplTitle);
      setType('community');
      setStake('none');
      if (params.tplCat) setCategory(params.tplCat);
      if (params.tplDays) setDuration(parseInt(params.tplDays, 10) || 7);
      setStep(3); // Skip to the last step (title + confirmation)
    }
  }, [params.tplTitle]);

  // Animated progress
  const prog = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(prog, { toValue: (step + 1) / 4, useNativeDriver: false, speed: 14 }).start();
  }, [step]);

  const canNext = () => {
    if (step === 0) return !!type;
    if (step === 1) return true;
    if (step === 2) return !!category && !!stake;
    if (step === 3) return title.trim().length > 2;
    return false;
  };

  const next = () => { if (canNext() && step < 3) setStep(step + 1); };
  const back = () => { if (step > 0) setStep(step - 1); else router.back(); };

  const submit = async () => {
    if (!canNext()) return;
    setSubmitting(true);
    try {
      const ch = await api.post('/api/challenges', {
        title: title.trim(),
        description: `Défi ${category} · ${duration} jours`,
        category,
        duration_days: duration,
        challenge_type: type === 'solo' ? 'community' : type,
        has_pot: stake === 'money',
        pot_amount_per_person: stake === 'money' ? potAmount : 0,
        max_participants: maxPart,
        difficulty: 'moyen',
        validation_type: 'photo',
      });
      Alert.alert('Défi lancé ! 🔥', '', [
        { text: 'Voir le défi', onPress: () => router.replace(`/challenge/${ch.challenge_id}`) },
      ]);
    } catch { Alert.alert('Erreur', 'Impossible de créer le défi'); }
    finally { setSubmitting(false); }
  };

  // ===== STEP TITLES =====
  const TITLES = ['Choisis ton mode', 'Configure', 'Personnalise', 'Lance ton défi'];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[g.root]}>
        {/* Immersive Background */}
        <Image source={{ uri: CREATE_BG }} style={g.bgImg} blurRadius={1} />
        <LinearGradient
          colors={['rgba(30,0,120,0.35)', 'rgba(0,80,200,0.25)', 'rgba(12,12,30,0.72)', '#0C0C18']}
          locations={[0, 0.15, 0.45, 0.65]}
          style={g.bgOverlay}
        />
        <View style={{ paddingTop: insets.top }}>

        {/* ===== HEADER ===== */}
        <View style={g.hdr}>
          <TouchableOpacity testID="back-btn" onPress={back} style={g.hdrBtn}>
            <Ionicons name={step > 0 ? 'arrow-back' : 'close'} size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={g.progW}>
            <View style={g.progBg}>
              <Animated.View style={[g.progFill, { width: prog.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}>
                <LinearGradient colors={['#007AFF', '#AF52DE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
              </Animated.View>
            </View>
            <Text style={g.stepN}>{step + 1}/4</Text>
          </View>
          </View>
        </View>

        {/* Title */}
        <Fade key={`title-${step}`}>
          <Text style={g.title}>{TITLES[step]}</Text>
        </Fade>

        {/* ===== CONTENT ===== */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ================== STEP 0: TYPE ================== */}
          {step === 0 && (
            <View style={st0.w}>
              {TYPES.map((t, i) => {
                const sel = type === t.id;
                return (
                  <Fade key={t.id} delay={i * 70}>
                    <ScalePress testID={`type-${t.id}`} onPress={() => setType(t.id)} style={[st0.card, sel && { borderWidth: 0 }]}>
                      {sel && <LinearGradient colors={t.grad} style={st0.cardBg} />}
                      <View style={[st0.iconW, sel && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Ionicons name={t.icon as any} size={30} color={sel ? '#FFF' : t.grad[0]} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[st0.lbl, sel && { color: '#FFF' }]}>{t.label}</Text>
                        <Text style={[st0.desc, sel && { color: 'rgba(255,255,255,0.7)' }]}>{t.desc}</Text>
                      </View>
                      {sel && <Ionicons name="checkmark-circle" size={26} color="#FFF" />}
                    </ScalePress>
                  </Fade>
                );
              })}
            </View>
          )}

          {/* ================== STEP 1: CONFIG ================== */}
          {step === 1 && (
            <View style={st1.w}>
              {/* Duration */}
              <Fade>
                <Text style={st1.secT}>Durée du défi</Text>
                <View style={st1.chipRow}>
                  {DURATIONS.map((d) => {
                    const sel = duration === d;
                    return (
                      <ScalePress key={d} testID={`dur-${d}`} onPress={() => setDuration(d)} style={[st1.durChip, sel && { borderColor: COLORS.primary }]}>
                        {sel && <LinearGradient colors={['#007AFF', '#5856D6']} style={StyleSheet.absoluteFill} />}
                        <Text style={[st1.durN, sel && { color: '#FFF' }]}>{d}</Text>
                        <Text style={[st1.durL, sel && { color: 'rgba(255,255,255,0.7)' }]}>{d === 1 ? 'jour' : 'jours'}</Text>
                      </ScalePress>
                    );
                  })}
                </View>
              </Fade>

              {/* Participants (not solo) */}
              {type !== 'solo' && (
                <Fade delay={80}>
                  <Text style={[st1.secT, { marginTop: 28 }]}>Participants max</Text>
                  <View style={st1.chipRow}>
                    {PARTICIPANTS.map((p) => {
                      const sel = maxPart === p;
                      const label = p === 0 ? '∞' : `${p}`;
                      return (
                        <ScalePress key={p} testID={`part-${p}`} onPress={() => setMaxPart(p)} style={[st1.partChip, sel && { borderColor: COLORS.secondary }]}>
                          {sel && <LinearGradient colors={['#AF52DE', '#7C3AED']} style={StyleSheet.absoluteFill} />}
                          <Text style={[st1.partN, sel && { color: '#FFF' }]}>{label}</Text>
                        </ScalePress>
                      );
                    })}
                  </View>
                </Fade>
              )}

              {/* Time limited toggle */}
              <Fade delay={160}>
                <TouchableOpacity testID="toggle-time" onPress={() => setTimeLimited(!timeLimited)} style={st1.toggleRow} activeOpacity={0.8}>
                  <View style={{ flex: 1 }}>
                    <Text style={st1.toggleLbl}>Limité dans le temps</Text>
                    <Text style={st1.toggleDesc}>Le défi expire après la durée</Text>
                  </View>
                  <View style={[st1.toggle, timeLimited && st1.toggleOn]}>
                    <View style={[st1.toggleDot, timeLimited && st1.toggleDotOn]} />
                  </View>
                </TouchableOpacity>
              </Fade>

              {/* Preview */}
              <Fade delay={240}>
                <View style={st1.preview}>
                  <Ionicons name="information-circle" size={18} color={COLORS.primary} />
                  <Text style={st1.previewT}>
                    {duration} jour{duration > 1 ? 's' : ''} · {type === 'solo' ? 'Solo' : maxPart === 0 ? 'Illimité' : `${maxPart} joueurs`}{timeLimited ? '' : ' · Sans limite'}
                  </Text>
                </View>
              </Fade>
            </View>
          )}

          {/* ================== STEP 2: CATEGORY + STAKE ================== */}
          {step === 2 && (
            <View style={st2.w}>
              {/* Category grid */}
              <Fade>
                <Text style={st1.secT}>Catégorie</Text>
                <View style={st2.catGrid}>
                  {CATEGORIES.map((c, i) => {
                    const sel = category === c.id;
                    return (
                      <Fade key={c.id} delay={i * 40}>
                        <ScalePress testID={`cat-${c.id}`} onPress={() => setCategory(c.id)}
                          style={[st2.catItem, sel && { borderColor: c.color, backgroundColor: c.color + '15' }]}>
                          <Text style={st2.catEmoji}>{c.emoji}</Text>
                          <Text style={[st2.catLbl, sel && { color: c.color }]}>{c.id}</Text>
                          {sel && <View style={[st2.catDot, { backgroundColor: c.color }]} />}
                        </ScalePress>
                      </Fade>
                    );
                  })}
                </View>
              </Fade>

              {/* Stakes */}
              <Fade delay={200}>
                <Text style={[st1.secT, { marginTop: 28 }]}>Enjeu</Text>
                <View style={st2.stakeCol}>
                  {STAKES.map((s, i) => {
                    const sel = stake === s.id;
                    return (
                      <Fade key={s.id} delay={220 + i * 60}>
                        <ScalePress testID={`stake-${s.id}`} onPress={() => setStake(s.id)}
                          style={[st2.stakeCard, sel && { borderColor: s.color, borderWidth: 2 }]}>
                          {sel && <View style={[st2.stakeSel, { backgroundColor: s.color + '12' }]} />}
                          <Text style={st2.stakeEmoji}>{s.emoji}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={[st2.stakeLbl, sel && { color: '#FFF' }]}>{s.label}</Text>
                            <Text style={st2.stakeDesc}>{s.desc}</Text>
                          </View>
                          {sel && <Ionicons name="checkmark-circle" size={22} color={s.color} />}
                        </ScalePress>
                      </Fade>
                    );
                  })}
                </View>
              </Fade>

              {/* Pot amounts */}
              {stake === 'money' && (
                <Fade delay={400}>
                  <View style={st2.potW}>
                    <Text style={st2.potLbl}>Mise par personne</Text>
                    <View style={st2.potRow}>
                      {POT_AMOUNTS.map((a) => {
                        const sel = potAmount === a;
                        return (
                          <ScalePress key={a} testID={`pot-${a}`} onPress={() => setPotAmount(a)}
                            style={[st2.potChip, sel && { borderColor: '#34C759' }]}>
                            {sel && <LinearGradient colors={['#34C759', '#28A745']} style={StyleSheet.absoluteFill} />}
                            <Text style={[st2.potChipT, sel && { color: '#FFF' }]}>{a}€</Text>
                          </ScalePress>
                        );
                      })}
                    </View>
                  </View>
                </Fade>
              )}
            </View>
          )}

          {/* ================== STEP 3: TITLE + SUMMARY ================== */}
          {step === 3 && (
            <View style={st3.w}>
              <Fade>
                <View style={st3.inputW}>
                  <TextInput testID="challenge-title-input" style={st3.input}
                    placeholder="Ex : 30 jours sport sans pause"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={title} onChangeText={setTitle} maxLength={50} autoFocus />
                  <Text style={st3.charCnt}>{title.length}/50</Text>
                </View>
              </Fade>

              <Fade delay={100}>
                <View style={st3.summary}>
                  <Text style={st3.sumTitle}>Récapitulatif</Text>
                  {[
                    { icon: TYPES.find(t => t.id === type)?.icon || 'star', color: TYPES.find(t => t.id === type)?.grad[0] || '#FFF', text: TYPES.find(t => t.id === type)?.label || '' },
                    { icon: 'calendar', color: COLORS.primary, text: `${duration} jour${duration > 1 ? 's' : ''}` },
                    { icon: type !== 'solo' ? 'people' : 'person', color: COLORS.secondary, text: type === 'solo' ? 'Solo' : maxPart === 0 ? 'Illimité' : `${maxPart} participants` },
                    { icon: CATEGORIES.find(c => c.id === category)?.icon || 'star', color: CATEGORIES.find(c => c.id === category)?.color || '#FFF', text: category },
                  ].map((r, i) => (
                    <View key={i} style={st3.sumRow}>
                      <View style={[st3.sumIcon, { backgroundColor: (r.color || '#FFF') + '15' }]}>
                        <Ionicons name={r.icon as any} size={16} color={r.color} />
                      </View>
                      <Text style={st3.sumT}>{r.text}</Text>
                    </View>
                  ))}
                  {/* Stake row */}
                  <View style={st3.sumRow}>
                    <View style={[st3.sumIcon, { backgroundColor: (STAKES.find(s => s.id === stake)?.color || '#FFF') + '15' }]}>
                      <Text style={{ fontSize: 16 }}>{STAKES.find(s => s.id === stake)?.emoji}</Text>
                    </View>
                    <Text style={st3.sumT}>
                      {STAKES.find(s => s.id === stake)?.label}{stake === 'money' ? ` · ${potAmount}€/pers` : ''}
                    </Text>
                  </View>
                </View>
              </Fade>
            </View>
          )}
        </ScrollView>

        {/* ===== BOTTOM CTA ===== */}
        <View style={[g.bot, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {step < 3 ? (
            <ScalePress testID="next-btn" onPress={next} disabled={!canNext()}
              style={{}}>
              <LinearGradient colors={canNext() ? ['#007AFF', '#AF52DE'] : ['#1C1C2E', '#1C1C2E']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={g.cta}>
                <Text style={[g.ctaT, !canNext() && { color: '#555' }]}>Continuer</Text>
                <Ionicons name="arrow-forward" size={20} color={canNext() ? '#FFF' : '#555'} />
              </LinearGradient>
            </ScalePress>
          ) : (
            <ScalePress testID="create-challenge-submit-btn" onPress={submit} disabled={submitting || !canNext()}
              style={{}}>
              <LinearGradient colors={canNext() ? ['#007AFF', '#AF52DE'] : ['#1C1C2E', '#1C1C2E']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={g.cta}>
                {submitting ? <ActivityIndicator color="#FFF" /> : (
                  <><Ionicons name="rocket" size={22} color="#FFF" /><Text style={g.ctaT}>Lancer le défi</Text></>
                )}
              </LinearGradient>
            </ScalePress>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ===== STYLES =====
const GL = { backgroundColor: 'rgba(22,22,38,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' };

const g = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0C0C18' },
  bgImg: { position: 'absolute', top: 0, left: 0, right: 0, height: 500, width: '100%' } as any,
  bgOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 500 },
  hdr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 14 },
  hdrBtn: { width: 42, height: 42, borderRadius: 21, ...GL, justifyContent: 'center', alignItems: 'center' },
  progW: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  progBg: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 3, overflow: 'hidden' },
  stepN: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.35)' },
  title: { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: -0.8, paddingHorizontal: 20, marginBottom: 20, marginTop: 4 },
  bot: { paddingHorizontal: 20, paddingTop: 12 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, gap: 10 },
  ctaT: { fontSize: 17, fontWeight: '800', color: '#FFF' },
});

// Step 0: Type
const st0 = StyleSheet.create({
  w: { gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', ...GL, borderRadius: 20, padding: 20, gap: 16, overflow: 'hidden' },
  cardBg: { ...StyleSheet.absoluteFillObject, borderRadius: 20 },
  iconW: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  lbl: { fontSize: 18, fontWeight: '800', color: 'rgba(255,255,255,0.8)' },
  desc: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.35)', marginTop: 3 },
});

// Step 1: Config
const st1 = StyleSheet.create({
  w: {},
  secT: { fontSize: 16, fontWeight: '800', color: 'rgba(255,255,255,0.7)', marginBottom: 14 },
  chipRow: { flexDirection: 'row', gap: 10 },
  durChip: { flex: 1, height: 76, borderRadius: 18, ...GL, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  durN: { fontSize: 26, fontWeight: '900', color: 'rgba(255,255,255,0.5)' },
  durL: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.25)', marginTop: 2 },
  partChip: { flex: 1, height: 56, borderRadius: 16, ...GL, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  partN: { fontSize: 22, fontWeight: '900', color: 'rgba(255,255,255,0.5)' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', ...GL, borderRadius: 16, padding: 18, marginTop: 28, gap: 14 },
  toggleLbl: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  toggleDesc: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  toggle: { width: 50, height: 30, borderRadius: 15, backgroundColor: '#333', justifyContent: 'center', paddingHorizontal: 3 },
  toggleOn: { backgroundColor: COLORS.primary },
  toggleDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#666' },
  toggleDotOn: { backgroundColor: '#FFF', alignSelf: 'flex-end' },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 10, ...GL, borderRadius: 14, padding: 16, marginTop: 20 },
  previewT: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
});

// Step 2: Category + Stake
const st2 = StyleSheet.create({
  w: {},
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catItem: { width: (W - 70) / 4, ...GL, borderRadius: 16, paddingVertical: 16, alignItems: 'center', gap: 6 },
  catEmoji: { fontSize: 24 },
  catLbl: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 },
  catDot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
  stakeCol: { gap: 10 },
  stakeCard: { flexDirection: 'row', alignItems: 'center', ...GL, borderRadius: 18, padding: 18, gap: 14, overflow: 'hidden' },
  stakeSel: { ...StyleSheet.absoluteFillObject, borderRadius: 18 },
  stakeEmoji: { fontSize: 30 },
  stakeLbl: { fontSize: 16, fontWeight: '800', color: 'rgba(255,255,255,0.75)' },
  stakeDesc: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  potW: { ...GL, borderRadius: 16, padding: 18, marginTop: 16 },
  potLbl: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.4)', marginBottom: 12 },
  potRow: { flexDirection: 'row', gap: 8 },
  potChip: { flex: 1, paddingVertical: 14, borderRadius: 14, ...GL, alignItems: 'center', overflow: 'hidden' },
  potChipT: { fontSize: 16, fontWeight: '800', color: 'rgba(255,255,255,0.4)' },
});

// Step 3: Title + Summary
const st3 = StyleSheet.create({
  w: {},
  inputW: { ...GL, borderRadius: 20, padding: 20, marginBottom: 20 },
  input: { fontSize: 22, fontWeight: '700', color: '#FFF', minHeight: 44 },
  charCnt: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.2)', textAlign: 'right', marginTop: 8 },
  summary: { ...GL, borderRadius: 20, padding: 20, gap: 14 },
  sumTitle: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
  sumRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sumIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  sumT: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
