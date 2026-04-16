import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Image, TextInput, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../contexts/api';
import { COLORS, SPACING, RADIUS, CATEGORIES, getChallengeImage } from '../../contexts/theme';

const CATEGORY_TABS = ['Tous', 'Sport', 'Sante', 'Habitudes', 'Business', 'Esport', 'Art'];
const CHALLENGES_BG = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&h=1200&fit=crop&q=75';

export default function ChallengesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [friendsChallenges, setFriendsChallenges] = useState<any[]>([]);
  const [mainTab, setMainTab] = useState<'community' | 'friends'>('community');
  const [activeTab, setActiveTab] = useState('Tous');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  const fetchChallenges = useCallback(async () => {
    try {
      const q = activeTab === 'Tous' ? '' : `?category=${encodeURIComponent(activeTab)}`;
      const [pub, fri] = await Promise.all([
        api.get(`/api/challenges${q}`),
        api.get('/api/my-friends-challenges').catch(() => []),
      ]);
      setChallenges(pub);
      setFriendsChallenges(fri);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { setLoading(true); fetchChallenges(); }, [fetchChallenges]);
  const onRefresh = async () => { setRefreshing(true); await fetchChallenges(); setRefreshing(false); };

  const handleJoinByCode = async () => {
    if (inviteCode.length < 4) { Alert.alert('Erreur', 'Entrez un code valide'); return; }
    setJoining(true);
    try {
      const result = await api.post('/api/challenges/join-by-code', { code: inviteCode.trim() });
      Alert.alert('Bravo !', 'Vous avez rejoint le défi !', [
        { text: 'Voir', onPress: () => { if (result.challenge) router.push(`/challenge/${result.challenge.challenge_id}`); } },
      ]);
      setInviteCode('');
      fetchChallenges();
    } catch (e: any) {
      const msg = e.message?.includes('inscrit') ? 'Vous êtes déjà inscrit à ce défi' :
        e.message?.includes('invalide') ? 'Code invalide' : 'Erreur';
      Alert.alert('Erreur', msg);
    } finally { setJoining(false); }
  };

  const displayList = mainTab === 'community' ? challenges : friendsChallenges;

  const renderCard = (ch: any) => {
    const cat = CATEGORIES[ch.category] || CATEGORIES['Autre'];
    const img = getChallengeImage(ch.challenge_id, ch.category, ch.image);
    const isFriends = ch.challenge_type === 'friends';
    return (
      <TouchableOpacity key={ch.challenge_id} testID={`challenge-card-${ch.challenge_id}`}
        onPress={() => router.push(`/challenge/${ch.challenge_id}`)} activeOpacity={0.85} style={styles.card}>
        <Image source={{ uri: img }} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.92)']} locations={[0.15, 1]} style={StyleSheet.absoluteFill} />
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <View style={[styles.catPill, { backgroundColor: cat.color + '45' }]}>
              <Ionicons name={cat.icon as any} size={12} color={cat.color} />
              <Text style={[styles.catPillText, { color: cat.color }]}>{ch.category}</Text>
            </View>
            <View style={styles.cardTopRight}>
              {isFriends && (
                <View style={[styles.friendsBadge]}>
                  <Ionicons name="people" size={11} color={COLORS.secondary} />
                  <Text style={styles.friendsBadgeText}>Amis</Text>
                </View>
              )}
              {ch.has_pot && (
                <View style={styles.potBadge}>
                  <Ionicons name="cash" size={11} color={COLORS.warning} />
                  <Text style={styles.potBadgeText}>{ch.pot_total || ch.pot_amount_per_person}€</Text>
                </View>
              )}
              <View style={styles.durPill}>
                <Text style={styles.durText}>{ch.duration_days}j</Text>
              </View>
            </View>
          </View>
          <View>
            <Text style={styles.cardTitle}>{ch.title}</Text>
            {ch.has_pot && ch.pot_total > 0 && (
              <View style={styles.potHighlight}>
                <Ionicons name="cash" size={16} color="#FFD700" />
                <Text style={styles.potHighlightText}>{ch.pot_total}€ en jeu</Text>
                <Text style={styles.potHighlightSub}>Tu peux gagner ou perdre</Text>
              </View>
            )}
            {!ch.has_pot && (
              <Text style={styles.cardDesc} numberOfLines={1}>{ch.description}</Text>
            )}
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
  };

  return (
    <View style={[styles.container]}>
      {/* Immersive Background */}
      <Image source={{ uri: CHALLENGES_BG }} style={styles.bgImg} blurRadius={1} />
      <LinearGradient
        colors={['rgba(255,100,0,0.3)', 'rgba(0,80,255,0.25)', 'rgba(15,15,25,0.7)', COLORS.background]}
        locations={[0, 0.18, 0.5, 0.7]}
        style={styles.bgOverlay}
      />
      <View style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Text style={styles.title}>Défis</Text>
        <TouchableOpacity testID="create-challenge-btn" onPress={() => router.push('/create-challenge')} style={styles.createBtn}>
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Main tabs: Community / Friends */}
      <View style={styles.mainTabs}>
        <TouchableOpacity testID="tab-community" onPress={() => setMainTab('community')}
          style={[styles.mainTab, mainTab === 'community' && styles.mainTabActive]}>
          <Ionicons name="earth" size={18} color={mainTab === 'community' ? COLORS.primary : COLORS.textMuted} />
          <Text style={[styles.mainTabText, mainTab === 'community' && styles.mainTabTextActive]}>Communauté</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="tab-friends" onPress={() => setMainTab('friends')}
          style={[styles.mainTab, mainTab === 'friends' && styles.mainTabFriends]}>
          <Ionicons name="people" size={18} color={mainTab === 'friends' ? COLORS.secondary : COLORS.textMuted} />
          <Text style={[styles.mainTabText, mainTab === 'friends' && { color: COLORS.secondary }]}>Entre Amis</Text>
        </TouchableOpacity>
      </View>

      {/* Join by code (Friends tab) */}
      {mainTab === 'friends' && (
        <View style={styles.codeSection}>
          <TextInput testID="invite-code-input" style={styles.codeInput} placeholder="CODE D'INVITATION"
            placeholderTextColor={COLORS.textMuted} value={inviteCode} onChangeText={setInviteCode}
            autoCapitalize="characters" maxLength={6} />
          <TouchableOpacity testID="join-by-code-btn" onPress={handleJoinByCode} disabled={joining}
            style={[styles.codeBtn, inviteCode.length >= 4 && styles.codeBtnActive]}>
            {joining ? <ActivityIndicator size="small" color="#FFF" /> :
              <Ionicons name="arrow-forward" size={20} color={inviteCode.length >= 4 ? '#FFF' : COLORS.textMuted} />}
          </TouchableOpacity>
        </View>
      )}

      {/* Category filters (Community only) */}
      {mainTab === 'community' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {CATEGORY_TABS.map((cat) => (
            <TouchableOpacity key={cat} testID={`filter-${cat}`} onPress={() => setActiveTab(cat)}
              style={[styles.filterTab, activeTab === cat && styles.filterTabActive]}>
              <Text style={[styles.filterText, activeTab === cat && styles.filterTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120, paddingTop: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : displayList.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name={mainTab === 'friends' ? 'people' : 'search'} size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>
              {mainTab === 'friends' ? 'Pas encore de défis entre amis' : 'Aucun défi trouvé'}
            </Text>
            <Text style={styles.emptyText}>
              {mainTab === 'friends'
                ? 'Créez un défi privé ou rejoignez-en un avec un code !'
                : 'Changez de catégorie ou créez un nouveau défi'}
            </Text>
            {mainTab === 'friends' && (
              <TouchableOpacity testID="create-friends-challenge-btn" onPress={() => router.push('/create-challenge')}
                style={styles.emptyBtn}>
                <Ionicons name="add" size={18} color="#FFF" />
                <Text style={styles.emptyBtnText}>Créer un défi entre amis</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          displayList.map(renderCard)
        )}
      </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  bgImg: { position: 'absolute', top: 0, left: 0, right: 0, height: 500, width: '100%' },
  bgOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 500 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  createBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  // Main tabs
  mainTabs: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: COLORS.card, borderRadius: 14, padding: 4, marginBottom: 10 },
  mainTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
  mainTabActive: { backgroundColor: COLORS.primary + '18' },
  mainTabFriends: { backgroundColor: COLORS.secondary + '18' },
  mainTabText: { fontSize: 14, fontWeight: '700', color: COLORS.textMuted },
  mainTabTextActive: { color: COLORS.primary },
  // Code section
  codeSection: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 10 },
  codeInput: { flex: 1, backgroundColor: COLORS.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 4, textAlign: 'center', borderWidth: 1, borderColor: COLORS.border },
  codeBtn: { width: 52, height: 52, borderRadius: 14, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  codeBtnActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  // Category
  tabScroll: { paddingHorizontal: 20, paddingBottom: 8, gap: 8 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  filterTextActive: { color: '#FFF' },
  // Cards
  card: { marginHorizontal: 20, marginBottom: 14, borderRadius: 20, overflow: 'hidden', height: 195 },
  cardContent: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTopRight: { flexDirection: 'row', gap: 6 },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  catPillText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  friendsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.secondary + '35', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  friendsBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.secondary },
  potBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.warning + '30', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  potBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.warning },
  durPill: { backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  durText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },
  cardTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.3, marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  cardDesc: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 18, marginBottom: 10 },
  potHighlight: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  potHighlightText: { fontSize: 16, fontWeight: '900', color: '#FFD700' },
  potHighlightSub: { fontSize: 11, fontWeight: '600', color: '#FF3B30' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerText: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.55)' },
  joinHint: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.primary + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  joinText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  // Empty
  empty: { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', textAlign: 'center' },
  emptyText: { fontSize: 14, fontWeight: '500', color: COLORS.textMuted, textAlign: 'center' },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.secondary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, marginTop: 8 },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
