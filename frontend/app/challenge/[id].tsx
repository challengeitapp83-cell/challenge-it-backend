import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Alert, Share, Clipboard, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../contexts/api';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING, RADIUS, CATEGORIES, getChallengeImage } from '../../contexts/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function ChallengeDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, refreshUser } = useAuth();
  const [challenge, setChallenge] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [proofs, setProofs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [contributing, setContributing] = useState(false);

  const isJoined = user?.joined_challenges?.includes(id || '');
  const hasContributed = challenge?.pot_contributions?.includes(user?.user_id);
  const isFriends = challenge?.challenge_type === 'friends';

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const [ch, lb, pr] = await Promise.all([
        api.get(`/api/challenges/${id}`),
        api.get(`/api/challenges/${id}/leaderboard?limit=10`).catch(() => []),
        api.get(`/api/challenges/${id}/proofs`).catch(() => []),
      ]);
      setChallenge(ch);
      setLeaderboard(lb);
      setProofs(pr);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      await api.post(`/api/challenges/${id}/join`);
      await refreshUser();
      await fetchData();
      Alert.alert('Bienvenue !', 'Vous avez rejoint ce défi !');
    } catch (e: any) {
      const msg = e.message?.includes('Already joined')
        ? 'Vous avez déjà rejoint ce défi' : 'Erreur lors de l\'inscription';
      Alert.alert('Erreur', msg);
    } finally { setJoining(false); }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 100 }} />
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Défi introuvable</Text>
      </View>
    );
  }

  const catConfig = CATEGORIES[challenge.category] || CATEGORIES['Autre'];
  const imageUrl = getChallengeImage(challenge.challenge_id, challenge.category, challenge.image);

  return (
    <View style={[styles.container]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: imageUrl }} style={styles.heroImage} />
          <LinearGradient
            colors={['rgba(15,15,15,0.3)', 'rgba(15,15,15,0.95)']}
            locations={[0.3, 1]}
            style={styles.heroOverlay}
          />
          {/* Back button */}
          <TouchableOpacity
            testID="back-btn"
            onPress={() => router.back()}
            style={[styles.backBtn, { top: insets.top + 8 }]}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {/* Hero content */}
          <View style={styles.heroContent}>
            <View style={[styles.heroCatBadge, { backgroundColor: catConfig.color + '35' }]}>
              <Ionicons name={catConfig.icon as any} size={14} color={catConfig.color} />
              <Text style={[styles.heroCatText, { color: catConfig.color }]}>{challenge.category}</Text>
            </View>
            <Text style={styles.heroTitle}>{challenge.title}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descSection}>
          <Text style={styles.description}>{challenge.description}</Text>
        </View>

        {/* ===== GAINS CALCULATOR (CONVERSION) ===== */}
        {challenge.has_pot && challenge.pot_amount_per_person > 0 && (
          <View style={gc.w}>
            <LinearGradient colors={['#1A1200', '#0F0A00']} style={gc.bg} />
            <View style={gc.glowLine} />
            <Text style={gc.title}>TU PEUX GAGNER</Text>
            <Text style={gc.amount}>
              {Math.floor(challenge.pot_total * 0.9)}€
            </Text>
            <Text style={gc.sub}>si tu tiens {challenge.duration_days} jours</Text>
            <View style={gc.row}>
              <View style={gc.item}>
                <Text style={gc.itemLabel}>Ta mise</Text>
                <Text style={gc.itemVal}>{challenge.pot_amount_per_person}€</Text>
              </View>
              <View style={gc.divider} />
              <View style={gc.item}>
                <Text style={gc.itemLabel}>Cagnotte</Text>
                <Text style={[gc.itemVal, { color: '#FFD700' }]}>{challenge.pot_total}€</Text>
              </View>
              <View style={gc.divider} />
              <View style={gc.item}>
                <Text style={gc.itemLabel}>Joueurs</Text>
                <Text style={gc.itemVal}>{challenge.participant_count}</Text>
              </View>
            </View>
            {!isJoined && (
              <Text style={gc.warn}>Les perdants financent les gagnants</Text>
            )}
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="calendar" size={22} color={COLORS.primary} />
            <Text style={styles.statValue}>{challenge.duration_days}</Text>
            <Text style={styles.statLabel}>Jours</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="people" size={22} color={COLORS.secondary} />
            <Text style={styles.statValue}>{challenge.participant_count}</Text>
            <Text style={styles.statLabel}>Participants</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name={challenge.is_public ? 'earth' : 'lock-closed'} size={22} color={COLORS.success} />
            <Text style={styles.statValue}>{challenge.is_public ? 'Public' : 'Prive'}</Text>
            <Text style={styles.statLabel}>Acces</Text>
          </View>
        </View>

        {/* ===== PROOFS ACCESS BANNER (ALWAYS VISIBLE) ===== */}
        <View style={pf.banner}>
          <TouchableOpacity
            testID="proofs-banner"
            activeOpacity={0.85}
            onPress={() => {
              if (isJoined) router.push('/(tabs)/publish');
            }}
            style={pf.bannerInner}
          >
            <LinearGradient
              colors={proofs.length > 0 ? ['#007AFF12', '#AF52DE08'] : ['#FF6B3512', '#FF3B3008']}
              style={pf.bannerBg}
            />
            <View style={pf.bannerLeft}>
              <View style={[pf.bannerIcon, proofs.length > 0 ? { backgroundColor: '#007AFF20' } : { backgroundColor: '#FF6B3520' }]}>
                <Ionicons
                  name={proofs.length > 0 ? 'images' : 'camera'}
                  size={24}
                  color={proofs.length > 0 ? '#007AFF' : '#FF6B35'}
                />
              </View>
              <View>
                <Text style={pf.bannerTitle}>
                  {proofs.length > 0 ? `${proofs.length} preuve${proofs.length > 1 ? 's' : ''} envoyee${proofs.length > 1 ? 's' : ''}` : 'Aucune preuve'}
                </Text>
                <Text style={pf.bannerSub}>
                  {proofs.length > 0
                    ? 'Photos et videos des participants'
                    : isJoined ? 'Sois le premier a envoyer ta preuve !' : 'Rejoins pour envoyer des preuves'}
                </Text>
              </View>
            </View>
            {isJoined && (
              <View style={pf.bannerBtn}>
                <Ionicons name="add-circle" size={28} color={COLORS.primary} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ===== PROOFS GALLERY ===== */}
        {proofs.length > 0 && (
          <View style={styles.section}>
            <View style={pf.galHeader}>
              <Ionicons name="images" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Preuves des participants</Text>
            </View>
            <Text style={pf.galSub}>Visible par tous les participants du defi</Text>

            {proofs.map((p: any) => {
              const isVideo = p.media_type === 'video';
              // Resolve media URL - handle Cloudinary URLs, local URLs, and base64
              const rawUrl = p.media_url || p.image;
              const isCloudinary = rawUrl && rawUrl.startsWith('https://');
              const isLocalApi = rawUrl && rawUrl.startsWith('/api/');
              const isBase64 = rawUrl && rawUrl.startsWith('data:');
              const mediaSource = isCloudinary ? rawUrl : isLocalApi ? `${API_URL}${rawUrl}` : null;
              const imageSource = isCloudinary ? rawUrl : isBase64 ? rawUrl : isLocalApi ? `${API_URL}${rawUrl}` : null;
              const hasMedia = !!(mediaSource || imageSource);
              const isMe = p.user_id === user?.user_id;

              return (
                <View key={p.proof_id} style={[pf.card, isMe && pf.cardMe]}>
                  {/* User info */}
                  <View style={pf.header}>
                    {p.user_picture ? (
                      <Image source={{ uri: p.user_picture }} style={pf.avatar} />
                    ) : (
                      <LinearGradient colors={['#007AFF', '#AF52DE']} style={pf.avatar}>
                        <Text style={pf.avatarI}>{p.user_name?.charAt(0)?.toUpperCase()}</Text>
                      </LinearGradient>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={pf.userName}>{p.user_name}</Text>
                        {isMe && (
                          <View style={pf.meBadge}><Text style={pf.meT}>Toi</Text></View>
                        )}
                      </View>
                      <Text style={pf.dayTag}>Jour {p.day_number}</Text>
                    </View>
                    <View style={[pf.typeBadge, isVideo ? { backgroundColor: '#FF6B3520' } : { backgroundColor: '#007AFF20' }]}>
                      <Ionicons name={isVideo ? 'videocam' : 'image'} size={14} color={isVideo ? '#FF6B35' : '#007AFF'} />
                      <Text style={[pf.typeT, { color: isVideo ? '#FF6B35' : '#007AFF' }]}>
                        {isVideo ? 'Video' : 'Photo'}
                      </Text>
                    </View>
                  </View>

                  {/* Media content */}
                  {isVideo && mediaSource ? (
                    <View style={pf.mediaW}>
                      <Video
                        source={{ uri: mediaSource }}
                        style={pf.mediaLarge}
                        useNativeControls
                        resizeMode={ResizeMode.COVER}
                        isLooping={false}
                        shouldPlay={false}
                      />
                    </View>
                  ) : imageSource ? (
                    <Image source={{ uri: imageSource }} style={pf.mediaLarge} />
                  ) : null}

                  {/* Text */}
                  {p.text ? <Text style={pf.text}>{p.text}</Text> : null}

                  {/* Footer */}
                  <View style={pf.footer}>
                    <View style={pf.footerL}>
                      <Ionicons name="heart" size={14} color={p.likes > 0 ? '#FF2D55' : COLORS.textMuted} />
                      <Text style={pf.footerT}>{p.likes || 0}</Text>
                    </View>
                    <View style={pf.footerL}>
                      <Ionicons name="eye" size={14} color={COLORS.textMuted} />
                      <Text style={pf.footerT}>Visible par les participants</Text>
                    </View>
                    <Text style={pf.footerTime}>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Publish proof CTA (for joined users) */}
        {isJoined && (
          <View style={styles.section}>
            <TouchableOpacity
              testID="publish-proof-cta"
              onPress={() => router.push('/(tabs)/publish')}
              activeOpacity={0.85}
              style={pf.publishCta}
            >
              <LinearGradient
                colors={['#007AFF', '#AF52DE']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={pf.publishCtaInner}
              >
                <Ionicons name="camera" size={22} color="#FFF" />
                <Text style={pf.publishCtaT}>Envoyer ma preuve</Text>
                <Text style={pf.publishCtaSub}>Photo ou video</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Classement du défi</Text>
            {leaderboard.map((u: any, i: number) => (
              <View key={u.user_id} style={styles.leaderRow}>
                <Text style={[styles.rank, i < 3 && {
                  color: i === 0 ? COLORS.warning : i === 1 ? '#C0C0C0' : '#CD7F32'
                }]}>#{i + 1}</Text>
                <View style={styles.leaderAvatar}>
                  {u.picture ? (
                    <Image source={{ uri: u.picture }} style={styles.leaderAvatarImg} />
                  ) : (
                    <Text style={styles.leaderInitial}>{u.name?.charAt(0)}</Text>
                  )}
                </View>
                <Text style={styles.leaderName} numberOfLines={1}>{u.name}</Text>
                <Text style={styles.leaderDays}>Jour {u.current_day || 1}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Pot Info */}
        {challenge.has_pot && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cagnotte</Text>
            <View style={styles.potCard}>
              <LinearGradient colors={[COLORS.warning + '12', COLORS.warning + '04']} style={styles.potCardInner}>
                <View style={styles.potHeader}>
                  <Ionicons name="cash" size={24} color={COLORS.warning} />
                  <View>
                    <Text style={styles.potTotal}>{challenge.pot_total || 0}€</Text>
                    <Text style={styles.potSub}>Cagnotte totale</Text>
                  </View>
                </View>
                <View style={styles.potDetails}>
                  <View style={styles.potDetail}>
                    <Text style={styles.potDetailVal}>{challenge.pot_amount_per_person}€</Text>
                    <Text style={styles.potDetailLbl}>par personne</Text>
                  </View>
                  <View style={styles.potDetail}>
                    <Text style={styles.potDetailVal}>{challenge.pot_contributions?.length || 0}</Text>
                    <Text style={styles.potDetailLbl}>contributeurs</Text>
                  </View>
                </View>
                {challenge.winner_name && (
                  <View style={styles.winnerRow}>
                    <Ionicons name="trophy" size={18} color={COLORS.warning} />
                    <Text style={styles.winnerText}>Gagnant : {challenge.winner_name}</Text>
                  </View>
                )}
                {isJoined && !hasContributed && !challenge.winner_id && (
                  <TouchableOpacity testID="contribute-pot-btn" onPress={async () => {
                    setContributing(true);
                    try {
                      await api.post(`/api/challenges/${id}/contribute-pot`);
                      Alert.alert('Contribution ajoutée !', `${challenge.pot_amount_per_person}€ ajoutés à la cagnotte`);
                      fetchData();
                    } catch (e: any) { Alert.alert('Erreur', e.message?.includes('déjà') ? 'Vous avez déjà contribué' : 'Erreur'); }
                    finally { setContributing(false); }
                  }} disabled={contributing} style={styles.contributeBtn}>
                    <LinearGradient colors={[COLORS.warning, '#E8A300']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.contributeBtnInner}>
                      {contributing ? <ActivityIndicator color="#000" size="small" /> : (
                        <>
                          <Ionicons name="cash" size={18} color="#000" />
                          <Text style={styles.contributeBtnText}>Contribuer {challenge.pot_amount_per_person}€</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                {hasContributed && (
                  <View style={styles.contributedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    <Text style={styles.contributedText}>Vous avez contribué</Text>
                  </View>
                )}
                {/* MISER BUTTON */}
                {isJoined && (
                  <TouchableOpacity
                    testID="bet-btn"
                    onPress={() => router.push({
                      pathname: '/bet/[challengeId]',
                      params: {
                        challengeId: id || '',
                        challengeTitle: challenge.title,
                        participants: String(challenge.participant_count || 5),
                      },
                    })}
                    activeOpacity={0.8}
                    style={styles.betBtnWrap}
                  >
                    <LinearGradient
                      colors={['#FFD700', '#FFA500']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.betBtnInner}
                    >
                      <Ionicons name="cash" size={20} color="#000" />
                      <Text style={styles.betBtnText}>Miser sur ce défi</Text>
                      <Ionicons name="arrow-forward" size={16} color="#000" />
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Invite Code (Friends challenges) */}
        {isFriends && challenge.invite_code && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inviter des amis</Text>
            <View style={styles.inviteCard}>
              <Text style={styles.inviteLabel}>Code d'invitation</Text>
              <View style={styles.inviteCodeRow}>
                <Text style={styles.inviteCode}>{challenge.invite_code}</Text>
                <TouchableOpacity testID="share-invite-btn" onPress={async () => {
                  try {
                    await Share.share({ message: `Rejoins mon defi "${challenge.title}" sur Challenge It !\n\nCode : ${challenge.invite_code}` });
                  } catch {}
                }} style={styles.shareBtn}>
                  <Ionicons name="share-social" size={20} color={COLORS.primary} />
                  <Text style={styles.shareBtnText}>Partager</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Join / Publish / Bet */}
        {!isJoined ? (
          <TouchableOpacity
            testID="join-challenge-btn"
            onPress={handleJoin}
            disabled={joining}
            activeOpacity={0.8}
            style={styles.joinWrapper}
          >
            <LinearGradient
              colors={['#007AFF', '#9D4CDD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.joinGradient}
            >
              {joining ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="flash" size={22} color="#FFF" />
                  <Text style={styles.joinText}>Rejoindre le défi</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View>
            <TouchableOpacity
              testID="publish-proof-from-detail-btn"
              onPress={() => router.push('/(tabs)/publish')}
              activeOpacity={0.8}
              style={styles.joinWrapper}
            >
              <LinearGradient
                colors={[COLORS.success, '#28B446']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.joinGradient}
              >
                <Ionicons name="camera" size={22} color="#FFF" />
                <Text style={styles.joinText}>Publier une preuve</Text>
              </LinearGradient>
            </TouchableOpacity>
            {!challenge.has_pot && (
              <TouchableOpacity
                testID="bet-from-detail-btn"
                onPress={() => router.push({
                  pathname: '/bet/[challengeId]',
                  params: {
                    challengeId: id || '',
                    challengeTitle: challenge.title,
                    participants: String(challenge.participant_count || 5),
                  },
                })}
                activeOpacity={0.8}
                style={[styles.joinWrapper, { marginTop: 10 }]}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.joinGradient}
                >
                  <Ionicons name="cash" size={22} color="#000" />
                  <Text style={[styles.joinText, { color: '#000' }]}>Miser sur ce défi</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  // ===== HERO =====
  heroContainer: { height: 280, position: 'relative' },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  backBtn: {
    position: 'absolute', left: 16, width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center',
    zIndex: 10,
  },
  heroContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: SPACING.lg,
  },
  heroCatBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md, paddingVertical: 5, borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  heroCatText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  // ===== DESCRIPTION =====
  descSection: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  description: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22 },
  // ===== STATS =====
  statsRow: {
    flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statItem: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    padding: SPACING.md, alignItems: 'center', gap: SPACING.xs,
    borderWidth: 1, borderColor: COLORS.border,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase' },
  // ===== SECTION =====
  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.md },
  leaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  rank: { fontSize: 15, fontWeight: '800', color: COLORS.textMuted, width: 32 },
  leaderAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.cardLight,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  leaderAvatarImg: { width: 36, height: 36 },
  leaderInitial: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  leaderName: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  leaderDays: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  joinWrapper: { marginHorizontal: SPACING.lg, borderRadius: RADIUS.md, overflow: 'hidden', marginTop: SPACING.md },
  joinGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, gap: SPACING.sm,
  },
  joinText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  errorText: { fontSize: 16, color: COLORS.textMuted, textAlign: 'center', marginTop: 100 },
  // Pot
  potCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.warning + '20' },
  potCardInner: { padding: 16, gap: 14 },
  potHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  potTotal: { fontSize: 28, fontWeight: '900', color: COLORS.warning },
  potSub: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  potDetails: { flexDirection: 'row', gap: 20 },
  potDetail: {},
  potDetailVal: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  potDetailLbl: { fontSize: 11, fontWeight: '500', color: COLORS.textMuted },
  winnerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.warning + '15', borderRadius: 10, padding: 10 },
  winnerText: { fontSize: 14, fontWeight: '700', color: COLORS.warning },
  contributeBtn: { borderRadius: 12, overflow: 'hidden' },
  contributeBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
  contributeBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
  contributedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contributedText: { fontSize: 13, fontWeight: '600', color: COLORS.success },
  betBtnWrap: { borderRadius: 12, overflow: 'hidden', marginTop: 10 },
  betBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  betBtnText: { fontSize: 16, fontWeight: '800', color: '#000' },
  // Invite
  inviteCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  inviteLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginBottom: 10 },
  inviteCodeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inviteCode: { fontSize: 28, fontWeight: '900', color: COLORS.secondary, letterSpacing: 6 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary + '15', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  shareBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
});

// Proof gallery styles
const pf = StyleSheet.create({
  // Banner (always visible right after stats)
  banner: { paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  bannerInner: { borderRadius: 18, overflow: 'hidden', position: 'relative' },
  bannerBg: { ...StyleSheet.absoluteFillObject },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, flex: 1 },
  bannerIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  bannerTitle: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  bannerSub: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.45)', marginTop: 3 },
  bannerBtn: { position: 'absolute', right: 16, top: 0, bottom: 0, justifyContent: 'center' },
  // Gallery header
  galHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  galSub: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted, marginBottom: 14, paddingHorizontal: SPACING.md },
  // Proof card
  card: { backgroundColor: COLORS.card, borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  cardMe: { borderColor: COLORS.primary + '30', backgroundColor: COLORS.primary + '06' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarI: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  userName: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  dayTag: { fontSize: 12, fontWeight: '600', color: COLORS.primary, marginTop: 2 },
  meBadge: { backgroundColor: COLORS.primary + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  meT: { fontSize: 10, fontWeight: '800', color: COLORS.primary },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  typeT: { fontSize: 12, fontWeight: '700' },
  // Media
  mediaW: { borderRadius: 14, overflow: 'hidden', marginBottom: 12, position: 'relative' },
  media: { width: '100%', height: 200, borderRadius: 14 },
  mediaLarge: { width: '100%', height: 260, borderRadius: 14 },
  playOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  playBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  text: { fontSize: 15, fontWeight: '500', color: COLORS.textSecondary, lineHeight: 22, marginBottom: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerL: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerT: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  footerTime: { fontSize: 11, fontWeight: '500', color: COLORS.textMuted },
  // Publish CTA
  publishCta: { borderRadius: 18, overflow: 'hidden', marginHorizontal: SPACING.md },
  publishCtaInner: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  publishCtaT: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  publishCtaSub: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.55)' },
});

// Gains calculator styles
const gc = StyleSheet.create({
  w: { marginHorizontal: 16, marginBottom: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)', position: 'relative' },
  bg: { ...StyleSheet.absoluteFillObject },
  glowLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#FFD700' },
  title: { fontSize: 11, fontWeight: '800', color: 'rgba(255,215,0,0.5)', letterSpacing: 2, textAlign: 'center', marginTop: 18 },
  amount: { fontSize: 42, fontWeight: '900', color: '#FFD700', textAlign: 'center', marginTop: 4 },
  sub: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 18, marginBottom: 16, paddingHorizontal: 16 },
  item: { alignItems: 'center', gap: 4 },
  itemLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.35)' },
  itemVal: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  warn: { fontSize: 12, fontWeight: '700', color: '#FF3B30', textAlign: 'center', paddingBottom: 16, fontStyle: 'italic' },
});
