import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Image, ActivityIndicator, Alert, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { api } from '../../contexts/api';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING, RADIUS, CATEGORIES } from '../../contexts/theme';

export default function PublishScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [myChallenges, setMyChallenges] = useState<any[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMyChallenges();
  }, []);

  const fetchMyChallenges = async () => {
    try {
      const data = await api.get('/api/my-challenges');
      setMyChallenges(data);
      if (data.length > 0) {
        setSelectedChallenge(data[0].challenge_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission nécessaire', 'Nous avons besoin d\'accéder à vos photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const base64 = result.assets[0].base64;
      if (base64) {
        setImage(`data:image/jpeg;base64,${base64}`);
      }
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission nécessaire', 'Nous avons besoin d\'accéder à la caméra.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const base64 = result.assets[0].base64;
      if (base64) {
        setImage(`data:image/jpeg;base64,${base64}`);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedChallenge) {
      Alert.alert('Erreur', 'Sélectionnez un défi');
      return;
    }
    if (!text.trim()) {
      Alert.alert('Erreur', 'Ajoutez une description');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/proofs', {
        challenge_id: selectedChallenge,
        text: text.trim(),
        image: image,
      });
      await refreshUser();
      Alert.alert('Bravo !', 'Votre preuve a été publiée !', [
        { text: 'OK', onPress: () => router.push('/(tabs)') },
      ]);
      setText('');
      setImage(null);
    } catch (e: any) {
      const msg = e.message?.includes('already submitted')
        ? 'Vous avez déjà soumis une preuve aujourd\'hui pour ce défi'
        : 'Erreur lors de la publication';
      Alert.alert('Erreur', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Publier une preuve</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {myChallenges.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="flag" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Aucun défi actif</Text>
              <Text style={styles.emptyText}>Rejoignez un défi pour publier des preuves</Text>
              <TouchableOpacity
                testID="go-challenges-btn"
                onPress={() => router.push('/(tabs)/challenges')}
                style={styles.emptyBtn}
              >
                <Text style={styles.emptyBtnText}>Découvrir les défis</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Challenge Selector */}
              <Text style={styles.label}>Choisir le défi</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.challengeSelector}>
                {myChallenges.map((uc: any) => {
                  const ch = uc.challenge;
                  const isSelected = selectedChallenge === uc.challenge_id;
                  const catConfig = CATEGORIES[ch?.category] || CATEGORIES['Autre'];
                  return (
                    <TouchableOpacity
                      key={uc.user_challenge_id}
                      testID={`select-challenge-${uc.challenge_id}`}
                      onPress={() => setSelectedChallenge(uc.challenge_id)}
                      style={[styles.challengeChip, isSelected && { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' }]}
                    >
                      <Ionicons name={catConfig.icon as any} size={16} color={isSelected ? COLORS.primary : COLORS.textMuted} />
                      <Text style={[styles.chipText, isSelected && { color: COLORS.primary }]} numberOfLines={1}>
                        {ch?.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Image Section */}
              <Text style={styles.label}>Photo</Text>
              {image ? (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: image }} style={styles.previewImg} />
                  <TouchableOpacity
                    testID="remove-image-btn"
                    onPress={() => setImage(null)}
                    style={styles.removeImg}
                  >
                    <Ionicons name="close-circle" size={28} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imageActions}>
                  <TouchableOpacity testID="take-photo-btn" onPress={takePhoto} style={styles.imageBtn}>
                    <Ionicons name="camera" size={28} color={COLORS.primary} />
                    <Text style={styles.imageBtnText}>Prendre une photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity testID="pick-image-btn" onPress={pickImage} style={styles.imageBtn}>
                    <Ionicons name="images" size={28} color={COLORS.secondary} />
                    <Text style={styles.imageBtnText}>Galerie</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Text Input */}
              <Text style={styles.label}>Description</Text>
              <TextInput
                testID="proof-text-input"
                style={styles.textInput}
                placeholder="Décrivez votre progression..."
                placeholderTextColor={COLORS.textMuted}
                value={text}
                onChangeText={setText}
                multiline
                maxLength={280}
              />
              <Text style={styles.charCount}>{text.length}/280</Text>

              {/* Submit */}
              <TouchableOpacity
                testID="submit-proof-btn"
                onPress={handleSubmit}
                disabled={submitting || !text.trim()}
                activeOpacity={0.8}
                style={styles.submitWrapper}
              >
                <LinearGradient
                  colors={text.trim() ? ['#007AFF', '#9D4CDD'] : ['#333', '#333']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                      <Text style={styles.submitText}>Publier la preuve</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm,
  },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  label: {
    fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase',
    letterSpacing: 0.5, paddingHorizontal: SPACING.lg, marginTop: SPACING.lg, marginBottom: SPACING.sm,
  },
  challengeSelector: { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  challengeChip: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill, backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border, marginRight: SPACING.sm,
  },
  chipText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, maxWidth: 140 },
  imageActions: {
    flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm,
  },
  imageBtn: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    paddingVertical: SPACING.xl, alignItems: 'center', gap: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed',
  },
  imageBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  imagePreview: {
    marginHorizontal: SPACING.lg, borderRadius: RADIUS.md, overflow: 'hidden',
    position: 'relative',
  },
  previewImg: { width: '100%', height: 200, borderRadius: RADIUS.md },
  removeImg: { position: 'absolute', top: 8, right: 8 },
  textInput: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md,
    marginHorizontal: SPACING.lg, color: COLORS.textPrimary, fontSize: 16,
    minHeight: 100, textAlignVertical: 'top',
    borderWidth: 1, borderColor: COLORS.border,
  },
  charCount: {
    fontSize: 12, color: COLORS.textMuted, textAlign: 'right',
    paddingHorizontal: SPACING.lg, marginTop: SPACING.xs,
  },
  submitWrapper: { marginHorizontal: SPACING.lg, borderRadius: RADIUS.md, overflow: 'hidden', marginTop: SPACING.lg },
  submitGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, gap: SPACING.sm,
  },
  submitText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  empty: { alignItems: 'center', paddingTop: 60, gap: SPACING.md, paddingHorizontal: SPACING.lg },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  emptyBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm, borderRadius: RADIUS.pill, marginTop: SPACING.sm,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
