import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/store';
import { Colors, Gradients, Shadows, BorderRadius, Spacing } from '../../src/constants/theme';

export default function Profile() {
  const router = useRouter();
  const { user, logout, stats, wallets } = useStore();

  const handleLogout = () => {
    Alert.alert('Wyloguj', 'Na pewno chcesz się wylogować?', [
      { text: 'Nie', style: 'cancel' },
      { text: 'Tak', onPress: () => { logout(); router.replace('/'); } },
    ]);
  };

  const formatMoney = (n: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0 }).format(n);

  const sharedWallets = wallets.filter(w => w.is_shared);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
          
          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{formatMoney(stats?.total_balance || 0)}</Text>
              <Text style={styles.quickStatLabel}>Saldo</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{wallets.length}</Text>
              <Text style={styles.quickStatLabel}>Portfele</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{sharedWallets.length}</Text>
              <Text style={styles.quickStatLabel}>Wspólne</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(tabs)/chat')}>
            <LinearGradient colors={Gradients.primary} style={styles.quickActionIcon}>
              <Ionicons name="chatbubble-ellipses" size={22} color={Colors.white} />
            </LinearGradient>
            <View style={styles.quickActionInfo}>
              <Text style={styles.quickActionTitle}>Asystent AI</Text>
              <Text style={styles.quickActionSubtitle}>Porady finansowe</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(tabs)/transactions')}>
            <View style={[styles.quickActionIcon, styles.quickActionIconSecondary]}>
              <Ionicons name="receipt" size={22} color={Colors.primary} />
            </View>
            <View style={styles.quickActionInfo}>
              <Text style={styles.quickActionTitle}>Historia</Text>
              <Text style={styles.quickActionSubtitle}>Wszystkie transakcje</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menu}>
          <Text style={styles.menuSectionTitle}>Ustawienia</Text>
          <MenuItem icon="person-outline" label="Edytuj profil" onPress={() => {}} />
          <MenuItem icon="notifications-outline" label="Powiadomienia" onPress={() => {}} />
          <MenuItem icon="shield-outline" label="Bezpieczeństwo" onPress={() => {}} />
          <MenuItem icon="color-palette-outline" label="Wygląd" onPress={() => {}} />
        </View>

        <View style={styles.menu}>
          <Text style={styles.menuSectionTitle}>Pomoc</Text>
          <MenuItem icon="help-circle-outline" label="Centrum pomocy" onPress={() => {}} />
          <MenuItem icon="chatbubbles-outline" label="Kontakt" onPress={() => {}} />
          <MenuItem icon="document-text-outline" label="Regulamin" onPress={() => {}} />
          <MenuItem icon="shield-checkmark-outline" label="Polityka prywatności" onPress={() => {}} />
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

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const MenuItem = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.menuIcon}>
      <Ionicons name={icon as any} size={22} color={Colors.primary} />
    </View>
    <Text style={styles.menuLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text },
  profileCard: { 
    alignItems: 'center', 
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    ...Shadows.medium,
  },
  avatar: { 
    width: 88, 
    height: 88, 
    borderRadius: 44, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: Spacing.md,
  },
  avatarText: { fontSize: 36, fontWeight: '700', color: Colors.white },
  name: { fontSize: 24, fontWeight: '700', color: Colors.text },
  email: { fontSize: 14, color: Colors.textLight, marginTop: 4 },
  quickStats: { 
    flexDirection: 'row', 
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    width: '100%',
  },
  quickStatItem: { flex: 1, alignItems: 'center' },
  quickStatValue: { fontSize: 18, fontWeight: '700', color: Colors.text },
  quickStatLabel: { fontSize: 12, color: Colors.textLight, marginTop: 4 },
  quickStatDivider: { width: 1, backgroundColor: Colors.borderLight },
  quickActions: { 
    marginHorizontal: Spacing.xl, 
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  quickActionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Colors.card, 
    padding: Spacing.lg, 
    borderRadius: BorderRadius.xl,
    ...Shadows.small,
  },
  quickActionIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: BorderRadius.md, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  quickActionIconSecondary: { backgroundColor: Colors.primary + '15' },
  quickActionInfo: { flex: 1, marginLeft: Spacing.md },
  quickActionTitle: { fontSize: 16, fontWeight: '600', color: Colors.text },
  quickActionSubtitle: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  menu: { 
    backgroundColor: Colors.card, 
    marginHorizontal: Spacing.xl, 
    borderRadius: BorderRadius.xl, 
    marginTop: Spacing.xl,
    ...Shadows.small,
  },
  menuSectionTitle: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: Colors.textMuted, 
    paddingHorizontal: Spacing.lg, 
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: Spacing.md, 
    paddingHorizontal: Spacing.lg, 
    borderBottomWidth: 1, 
    borderBottomColor: Colors.borderLight,
  },
  menuIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: BorderRadius.md, 
    backgroundColor: Colors.primary + '15', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: Spacing.md,
  },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: Colors.text },
  logoutBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginHorizontal: Spacing.xl, 
    marginTop: Spacing.xxl, 
    backgroundColor: Colors.expenseLight, 
    paddingVertical: Spacing.lg, 
    borderRadius: BorderRadius.xl, 
    gap: Spacing.sm,
    ...Shadows.small,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: Colors.expense },
  appInfo: { alignItems: 'center', marginTop: Spacing.xxl },
  appName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  appVersion: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
});
