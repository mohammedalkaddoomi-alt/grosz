import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/store';
import { Colors, Gradients, Shadows, BorderRadius, Spacing } from '../../src/constants/theme';

export default function Login() {
  const router = useRouter();
  const { login, register } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      return Alert.alert('Błąd', 'Wypełnij wszystkie pola');
    }
    if (!isLogin && !name.trim()) {
      return Alert.alert('Błąd', 'Podaj swoje imię');
    }
    if (password.length < 6) {
      return Alert.alert('Błąd', 'Hasło musi mieć minimum 6 znaków');
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, name.trim());
      }
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Błąd', e.message || 'Coś poszło nie tak');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <LinearGradient colors={Gradients.primary} style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>💰</Text>
            </LinearGradient>
            <Text style={styles.appName}>Cenny Grosz</Text>
            <Text style={styles.tagline}>Twoje finanse pod kontrolą</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Tab Switcher */}
            <View style={styles.tabSwitcher}>
              <TouchableOpacity
                style={[styles.tab, isLogin && styles.tabActive]}
                onPress={() => setIsLogin(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Logowanie</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, !isLogin && styles.tabActive]}
                onPress={() => setIsLogin(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Rejestracja</Text>
              </TouchableOpacity>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              {!isLogin && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Imię</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="Twoje imię"
                      placeholderTextColor={Colors.textMuted}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="twoj@email.pl"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Hasło</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              {isLogin && (
                <TouchableOpacity style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>Zapomniałeś hasła?</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
                <LinearGradient colors={Gradients.primary} style={styles.submitGradient}>
                  {loading ? (
                    <Text style={styles.submitText}>Ładowanie...</Text>
                  ) : (
                    <>
                      <Text style={styles.submitText}>{isLogin ? 'Zaloguj się' : 'Zarejestruj się'}</Text>
                      <Ionicons name="arrow-forward" size={20} color={Colors.white} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Features */}
            <View style={styles.features}>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name="wallet" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.featureText}>Zarządzaj portfelami</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name="people" size={20} color={Colors.shared} />
                </View>
                <Text style={styles.featureText}>Wspólne konta</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name="sparkles" size={20} color={Colors.warning} />
                </View>
                <Text style={styles.featureText}>Asystent AI</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Kontynuując, akceptujesz</Text>
            <View style={styles.footerLinks}>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Regulamin</Text>
              </TouchableOpacity>
              <Text style={styles.footerDot}>•</Text>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Politykę prywatności</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.xl },
  logoSection: { alignItems: 'center', paddingTop: Spacing.xxxl, paddingBottom: Spacing.xxl },
  logoContainer: { 
    width: 88, 
    height: 88, 
    borderRadius: BorderRadius.xxl, 
    justifyContent: 'center', 
    alignItems: 'center',
    ...Shadows.large,
  },
  logoEmoji: { fontSize: 44 },
  appName: { fontSize: 32, fontWeight: '800', color: Colors.text, marginTop: Spacing.lg },
  tagline: { fontSize: 15, color: Colors.textLight, marginTop: Spacing.xs },
  formSection: { flex: 1 },
  tabSwitcher: { 
    flexDirection: 'row', 
    backgroundColor: Colors.backgroundDark, 
    borderRadius: BorderRadius.lg, 
    padding: 4,
    marginBottom: Spacing.xl,
  },
  tab: { 
    flex: 1, 
    paddingVertical: Spacing.md, 
    borderRadius: BorderRadius.md, 
    alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.card, ...Shadows.small },
  tabText: { fontSize: 15, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.text },
  formCard: { 
    backgroundColor: Colors.card, 
    borderRadius: BorderRadius.xxl, 
    padding: Spacing.xl,
    ...Shadows.medium,
  },
  inputGroup: { marginBottom: Spacing.lg },
  inputLabel: { fontSize: 14, fontWeight: '600', color: Colors.textLight, marginBottom: Spacing.sm },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Colors.background, 
    borderRadius: BorderRadius.lg, 
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  inputIcon: { paddingLeft: Spacing.lg },
  input: { 
    flex: 1, 
    height: 52, 
    paddingHorizontal: Spacing.md, 
    fontSize: 16, 
    color: Colors.text,
  },
  eyeBtn: { padding: Spacing.md },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: Spacing.lg },
  forgotText: { fontSize: 14, color: Colors.primary, fontWeight: '500' },
  submitBtn: { borderRadius: BorderRadius.lg, overflow: 'hidden', marginTop: Spacing.sm, ...Shadows.medium },
  submitGradient: { 
    flexDirection: 'row', 
    height: 56, 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: Spacing.sm,
  },
  submitText: { fontSize: 17, fontWeight: '700', color: Colors.white },
  features: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginTop: Spacing.xxl,
    paddingVertical: Spacing.lg,
  },
  featureItem: { alignItems: 'center', gap: Spacing.sm },
  featureIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: BorderRadius.md, 
    backgroundColor: Colors.card, 
    justifyContent: 'center', 
    alignItems: 'center',
    ...Shadows.small,
  },
  featureText: { fontSize: 12, color: Colors.textLight, fontWeight: '500' },
  footer: { alignItems: 'center', paddingVertical: Spacing.xxl },
  footerText: { fontSize: 12, color: Colors.textMuted },
  footerLinks: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs },
  footerLink: { fontSize: 12, color: Colors.primary, fontWeight: '500' },
  footerDot: { fontSize: 12, color: Colors.textMuted, marginHorizontal: Spacing.sm },
});
