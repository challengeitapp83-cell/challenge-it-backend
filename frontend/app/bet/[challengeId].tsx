import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView,
  Animated, Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../contexts/api';
import { COLORS } from '../../contexts/theme';

const { width: W } = Dimensions.get('window');
const AMOUNTS = [5, 10, 20, 50];

function Fade({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const o = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(16)).current;
  useEffect(() => { Animated.parallel([Animated.timing(o, { toValue: 1, duration: 350, delay, useNativeDriver: true }), Animated.timing(y, { toValue: 0, duration: 350, delay, useNativeDriver: true })]).start(); }, []);
  return <Animated.View style={{ opacity: o, transform: [{ translateY: y }] }}>{children}</Animated.View>;
}

function Scale({ children, onPress, testID, style, disabled }: any) {
  const s = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity testID={testID} onPress={onPress} disabled={disabled}
      onPressIn={() => Animated.spring(s, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start()}
      onPressOut={() => Animated.spring(s, { toValue: 1, useNativeDriver: true, speed: 50 }).start()} activeOpacity={1}>
      <Animated.View style={[style, { transform: [{ scale: s }] }]}>{children}</Animated.View>
    </TouchableOpacity>
  );
}

export default function BetScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { challengeId, challengeTitle, participants } = useLocalSearchParams<{ challengeId: string; challengeTitle: string; participants: string }>();

  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState(10);
  const [customAmount, setCustomAmount] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [payMethod, setPayMethod] = useState('');

  const partCount = parseInt(participants || '5', 10) || 5;
  const betAmount = useCustom ? (parseInt(customAmount, 10) || 0) : amount;
  const totalPot = betAmount * partCount;
  const commission = Math.round(totalPot * 0.1);
  const winnerGets = totalPot - commission;

  const prog = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(prog, { toValue: (step + 1) / 4, useNativeDriver: false, speed: 14 }).start();
  }, [step]);

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      await api.post(`/api/challenges/${challengeId}/contribute-pot`);
      // Simulate payment delay
      await new Promise(r => setTimeout(r, 1500));
      setStep(3);
    } catch (e: any) {
      Alert.alert('Erreur', e.message?.includes('déjà') ? 'Vous avez déjà contribué' : 'Erreur de paiement');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={[g.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={g.hdr}>
        <TouchableOpacity testID="back-btn" onPress={() => step > 0 && step < 3 ? setStep(step - 1) : router.back()} style={g.hdrBtn}>
          <Ionicons name={step > 0 && step < 3 ? 'arrow-back' : 'close'} size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={g.progW}>
          <View style={g.progBg}>
            <Animated.View style={[g.progFill, { width: prog.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}>
              <LinearGradient colors={['#34C759', '#28A745']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            </Animated.View>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* ===== STEP 0: AMOUNT ===== */}
        {step === 0 && (
          <>
            <Fade><Text style={g.title}>Choisis ta mise</Text></Fade>
            <Fade delay={60}><Text style={g.sub}>Chaque participant mise le même montant</Text></Fade>

            <Fade delay={120}>
              <View style={s0.grid}>
                {AMOUNTS.map((a) => {
                  const sel = !useCustom && amount === a;
                  return (
                    <Scale key={a} testID={`amount-${a}`} onPress={() => { setAmount(a); setUseCustom(false); }}
                      style={[s0.chip, sel && { borderWidth: 0 }]}>
                      {sel && <LinearGradient colors={['#34C759', '#28A745']} style={s0.chipBg} />}
                      <Text style={[s0.chipN, sel && { color: '#FFF' }]}>{a}€</Text>
                    </Scale>
                  );
                })}
              </View>
            </Fade>

            <Fade delay={180}>
              <TouchableOpacity testID="custom-amount-toggle" onPress={() => setUseCustom(!useCustom)}
                style={[s0.customToggle, useCustom && { borderColor: '#34C759' }]}>
                <Text style={s0.customLbl}>Montant personnalisé</Text>
                <Ionicons name={useCustom ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </Fade>

            {useCustom && (
              <Fade delay={200}>
                <View style={s0.customInput}>
                  <Text style={s0.euroSign}>€</Text>
                  <TextInput testID="custom-amount-input" style={s0.input}
                    placeholder="0" placeholderTextColor="rgba(255,255,255,0.15)"
                    keyboardType="number-pad" value={customAmount}
                    onChangeText={(t) => setCustomAmount(t.replace(/[^0-9]/g, ''))} maxLength={4} />
                </View>
              </Fade>
            )}

            {/* Pot preview */}
            <Fade delay={240}>
              <View style={s0.potCard}>
                <View style={s0.potRow}>
                  <View style={s0.potIcon}><Ionicons name="people" size={18} color={COLORS.primary} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s0.potLbl}>{partCount} participants × {betAmount}€</Text>
                    <Text style={s0.potSub}>Mise par personne</Text>
                  </View>
                </View>
                <View style={s0.potDivider} />
                <View style={s0.potRow}>
                  <View style={[s0.potIcon, { backgroundColor: '#FFD70015' }]}><Ionicons name="trophy" size={18} color={COLORS.warning} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s0.potLbl, { color: COLORS.warning }]}>{totalPot}€ cagnotte</Text>
                    <Text style={s0.potSub}>Le gagnant remporte {winnerGets}€</Text>
                  </View>
                </View>
              </View>
            </Fade>
          </>
        )}

        {/* ===== STEP 1: SECURITY ===== */}
        {step === 1 && (
          <>
            <Fade><Text style={g.title}>Ton argent est{'\n'}en sécurité</Text></Fade>
            <Fade delay={60}><Text style={g.sub}>Nous protégeons chaque transaction</Text></Fade>

            {[
              { icon: 'lock-closed', color: '#34C759', title: 'Paiement sécurisé', desc: 'Chiffrement SSL de bout en bout. Tes données bancaires ne sont jamais stockées.' },
              { icon: 'shield-checkmark', color: '#007AFF', title: 'Cagnotte bloquée', desc: 'L\'argent est conservé en sécurité jusqu\'à la fin du défi. Aucun accès prématuré.' },
              { icon: 'trophy', color: '#FFD700', title: 'Gains automatiques', desc: 'Le gagnant reçoit automatiquement ses gains. Transparent et instantané.' },
              { icon: 'people', color: '#AF52DE', title: 'Règles équitables', desc: 'Mêmes conditions pour tous. La validation est impartiale et vérifiable.' },
            ].map((item, i) => (
              <Fade key={i} delay={120 + i * 70}>
                <View style={s1.card}>
                  <View style={[s1.iconW, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon as any} size={24} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s1.cardTitle}>{item.title}</Text>
                    <Text style={s1.cardDesc}>{item.desc}</Text>
                  </View>
                </View>
              </Fade>
            ))}

            <Fade delay={500}>
              <View style={s1.trust}>
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text style={s1.trustT}>Commission plateforme : 10% transparent</Text>
              </View>
            </Fade>
          </>
        )}

        {/* ===== STEP 2: PAYMENT + CONFIRM ===== */}
        {step === 2 && (
          <>
            <Fade><Text style={g.title}>Paiement</Text></Fade>
            <Fade delay={60}><Text style={g.sub}>Choisis ton mode de paiement</Text></Fade>

            {/* Payment methods */}
            {[
              { id: 'apple', label: 'Apple Pay', icon: 'logo-apple', color: '#FFF' },
              { id: 'google', label: 'Google Pay', icon: 'logo-google', color: '#4285F4' },
              { id: 'card', label: 'Carte bancaire', icon: 'card', color: '#FF9500' },
            ].map((m, i) => (
              <Fade key={m.id} delay={100 + i * 60}>
                <Scale testID={`pay-${m.id}`} onPress={() => setPayMethod(m.id)}
                  style={[s2.payCard, payMethod === m.id && { borderColor: m.color, borderWidth: 2 }]}>
                  {payMethod === m.id && <View style={[s2.paySel, { backgroundColor: m.color + '08' }]} />}
                  <Ionicons name={m.icon as any} size={24} color={m.color} />
                  <Text style={[s2.payLbl, payMethod === m.id && { color: '#FFF' }]}>{m.label}</Text>
                  {payMethod === m.id && <Ionicons name="checkmark-circle" size={22} color={m.color} />}
                </Scale>
              </Fade>
            ))}

            {/* Summary */}
            <Fade delay={300}>
              <View style={s2.summary}>
                <Text style={s2.sumTitle}>Récapitulatif</Text>
                <View style={s2.sumRow}><Text style={s2.sumLbl}>Défi</Text><Text style={s2.sumVal} numberOfLines={1}>{challengeTitle || 'Mon défi'}</Text></View>
                <View style={s2.sumRow}><Text style={s2.sumLbl}>Ta mise</Text><Text style={[s2.sumVal, { color: '#FFF' }]}>{betAmount}€</Text></View>
                <View style={s2.sumRow}><Text style={s2.sumLbl}>Participants</Text><Text style={s2.sumVal}>{partCount}</Text></View>
                <View style={s2.sumRow}><Text style={s2.sumLbl}>Cagnotte totale</Text><Text style={[s2.sumVal, { color: COLORS.warning }]}>{totalPot}€</Text></View>
                <View style={s2.sumDivider} />
                <View style={s2.sumRow}><Text style={s2.sumLbl}>Commission (10%)</Text><Text style={s2.sumVal}>-{commission}€</Text></View>
                <View style={s2.sumRow}><Text style={[s2.sumLbl, { fontWeight: '800', color: '#FFF' }]}>Gain potentiel</Text><Text style={[s2.sumVal, { color: '#34C759', fontWeight: '900', fontSize: 20 }]}>{winnerGets}€</Text></View>
              </View>
            </Fade>

            <Fade delay={400}>
              <View style={s2.legal}>
                <Ionicons name="lock-closed" size={12} color="rgba(255,255,255,0.3)" />
                <Text style={s2.legalT}>Paiement simulé (MVP). Intégration Stripe prévue.</Text>
              </View>
            </Fade>
          </>
        )}

        {/* ===== STEP 3: SUCCESS ===== */}
        {step === 3 && (
          <View style={s3.w}>
            <Fade>
              <View style={s3.iconW}>
                <LinearGradient colors={['#34C759', '#28A745']} style={s3.iconCircle}>
                  <Ionicons name="checkmark" size={48} color="#FFF" />
                </LinearGradient>
              </View>
            </Fade>
            <Fade delay={200}><Text style={s3.title}>Mise confirmée !</Text></Fade>
            <Fade delay={300}><Text style={s3.sub}>Tu as misé {betAmount}€ sur ce défi</Text></Fade>
            <Fade delay={400}>
              <View style={s3.card}>
                <View style={s3.cardRow}><Ionicons name="cash" size={18} color={COLORS.warning} /><Text style={s3.cardLbl}>Cagnotte</Text><Text style={s3.cardVal}>{totalPot}€</Text></View>
                <View style={s3.cardRow}><Ionicons name="trophy" size={18} color="#34C759" /><Text style={s3.cardLbl}>Gain potentiel</Text><Text style={[s3.cardVal, { color: '#34C759' }]}>{winnerGets}€</Text></View>
                <View style={s3.cardRow}><Ionicons name="time" size={18} color={COLORS.primary} /><Text style={s3.cardLbl}>Statut</Text><Text style={[s3.cardVal, { color: COLORS.primary }]}>En cours</Text></View>
              </View>
            </Fade>
            <Fade delay={500}><Text style={s3.motto}>Donne tout. Le gagnant rafle la mise.</Text></Fade>
          </View>
        )}
      </ScrollView>

      {/* ===== BOTTOM CTA ===== */}
      <View style={[g.bot, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {step === 0 && (
          <Scale testID="next-btn" onPress={() => betAmount > 0 && setStep(1)} disabled={betAmount <= 0}>
            <LinearGradient colors={betAmount > 0 ? ['#34C759', '#28A745'] : ['#1C1C2E', '#1C1C2E']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={g.cta}>
              <Text style={[g.ctaT, betAmount <= 0 && { color: '#555' }]}>Continuer · {betAmount}€</Text>
              <Ionicons name="arrow-forward" size={20} color={betAmount > 0 ? '#FFF' : '#555'} />
            </LinearGradient>
          </Scale>
        )}
        {step === 1 && (
          <Scale testID="next-security-btn" onPress={() => setStep(2)}>
            <LinearGradient colors={['#007AFF', '#5856D6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={g.cta}>
              <Ionicons name="shield-checkmark" size={20} color="#FFF" /><Text style={g.ctaT}>J'ai compris, continuer</Text>
            </LinearGradient>
          </Scale>
        )}
        {step === 2 && (
          <Scale testID="confirm-bet-btn" onPress={handleConfirm} disabled={processing || !payMethod}>
            <LinearGradient colors={payMethod ? ['#34C759', '#28A745'] : ['#1C1C2E', '#1C1C2E']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={g.cta}>
              {processing ? <ActivityIndicator color="#FFF" /> : (
                <><Ionicons name="lock-closed" size={18} color="#FFF" /><Text style={g.ctaT}>Confirmer · {betAmount}€</Text></>
              )}
            </LinearGradient>
          </Scale>
        )}
        {step === 3 && (
          <Scale testID="done-btn" onPress={() => router.back()}>
            <LinearGradient colors={['#007AFF', '#AF52DE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={g.cta}>
              <Text style={g.ctaT}>Retour au défi</Text><Ionicons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </Scale>
        )}
      </View>
    </View>
  );
}

const GL = { backgroundColor: 'rgba(22,22,38,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' };

const g = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0C0C18' },
  hdr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 14 },
  hdrBtn: { width: 42, height: 42, borderRadius: 21, ...GL, justifyContent: 'center', alignItems: 'center' },
  progW: { flex: 1 }, progBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 3, overflow: 'hidden' },
  title: { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: -0.8, marginBottom: 8 },
  sub: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.4)', marginBottom: 24 },
  bot: { paddingHorizontal: 20, paddingTop: 12 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, gap: 10 },
  ctaT: { fontSize: 17, fontWeight: '800', color: '#FFF' },
});

const s0 = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  chip: { flex: 1, height: 72, borderRadius: 18, ...GL, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  chipBg: { ...StyleSheet.absoluteFillObject, borderRadius: 18 },
  chipN: { fontSize: 24, fontWeight: '900', color: 'rgba(255,255,255,0.5)' },
  customToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...GL, borderRadius: 14, padding: 16, marginBottom: 12 },
  customLbl: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  customInput: { flexDirection: 'row', alignItems: 'center', ...GL, borderRadius: 16, padding: 16, marginBottom: 16, borderColor: '#34C759' },
  euroSign: { fontSize: 28, fontWeight: '900', color: '#34C759', marginRight: 8 },
  input: { flex: 1, fontSize: 32, fontWeight: '900', color: '#FFF' },
  potCard: { ...GL, borderRadius: 18, padding: 18, gap: 14 },
  potRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  potIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
  potLbl: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  potSub: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  potDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)' },
});

const s1 = StyleSheet.create({
  card: { flexDirection: 'row', ...GL, borderRadius: 18, padding: 18, gap: 14, marginBottom: 12 },
  iconW: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  cardDesc: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.4)', marginTop: 3, lineHeight: 17 },
  trust: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 12 },
  trustT: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
});

const s2 = StyleSheet.create({
  payCard: { flexDirection: 'row', alignItems: 'center', ...GL, borderRadius: 16, padding: 18, gap: 14, marginBottom: 10, overflow: 'hidden' },
  paySel: { ...StyleSheet.absoluteFillObject, borderRadius: 16 },
  payLbl: { flex: 1, fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  summary: { ...GL, borderRadius: 18, padding: 18, gap: 12, marginTop: 16 },
  sumTitle: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sumLbl: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.4)' },
  sumVal: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  sumDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginVertical: 4 },
  legal: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 14 },
  legalT: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.2)' },
});

const s3 = StyleSheet.create({
  w: { alignItems: 'center', paddingTop: 40 },
  iconW: { marginBottom: 24 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: '#FFF', marginBottom: 8 },
  sub: { fontSize: 15, fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: 28 },
  card: { ...GL, borderRadius: 18, padding: 20, width: '100%', gap: 16 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardLbl: { flex: 1, fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  cardVal: { fontSize: 16, fontWeight: '800', color: COLORS.warning },
  motto: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', marginTop: 24, textAlign: 'center' },
});
