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
    { icon: 'flash', label: 'Creer un defi', color: '#007AFF', route: '/create-challenge' },
    { icon: 'enter', label: 'Rejoindre un defi', color: '#34C759', route: '/(tabs)/challenges' },
    { icon: 'people', label: 'Defier un ami', color: '#AF52DE', route: '/social' },
  ];

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <Pressable style={mn.overlay} onPress={onClose}>
        <Animated.View style={[mn.menu, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          {actions.map((a, i) => (
            <TouchableOpacity key={i} activeOpacity={0.8}
              onPress={() => { onClose(); router.push(a.route); }}
              style={mn.menuItem}>
              <View style={[mn.menuIcon, { backgroundColor: a.color + '18' }]}>
                <Ionicons name={a.icon as any} size={22} color={a.color} />
              </View>
              <Text style={mn.menuLabel}>{a.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          ))}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const mn = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end', paddingBottom: 110, paddingHorizontal: 20 },
  menu: { backgroundColor: '#16162A', borderRadius: 22, padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 16, borderRadius: 16 },
  menuIcon: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: '#FFF' },
});

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.06, duration: 1400, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 0.8, duration: 1400, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0.4, duration: 1400, useNativeDriver: true }),
    ])).start();
  }, []);

  const tabs = [
    { name: 'index', label: 'Accueil', icon: 'home', activeColor: '#007AFF' },
    { name: 'challenges', label: 'Defis', icon: 'flame', activeColor: '#FF6B35' },
    { name: 'publish', label: '', icon: 'add', activeColor: '#007AFF' },
    { name: 'leaderboard', label: 'Rang', icon: 'podium', activeColor: '#FFD700' },
    { name: 'profile', label: 'Profil', icon: 'person', activeColor: '#AF52DE' },
  ];

  return (
    <>
      <ActionMenu visible={menuOpen} onClose={() => setMenuOpen(false)} router={router} />
      <View style={[tb.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {/* Blur background */}
        <View style={tb.barBg} />

        {state.routes.map((route: any, index: number) => {
          const tab = tabs[index];
          if (!tab) return null;
          const isFocused = state.index === index;
          const isCenter = tab.name === 'publish';

          const onPress = () => {
            if (isCenter) { setMenuOpen(true); return; }
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          if (isCenter) {
            return (
              <TouchableOpacity key={tab.name} onPress={onPress} activeOpacity={0.8} style={tb.centerWrap}>
                {/* Glow behind button */}
                <Animated.View style={[tb.centerGlow, { opacity: glowAnim }]} />
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <LinearGradient
                    colors={['#00D4FF', '#007AFF', '#C850C0']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={tb.centerBtn}
                  >
                    {/* IT icon */}
                    <View style={tb.itRow}>
                      <Text style={tb.itI}>I</Text>
                      <Ionicons name="flash-sharp" size={16} color="#FFF" style={{ marginHorizontal: -3 }} />
                      <Text style={tb.itT}>T</Text>
                    </View>
                  </LinearGradient>
                </Animated.View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity key={tab.name} onPress={onPress} activeOpacity={0.7} style={tb.tab}>
              {/* Active glow dot */}
              {isFocused && <View style={[tb.activeGlow, { backgroundColor: tab.activeColor }]} />}
              <Ionicons
                name={(isFocused ? tab.icon : `${tab.icon}-outline`) as any}
                size={22}
                color={isFocused ? tab.activeColor : 'rgba(255,255,255,0.3)'}
              />
              <Text style={[tb.label, isFocused && { color: tab.activeColor }]}>{tab.label}</Text>
              {isFocused && <View style={[tb.activeDot, { backgroundColor: tab.activeColor }]} />}
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

const tb = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'relative',
  },
  barBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,8,20,0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, gap: 3, zIndex: 1 },
  label: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.3)' },
  activeGlow: { position: 'absolute', top: -6, width: 36, height: 3, borderRadius: 2, opacity: 0.6 },
  activeDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -28, zIndex: 10 },
  centerGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
  },
  centerBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(8,8,20,0.9)',
  },
  itRow: { flexDirection: 'row', alignItems: 'center' },
  itI: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  itT: { fontSize: 18, fontWeight: '900', color: '#FFF' },
});
