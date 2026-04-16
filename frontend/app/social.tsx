import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, TextInput,
  StyleSheet, ActivityIndicator, Alert, Animated, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../contexts/api';
import { COLORS, BADGE_CONFIG } from '../contexts/theme';

type Tab = 'search' | 'requests' | 'friends';
const SOCIAL_BG = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&h=1200&fit=crop&q=75';

function Avatar({ u, size }: { u: any; size: number }) {
  if (u?.picture) return <Image source={{ uri: u.picture }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  return (
    <LinearGradient colors={['#007AFF', '#AF52DE']} style={{ width: size, height: size, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: size * 0.4, fontWeight: '800', color: '#FFF' }}>{u?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
    </LinearGradient>
  );
}

export default function SocialScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const searchTimeout = useRef<any>(null);

  const fetchSocial = useCallback(async () => {
    try {
      const [req, fri] = await Promise.all([
        api.get('/api/friends/requests').catch(() => []),
        api.get('/api/friends').catch(() => []),
      ]);
      setRequests(req);
      setFriends(fri);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { setLoading(true); fetchSocial(); }, [fetchSocial]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSocial();
    setRefreshing(false);
  };

  // Debounced search
  const handleSearch = (text: string) => {
    setQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.length < 1) { setResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await api.get(`/api/users/search?q=${encodeURIComponent(text)}`);
        setResults(r);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
  };

  const sendFriendRequest = async (userId: string, userName: string) => {
    setActionLoading(userId);
    try {
      const res = await api.post('/api/friends/request', { to_id: userId });
      Alert.alert('Envoye !', res.message || `Demande envoyee a ${userName}`);
      // Update local state
      setResults(prev => prev.map(u => u.user_id === userId ? { ...u, request_sent: true } : u));
      if (res.status === 'accepted') {
        fetchSocial();
      }
    } catch (e: any) {
      const msg = e.message?.includes('Deja') ? 'Deja ami ou demande existante' : 'Erreur';
      Alert.alert('Erreur', msg);
    } finally { setActionLoading(null); }
  };

  const acceptRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await api.post(`/api/friends/accept/${requestId}`);
      Alert.alert('Accepte !', 'Vous etes maintenant amis');
      fetchSocial();
    } catch { Alert.alert('Erreur', 'Impossible d\'accepter'); }
    finally { setActionLoading(null); }
  };

  const declineRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await api.post(`/api/friends/decline/${requestId}`);
      setRequests(prev => prev.filter(r => r.request_id !== requestId));
    } catch { Alert.alert('Erreur', 'Impossible de refuser'); }
    finally { setActionLoading(null); }
  };

  const handleChallenge = (targetUser: any) => {
    router.push({
      pathname: '/challenge-friend',
      params: {
        targetId: targetUser.user_id,
        targetName: targetUser.name,
        targetPicture: targetUser.picture || '',
      },
    });
  };

  return (
    <KeyboardAvoidingView style={g.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Immersive Background */}
      <Image source={{ uri: SOCIAL_BG }} style={g.bgImg} blurRadius={4} />
      <LinearGradient
        colors={['rgba(175,82,222,0.15)', 'rgba(0,30,100,0.2)', 'rgba(12,12,24,0.9)', '#0C0C18']}
        locations={[0, 0.12, 0.38, 0.52]}
        style={g.bgOverlay}
      />

      <View style={[g.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity testID="social-back" onPress={() => router.back()} style={g.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={g.title}>Social</Text>
        <TouchableOpacity testID="notif-btn" onPress={() => router.push('/notifications')} style={g.notifBtn}>
          <Ionicons name="notifications-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={tb.w}>
        {([
          { key: 'search', label: 'Rechercher', icon: 'search' },
          { key: 'requests', label: `Demandes${requests.length > 0 ? ` (${requests.length})` : ''}`, icon: 'person-add' },
          { key: 'friends', label: `Amis (${friends.length})`, icon: 'people' },
        ] as { key: Tab; label: string; icon: string }[]).map((t) => (
          <TouchableOpacity
            key={t.key}
            testID={`tab-${t.key}`}
            onPress={() => setTab(t.key)}
            style={[tb.tab, tab === t.key && tb.tabActive]}
          >
            <Ionicons name={t.icon as any} size={16} color={tab === t.key ? COLORS.primary : COLORS.textMuted} />
            <Text style={[tb.tabT, tab === t.key && { color: COLORS.primary }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        keyboardShouldPersistTaps="handled"
      >
        {/* ===== SEARCH TAB ===== */}
        {tab === 'search' && (
          <View style={sc.w}>
            <View style={sc.searchW}>
              <Ionicons name="search" size={20} color={COLORS.textMuted} />
              <TextInput
                testID="search-input"
                style={sc.input}
                placeholder="Rechercher un joueur..."
                placeholderTextColor={COLORS.textMuted}
                value={query}
                onChangeText={handleSearch}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
                  <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {searching && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />}

            {!searching && results.length === 0 && query.length > 0 && (
              <View style={sc.empty}>
                <Ionicons name="search-outline" size={40} color={COLORS.textMuted} />
                <Text style={sc.emptyT}>Aucun joueur trouve</Text>
              </View>
            )}

            {!searching && query.length === 0 && (
              <View style={sc.empty}>
                <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
                <Text style={sc.emptyT}>Trouve des joueurs a defier</Text>
                <Text style={sc.emptySub}>Tape un pseudo pour commencer</Text>
              </View>
            )}

            {results.map((u) => (
              <View key={u.user_id} style={sc.card}>
                <Avatar u={u} size={48} />
                <View style={sc.cardInfo}>
                  <Text style={sc.cardName}>{u.name}</Text>
                  <View style={sc.cardMeta}>
                    <Text style={sc.cardLevel}>Niv. {u.level || 1}</Text>
                    {u.badges && u.badges.length > 0 && (
                      <View style={sc.badgeRow}>
                        {u.badges.slice(0, 3).map((b: string) => {
                          const cfg = BADGE_CONFIG[b];
                          return cfg ? (
                            <View key={b} style={[sc.badge, { backgroundColor: cfg.color + '20' }]}>
                              <Ionicons name={cfg.icon as any} size={10} color={cfg.color} />
                            </View>
                          ) : null;
                        })}
                      </View>
                    )}
                  </View>
                </View>
                <View style={sc.actions}>
                  {u.is_friend ? (
                    <TouchableOpacity
                      testID={`challenge-${u.user_id}`}
                      onPress={() => handleChallenge(u)}
                      style={sc.challengeBtn}
                    >
                      <Ionicons name="flash" size={16} color="#FFF" />
                      <Text style={sc.challengeT}>Defier</Text>
                    </TouchableOpacity>
                  ) : u.request_sent ? (
                    <View style={sc.sentBadge}>
                      <Ionicons name="checkmark" size={14} color={COLORS.textMuted} />
                      <Text style={sc.sentT}>Envoye</Text>
                    </View>
                  ) : (
                    <View style={sc.btnRow}>
                      <TouchableOpacity
                        testID={`add-${u.user_id}`}
                        onPress={() => sendFriendRequest(u.user_id, u.name)}
                        disabled={actionLoading === u.user_id}
                        style={sc.addBtn}
                      >
                        {actionLoading === u.user_id ? <ActivityIndicator size="small" color={COLORS.primary} /> :
                          <Ionicons name="person-add" size={16} color={COLORS.primary} />}
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID={`challenge-${u.user_id}`}
                        onPress={() => handleChallenge(u)}
                        style={sc.challengeBtn}
                      >
                        <Ionicons name="flash" size={14} color="#FFF" />
                        <Text style={sc.challengeT}>Defier</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ===== REQUESTS TAB ===== */}
        {tab === 'requests' && (
          <View style={rq.w}>
            {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} /> :
            requests.length === 0 ? (
              <View style={sc.empty}>
                <Ionicons name="person-add-outline" size={48} color={COLORS.textMuted} />
                <Text style={sc.emptyT}>Aucune demande en attente</Text>
              </View>
            ) : (
              requests.map((r) => (
                <View key={r.request_id} style={rq.card}>
                  <Avatar u={{ picture: r.from_picture, name: r.from_name }} size={48} />
                  <View style={rq.info}>
                    <Text style={rq.name}>{r.from_name}</Text>
                    <Text style={rq.sub}>veut etre ton ami</Text>
                  </View>
                  <View style={rq.actions}>
                    <TouchableOpacity
                      testID={`accept-${r.request_id}`}
                      onPress={() => acceptRequest(r.request_id)}
                      disabled={actionLoading === r.request_id}
                      style={rq.acceptBtn}
                    >
                      {actionLoading === r.request_id ? <ActivityIndicator size="small" color="#FFF" /> :
                        <Ionicons name="checkmark" size={20} color="#FFF" />}
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID={`decline-${r.request_id}`}
                      onPress={() => declineRequest(r.request_id)}
                      style={rq.declineBtn}
                    >
                      <Ionicons name="close" size={20} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ===== FRIENDS TAB ===== */}
        {tab === 'friends' && (
          <View style={fr.w}>
            {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} /> :
            friends.length === 0 ? (
              <View style={sc.empty}>
                <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
                <Text style={sc.emptyT}>Pas encore d'amis</Text>
                <Text style={sc.emptySub}>Recherche des joueurs et ajoute-les !</Text>
                <TouchableOpacity onPress={() => setTab('search')} style={fr.findBtn}>
                  <Ionicons name="search" size={16} color="#FFF" />
                  <Text style={fr.findT}>Trouver des joueurs</Text>
                </TouchableOpacity>
              </View>
            ) : (
              friends.map((f) => (
                <View key={f.user_id} style={fr.card}>
                  <Avatar u={f} size={48} />
                  <View style={fr.info}>
                    <Text style={fr.name}>{f.name}</Text>
                    <View style={fr.meta}>
                      <Text style={fr.level}>Niv. {f.level || 1}</Text>
                      <View style={fr.dot} />
                      <Ionicons name="flame" size={12} color="#FF6B35" />
                      <Text style={fr.streak}>{f.streak || 0}j</Text>
                      <View style={fr.dot} />
                      <Text style={fr.pts}>{f.points || 0} XP</Text>
                    </View>
                    {f.badges && f.badges.length > 0 && (
                      <View style={sc.badgeRow}>
                        {f.badges.slice(0, 4).map((b: string) => {
                          const cfg = BADGE_CONFIG[b];
                          return cfg ? (
                            <View key={b} style={[sc.badge, { backgroundColor: cfg.color + '20' }]}>
                              <Ionicons name={cfg.icon as any} size={10} color={cfg.color} />
                            </View>
                          ) : null;
                        })}
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    testID={`challenge-friend-${f.user_id}`}
                    onPress={() => handleChallenge(f)}
                    style={fr.challengeBtn}
                  >
                    <LinearGradient colors={['#007AFF', '#AF52DE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={fr.challengeGrad}>
                      <Ionicons name="flash" size={16} color="#FFF" />
                      <Text style={fr.challengeT}>Defier</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const GL = { backgroundColor: 'rgba(20,20,38,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' };

const g = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0C0C18' },
  bgImg: { position: 'absolute', top: 0, left: 0, right: 0, height: 420, width: '100%' },
  bgOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 420 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  backBtn: { width: 42, height: 42, borderRadius: 21, ...GL, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, fontSize: 24, fontWeight: '900', color: '#FFF' },
  notifBtn: { width: 42, height: 42, borderRadius: 21, ...GL, justifyContent: 'center', alignItems: 'center' },
});

const tb = StyleSheet.create({
  w: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: 'rgba(20,20,34,0.6)', borderRadius: 14, padding: 4, marginBottom: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 12 },
  tabActive: { backgroundColor: COLORS.primary + '18' },
  tabT: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
});

const sc = StyleSheet.create({
  w: { paddingHorizontal: 16 },
  searchW: { flexDirection: 'row', alignItems: 'center', gap: 10, ...GL, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: '#FFF' },
  empty: { alignItems: 'center', paddingTop: 50, gap: 10 },
  emptyT: { fontSize: 16, fontWeight: '700', color: COLORS.textMuted },
  emptySub: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.3)' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, ...GL, borderRadius: 16, padding: 14, marginTop: 10 },
  cardInfo: { flex: 1, gap: 4 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardLevel: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  badgeRow: { flexDirection: 'row', gap: 4, marginTop: 2 },
  badge: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  actions: { gap: 6 },
  btnRow: { flexDirection: 'row', gap: 6 },
  addBtn: { width: 40, height: 40, borderRadius: 12, ...GL, borderColor: COLORS.primary + '30', justifyContent: 'center', alignItems: 'center' },
  challengeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  challengeT: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  sentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  sentT: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
});

const rq = StyleSheet.create({
  w: { paddingHorizontal: 16 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, ...GL, borderRadius: 16, padding: 14, marginBottom: 10 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  sub: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  actions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  declineBtn: { width: 44, height: 44, borderRadius: 14, ...GL, justifyContent: 'center', alignItems: 'center' },
});

const fr = StyleSheet.create({
  w: { paddingHorizontal: 16 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, ...GL, borderRadius: 16, padding: 14, marginBottom: 10 },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  level: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  streak: { fontSize: 12, fontWeight: '600', color: '#FF6B35' },
  pts: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.15)' },
  challengeBtn: { borderRadius: 12, overflow: 'hidden' },
  challengeGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10 },
  challengeT: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  findBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, marginTop: 8 },
  findT: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
