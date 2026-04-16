import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// ===== BRAND ICON (App Store style square icon) =====
export function BrandIcon({ size = 64 }: { size?: number }) {
  const r = size * 0.22;
  const bolt = size * 0.42;
  const fs = size * 0.36;

  return (
    <View style={[s.iconWrap, { width: size, height: size, borderRadius: r }]}>
      <LinearGradient
        colors={['#161630', '#0D0D1E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: r }]}
      />
      {/* Glow effect */}
      <View style={[s.iconGlow, { top: -size * 0.15, right: -size * 0.1, width: size * 0.6, height: size * 0.6 }]} />
      {/* Content */}
      <View style={s.iconContent}>
        <Ionicons
          name="flash-sharp"
          size={bolt}
          color="#007AFF"
          style={{ position: 'absolute', opacity: 0.35, transform: [{ rotate: '-10deg' }] }}
        />
        <View style={s.iconTextRow}>
          <Text style={[s.iconLetterBlue, { fontSize: fs }]}>I</Text>
          <Text style={[s.iconLetterPurple, { fontSize: fs }]}>T</Text>
        </View>
      </View>
      {/* Border */}
      <View style={[s.iconBorder, { borderRadius: r }]} />
    </View>
  );
}

// ===== BRAND LOGO TEXT ("CHALLENGE IT") =====
export function BrandLogo({ size = 'large' }: { size?: 'large' | 'medium' | 'small' }) {
  const cfg = {
    large: { cFs: 30, itFs: 30, bolt: 22 },
    medium: { cFs: 20, itFs: 20, bolt: 16 },
    small: { cFs: 15, itFs: 15, bolt: 13 },
  }[size];

  return (
    <View style={s.logoRow}>
      <Text style={[s.challengeWord, { fontSize: cfg.cFs }]}>CHALLENGE</Text>
      <Ionicons name="flash-sharp" size={cfg.bolt} color="#007AFF" style={{ marginHorizontal: -2 }} />
      <Text style={[s.itBlue, { fontSize: cfg.itFs }]}>I</Text>
      <Text style={[s.itPurple, { fontSize: cfg.itFs }]}>T</Text>
    </View>
  );
}

// ===== COMBINED (icon left + text right) =====
export function BrandLogoFull() {
  return (
    <View style={s.fullRow}>
      <BrandIcon size={52} />
      <BrandLogo size="medium" />
    </View>
  );
}

const s = StyleSheet.create({
  // Icon
  iconWrap: { overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  iconGlow: { position: 'absolute', backgroundColor: '#007AFF', opacity: 0.08, borderRadius: 999 },
  iconContent: { justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  iconTextRow: { flexDirection: 'row', alignItems: 'center' },
  iconLetterBlue: { fontWeight: '900', color: '#007AFF', letterSpacing: -1 },
  iconLetterPurple: { fontWeight: '900', color: '#9D4CDD', letterSpacing: -1 },
  iconBorder: { ...StyleSheet.absoluteFillObject, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  // Logo text
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  challengeWord: { fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  itBlue: { fontWeight: '900', color: '#007AFF', letterSpacing: -0.5 },
  itPurple: { fontWeight: '900', color: '#9D4CDD', letterSpacing: -0.5 },
  // Full
  fullRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
