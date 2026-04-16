import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../contexts/api';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING, RADIUS, CATEGORIES } from '../../contexts/theme';

export default function ChallengeDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, refreshUser } = useAuth();
  const [challenge, setChallenge] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const isJoined = user?.joined_challenges?.includes(id || '');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [ch, lb] = await Promise.all([
        api.get(`/api/challenges/${id}`),
        api.get(`/api/challenges/${id}/leaderboard?limit=10`).catch(() => []),
      ]);
      setChallenge(ch);
      setLeaderboard(lb);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
        ? 'Vous avez déjà rejoint ce défi'
        : 'Erreur lors de l\'inscription';
      Alert.alert('Erreur', msg);
    } finally {
      setJoining(false);
    }
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Détail du défi</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Challenge Info */}
        <View style={styles.infoSection}>
          <View style={[styles.categoryIcon, { backgroundColor: catConfig.color + '20' }]}>
            <Ionicons name={catConfig.icon as any} size={36} color={catConfig.color} />
          </View>
          <View style={[styles.catBadge, { backgroundColor: catConfig.color + '15' }]}>
            <Text style={[styles.catText, { color: catConfig.color }]}>{challenge.category}</Text>
          </View>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <Text style={styles.challengeDesc}>{challenge.description}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="calendar" size={20} color={COLORS.primary} />
            <Text style={styles.statValue}>{challenge.duration_days}</Text>
            <Text style={styles.statLabel}>Jours</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="people" size={20} color={COLORS.secondary} />
            <Text style={styles.statValue}>{challenge.participant_count}</Text>
            <Text style={styles.statLabel}>Participants</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name={challenge.is_public ? 'earth' : 'lock-closed'} size={20} color={COLORS.success} />
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
                <Text style={[styles.rank, i < 3 && { color: i === 0 ? COLORS.warning : i === 1 ? '#C0C0C0' : '#CD7F32' }]}>
                  #{i + 1}
                </Text>
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

        {/* Join / Action */}
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
        )}
      </ScrollView>
    </View>
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
  infoSection: { alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  categoryIcon: {
    width: 72, height: 72, borderRadius: RADIUS.lg,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md,
  },
  catBadge: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.pill, marginBottom: SPACING.sm },
  catText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  challengeTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', letterSpacing: -0.5 },
  challengeDesc: {
    fontSize: 15, color: COLORS.textSecondary, textAlign: 'center',
    lineHeight: 22, marginTop: SPACING.sm, paddingHorizontal: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm,
    marginTop: SPACING.xl, marginBottom: SPACING.lg,
  },
  statItem: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    padding: SPACING.md, alignItems: 'center', gap: SPACING.xs,
    borderWidth: 1, borderColor: COLORS.border,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase' },
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
});
