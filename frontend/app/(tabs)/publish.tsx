import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Image, ActivityIndicator, Alert, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { useRouter } from 'expo-router';
import { api } from '../../contexts/api';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING, CATEGORIES } from '../../contexts/theme';

const CLOUD = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD || 'ton_cloud_name';
const PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_PRESET || 'challengeit_upload';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD}/auto/upload`;
const PUBLISH_BG = 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=900&h=1200&fit=crop&q=75';

export default function PublishScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [myChallenges, setMyChallenges] = useState<any[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => { fetchMyChallenges(); }, []);

  const fetchMyChallenges = async () => {
    try {
      const data = await api.get('/api/my-challenges');
      setMyChallenges(data);
      if (data.length > 0) setSelectedChallenge(data[0].challenge_id);
    } catch {} finally { setLoading(false); }
  };

  const pickMedia = async (source: 'camera' | 'library') => {
    const permFn = source === 'camera'
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;
    const { status } = await permFn();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Autorise l\'acces pour continuer.');
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images', 'videos'],
      allowsEditing: Platform.OS === 'ios',
      quality: 0.8,
      videoMaxDuration: 30,
    };

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const isVideo = asset.type === 'video';

    setMediaUri(asset.uri);
    setMediaType(isVideo ? 'video' : 'image');
    setCloudinaryUrl(null);
    setUploadError(null);

    // Upload to Cloudinary
    await uploadToCloudinary(asset.uri, isVideo);
  };

  const uploadToCloudinary = async (uri: string, isVideo: boolean) => {
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || (isVideo ? 'video.mp4' : 'photo.jpg');
      const ext = filename.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg');

      let mimeType = 'image/jpeg';
      if (isVideo) {
        mimeType = ext === 'mov' ? 'video/quicktime' : ext === 'webm' ? 'video/webm' : 'video/mp4';
      } else {
        mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      }

      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename,
        type: mimeType,
      } as any);
      formData.append('upload_preset', PRESET);
      formData.append('folder', 'challengeit');

      // Simulate progress
      const progressTimer = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 8, 85));
      }, 400);

      const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressTimer);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `Upload echoue (${response.status})`);
      }

      const data = await response.json();
      setCloudinaryUrl(data.secure_url);
      setUploadProgress(100);
    } catch (e: any) {
      console.error('Cloudinary upload error:', e);
      setUploadError(e.message || 'Echec de l\'envoi');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const clearMedia = () => {
    setMediaUri(null);
    setMediaType(null);
    setCloudinaryUrl(null);
    setUploadProgress(0);
    setUploadError(null);
  };

  const retryUpload = () => {
    if (mediaUri && mediaType) {
      uploadToCloudinary(mediaUri, mediaType === 'video');
    }
  };

  const handleSubmit = async () => {
    if (!selectedChallenge) { Alert.alert('Erreur', 'Selectionne un defi'); return; }
    if (!text.trim()) { Alert.alert('Erreur', 'Ajoute une description'); return; }

    setSubmitting(true);
    try {
      const proofData: any = {
        challenge_id: selectedChallenge,
        text: text.trim(),
        media_type: mediaType || 'text',
      };

      if (cloudinaryUrl) {
        proofData.image = cloudinaryUrl;
        proofData.media_type = mediaType || 'image';
      }

      await api.post('/api/proofs', proofData);
      await refreshUser();
      Alert.alert('Preuve envoyee !', 'Visible par les participants du defi', [
        { text: 'OK', onPress: () => router.push('/(tabs)') },
      ]);
      setText('');
      clearMedia();
    } catch (e: any) {
      const msg = e.message?.includes('already submitted')
        ? 'Preuve deja soumise aujourd\'hui'
        : 'Erreur lors de la publication';
      Alert.alert('Erreur', msg);
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <View style={[g.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 100 }} />
      </View>
    );
  }

  const canSubmit = text.trim() && !uploading && !submitting && (!mediaUri || cloudinaryUrl);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={g.container}>
        <Image source={{ uri: PUBLISH_BG }} style={g.bgImg} blurRadius={1} />
        <LinearGradient
          colors={['rgba(0,120,255,0.3)', 'rgba(180,0,255,0.25)', 'rgba(15,15,25,0.72)', COLORS.background]}
          locations={[0, 0.15, 0.48, 0.68]}
          style={g.bgOverlay}
        />
        <View style={{ paddingTop: insets.top }}>
          <View style={g.header}>
            <Text style={g.title}>Publier une preuve</Text>
            <Text style={g.sub}>Photo ou video · 30s max</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          {myChallenges.length === 0 ? (
            <View style={g.empty}>
              <Ionicons name="flag" size={48} color={COLORS.textMuted} />
              <Text style={g.emptyT}>Aucun defi actif</Text>
              <Text style={g.emptySub}>Rejoins un defi pour publier</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/challenges')} style={g.emptyBtn}>
                <Text style={g.emptyBtnT}>Decouvrir les defis</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Challenge Selector */}
              <Text style={g.label}>Choisir le defi</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.challengeRow}>
                {myChallenges.map((uc: any) => {
                  const ch = uc.challenge;
                  const isSel = selectedChallenge === uc.challenge_id;
                  const cat = CATEGORIES[ch?.category] || CATEGORIES['Autre'];
                  return (
                    <TouchableOpacity key={uc.user_challenge_id}
                      onPress={() => setSelectedChallenge(uc.challenge_id)}
                      style={[s.chip, isSel && { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' }]}>
                      <Ionicons name={cat.icon as any} size={16} color={isSel ? COLORS.primary : COLORS.textMuted} />
                      <Text style={[s.chipT, isSel && { color: COLORS.primary }]} numberOfLines={1}>{ch?.title}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Media */}
              <Text style={g.label}>Preuve (photo ou video)</Text>
              {mediaUri ? (
                <View style={s.preview}>
                  {mediaType === 'video' ? (
                    <Video
                      source={{ uri: mediaUri }}
                      style={s.previewMedia}
                      useNativeControls
                      resizeMode={ResizeMode.COVER}
                      isLooping={false}
                      shouldPlay={false}
                    />
                  ) : (
                    <Image source={{ uri: mediaUri }} style={s.previewMedia} />
                  )}

                  {/* Type badge */}
                  <View style={s.typeBadge}>
                    <Ionicons name={mediaType === 'video' ? 'videocam' : 'image'} size={14} color="#FFF" />
                    <Text style={s.typeT}>{mediaType === 'video' ? 'Video' : 'Photo'}</Text>
                  </View>

                  {/* Remove */}
                  <TouchableOpacity onPress={clearMedia} style={s.removeBtn}>
                    <Ionicons name="close-circle" size={32} color="#FF3B30" />
                  </TouchableOpacity>

                  {/* Upload progress */}
                  {uploading && (
                    <View style={s.progressOverlay}>
                      <ActivityIndicator size="small" color="#FFF" />
                      <View style={s.progressW}>
                        <View style={[s.progressBar, { width: `${uploadProgress}%` as any }]} />
                      </View>
                      <Text style={s.progressT}>Upload vers Cloudinary {uploadProgress}%</Text>
                    </View>
                  )}

                  {/* Upload success */}
                  {cloudinaryUrl && !uploading && (
                    <View style={s.successOverlay}>
                      <Ionicons name="checkmark-circle" size={18} color="#34C759" />
                      <Text style={s.successT}>Pret a publier</Text>
                    </View>
                  )}

                  {/* Upload error */}
                  {uploadError && !uploading && (
                    <View style={s.errorOverlay}>
                      <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                      <Text style={s.errorT}>{uploadError}</Text>
                      <TouchableOpacity onPress={retryUpload} style={s.retryBtn}>
                        <Text style={s.retryT}>Reessayer</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : (
                <View style={s.mediaActions}>
                  <TouchableOpacity onPress={() => pickMedia('camera')} style={s.mediaBtn}>
                    <View style={s.mediaBtnIcon}>
                      <Ionicons name="camera" size={28} color={COLORS.primary} />
                    </View>
                    <Text style={s.mediaBtnT}>Camera</Text>
                    <Text style={s.mediaBtnSub}>Photo ou video</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => pickMedia('library')} style={s.mediaBtn}>
                    <View style={[s.mediaBtnIcon, { backgroundColor: COLORS.secondary + '15' }]}>
                      <Ionicons name="images" size={28} color={COLORS.secondary} />
                    </View>
                    <Text style={s.mediaBtnT}>Galerie</Text>
                    <Text style={s.mediaBtnSub}>Photo ou video</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Description */}
              <Text style={g.label}>Description</Text>
              <TextInput style={s.input}
                placeholder="Decris ta progression..." placeholderTextColor={COLORS.textMuted}
                value={text} onChangeText={setText} multiline maxLength={280} />
              <Text style={s.charCount}>{text.length}/280</Text>

              {/* Info */}
              <View style={s.infoCard}>
                <Ionicons name="eye" size={16} color={COLORS.primary} />
                <Text style={s.infoT}>Preuve visible par les participants du defi</Text>
              </View>

              {/* Submit */}
              <TouchableOpacity onPress={handleSubmit} disabled={!canSubmit} activeOpacity={0.8} style={s.submitW}>
                <LinearGradient
                  colors={canSubmit ? ['#007AFF', '#9D4CDD'] : ['#333', '#333']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.submitGrad}>
                  {submitting ? <ActivityIndicator color="#FFF" /> : (
                    <>
                      <Ionicons name="checkmark-circle" size={22} color={canSubmit ? '#FFF' : '#555'} />
                      <Text style={[s.submitT, !canSubmit && { color: '#555' }]}>Publier la preuve</Text>
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

const GL = { backgroundColor: 'rgba(25,30,60,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' };

const g = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  bgImg: { position: 'absolute', top: 0, left: 0, right: 0, height: 500, width: '100%' },
  bgOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 500 },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.xs },
  title: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  sub: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: SPACING.lg, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  empty: { alignItems: 'center', paddingTop: 60, gap: SPACING.md, paddingHorizontal: SPACING.lg },
  emptyT: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  emptySub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  emptyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: 999, marginTop: SPACING.sm },
  emptyBtnT: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});

const s = StyleSheet.create({
  challengeRow: { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, ...GL, marginRight: 8 },
  chipT: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted, maxWidth: 140 },
  mediaActions: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  mediaBtn: { flex: 1, ...GL, borderRadius: 18, paddingVertical: 24, alignItems: 'center', gap: 8 },
  mediaBtnIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
  mediaBtnT: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  mediaBtnSub: { fontSize: 11, fontWeight: '500', color: COLORS.textMuted },
  preview: { marginHorizontal: SPACING.lg, borderRadius: 18, overflow: 'hidden', position: 'relative', backgroundColor: '#000' },
  previewMedia: { width: '100%', height: 260, borderRadius: 18 },
  removeBtn: { position: 'absolute', top: 10, right: 10, zIndex: 10 },
  typeBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  typeT: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  progressOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', gap: 8 },
  progressW: { height: 4, width: '100%', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#007AFF', borderRadius: 2 },
  progressT: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  successOverlay: { position: 'absolute', bottom: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  successT: { fontSize: 13, fontWeight: '700', color: '#34C759' },
  errorOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, backgroundColor: 'rgba(60,0,0,0.9)', flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  errorT: { fontSize: 13, fontWeight: '600', color: '#FF3B30', flex: 1 },
  retryBtn: { backgroundColor: '#FF3B30', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  retryT: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  input: { ...GL, borderRadius: 16, padding: 16, marginHorizontal: SPACING.lg, color: '#FFF', fontSize: 16, minHeight: 90, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right', paddingHorizontal: SPACING.lg, marginTop: 4 },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: SPACING.lg, marginTop: 14, backgroundColor: COLORS.primary + '08', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.primary + '20' },
  infoT: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  submitW: { marginHorizontal: SPACING.lg, borderRadius: 16, overflow: 'hidden', marginTop: SPACING.lg },
  submitGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  submitT: { fontSize: 17, fontWeight: '800', color: '#FFF' },
});
