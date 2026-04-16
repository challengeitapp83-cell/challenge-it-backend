import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, Modal, Pressable } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../contexts/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function ActionMenu({ visible, onClose, router }: { visible: boolean; onClose: () => void; router: any }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const actions = [
    { icon: 'flash', label: 'Créer un défi', color: COLORS.primary, route: '/create-challenge' },
    { icon: 'enter', label: 'Rejoindre un défi', color: COLORS.success, route: '/(tabs)/challenges' },
    { icon: 'people', label: 'Défier un ami', color: COLORS.secondary, route: '/create-challenge' },
  ];

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <Pressable style={m.overlay} onPress={onClose}>
        <Animated.View style={[m.menu, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          {actions.map((a, i) => (
            <TouchableOpacity key={i} testID={`action-${a.icon}`} activeOpacity={0.8}
              onPress={() => { onClose(); router.push(a.route); }}
              style={m.menuItem}>
              <View style={[m.menuIcon, { backgroundColor: a.color + '18' }]}>
                <Ionicons name={a.icon as any} size={22} color={a.color} />
              </View>
              <Text style={m.menuLabel}>{a.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', paddingBottom: 100, paddingHorizontal: 20 },
  menu: { backgroundColor: '#1A1A2E', borderRadius: 20, padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 16, borderRadius: 14 },
  menuIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: '#FFF' },
});

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const tabs = [
    { name: 'index', label: 'Accueil', icon: 'home' },
    { name: 'challenges', label: 'Défis', icon: 'flame' },
    { name: 'publish', label: '', icon: 'add' },
    { name: 'leaderboard', label: 'Classement', icon: 'podium' },
    { name: 'profile', label: 'Profil', icon: 'person' },
  ];

  return (
    <>
      <ActionMenu visible={menuOpen} onClose={() => setMenuOpen(false)} router={router} />
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {state.routes.map((route: any, index: number) => {
          const tab = tabs[index];
          if (!tab) return null;
          const isFocused = state.index === index;
          const isCenter = tab.name === 'publish';

          const onPress = () => {
            if (isCenter) {
              setMenuOpen(true);
              return;
            }
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          if (isCenter) {
            return (
              <TouchableOpacity key={tab.name} testID="tab-publish" onPress={onPress} activeOpacity={0.8} style={styles.centerWrap}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <LinearGradient colors={['#007AFF', '#9D4CDD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.centerBtn}>
                    <Ionicons name="add" size={32} color="#FFF" />
                  </LinearGradient>
                </Animated.View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity key={tab.name} testID={`tab-${tab.name}`} onPress={onPress} activeOpacity={0.7} style={styles.tab}>
              <Ionicons name={(isFocused ? tab.icon : `${tab.icon}-outline`) as any} size={24}
                color={isFocused ? COLORS.primary : COLORS.textMuted} />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="challenges" />
      <Tabs.Screen name="publish" />
      <Tabs.Screen name="leaderboard" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', backgroundColor: '#0A0A14', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)', paddingTop: 8, alignItems: 'center', justifyContent: 'space-around' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, gap: 2 },
  tabLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted, marginTop: 2 },
  tabLabelActive: { color: COLORS.primary },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -30 },
  centerBtn: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 },
});
