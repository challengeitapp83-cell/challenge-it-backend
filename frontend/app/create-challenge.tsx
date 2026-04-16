import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Platform, KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../contexts/api';
import { COLORS, SPACING, RADIUS, CATEGORIES } from '../contexts/theme';

const CATEGORY_LIST = ['Sport', 'Santé', 'Habitudes', 'Business', 'Autre'];
const DURATIONS = [7, 14, 21, 30, 60, 90];

export default function CreateChallengeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Sport');
  const [duration, setDuration] = useState(30);
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre est requis');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Erreur', 'La description est requise');
      return;
    }
    setSubmitting(true);
    try {
      const challenge = await api.post('/api/challenges', {
        title: title.trim(),
        description: description.trim(),
        category,
        duration_days: duration,
        is_public: isPublic,
      });
      Alert.alert('Défi créé !', 'Votre défi a été publié', [
        { text: 'Voir', onPress: () => router.push(`/challenge/${challenge.challenge_id}`) },
      ]);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de créer le défi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Créer un défi</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Title */}
          <Text style={styles.label}>Titre</Text>
          <TextInput
            testID="challenge-title-input"
            style={styles.input}
            placeholder="Ex : 30 jours de course"
            placeholderTextColor={COLORS.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={60}
          />

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            testID="challenge-description-input"
            style={[styles.input, styles.textArea]}
            placeholder="Décrivez le défi..."
            placeholderTextColor={COLORS.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={500}
          />

          {/* Category */}
          <Text style={styles.label}>Catégorie</Text>
          <View style={styles.chipRow}>
            {CATEGORY_LIST.map((cat) => {
              const config = CATEGORIES[cat];
              const isActive = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  testID={`cat-${cat}`}
                  onPress={() => setCategory(cat)}
                  style={[styles.chip, isActive && { borderColor: config.color, backgroundColor: config.color + '15' }]}
                >
                  <Ionicons name={config.icon as any} size={16} color={isActive ? config.color : COLORS.textMuted} />
                  <Text style={[styles.chipText, isActive && { color: config.color }]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Duration */}
          <Text style={styles.label}>Durée (jours)</Text>
          <View style={styles.chipRow}>
            {DURATIONS.map((d) => {
              const isActive = duration === d;
              return (
                <TouchableOpacity
                  key={d}
                  testID={`duration-${d}`}
                  onPress={() => setDuration(d)}
                  style={[styles.durationChip, isActive && styles.durationChipActive]}
                >
                  <Text style={[styles.durationText, isActive && styles.durationTextActive]}>{d}j</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Public/Private */}
          <Text style={styles.label}>Visibilité</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              testID="visibility-public"
              onPress={() => setIsPublic(true)}
              style={[styles.toggleBtn, isPublic && styles.toggleActive]}
            >
              <Ionicons name="earth" size={18} color={isPublic ? COLORS.primary : COLORS.textMuted} />
              <Text style={[styles.toggleText, isPublic && styles.toggleTextActive]}>Public</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="visibility-private"
              onPress={() => setIsPublic(false)}
              style={[styles.toggleBtn, !isPublic && styles.toggleActive]}
            >
              <Ionicons name="lock-closed" size={18} color={!isPublic ? COLORS.primary : COLORS.textMuted} />
              <Text style={[styles.toggleText, !isPublic && styles.toggleTextActive]}>Privé</Text>
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity
            testID="create-challenge-submit-btn"
            onPress={handleCreate}
            disabled={submitting}
            activeOpacity={0.8}
            style={styles.submitWrapper}
          >
            <LinearGradient
              colors={['#007AFF', '#9D4CDD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={22} color="#FFF" />
                  <Text style={styles.submitText}>Créer le défi</Text>
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  label: {
    fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase',
    letterSpacing: 0.5, paddingHorizontal: SPACING.lg, marginTop: SPACING.lg, marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md,
    marginHorizontal: SPACING.lg, color: COLORS.textPrimary, fontSize: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  chipRow: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.lg, gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill, backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border,
  },
  chipText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  durationChip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill, backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border,
  },
  durationChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' },
  durationText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  durationTextActive: { color: COLORS.primary },
  toggleRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.md, borderRadius: RADIUS.md,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
  },
  toggleActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' },
  toggleText: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  toggleTextActive: { color: COLORS.primary },
  submitWrapper: { marginHorizontal: SPACING.lg, borderRadius: RADIUS.md, overflow: 'hidden', marginTop: SPACING.xl },
  submitGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, gap: SPACING.sm,
  },
  submitText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
