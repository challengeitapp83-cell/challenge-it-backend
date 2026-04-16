import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../contexts/api';
import { COLORS } from '../contexts/theme';

const NOTIF_BG = 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=900&h=1200&fit=crop&q=75';

const ICONS: Record<string, { icon: string; color: string }> = {
  friend_request: { icon: 'person-add', color: '#007AFF' },
  friend_accepted: { icon: 'people', color: '#34C759' },
  challenge_invite: { icon: 'flash', color: '#FFD700' },
  challenge_activity: { icon: 'pulse', color: '#AF52DE' },
};

function timeAgo(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'a l\'instant';
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifs = useCallback(async () => {
    try {
      const data = await api.get('/api/notifications');
      setNotifs(data);
      // Mark all as read
      api.post('/api/notifications/read').catch(() => {});
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);
  const onRefresh = async () => { setRefreshing(true); await fetchNotifs(); setRefreshing(false); };

  const handlePress = (n: any) => {
    if (n.type === 'friend_request') {
      router.push('/social');
    } else if (n.type === 'challenge_invite' && n.data?.challenge_id) {
      router.push(`/challenge/${n.data.challenge_id}`);
    }
  };

  return (
    <View style={[g.root, { paddingTop: insets.top }]}>
      {/* Immersive Background */}
      <Image source={{ uri: NOTIF_BG }} style={g.bgImg} blurRadius={1} />
      <LinearGradient
        colors={['rgba(120,0,255,0.3)', 'rgba(0,80,200,0.25)', 'rgba(12,12,30,0.7)', '#0C0C18']}
        locations={[0, 0.15, 0.45, 0.65]}
        style={g.bgOverlay}
      />
      <View style={g.header}>
        <TouchableOpacity testID="notif-back" onPress={() => router.back()} style={g.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={g.title}>Notifications</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} /> :
        notifs.length === 0 ? (
          <View style={g.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={COLORS.textMuted} />
            <Text style={g.emptyT}>Aucune notification</Text>
          </View>
        ) : (
          notifs.map((n) => {
            const cfg = ICONS[n.type] || { icon: 'notifications', color: COLORS.primary };
            return (
              <TouchableOpacity
                key={n.notification_id}
                testID={`notif-${n.notification_id}`}
                onPress={() => handlePress(n)}
                activeOpacity={0.8}
                style={[s.card, !n.read && s.unread]}
              >
                <View style={[s.iconW, { backgroundColor: cfg.color + '18' }]}>
                  <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
                </View>
                <View style={s.body}>
                  <Text style={s.text}>{n.text}</Text>
                  <Text style={s.time}>{timeAgo(n.created_at)}</Text>
                </View>
                {!n.read && <View style={s.dot} />}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const GL = { backgroundColor: 'rgba(20,20,38,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' };

const g = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0C0C18' },
  bgImg: { position: 'absolute', top: 0, left: 0, right: 0, height: 500, width: '100%' } as any,
  bgOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 500 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: { width: 42, height: 42, borderRadius: 21, ...GL, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, fontSize: 24, fontWeight: '900', color: '#FFF' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyT: { fontSize: 16, fontWeight: '700', color: COLORS.textMuted },
});

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, ...GL, borderRadius: 16, padding: 14, marginBottom: 8 },
  unread: { borderColor: COLORS.primary + '25', backgroundColor: COLORS.primary + '06' },
  iconW: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  body: { flex: 1, gap: 4 },
  text: { fontSize: 14, fontWeight: '600', color: '#FFF', lineHeight: 19 },
  time: { fontSize: 11, fontWeight: '500', color: COLORS.textMuted },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
});
