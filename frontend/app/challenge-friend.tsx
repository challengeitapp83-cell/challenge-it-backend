import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView,
  Alert, ActivityIndicator, Image, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../contexts/api';
import { COLORS, CATEGORIES } from '../contexts/theme';

const CATS = ['Sport', 'Esport', 'Business', 'Art', 'Sante', 'Nourriture', 'Motivation', 'General'];
const DURATIONS = [3, 7, 14, 30];
const CHALLENGE_BG = 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=900&h=1200&fit=crop&q=75';
const STAKES = [
  { id: 'none', label: 'Rien', icon: 'heart', color: COLORS.textMuted },
  { id: 'gage', label: 'Gage', icon: 'skull', color: '#FF6B35' },
  { id: 'money', label: 'Argent', icon: 'cash', color: '#FFD700' },
];

function Avatar({ uri, name, size }: { uri?: string; name: string; size: number }) {
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  return (
    <LinearGradient colors={['#007AFF', '#AF52DE']} style={{ width: size, height: size, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: size * 0.4, fontWeight: '800', color: '#FFF' }}>{name?.charAt(0)?.toUpperCase() || '?'}</Text>
    </LinearGradient>
  );
}

export default function ChallengeFriendScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { targetId, targetName, targetPicture } = useLocalSearchParams<{ targetId: string; targetName: string; targetPicture: string }>();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Sport');
  const [duration, setDuration] = useState(7);
  const [stake, setStake] = useState('none');
  const [potAmount, setPotAmount] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Donne un titre a ton defi');
      return;
    }
    setCreating(true);
    try {
      const hasPot = stake === 'money' && parseInt(potAmount || '0', 10) > 0;
      const result = await api.post('/api/challenges/create-and-invite', {
        title: title.trim(),
        description: stake === 'gage' ? 'Defi avec gage - Le perdant paie !' : `Defi entre amis : ${title}`,
        category,
        duration_days: duration,
        invited_user_id: targetId,
        has_pot: hasPot,
        pot_amount: hasPot ? parseInt(potAmount, 10) : 0,
      });

      Alert.alert(
        'Defi lance !',
        `Invitation envoyee a ${targetName}\n${result.invite_code ? `Code: ${result.invite_code}` : ''}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible de creer le defi');
    } finally { setCreating(false); }
  };

  return (
    <View style={[g.root, { paddingTop: insets.top }]}>
      {/* Immersive Background */}
      <Image source={{ uri: CHALLENGE_BG }} style={g.bgImg} blurRadius={3} />
      <LinearGradient
        colors={['rgba(0,80,200,0.18)', 'rgba(200,80,0,0.1)', 'rgba(12,12,24,0.92)', '#0C0C18']}
        locations={[0, 0.12, 0.36, 0.5]}
        style={g.bgOverlay}
      />
      <View style={g.header}>
        <TouchableOpacity testID="cf-back" onPress={() => router.back()} style={g.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={g.headerT}>Defier un ami</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        {/* Target user */}
        <View style={s.targetCard}>
          <Avatar uri={targetPicture || undefined} name={targetName || '?'} size={52} />
          <View style={{ flex: 1 }}>
            <Text style={s.targetName}>{targetName}</Text>
            <Text style={s.targetSub}>Ton adversaire</Text>
          </View>
          <Ionicons name="flash" size={24} color={COLORS.primary} />
        </View>

        {/* Title */}
        <Text style={s.label}>Titre du defi</Text>
        <TextInput
          testID="cf-title"
          style={s.input}
          placeholder="Ex: 50 pompes par jour"
          placeholderTextColor={COLORS.textMuted}
          value={title}
          onChangeText={setTitle}
          maxLength={60}
        />

        {/* Category */}
        <Text style={s.label}>Categorie</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
          {CATS.map((c) => {
            const cfg = CATEGORIES[c] || CATEGORIES['Autre'];
            const sel = category === c;
            return (
              <TouchableOpacity key={c} testID={`cat-${c}`} onPress={() => setCategory(c)}
                style={[s.catChip, sel && { borderColor: cfg.color, backgroundColor: cfg.color + '18' }]}>
                <Ionicons name={cfg.icon as any} size={16} color={sel ? cfg.color : COLORS.textMuted} />
                <Text style={[s.catT, sel && { color: cfg.color }]}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Duration */}
        <Text style={s.label}>Duree</Text>
        <View style={s.durRow}>
          {DURATIONS.map((d) => (
            <TouchableOpacity key={d} testID={`dur-${d}`} onPress={() => setDuration(d)}
              style={[s.durChip, duration === d && s.durChipSel]}>
              <Text style={[s.durT, duration === d && { color: '#FFF' }]}>{d}j</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stake */}
        <Text style={s.label}>Enjeu</Text>
        <View style={s.stakeRow}>
          {STAKES.map((st) => (
            <TouchableOpacity key={st.id} testID={`stake-${st.id}`} onPress={() => setStake(st.id)}
              style={[s.stakeChip, stake === st.id && { borderColor: st.color, backgroundColor: st.color + '15' }]}>
              <Ionicons name={st.icon as any} size={20} color={stake === st.id ? st.color : COLORS.textMuted} />
              <Text style={[s.stakeT, stake === st.id && { color: st.color }]}>{st.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Money amount */}
        {stake === 'money' && (
          <View style={s.moneyW}>
            <Text style={s.euroSign}>€</Text>
            <TextInput
              testID="cf-pot"
              style={s.moneyInput}
              placeholder="10"
              placeholderTextColor="rgba(255,255,255,0.2)"
              keyboardType="number-pad"
              value={potAmount}
              onChangeText={(t) => setPotAmount(t.replace(/[^0-9]/g, ''))}
              maxLength={4}
            />
            <Text style={s.moneyLabel}>par personne</Text>
          </View>
        )}

        {/* Summary */}
        <View style={s.summary}>
          <View style={s.sumRow}>
            <Ionicons name="person" size={16} color={COLORS.primary} />
            <Text style={s.sumLbl}>Adversaire</Text>
            <Text style={s.sumVal}>{targetName}</Text>
          </View>
          <View style={s.sumRow}>
            <Ionicons name="time" size={16} color={COLORS.primary} />
            <Text style={s.sumLbl}>Duree</Text>
            <Text style={s.sumVal}>{duration} jours</Text>
          </View>
          <View style={s.sumRow}>
            <Ionicons name={(CATEGORIES[category]?.icon || 'star') as any} size={16} color={(CATEGORIES[category]?.color || COLORS.primary)} />
            <Text style={s.sumLbl}>Categorie</Text>
            <Text style={s.sumVal}>{category}</Text>
          </View>
          {stake !== 'none' && (
            <View style={s.sumRow}>
              <Ionicons name={stake === 'money' ? 'cash' : 'skull'} size={16} color={stake === 'money' ? '#FFD700' : '#FF6B35'} />
              <Text style={s.sumLbl}>Enjeu</Text>
              <Text style={[s.sumVal, { color: stake === 'money' ? '#FFD700' : '#FF6B35' }]}>
                {stake === 'money' ? `${potAmount || '0'}€` : 'Gage'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[g.bot, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity testID="cf-create" onPress={handleCreate} disabled={creating || !title.trim()} activeOpacity={0.85}>
          <LinearGradient
            colors={title.trim() ? ['#007AFF', '#AF52DE'] : ['#1C1C2E', '#1C1C2E']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={g.cta}
          >
            {creating ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Ionicons name="flash" size={20} color="#FFF" />
                <Text style={[g.ctaT, !title.trim() && { color: '#555' }]}>Envoyer le defi</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const GL = { backgroundColor: 'rgba(20,20,38,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' };

const g = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0C0C18' },
  bgImg: { position: 'absolute', top: 0, left: 0, right: 0, height: 400, width: '100%' } as any,
  bgOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: { width: 42, height: 42, borderRadius: 21, ...GL, justifyContent: 'center', alignItems: 'center' },
  headerT: { fontSize: 22, fontWeight: '900', color: '#FFF' },
  bot: { paddingHorizontal: 16, paddingTop: 12 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, gap: 10 },
  ctaT: { fontSize: 17, fontWeight: '800', color: '#FFF' },
});

const s = StyleSheet.create({
  targetCard: { flexDirection: 'row', alignItems: 'center', gap: 14, ...GL, borderRadius: 18, padding: 16, marginBottom: 24, borderColor: COLORS.primary + '30' },
  targetName: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  targetSub: { fontSize: 12, fontWeight: '600', color: COLORS.primary, marginTop: 2 },
  label: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  input: { ...GL, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontWeight: '600', color: '#FFF', marginBottom: 20 },
  catRow: { gap: 8, paddingBottom: 20 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, ...GL, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  catT: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  durRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  durChip: { flex: 1, ...GL, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  durChipSel: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  durT: { fontSize: 16, fontWeight: '800', color: COLORS.textMuted },
  stakeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  stakeChip: { flex: 1, ...GL, borderRadius: 14, paddingVertical: 14, alignItems: 'center', gap: 6 },
  stakeT: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  moneyW: { flexDirection: 'row', alignItems: 'center', ...GL, borderRadius: 14, padding: 14, gap: 8, marginBottom: 20, borderColor: '#FFD700' + '40' },
  euroSign: { fontSize: 24, fontWeight: '900', color: '#FFD700' },
  moneyInput: { fontSize: 28, fontWeight: '900', color: '#FFF', minWidth: 60 },
  moneyLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  summary: { ...GL, borderRadius: 18, padding: 18, gap: 14 },
  sumRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sumLbl: { flex: 1, fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.4)' },
  sumVal: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
