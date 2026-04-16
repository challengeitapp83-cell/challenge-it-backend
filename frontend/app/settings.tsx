import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch,
  StyleSheet, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../contexts/theme';

const SETTINGS_BG = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&h=600&fit=crop&q=70';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [notifs, setNotifs] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const handleLogout = () => {
    Alert.alert('Deconnexion', 'Tu veux vraiment te deconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Deconnecter', style: 'destructive', onPress: logout },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Supprimer le compte', 'Cette action est irreversible. Toutes tes donnees seront supprimees.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => Alert.alert('Contacte-nous', 'Envoie un email a support@challengeit.app') },
    ]);
  };

  return (
    <View style={g.root}>
      <Image source={{ uri: SETTINGS_BG }} style={g.bgImg} blurRadius={6} />
      <LinearGradient colors={['rgba(0,40,120,0.15)', 'rgba(12,12,24,0.85)', '#0C0C1A']} locations={[0, 0.3, 0.5]} style={g.bgOverlay} />

      <View style={[g.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={g.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={g.title}>Parametres</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* User card */}
        <View style={u.card}>
          {user?.picture ? <Image source={{ uri: user.picture }} style={u.av} /> :
            <LinearGradient colors={['#00D4FF', '#C850C0']} style={u.av}>
              <Text style={u.avI}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
            </LinearGradient>}
          <View style={u.info}>
            <Text style={u.name}>{user?.name || 'Challenger'}</Text>
            <Text style={u.email}>{user?.email || ''}</Text>
          </View>
          <View style={u.lvlBadge}>
            <Text style={u.lvlT}>Niv. {user?.level || 1}</Text>
          </View>
        </View>

        {/* Account */}
        <Text style={sec.title}>Compte</Text>
        <View style={sec.card}>
          <SettingRow icon="person" label="Modifier le pseudo" onPress={() => Alert.alert('Bientot', 'Fonctionnalite a venir')} />
          <Divider />
          <SettingRow icon="camera" label="Changer la photo" onPress={() => Alert.alert('Bientot', 'Fonctionnalite a venir')} />
          <Divider />
          <SettingRow icon="mail" label="Email" value={user?.email?.substring(0, 20) || ''} />
        </View>

        {/* App */}
        <Text style={sec.title}>Application</Text>
        <View style={sec.card}>
          <SettingToggle icon="notifications" label="Notifications" value={notifs} onToggle={setNotifs} />
          <Divider />
          <SettingToggle icon="volume-high" label="Sons" value={sounds} onToggle={setSounds} />
          <Divider />
          <SettingToggle icon="moon" label="Mode sombre" value={darkMode} onToggle={setDarkMode} />
        </View>

        {/* Security */}
        <Text style={sec.title}>Securite</Text>
        <View style={sec.card}>
          <SettingRow icon="lock-closed" label="Changer le mot de passe" onPress={() => Alert.alert('Bientot', 'Fonctionnalite a venir')} />
          <Divider />
          <SettingRow icon="log-out" label="Deconnexion" color="#FF6B35" onPress={handleLogout} />
          <Divider />
          <SettingRow icon="trash" label="Supprimer le compte" color="#FF3B30" onPress={handleDelete} />
        </View>

        {/* Legal */}
        <Text style={sec.title}>Legal</Text>
        <View style={sec.card}>
          <SettingRow icon="document-text" label="Conditions d'utilisation" onPress={() => router.push({ pathname: '/legal', params: { page: 'cgu' } })} />
          <Divider />
          <SettingRow icon="card" label="Politique de paiement" onPress={() => router.push({ pathname: '/legal', params: { page: 'paiement' } })} />
          <Divider />
          <SettingRow icon="shield-checkmark" label="Politique de confidentialite" onPress={() => router.push({ pathname: '/legal', params: { page: 'confidentialite' } })} />
          <Divider />
          <SettingRow icon="information-circle" label="A propos" value="v1.0.0" />
        </View>

        <Text style={g.version}>Challenge It v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

function SettingRow({ icon, label, value, color, onPress }: { icon: string; label: string; value?: string; color?: string; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={0.7} style={r.row}>
      <View style={[r.iconW, { backgroundColor: (color || '#007AFF') + '12' }]}>
        <Ionicons name={icon as any} size={18} color={color || '#007AFF'} />
      </View>
      <Text style={[r.label, color && { color }]}>{label}</Text>
      {value ? <Text style={r.value}>{value}</Text> : onPress ? <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" /> : null}
    </TouchableOpacity>
  );
}

function SettingToggle({ icon, label, value, onToggle }: { icon: string; label: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={r.row}>
      <View style={[r.iconW, { backgroundColor: '#007AFF12' }]}>
        <Ionicons name={icon as any} size={18} color="#007AFF" />
      </View>
      <Text style={r.label}>{label}</Text>
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: '#333', true: '#00D4FF' }} thumbColor="#FFF" />
    </View>
  );
}

function Divider() { return <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginLeft: 54 }} />; }

const GL = { backgroundColor: 'rgba(25,30,60,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' };

const g = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0C0C1A' },
  bgImg: { position: 'absolute', top: 0, left: 0, right: 0, height: 350, width: '100%' } as any,
  bgOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 350 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, gap: 12 },
  backBtn: { width: 42, height: 42, borderRadius: 21, ...GL, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, fontSize: 24, fontWeight: '900', color: '#FFF', textAlign: 'center' },
  version: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.15)', textAlign: 'center', marginTop: 24 },
});

const u = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, marginBottom: 24, ...GL, borderRadius: 20, padding: 18 },
  av: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  avI: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  email: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.4)' },
  lvlBadge: { backgroundColor: '#00D4FF15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  lvlT: { fontSize: 13, fontWeight: '700', color: '#00D4FF' },
});

const sec = StyleSheet.create({
  title: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.5, paddingHorizontal: 20, marginBottom: 8, marginTop: 8 },
  card: { marginHorizontal: 16, ...GL, borderRadius: 18, marginBottom: 16, overflow: 'hidden' },
});

const r = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  iconW: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  label: { flex: 1, fontSize: 15, fontWeight: '600', color: '#FFF' },
  value: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.3)' },
});
