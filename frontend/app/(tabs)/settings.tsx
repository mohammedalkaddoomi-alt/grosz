import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, SPACING, BORDER_RADIUS, GRADIENTS } from '../../src/constants/theme';
import { PL } from '../../src/constants/polish';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(PL.logout, 'Czy na pewno chcesz się wylogować?', [
      { text: PL.cancel, style: 'cancel' },
      { text: PL.logout, style: 'destructive', onPress: async () => { await logout(); router.replace('/'); } },
    ]);
  };

  const SettingItem = ({ icon, title, subtitle, onPress, showChevron = true, gradient }: any) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
      <LinearGradient colors={gradient || GRADIENTS.primary} style={styles.settingIcon}>
        <Ionicons name={icon} size={20} color={COLORS.white} />
      </LinearGradient>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showChevron && <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1A1A2E', '#16213E']} style={styles.headerGradient}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <Text style={styles.title}>{PL.settings}</Text>
          
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <LinearGradient colors={GRADIENTS.primary} style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
            </LinearGradient>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'Użytkownik'}</Text>
              <Text style={styles.profileEmail}>{user?.email || ''}</Text>
            </View>
            <TouchableOpacity style={styles.editBtn}>
              <Ionicons name="pencil" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Konto</Text>
          <View style={styles.sectionContent}>
            <SettingItem icon="person-outline" title="Edytuj profil" gradient={GRADIENTS.primary} />
            <SettingItem icon="lock-closed-outline" title="Zmień hasło" gradient={GRADIENTS.purple} />
            <SettingItem icon="shield-checkmark-outline" title="Bezpieczeństwo" gradient={GRADIENTS.income} />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferencje</Text>
          <View style={styles.sectionContent}>
            <SettingItem icon="notifications-outline" title="Powiadomienia" gradient={GRADIENTS.sunset} />
            <SettingItem icon="moon-outline" title="Motyw" subtitle="Jasny" gradient={GRADIENTS.ocean} />
            <SettingItem icon="language-outline" title="Język" subtitle="Polski" gradient={GRADIENTS.expense} />
            <SettingItem icon="cash-outline" title="Waluta" subtitle="PLN (zł)" gradient={GRADIENTS.income} />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wsparcie</Text>
          <View style={styles.sectionContent}>
            <SettingItem icon="help-circle-outline" title="Pomoc" gradient={GRADIENTS.primary} />
            <SettingItem icon="chatbubble-outline" title="Napisz do nas" gradient={GRADIENTS.purple} />
            <SettingItem icon="star-outline" title="Oceń aplikację" gradient={GRADIENTS.sunset} />
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informacje prawne</Text>
          <View style={styles.sectionContent}>
            <SettingItem icon="document-text-outline" title="Regulamin" gradient={['#64748b', '#475569']} />
            <SettingItem icon="shield-outline" title="Polityka prywatności" gradient={['#64748b', '#475569']} />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <View style={styles.appLogoSmall}>
            <Text style={styles.appLogoEmoji}>💰</Text>
          </View>
          <Text style={styles.appName}>Cenny Grosz</Text>
          <Text style={styles.appVersion}>Wersja 1.0.0</Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <LinearGradient colors={GRADIENTS.expense} style={styles.logoutGradient}>
            <Ionicons name="log-out-outline" size={22} color={COLORS.white} />
            <Text style={styles.logoutText}>{PL.logout}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerGradient: { paddingBottom: 20 },
  safeArea: { paddingHorizontal: SPACING.lg },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.white, marginTop: SPACING.sm, marginBottom: SPACING.lg },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: BORDER_RADIUS.lg, padding: SPACING.md },
  avatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: '700', color: COLORS.white },
  profileInfo: { flex: 1, marginLeft: SPACING.md },
  profileName: { fontSize: 18, fontWeight: '600', color: COLORS.white },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, marginTop: -10, borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: 100 },
  section: { marginBottom: SPACING.xl },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textLight, textTransform: 'uppercase', marginBottom: SPACING.sm, marginLeft: SPACING.xs },
  sectionContent: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  settingIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  settingText: { flex: 1, marginLeft: SPACING.md },
  settingTitle: { fontSize: 15, fontWeight: '500', color: COLORS.text },
  settingSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  appInfo: { alignItems: 'center', paddingVertical: SPACING.lg },
  appLogoSmall: { width: 48, height: 48, borderRadius: 24, backgroundColor: `${COLORS.primary}15`, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  appLogoEmoji: { fontSize: 24 },
  appName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  appVersion: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  logoutButton: { borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', marginTop: SPACING.md },
  logoutGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: SPACING.sm },
  logoutText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
});
