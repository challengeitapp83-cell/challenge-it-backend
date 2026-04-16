import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../contexts/theme';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { api } from '../../contexts/api';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_gamified-goals-12/artifacts/5kk57hyk_challenge%20it%20%281%29.png';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser, setToken } = useAuth();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
        const redirectUrl = window.location.origin + '/auth-callback';
        window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
      } else {
        const returnUrl = Linking.createURL('/auth-callback');
        const result = await WebBrowser.openAuthSessionAsync(
          `https://auth.emergentagent.com/?redirect=${encodeURIComponent(returnUrl)}`,
          returnUrl
        );
        if (result.type === 'success' && result.url) {
          const hashPart = result.url.split('#')[1] || '';
          const params = new URLSearchParams(hashPart);
          const sessionId = params.get('session_id');
          if (sessionId) {
            const data = await api.post('/api/auth/session', { session_id: sessionId });
            if (data.session_token) {
              await setToken(data.session_token);
            }
            if (data.user) {
              setUser(data.user);
            }
            router.replace('/(tabs)');
          }
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Official Logo */}
        <View style={styles.logoSection}>
          <Image
            source={{ uri: LOGO_URL }}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Relève le défi. Prouve-le.</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {[
            { icon: 'trophy', text: 'Défis quotidiens', color: COLORS.warning },
            { icon: 'flame', text: 'Streak & progression', color: '#FF6B35' },
            { icon: 'people', text: 'Classement global', color: COLORS.primary },
            { icon: 'medal', text: 'Badges premium', color: COLORS.secondary },
          ].map((item, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.featureText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Login Button */}
        <TouchableOpacity
          testID="google-login-button"
          onPress={handleGoogleLogin}
          disabled={loading}
          activeOpacity={0.8}
          style={styles.loginButton}
        >
          <LinearGradient
            colors={['#007AFF', '#9D4CDD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.loginGradient}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="logo-google" size={22} color="#FFFFFF" />
                <Text style={styles.loginText}>Continuer avec Google</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          En continuant, vous acceptez nos conditions d'utilisation
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12122A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 280,
    height: 120,
    marginBottom: SPACING.md,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  features: {
    marginBottom: 40,
    gap: SPACING.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  loginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: SPACING.sm,
  },
  loginText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
