import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/store';
import { Gradients, Shadows, BorderRadius, Spacing } from '../../src/constants/theme';
import { Wallet } from '../../src/types';
import { AnimatedCard, AnimatedButton } from '../../src/components/AnimatedComponents';
import { useDrawer } from '../../src/contexts/DrawerContext';
import { WallpaperBackground } from '../../src/components/WallpaperBackground';

export default function Profile() {
  const router = useRouter();
  const { colors: Colors, settings } = useTheme();
  const { openDrawer } = useDrawer();
  const styles = useMemo(() => getStyles(Colors), [Colors]);
  const { user, logout, stats, wallets } = useStore();

  const MenuItem = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon as any} size={22} color={Colors.primary} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  const handleLogout = () => {
    Alert.alert('Wyloguj', 'Na pewno chcesz się wylogować?', [
      { text: 'Nie', style: 'cancel' },
      {
        text: 'Tak',
        onPress: async () => {
          await logout();
          router.replace('/');
        }
      },
    ]);
  };

  const formatMoney = (n: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0 }).format(n);

  const sharedWallets = wallets.filter((w: Wallet) => w.is_shared);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
      {/* Wallpaper Background */}
      {settings.wallpaper && <WallpaperBackground wallpaper={settings.wallpaper} />}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={openDrawer} style={styles.hamburger} activeOpacity={0.7}>
            <Ionicons name="menu-outline" size={26} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Profil</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Profile Card */}
        <AnimatedCard entrance="rotate" delay={50}>
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
        </AnimatedCard>

        {/* Quick Actions */}
        <AnimatedCard entrance="bounce" delay={150}>
          <View style={styles.quickActions}>
            <AnimatedButton style={styles.quickActionBtn} onPress={() => router.push('/chat')} hapticFeedback="light">
              <LinearGradient colors={Gradients.primary} style={styles.quickActionIcon}>
                <Ionicons name="chatbubble-ellipses" size={22} color={Colors.white} />
              </LinearGradient>
              <View style={styles.quickActionInfo}>
                <Text style={styles.quickActionTitle}>Asystent AI</Text>
                <Text style={styles.quickActionSubtitle}>Porady finansowe</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </AnimatedButton>

            <AnimatedButton style={styles.quickActionBtn} onPress={() => router.push('/transactions')} hapticFeedback="light">
              <View style={[styles.quickActionIcon, styles.quickActionIconSecondary]}>
                <Ionicons name="receipt" size={22} color={Colors.primary} />
              </View>
              <View style={styles.quickActionInfo}>
                <Text style={styles.quickActionTitle}>Historia</Text>
                <Text style={styles.quickActionSubtitle}>Wszystkie transakcje</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </AnimatedButton>
          </View>
        </AnimatedCard>

        {/* Menu Items */}
        <AnimatedCard entrance="slideRight" delay={250}>
          <View style={styles.menu}>
            <Text style={styles.menuSectionTitle}>Ustawienia</Text>
            <MenuItem icon="person-outline" label="Edytuj profil" onPress={() => router.push('/(tabs)/settings')} />
            <MenuItem icon="notifications-outline" label="Powiadomienia" onPress={() => router.push('/(tabs)/settings')} />
            <MenuItem icon="shield-outline" label="Bezpieczeństwo" onPress={() => router.push('/(tabs)/security')} />
            <MenuItem icon="color-palette-outline" label="Wygląd" onPress={() => router.push('/(tabs)/customize')} />
          </View>
        </AnimatedCard>

        <AnimatedCard entrance="slideRight" delay={350}>
          <View style={styles.menu}>
            <Text style={styles.menuSectionTitle}>Pomoc</Text>
            <MenuItem icon="help-circle-outline" label="Centrum pomocy" onPress={() => Alert.alert('Informacja', 'Centrum pomocy zostanie wkrótce dodane')} />
            <MenuItem icon="chatbubbles-outline" label="Kontakt" onPress={() => Alert.alert('Kontakt', 'Email: support@grosz.pl')} />
            <MenuItem icon="document-text-outline" label="Regulamin" onPress={() => Alert.alert('Informacja', 'Regulamin zostanie wkrótce dodany')} />
            <MenuItem icon="shield-checkmark-outline" label="Polityka prywatności" onPress={() => Alert.alert('Informacja', 'Polityka prywatności zostanie wkrótce dodana')} />
          </View>
        </AnimatedCard>

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

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}



const getStyles = (Colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  wallpaper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  header: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hamburger: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, letterSpacing: -0.8 },
  profileCard: {
    alignItems: 'center',
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.xl,
    borderRadius: 28,
    paddingVertical: Spacing.xxl + 4,
    paddingHorizontal: Spacing.lg,
    ...Shadows.premium,
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
  name: { fontSize: 26, fontWeight: '800', color: Colors.text, letterSpacing: -0.8 },
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
  quickStatValue: { fontSize: 19, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  quickStatLabel: { fontSize: 12, color: Colors.textLight, marginTop: 4 },
  quickStatDivider: { width: 1, backgroundColor: Colors.borderLight },
  quickActions: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Spacing.lg + 2,
    borderRadius: 20,
    marginBottom: Spacing.md,
    ...Shadows.medium,
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
  quickActionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, letterSpacing: -0.3 },
  quickActionSubtitle: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  menu: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.xl,
    borderRadius: 20,
    marginTop: Spacing.xl,
    ...Shadows.medium,
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
