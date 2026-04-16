import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../contexts/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const tabs = [
    { name: 'index', label: 'Accueil', icon: 'home' },
    { name: 'challenges', label: 'Défis', icon: 'flame' },
    { name: 'publish', label: 'Publier', icon: 'add' },
    { name: 'leaderboard', label: 'Classement', icon: 'podium' },
    { name: 'profile', label: 'Profil', icon: 'person' },
  ];

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route: any, index: number) => {
        const tab = tabs[index];
        if (!tab) return null;
        const isFocused = state.index === index;
        const isPublish = tab.name === 'publish';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isPublish) {
          return (
            <TouchableOpacity
              key={tab.name}
              testID="tab-publish"
              onPress={onPress}
              activeOpacity={0.8}
              style={styles.publishWrapper}
            >
              <LinearGradient
                colors={['#007AFF', '#9D4CDD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.publishButton}
              >
                <Ionicons name="add" size={32} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={tab.name}
            testID={`tab-${tab.name}`}
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.tab}
          >
            <Ionicons
              name={(isFocused ? tab.icon : `${tab.icon}-outline`) as any}
              size={24}
              color={isFocused ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="challenges" />
      <Tabs.Screen name="publish" />
      <Tabs.Screen name="leaderboard" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.tabBar,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  tabLabelActive: {
    color: COLORS.primary,
  },
  publishWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
  },
  publishButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
});
