import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const LOGO_IMAGE = require('../assets/images/logo-full.png');

// Exact colors from logo analysis
const CYAN = '#00D4FF';
const MAGENTA = '#C850C0';
const DEEP_PURPLE = '#9D4CDD';

// ===== FULL LOGO IMAGE (actual PNG) =====
export function BrandLogoImage({ height = 50 }: { height?: number }) {
  return (
    <Image
      source={LOGO_IMAGE}
      style={{ height, width: height * 3.2 }}
      resizeMode="contain"
    />
  );
}

// ===== BRAND ICON (App icon style - "IT" + lightning) =====
export function BrandIcon({ size = 64 }: { size?: number }) {
  const r = size * 0.22;
  const bolt = size * 0.44;
  const fs = size * 0.38;

  return (
    <View style={[s.iconWrap, { width: size, height: size, borderRadius: r }]}>
      <LinearGradient
        colors={['#161630', '#0D0D1E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: r }]}
      />
      {/* Cyan glow top-right */}
      <View style={[s.iconGlow, { top: -size * 0.12, right: -size * 0.08, width: size * 0.5, height: size * 0.5, backgroundColor: CYAN }]} />
      {/* Magenta glow bottom-left */}
      <View style={[s.iconGlow, { bottom: -size * 0.1, left: -size * 0.08, width: size * 0.45, height: size * 0.45, backgroundColor: MAGENTA }]} />
      {/* Content */}
      <View style={s.iconContent}>
        <Ionicons
          name="flash-sharp"
          size={bolt}
          color={CYAN}
          style={{ position: 'absolute', opacity: 0.3, transform: [{ rotate: '-12deg' }, { translateX: -2 }] }}
        />
        <View style={s.iconTextRow}>
          <Text style={[s.iconLetterCyan, { fontSize: fs }]}>I</Text>
          <Text style={[s.iconLetterMagenta, { fontSize: fs }]}>T</Text>
        </View>
      </View>
      {/* Border */}
      <View style={[s.iconBorder, { borderRadius: r }]} />
    </View>
  );
}

// ===== BRAND LOGO TEXT ("CHALLENGE IT" with gradient letters) =====
export function BrandLogo({ size = 'large' }: { size?: 'large' | 'medium' | 'small' }) {
  const cfg = {
    large: { cFs: 28, itFs: 28, bolt: 22 },
    medium: { cFs: 20, itFs: 20, bolt: 16 },
    small: { cFs: 15, itFs: 15, bolt: 13 },
  }[size];

  return (
    <View style={s.logoRow}>
      <Text style={[s.challengeWord, { fontSize: cfg.cFs }]}>CHALLENGE</Text>
      <View style={s.itBlock}>
        <Ionicons name="flash-sharp" size={cfg.bolt} color={CYAN} style={{ marginRight: -4, opacity: 0.9 }} />
        <Text style={[s.itCyan, { fontSize: cfg.itFs }]}>I</Text>
        <Text style={[s.itMagenta, { fontSize: cfg.itFs }]}>T</Text>
      </View>
    </View>
  );
}

// ===== MINI ICON (Lightning bolt only) =====
export function BrandMini({ size = 20 }: { size?: number }) {
  return <Ionicons name="flash-sharp" size={size} color={CYAN} />;
}

// ===== COMBINED (icon left + text right) =====
export function BrandLogoFull() {
  return (
    <View style={s.fullRow}>
      <BrandIcon size={48} />
      <BrandLogo size="medium" />
    </View>
  );
}

// ===== LOADER (animated later, static for now) =====
export function BrandLoader({ size = 64 }: { size?: number }) {
  return (
    <View style={s.loaderW}>
      <BrandIcon size={size} />
    </View>
  );
}

const s = StyleSheet.create({
  // Icon
  iconWrap: { overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  iconGlow: { position: 'absolute', opacity: 0.1, borderRadius: 999 },
  iconContent: { justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  iconTextRow: { flexDirection: 'row', alignItems: 'center' },
  iconLetterCyan: { fontWeight: '900', color: CYAN, letterSpacing: -1 },
  iconLetterMagenta: { fontWeight: '900', color: MAGENTA, letterSpacing: -1 },
  iconBorder: { ...StyleSheet.absoluteFillObject, borderWidth: 1, borderColor: 'rgba(0,212,255,0.1)' },
  // Logo text
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  challengeWord: { fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  itBlock: { flexDirection: 'row', alignItems: 'center', marginLeft: 2 },
  itCyan: { fontWeight: '900', color: CYAN, letterSpacing: -0.5 },
  itMagenta: { fontWeight: '900', color: MAGENTA, letterSpacing: -0.5 },
  // Full
  fullRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  // Loader
  loaderW: { justifyContent: 'center', alignItems: 'center' },
});
