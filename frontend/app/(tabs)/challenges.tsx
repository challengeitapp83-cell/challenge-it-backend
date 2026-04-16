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
      const q = activeTab === 'Tous' ? '' : `?category=${encodeURIComponent(activeTab)}`;
      setChallenges(await api.get(`/api/challenges${q}`));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { setLoading(true); fetchChallenges(); }, [fetchChallenges]);
  const onRefresh = async () => { setRefreshing(true); await fetchChallenges(); setRefreshing(false); };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Défis</Text>
        <TouchableOpacity testID="create-challenge-btn" onPress={() => router.push('/create-challenge')} style={styles.createBtn}>
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
        {CATEGORY_TABS.map((cat) => (
          <TouchableOpacity key={cat} testID={`filter-${cat}`} onPress={() => setActiveTab(cat)}
            style={[styles.filterTab, activeTab === cat && styles.filterTabActive]}>
            <Text style={[styles.filterText, activeTab === cat && styles.filterTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120, paddingTop: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : challenges.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="search" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Aucun défi trouvé</Text>
          </View>
        ) : (
          challenges.map((ch: any) => {
            const cat = CATEGORIES[ch.category] || CATEGORIES['Autre'];
            const img = getChallengeImage(ch.challenge_id, ch.category, ch.image);
            return (
              <TouchableOpacity key={ch.challenge_id} testID={`challenge-card-${ch.challenge_id}`}
                onPress={() => router.push(`/challenge/${ch.challenge_id}`)} activeOpacity={0.85} style={styles.card}>
                <Image source={{ uri: img }} style={StyleSheet.absoluteFill} />
                <LinearGradient colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.92)']} locations={[0.15, 1]} style={StyleSheet.absoluteFill} />
                <View style={styles.cardContent}>
                  {/* Top row */}
                  <View style={styles.cardTop}>
                    <View style={[styles.catPill, { backgroundColor: cat.color + '45' }]}>
                      <Ionicons name={cat.icon as any} size={12} color={cat.color} />
                      <Text style={[styles.catPillText, { color: cat.color }]}>{ch.category}</Text>
                    </View>
                    <View style={styles.durPill}>
                      <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.75)" />
                      <Text style={styles.durText}>{ch.duration_days}j</Text>
                    </View>
                  </View>
                  {/* Bottom */}
                  <View>
                    <Text style={styles.cardTitle}>{ch.title}</Text>
                    <Text style={styles.cardDesc} numberOfLines={1}>{ch.description}</Text>
                    <View style={styles.cardFooter}>
                      <View style={styles.footerLeft}>
                        <Ionicons name="people" size={14} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.footerText}>{ch.participant_count} participants</Text>
                      </View>
                      <View style={styles.joinHint}>
                        <Text style={styles.joinText}>Rejoindre</Text>
                        <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                      </View>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  createBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  tabScroll: { paddingHorizontal: 20, paddingBottom: 8, gap: 8 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  filterTextActive: { color: '#FFF' },
  // Cards
  card: { marginHorizontal: 20, marginBottom: 14, borderRadius: 20, overflow: 'hidden', height: 195 },
  cardContent: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  catPillText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  durPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  durText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },
  cardTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.3, marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  cardDesc: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 18, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerText: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.55)' },
  joinHint: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.primary + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  joinText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.textMuted },
});
