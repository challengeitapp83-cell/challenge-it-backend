import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../contexts/api';
import { COLORS, SPACING, RADIUS, CATEGORIES, getChallengeImage } from '../../contexts/theme';

const CATEGORY_TABS = ['Tous', 'Sport', 'Santé', 'Habitudes', 'Business', 'Autre'];

export default function ChallengesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('Tous');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChallenges = useCallback(async () => {
    try {
      const query = activeTab === 'Tous' ? '' : `?category=${encodeURIComponent(activeTab)}`;
      const data = await api.get(`/api/challenges${query}`);
      setChallenges(data);
    } catch (e) {
      console.error('Fetch challenges error:', e);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    fetchChallenges();
  }, [fetchChallenges]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChallenges();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Défis</Text>
        <TouchableOpacity
          testID="create-challenge-btn"
          onPress={() => router.push('/create-challenge')}
          style={styles.createBtn}
        >
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScroll}
      >
        {CATEGORY_TABS.map((cat) => {
          const catConfig = CATEGORIES[cat] || {};
          return (
            <TouchableOpacity
              key={cat}
              testID={`filter-${cat}`}
              onPress={() => setActiveTab(cat)}
              style={[styles.filterTab, activeTab === cat && styles.filterTabActive]}
            >
              <Text style={[styles.filterText, activeTab === cat && styles.filterTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: SPACING.md }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : challenges.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="search" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Aucun défi trouvé</Text>
          </View>
        ) : (
          challenges.map((ch: any) => {
            const catConfig = CATEGORIES[ch.category] || CATEGORIES['Autre'];
            const imageUrl = getChallengeImage(ch.challenge_id, ch.category, ch.image);
            return (
              <TouchableOpacity
                key={ch.challenge_id}
                testID={`challenge-card-${ch.challenge_id}`}
                onPress={() => router.push(`/challenge/${ch.challenge_id}`)}
                activeOpacity={0.85}
                style={styles.card}
              >
                <Image source={{ uri: imageUrl }} style={styles.cardImage} />
                <LinearGradient
                  colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.85)']}
                  locations={[0.2, 1]}
                  style={styles.cardOverlay}
                />
                <View style={styles.cardContent}>
                  <View style={styles.cardTop}>
                    <View style={[styles.catBadge, { backgroundColor: catConfig.color + '35' }]}>
                      <Ionicons name={catConfig.icon as any} size={12} color={catConfig.color} />
                      <Text style={[styles.catText, { color: catConfig.color }]}>{ch.category}</Text>
                    </View>
                    <View style={styles.durationBadge}>
                      <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.7)" />
                      <Text style={styles.durationText}>{ch.duration_days}j</Text>
                    </View>
                  </View>
                  <Text style={styles.cardTitle}>{ch.title}</Text>
                  <Text style={styles.cardDesc} numberOfLines={1}>{ch.description}</Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.footerItem}>
                      <Ionicons name="people" size={14} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.footerText}>{ch.participant_count} participants</Text>
                    </View>
                    <View style={styles.joinHint}>
                      <Text style={styles.joinHintText}>Rejoindre</Text>
                      <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm,
  },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  createBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  tabScroll: { paddingHorizontal: SPACING.lg, gap: SPACING.sm, paddingBottom: SPACING.sm },
  filterTab: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill, backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border, marginRight: SPACING.sm,
  },
  filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  filterTextActive: { color: '#FFFFFF' },
  // ===== IMMERSIVE CARD =====
  card: {
    marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
    borderRadius: RADIUS.md, overflow: 'hidden', height: 180,
    backgroundColor: COLORS.card,
  },
  cardImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  cardOverlay: { ...StyleSheet.absoluteFillObject },
  cardContent: {
    ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: SPACING.md,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.sm,
  },
  catText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  durationBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: SPACING.sm,
    paddingVertical: 4, borderRadius: RADIUS.sm,
  },
  durationText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  cardDesc: { fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  joinHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  joinHintText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  empty: { alignItems: 'center', paddingTop: 60, gap: SPACING.md },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.textMuted },
});
