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
import { COLORS, SPACING, RADIUS, CATEGORIES } from '../../contexts/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const PUBLISH_BG = 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=900&h=1200&fit=crop&q=75';

export default function PublishScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const videoRef = useRef<any>(null);
  const [myChallenges, setMyChallenges] = useState<any[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [mediaBase64, setMediaBase64] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchMyChallenges(); }, []);

  const fetchMyChallenges = async () => {
    try {
      const data = await api.get('/api/my-challenges');
      setMyChallenges(data);
      if (data.length > 0) setSelectedChallenge(data[0].challenge_id);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const pickMedia = async (source: 'camera' | 'library') => {
    const permFn = source === 'camera'
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;
    const { status } = await permFn();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Autorisez l\'acces pour continuer.');
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images', 'videos'],
      allowsEditing: Platform.OS === 'ios',
      quality: 0.7,
      base64: true,
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
    setUploadedUrl(null);

    if (isVideo) {
      // Upload video file to server
      await uploadVideoFile(asset.uri);
    } else {
      // Use base64 for images
      if (asset.base64) {
        setMediaBase64(`data:image/jpeg;base64,${asset.base64}`);
      }
    }
  };

  const uploadVideoFile = async (uri: string) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const token = await (await import('@react-native-async-storage/async-storage')).default.getItem('session_token');
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'video.mp4';
      const ext = filename.split('.').pop()?.toLowerCase() || 'mp4';
      const mimeType = ext === 'mov' ? 'video/quicktime' : ext === 'webm' ? 'video/webm' : 'video/mp4';

      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename,
        type: mimeType,
      } as any);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      const response = await fetch(`${API_URL}/api/upload-media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();
      setUploadedUrl(data.media_url);
      setUploadProgress(100);
    } catch (e: any) {
      Alert.alert('Erreur upload', e.message || 'Impossible d\'envoyer la video');
      clearMedia();
    } finally {
      setUploading(false);
    }
  };

  const clearMedia = () => {
    setMediaUri(null);
    setMediaType(null);
    setMediaBase64(null);
    setUploadedUrl(null);
    setUploadProgress(0);
  };

  const handleSubmit = async () => {
    if (!selectedChallenge) { Alert.alert('Erreur', 'Selectionnez un defi'); return; }
    if (!text.trim()) { Alert.alert('Erreur', 'Ajoutez une description'); return; }

    setSubmitting(true);
    try {
      const proofData: any = {
        challenge_id: selectedChallenge,
        text: text.trim(),
        media_type: mediaType || 'text',
      };

      if (mediaType === 'video' && uploadedUrl) {
        proofData.image = uploadedUrl;
        proofData.media_type = 'video';
      } else if (mediaType === 'image' && mediaBase64) {
        proofData.image = mediaBase64;
        proofData.media_type = 'image';
      }

      await api.post('/api/proofs', proofData);
      await refreshUser();
      Alert.alert('Preuve envoyee !', 'Visible par les participants du defi', [
        { text: 'OK', onPress: () => { router.push('/(tabs)'); } },
      ]);
      setText('');
      clearMedia();
    } catch (e: any) {
      const msg = e.message?.includes('already submitted')
        ? 'Preuve deja soumise aujourd\'hui pour ce defi'
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

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[g.container]}>
        {/* Immersive Background */}
        <Image source={{ uri: PUBLISH_BG }} style={g.bgImg} blurRadius={3} />
        <LinearGradient
          colors={['rgba(0,80,200,0.15)', 'rgba(120,0,200,0.12)', 'rgba(15,15,15,0.92)', COLORS.background]}
          locations={[0, 0.12, 0.38, 0.52]}
          style={g.bgOverlay}
        />
        <View style={{ paddingTop: insets.top }}>
        <View style={g.header}>
          <Text style={g.title}>Publier une preuve</Text>
          <Text style={g.sub}>Photo ou video - 30s max</Text>
        </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {myChallenges.length === 0 ? (
            <View style={g.empty}>
              <Ionicons name="flag" size={48} color={COLORS.textMuted} />
              <Text style={g.emptyT}>Aucun defi actif</Text>
              <Text style={g.emptySub}>Rejoignez un defi pour publier des preuves</Text>
              <TouchableOpacity testID="go-challenges-btn" onPress={() => router.push('/(tabs)/challenges')} style={g.emptyBtn}>
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
                    <TouchableOpacity key={uc.user_challenge_id} testID={`sel-ch-${uc.challenge_id}`}
                      onPress={() => setSelectedChallenge(uc.challenge_id)}
                      style={[s.chip, isSel && { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' }]}>
                      <Ionicons name={cat.icon as any} size={16} color={isSel ? COLORS.primary : COLORS.textMuted} />
                      <Text style={[s.chipT, isSel && { color: COLORS.primary }]} numberOfLines={1}>{ch?.title}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Media Section */}
              <Text style={g.label}>Preuve (photo ou video)</Text>
              {mediaUri ? (
                <View style={s.preview}>
                  {mediaType === 'video' ? (
                    <Video
                      ref={videoRef}
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

                  {/* Upload progress for video */}
                  {uploading && (
                    <View style={s.progressOverlay}>
                      <View style={s.progressW}>
                        <View style={[s.progressBar, { width: `${uploadProgress}%` as any }]} />
                      </View>
                      <Text style={s.progressT}>Upload {uploadProgress}%</Text>
                    </View>
                  )}

                  {/* Media type badge */}
                  <View style={s.typeBadge}>
                    <Ionicons name={mediaType === 'video' ? 'videocam' : 'image'} size={14} color="#FFF" />
                    <Text style={s.typeT}>{mediaType === 'video' ? 'Video' : 'Photo'}</Text>
                  </View>

                  {/* Remove button */}
                  <TouchableOpacity testID="remove-media" onPress={clearMedia} style={s.removeBtn}>
                    <Ionicons name="close-circle" size={32} color="#FF3B30" />
                  </TouchableOpacity>

                  {uploadedUrl && mediaType === 'video' && (
                    <View style={s.uploadDone}>
                      <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                      <Text style={s.uploadDoneT}>Video prete</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={s.mediaActions}>
                  <TouchableOpacity testID="take-media" onPress={() => pickMedia('camera')} style={s.mediaBtn}>
                    <View style={s.mediaBtnIcon}>
                      <Ionicons name="camera" size={28} color={COLORS.primary} />
                    </View>
                    <Text style={s.mediaBtnT}>Camera</Text>
                    <Text style={s.mediaBtnSub}>Photo ou video</Text>
                  </TouchableOpacity>
                  <TouchableOpacity testID="pick-media" onPress={() => pickMedia('library')} style={s.mediaBtn}>
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
              <TextInput testID="proof-text" style={s.input}
                placeholder="Decris ta progression..." placeholderTextColor={COLORS.textMuted}
                value={text} onChangeText={setText} multiline maxLength={280} />
              <Text style={s.charCount}>{text.length}/280</Text>

              {/* Info */}
              <View style={s.infoCard}>
                <Ionicons name="eye" size={16} color={COLORS.primary} />
                <Text style={s.infoT}>Preuve visible par les participants du defi</Text>
              </View>

              {/* Submit */}
              <TouchableOpacity testID="submit-proof-btn" onPress={handleSubmit}
                disabled={submitting || uploading || !text.trim()} activeOpacity={0.8} style={s.submitW}>
                <LinearGradient
                  colors={text.trim() && !uploading ? ['#007AFF', '#9D4CDD'] : ['#333', '#333']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.submitGrad}>
                  {submitting ? <ActivityIndicator color="#FFF" /> : (
                    <>
                      <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                      <Text style={s.submitT}>Publier la preuve</Text>
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

const GL = { backgroundColor: 'rgba(20,20,38,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' };

const g = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  bgImg: { position: 'absolute', top: 0, left: 0, right: 0, height: 400, width: '100%' },
  bgOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.xs },
  title: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  sub: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: SPACING.lg, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  empty: { alignItems: 'center', paddingTop: 60, gap: SPACING.md, paddingHorizontal: SPACING.lg },
  emptyT: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  emptySub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  emptyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.pill, marginTop: SPACING.sm },
  emptyBtnT: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});

const s = StyleSheet.create({
  challengeRow: { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, ...GL, marginRight: 8 },
  chipT: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted, maxWidth: 140 },
  // Media
  mediaActions: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  mediaBtn: { flex: 1, ...GL, borderRadius: 18, paddingVertical: 24, alignItems: 'center', gap: 8, borderStyle: 'dashed' as any },
  mediaBtnIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
  mediaBtnT: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  mediaBtnSub: { fontSize: 11, fontWeight: '500', color: COLORS.textMuted },
  // Preview
  preview: { marginHorizontal: SPACING.lg, borderRadius: 18, overflow: 'hidden', position: 'relative', backgroundColor: '#000' },
  previewMedia: { width: '100%', height: 240, borderRadius: 18 },
  removeBtn: { position: 'absolute', top: 10, right: 10, zIndex: 10 },
  typeBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  typeT: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  progressOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, backgroundColor: 'rgba(0,0,0,0.7)' },
  progressW: { height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#007AFF', borderRadius: 2 },
  progressT: { fontSize: 12, fontWeight: '700', color: '#FFF', marginTop: 6, textAlign: 'center' },
  uploadDone: { position: 'absolute', bottom: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  uploadDoneT: { fontSize: 12, fontWeight: '700', color: '#34C759' },
  // Input
  input: { ...GL, borderRadius: 16, padding: 16, marginHorizontal: SPACING.lg, color: '#FFF', fontSize: 16, minHeight: 90, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right', paddingHorizontal: SPACING.lg, marginTop: 4 },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: SPACING.lg, marginTop: 14, backgroundColor: COLORS.primary + '08', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.primary + '20' },
  infoT: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  // Submit
  submitW: { marginHorizontal: SPACING.lg, borderRadius: 16, overflow: 'hidden', marginTop: SPACING.lg },
  submitGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  submitT: { fontSize: 17, fontWeight: '800', color: '#FFF' },
});
