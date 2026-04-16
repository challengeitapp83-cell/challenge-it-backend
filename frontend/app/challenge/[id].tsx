import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Alert, Share, Clipboard, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../contexts/api';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING, RADIUS, CATEGORIES, getChallengeImage } from '../../contexts/theme';

export default function ChallengeDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, refreshUser } = useAuth();
  const [challenge, setChallenge] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [contributing, setContributing] = useState(false);

  const isJoined = user?.joined_challenges?.includes(id || '');
  const hasContributed = challenge?.pot_contributions?.includes(user?.user_id);
  const isFriends = challenge?.challenge_type === 'friends';

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const [ch, lb] = await Promise.all([
        api.get(`/api/challenges/${id}`),
        api.get(`/api/challenges/${id}/leaderboard?limit=10`).catch(() => []),
      ]);
      setChallenge(ch);
      setLeaderboard(lb);
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
            <Text style={styles.statValue}>{challenge.is_public ? 'Public' : 'Privé'}</Text>
            <Text style={styles.statLabel}>Accès</Text>
          </View>
        </View>

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
                    await Share.share({ message: `Rejoins mon défi "${challenge.title}" sur Challenge It !\n\nCode : ${challenge.invite_code}` });
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
