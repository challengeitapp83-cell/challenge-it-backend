import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../contexts/api';
import { COLORS, SPACING, RADIUS, CATEGORIES } from '../../contexts/theme';

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
      {/* Header */}
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

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScroll}
      >
        {CATEGORY_TABS.map((cat) => (
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
        ))}
      </ScrollView>

      {/* Challenge List */}
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
            return (
              <TouchableOpacity
                key={ch.challenge_id}
                testID={`challenge-card-${ch.challenge_id}`}
                onPress={() => router.push(`/challenge/${ch.challenge_id}`)}
                activeOpacity={0.8}
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.catIcon, { backgroundColor: catConfig.color + '20' }]}>
                    <Ionicons name={catConfig.icon as any} size={22} color={catConfig.color} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{ch.title}</Text>
                    <View style={styles.cardMeta}>
                      <View style={[styles.catBadge, { backgroundColor: catConfig.color + '15' }]}>
                        <Text style={[styles.catText, { color: catConfig.color }]}>{ch.category}</Text>
                      </View>
                      <Text style={styles.duration}>{ch.duration_days}j</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.cardDesc} numberOfLines={2}>{ch.description}</Text>
                <View style={styles.cardFooter}>
                  <View style={styles.footerItem}>
                    <Ionicons name="people" size={16} color={COLORS.textMuted} />
                    <Text style={styles.footerText}>{ch.participant_count} participants</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
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
  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  catIcon: {
    width: 48, height: 48, borderRadius: RADIUS.sm,
    justifyContent: 'center', alignItems: 'center',
  },
  cardInfo: { flex: 1, gap: SPACING.xs },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  catBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.sm },
  catText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  duration: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  cardDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: SPACING.sm },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  footerText: { fontSize: 13, fontWeight: '500', color: COLORS.textMuted },
  empty: { alignItems: 'center', paddingTop: 60, gap: SPACING.md },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.textMuted },
});
