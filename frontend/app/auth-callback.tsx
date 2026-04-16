import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../contexts/api';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../contexts/theme';

export default function AuthCallback() {
  const router = useRouter();
  const { setUser, setToken } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processCallback = async () => {
      try {
        let sessionId: string | null = null;

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const hash = window.location.hash || '';
          const params = new URLSearchParams(hash.replace('#', ''));
          sessionId = params.get('session_id');
        }

        if (!sessionId) {
          router.replace('/(auth)/login');
          return;
        }

        const data = await api.post('/api/auth/session', { session_id: sessionId });
        if (data.session_token) {
          await setToken(data.session_token);
        }
        if (data.user) {
          setUser(data.user);
        }

        // Seed data on first login
        try {
          await api.post('/api/seed');
        } catch {}

        router.replace('/(tabs)');
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/(auth)/login');
      }
    };

    processCallback();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.text}>Connexion en cours...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
});
