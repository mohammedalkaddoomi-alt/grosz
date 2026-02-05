import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/store';
import { Colors, Gradients } from '../../src/constants/theme';

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useStore();

  const handleLogout = () => {
    Alert.alert('Wyloguj', 'Na pewno?', [
      { text: 'Nie', style: 'cancel' },
      { text: 'Tak', onPress: () => { logout(); router.replace('/'); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <LinearGradient colors={Gradients.primary} style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
        </LinearGradient>
        <Text style={styles.name}>{user?.name || 'Użytkownik'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
      </View>

      {/* Menu Items */}
      <View style={styles.menu}>
        <MenuItem icon="person-outline" label="Edytuj profil" />
        <MenuItem icon="notifications-outline" label="Powiadomienia" />
        <MenuItem icon="shield-outline" label="Bezpieczeństwo" />
        <MenuItem icon="help-circle-outline" label="Pomoc" />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color={Colors.expense} />
        <Text style={styles.logoutText}>Wyloguj się</Text>
      </TouchableOpacity>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appName}>💰 Cenny Grosz</Text>
        <Text style={styles.appVersion}>Wersja 1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const MenuItem = ({ icon, label }: { icon: string; label: string }) => (
  <TouchableOpacity style={styles.menuItem}>
    <View style={styles.menuIcon}>
      <Ionicons name={icon as any} size={22} color={Colors.primary} />
    </View>
    <Text style={styles.menuLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  profileCard: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '700', color: Colors.white },
  name: { fontSize: 22, fontWeight: '700', color: Colors.text },
  email: { fontSize: 14, color: Colors.textLight, marginTop: 4 },
  menu: { backgroundColor: Colors.card, marginHorizontal: 20, borderRadius: 20, marginTop: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: Colors.text },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginTop: 24, backgroundColor: Colors.expense + '15', paddingVertical: 16, borderRadius: 16, gap: 8 },
  logoutText: { fontSize: 16, fontWeight: '600', color: Colors.expense },
  appInfo: { alignItems: 'center', marginTop: 'auto', paddingBottom: 100 },
  appName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  appVersion: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
});
