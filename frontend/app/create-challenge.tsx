import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Platform, KeyboardAvoidingView, ActivityIndicator, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../contexts/api';
import { COLORS, SPACING, RADIUS, CATEGORIES } from '../contexts/theme';

const CATEGORY_LIST = ['Sport', 'Santé', 'Habitudes', 'Business', 'Autre'];
const DURATIONS = [7, 14, 21, 30, 60, 90];
const POT_AMOUNTS = [5, 10, 20, 50, 100];

export default function CreateChallengeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Sport');
  const [duration, setDuration] = useState(30);
  const [challengeType, setChallengeType] = useState<'community' | 'friends'>('community');
  const [hasPot, setHasPot] = useState(false);
  const [potAmount, setPotAmount] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) { Alert.alert('Erreur', 'Le titre est requis'); return; }
    if (!description.trim()) { Alert.alert('Erreur', 'La description est requise'); return; }
    setSubmitting(true);
    try {
      const challenge = await api.post('/api/challenges', {
        title: title.trim(),
        description: description.trim(),
        category,
        duration_days: duration,
        challenge_type: challengeType,
        has_pot: hasPot,
        pot_amount_per_person: hasPot ? potAmount : 0,
      });

      if (challengeType === 'friends' && challenge.invite_code) {
        Alert.alert(
          'Défi créé !',
          `Code d'invitation : ${challenge.invite_code}\n\nPartagez-le avec vos amis !`,
          [
            { text: 'Partager', onPress: () => shareInvite(challenge.invite_code, challenge.title) },
            { text: 'Voir', onPress: () => router.push(`/challenge/${challenge.challenge_id}`) },
          ]
        );
      } else {
        Alert.alert('Défi créé !', 'Votre défi est maintenant disponible', [
          { text: 'Voir', onPress: () => router.push(`/challenge/${challenge.challenge_id}`) },
        ]);
      }
    } catch (e) { Alert.alert('Erreur', 'Impossible de créer le défi'); }
    finally { setSubmitting(false); }
  };

  const shareInvite = async (code: string, challengeTitle: string) => {
    try {
      await Share.share({
        message: `Rejoins mon défi "${challengeTitle}" sur Challenge It !\n\nCode : ${code}`,
      });
    } catch {}
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Créer un défi</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* ===== TYPE SELECTOR ===== */}
          <Text style={styles.label}>Type de défi</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity testID="type-community" onPress={() => setChallengeType('community')}
              style={[styles.typeCard, challengeType === 'community' && styles.typeCardActive]}>
              <View style={[styles.typeIconWrap, { backgroundColor: challengeType === 'community' ? COLORS.primary + '20' : COLORS.card }]}>
                <Ionicons name="earth" size={24} color={challengeType === 'community' ? COLORS.primary : COLORS.textMuted} />
              </View>
              <Text style={[styles.typeName, challengeType === 'community' && { color: COLORS.primary }]}>Communauté</Text>
              <Text style={styles.typeDesc}>Ouvert à tous</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="type-friends" onPress={() => setChallengeType('friends')}
              style={[styles.typeCard, challengeType === 'friends' && styles.typeCardFriends]}>
              <View style={[styles.typeIconWrap, { backgroundColor: challengeType === 'friends' ? COLORS.secondary + '20' : COLORS.card }]}>
                <Ionicons name="people" size={24} color={challengeType === 'friends' ? COLORS.secondary : COLORS.textMuted} />
              </View>
              <Text style={[styles.typeName, challengeType === 'friends' && { color: COLORS.secondary }]}>Entre Amis</Text>
              <Text style={styles.typeDesc}>Sur invitation</Text>
            </TouchableOpacity>
          </View>

          {challengeType === 'friends' && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={18} color={COLORS.secondary} />
              <Text style={styles.infoText}>
                Un code d'invitation sera généré. Partagez-le avec vos amis !
              </Text>
            </View>
          )}

          {/* ===== TITLE ===== */}
          <Text style={styles.label}>Titre</Text>
          <TextInput testID="challenge-title-input" style={styles.input} placeholder="Ex : 30 jours de course"
            placeholderTextColor={COLORS.textMuted} value={title} onChangeText={setTitle} maxLength={60} />

          {/* ===== DESCRIPTION ===== */}
          <Text style={styles.label}>Description</Text>
          <TextInput testID="challenge-description-input" style={[styles.input, styles.textArea]} placeholder="Décrivez le défi..."
            placeholderTextColor={COLORS.textMuted} value={description} onChangeText={setDescription} multiline maxLength={500} />

          {/* ===== CATEGORY ===== */}
          <Text style={styles.label}>Catégorie</Text>
          <View style={styles.chipRow}>
            {CATEGORY_LIST.map((cat) => {
              const cfg = CATEGORIES[cat];
              const active = category === cat;
              return (
                <TouchableOpacity key={cat} testID={`cat-${cat}`} onPress={() => setCategory(cat)}
                  style={[styles.chip, active && { borderColor: cfg.color, backgroundColor: cfg.color + '15' }]}>
                  <Ionicons name={cfg.icon as any} size={16} color={active ? cfg.color : COLORS.textMuted} />
                  <Text style={[styles.chipText, active && { color: cfg.color }]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ===== DURATION ===== */}
          <Text style={styles.label}>Durée (jours)</Text>
          <View style={styles.chipRow}>
            {DURATIONS.map((d) => (
              <TouchableOpacity key={d} testID={`duration-${d}`} onPress={() => setDuration(d)}
                style={[styles.durChip, duration === d && styles.durChipActive]}>
                <Text style={[styles.durText, duration === d && styles.durTextActive]}>{d}j</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ===== CAGNOTTE (POT) ===== */}
          <Text style={styles.label}>Cagnotte</Text>
          <TouchableOpacity testID="toggle-pot" onPress={() => setHasPot(!hasPot)} style={styles.potToggle}>
            <View style={styles.potToggleLeft}>
              <Ionicons name="cash" size={22} color={hasPot ? COLORS.warning : COLORS.textMuted} />
              <View>
                <Text style={styles.potToggleTitle}>Ajouter une cagnotte</Text>
                <Text style={styles.potToggleDesc}>Les participants misent un montant</Text>
              </View>
            </View>
            <View style={[styles.toggleSwitch, hasPot && styles.toggleSwitchOn]}>
              <View style={[styles.toggleDot, hasPot && styles.toggleDotOn]} />
            </View>
          </TouchableOpacity>

          {hasPot && (
            <View style={styles.potSection}>
              <Text style={styles.potLabel}>Mise par personne</Text>
              <View style={styles.chipRow}>
                {POT_AMOUNTS.map((a) => (
                  <TouchableOpacity key={a} testID={`pot-${a}`} onPress={() => setPotAmount(a)}
                    style={[styles.potChip, potAmount === a && styles.potChipActive]}>
                    <Text style={[styles.potChipText, potAmount === a && styles.potChipTextActive]}>{a}€</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.potInfo}>
                <Ionicons name="trophy" size={16} color={COLORS.warning} />
                <Text style={styles.potInfoText}>
                  Le gagnant remporte la cagnotte totale à la fin du défi
                </Text>
              </View>
            </View>
          )}

          {/* ===== SUBMIT ===== */}
          <TouchableOpacity testID="create-challenge-submit-btn" onPress={handleCreate} disabled={submitting}
            activeOpacity={0.8} style={styles.submitWrap}>
            <LinearGradient
              colors={challengeType === 'friends' ? [COLORS.secondary, '#7C3AED'] : ['#007AFF', '#9D4CDD']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGrad}>
              {submitting ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <Ionicons name={challengeType === 'friends' ? 'people' : 'add-circle'} size={22} color="#FFF" />
                  <Text style={styles.submitText}>
                    {challengeType === 'friends' ? 'Créer le défi entre amis' : 'Créer le défi'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 20, marginTop: 20, marginBottom: 10 },
  // Type selector
  typeRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12 },
  typeCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 16, alignItems: 'center', gap: 8, borderWidth: 2, borderColor: COLORS.border },
  typeCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '08' },
  typeCardFriends: { borderColor: COLORS.secondary, backgroundColor: COLORS.secondary + '08' },
  typeIconWrap: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  typeName: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  typeDesc: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginTop: 12, backgroundColor: COLORS.secondary + '10', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.secondary + '20' },
  infoText: { flex: 1, fontSize: 13, fontWeight: '500', color: COLORS.secondary },
  // Inputs
  input: { backgroundColor: COLORS.card, borderRadius: 14, padding: 16, marginHorizontal: 20, color: '#FFF', fontSize: 16, borderWidth: 1, borderColor: COLORS.border },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  chipText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  durChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  durChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' },
  durText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  durTextActive: { color: COLORS.primary },
  // Pot
  potToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, backgroundColor: COLORS.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  potToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  potToggleTitle: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  potToggleDesc: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  toggleSwitch: { width: 48, height: 28, borderRadius: 14, backgroundColor: '#333', justifyContent: 'center', paddingHorizontal: 3 },
  toggleSwitchOn: { backgroundColor: COLORS.warning },
  toggleDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#666' },
  toggleDotOn: { backgroundColor: '#FFF', alignSelf: 'flex-end' },
  potSection: { marginHorizontal: 20, marginTop: 12, gap: 12 },
  potLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  potChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  potChipActive: { borderColor: COLORS.warning, backgroundColor: COLORS.warning + '15' },
  potChipText: { fontSize: 15, fontWeight: '700', color: COLORS.textSecondary },
  potChipTextActive: { color: COLORS.warning },
  potInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.warning + '10', borderRadius: 12, padding: 12 },
  potInfoText: { flex: 1, fontSize: 13, fontWeight: '500', color: COLORS.warning },
  // Submit
  submitWrap: { marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', marginTop: 24 },
  submitGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  submitText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
});
