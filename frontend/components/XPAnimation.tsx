import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface XPPopupProps {
  amount: number;
  visible: boolean;
  onDone?: () => void;
}

export function XPPopup({ amount, visible, onDone }: XPPopupProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && amount > 0) {
      scale.setValue(0);
      translateY.setValue(0);
      opacity.setValue(0);
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scale, { toValue: 1.2, tension: 80, friction: 6, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]),
        Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.delay(800),
        Animated.parallel([
          Animated.timing(translateY, { toValue: -60, duration: 500, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
      ]).start(() => onDone?.());
    }
  }, [visible, amount]);

  if (!visible || amount <= 0) return null;

  return (
    <Animated.View style={[s.container, { opacity, transform: [{ scale }, { translateY }] }]}>
      <View style={s.badge}>
        <Ionicons name="star" size={18} color="#FFD700" />
        <Text style={s.text}>+{amount} XP</Text>
      </View>
    </Animated.View>
  );
}

interface LevelUpProps {
  level: number;
  visible: boolean;
  onDone?: () => void;
}

export function LevelUpPopup({ level, visible, onDone }: LevelUpProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0);
      glow.setValue(0);
      opacity.setValue(0);
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scale, { toValue: 1, tension: 50, friction: 5, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glow, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(glow, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          ]),
          { iterations: 3 }
        ),
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(() => onDone?.());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[l.overlay, { opacity }]}>
      <Animated.View style={[l.card, { transform: [{ scale }] }]}>
        <Animated.View style={[l.glowRing, { opacity: glow }]} />
        <Ionicons name="arrow-up-circle" size={48} color="#00D4FF" />
        <Text style={l.title}>LEVEL UP!</Text>
        <Text style={l.level}>Niveau {level}</Text>
        <Text style={l.sub}>Continue comme ca !</Text>
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: { position: 'absolute', top: '40%', alignSelf: 'center', zIndex: 999 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,215,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.4)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 },
  text: { fontSize: 22, fontWeight: '900', color: '#FFD700' },
});

const l = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999 },
  card: { alignItems: 'center', backgroundColor: 'rgba(20,20,40,0.95)', borderRadius: 28, padding: 36, borderWidth: 1, borderColor: 'rgba(0,212,255,0.2)', gap: 8, position: 'relative' },
  glowRing: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#00D4FF', top: -30 },
  title: { fontSize: 28, fontWeight: '900', color: '#00D4FF', letterSpacing: 3 },
  level: { fontSize: 42, fontWeight: '900', color: '#FFF' },
  sub: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginTop: 4 },
});
