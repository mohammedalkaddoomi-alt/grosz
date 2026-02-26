import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStore } from '../../src/store/store';
import { authService } from '../../src/services/authService';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Spacing, BorderRadius, Shadows } from '../../src/constants/theme';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();
const RESEND_COOLDOWN_SECONDS = 60;
const DEMO_LOGIN_EMAIL = 'demo@cennygrosz.app';
const DEMO_LOGIN_PASSWORD = 'demo123456';

export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login, register, init } = useStore();
  const { colors, fontFamily, scaleFont } = useTheme();
  const [isLogin, setIsLogin] = useState(params.initialIsLogin !== 'false');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const toggleMode = () => {
    Haptics.selectionAsync();
    setIsLogin(!isLogin);
    setUsernameError('');
    setUsernameAvailable(null);
  };

  const handleUsernameChange = (text: string) => {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9._]/g, '');
    setUsername(cleaned);
    setUsernameError('');
    setUsernameAvailable(null);
  };

  React.useEffect(() => {
    if (isLogin || username.length < 3) {
      setCheckingUsername(false);
      if (username.length > 0 && username.length < 3) setUsernameError('Minimum 3 znaki');
      return;
    }
    setCheckingUsername(true);
    const timeout = setTimeout(async () => {
      try {
        const isAvailable = await authService.checkUsernameAvailability(username);
        setUsernameAvailable(isAvailable);
        if (!isAvailable) setUsernameError('Nazwa użytkownika zajęta');
      } catch (err) {
        console.error('Check failed', err);
      } finally {
        setCheckingUsername(false);
      }
    }, 600);
    return () => clearTimeout(timeout);
  }, [username, isLogin]);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      // In Expo Go, we must construct the URL using createURL so it resolves to exp://...
      // providing the scheme ensures it matches app.json
      const redirectTo = Linking.createURL('auth/callback', { scheme: 'cenny-grosz' });
      const { data, error } = await authService.signInWithGoogle(redirectTo);
      if (error) throw new Error(error.message);
      if (!data?.url) throw new Error('Nie udało się rozpocząć logowania Google');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success') {
        const { error: completionError } = await authService.completeOAuthSignIn(result.url);
        if (completionError) throw completionError;
        await init();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const pinEnabled = useStore.getState().securitySettings.isPinEnabled;
        if (pinEnabled) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/setup-pin');
        }
      } else if (result.type !== 'cancel') {
        throw new Error('Logowanie Google zostało przerwane');
      }
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Błąd', e.message || 'Nie udało się zalogować przez Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResendVerificationEmail = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      Alert.alert('Podaj email', 'Wpisz poprawny email, aby wysłać link ponownie.');
      return;
    }
    if (resendLoading || resendCooldown > 0) return;
    setResendLoading(true);
    const { error } = await authService.resendSignupConfirmation(trimmedEmail);
    setResendLoading(false);
    if (error) {
      const lower = String(error.message || '').toLowerCase();
      if (lower.includes('rate limit') || lower.includes('limit')) setResendCooldown(RESEND_COOLDOWN_SECONDS);
      Alert.alert('Błąd', error.message || 'Nie udało się wysłać linku');
      return;
    }
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    Alert.alert('Wysłano', 'Link weryfikacyjny został wysłany ponownie.');
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return Alert.alert('Błąd', 'Wypełnij wszystkie pola');
    if (!isLogin && !name.trim()) return Alert.alert('Błąd', 'Podaj swoje imię');
    if (!isLogin) {
      if (!username.trim()) return Alert.alert('Błąd', 'Podaj nazwę użytkownika');
      if (username.length < 3) return Alert.alert('Błąd', 'Nazwa użytkownika za krótka');
      if (usernameAvailable === false) return Alert.alert('Błąd', 'Nazwa użytkownika zajęta');
    }
    if (password.length < 6) return Alert.alert('Błąd', 'Hasło musi mieć minimum 6 znaków');

    setLoading(true);
    try {
      if (isLogin) {
        await login(email.trim(), password);
        const pinEnabled = useStore.getState().securitySettings.isPinEnabled;
        if (pinEnabled) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/setup-pin');
        }
      } else {
        await register(email.trim(), password, name.trim(), username.trim());
        const session = await authService.getCurrentSession();
        if (session) {
          const pinEnabled = useStore.getState().securitySettings.isPinEnabled;
          if (pinEnabled) {
            router.replace('/(tabs)');
          } else {
            router.replace('/(auth)/setup-pin');
          }
        } else {
          Alert.alert('Konto utworzone', 'Sprawdź email i potwierdź rejestrację, potem zaloguj się.');
          setIsLogin(true);
        }
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = String(e?.message || '');
      const lower = message.toLowerCase();

      if (lower.includes('email not confirmed') || lower.includes('not confirmed')) {
        Alert.alert('Potwierdź email', 'Najpierw potwierdź konto z linku w wiadomości email.', [
          { text: 'Anuluj', style: 'cancel' },
          { text: 'Wyślij ponownie', onPress: () => void handleResendVerificationEmail() },
        ]);
        return;
      }
      if (lower.includes('rate limit') || lower.includes('limit emaili')) {
        Alert.alert('Limit wiadomości', 'Odczekaj kilka minut i spróbuj ponownie.', [
          { text: 'OK', style: 'cancel' },
          { text: 'Logowanie', onPress: () => setIsLogin(true) },
        ]);
        return;
      }
      if (lower.includes('invalid login credentials')) {
        const canResend = email.trim().includes('@');
        Alert.alert('Nieprawidłowe dane', 'Sprawdź email i hasło.',
          canResend
            ? [{ text: 'OK', style: 'cancel' }, { text: 'Wyślij link', onPress: () => void handleResendVerificationEmail() }]
            : [{ text: 'OK' }]
        );
        return;
      }
      Alert.alert('Błąd', message || 'Coś poszło nie tak');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLogin(true);
    setEmail(DEMO_LOGIN_EMAIL);
    setPassword(DEMO_LOGIN_PASSWORD);
    setLoading(true);
    try {
      await login(DEMO_LOGIN_EMAIL, DEMO_LOGIN_PASSWORD);
      const pinEnabled = useStore.getState().securitySettings.isPinEnabled;
      if (pinEnabled) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/setup-pin');
      }
    } catch (e: any) {
      Alert.alert('Błąd', e?.message || 'Nie udało się zalogować demo');
    } finally {
      setLoading(false);
    }
  };

  const inputBorder = (hasError?: boolean, isValid?: boolean) => ({
    borderColor: hasError ? '#EF4444' : isValid ? '#10B981' : colors.borderLight,
  });

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Branding */}
            <Animated.View entering={FadeIn.delay(100).duration(700)} style={s.branding}>
              <View style={[s.logoCircle, { backgroundColor: `${colors.primary}14` }]}>
                <Text style={s.logoEmoji}>💰</Text>
              </View>
              <Text style={[s.appName, { color: colors.text, fontFamily }]}>Cenny Grosz</Text>
              <Text style={[s.tagline, { color: colors.textLight, fontFamily }]}>Finanse pod kontrolą</Text>
            </Animated.View>

            {/* Card */}
            <Animated.View entering={FadeInUp.delay(250).duration(600)} style={[s.card, { backgroundColor: colors.card }]}>
              {/* Toggle */}
              <View style={[s.toggle, { backgroundColor: colors.background }]}>
                <TouchableOpacity
                  style={[s.toggleBtn, isLogin && [s.toggleActive, { backgroundColor: colors.card }]]}
                  onPress={() => !isLogin && toggleMode()}
                  activeOpacity={0.8}
                >
                  <Text style={[s.toggleText, { color: colors.textMuted, fontFamily }, isLogin && { color: colors.text, fontWeight: '700' }]}>
                    Logowanie
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.toggleBtn, !isLogin && [s.toggleActive, { backgroundColor: colors.card }]]}
                  onPress={() => isLogin && toggleMode()}
                  activeOpacity={0.8}
                >
                  <Text style={[s.toggleText, { color: colors.textMuted, fontFamily }, !isLogin && { color: colors.text, fontWeight: '700' }]}>
                    Rejestracja
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Register-only fields */}
              {!isLogin && (
                <>
                  <View style={s.field}>
                    <Text style={[s.label, { color: colors.textLight, fontFamily }]}>Imię</Text>
                    <View style={[s.inputRow, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
                      <Ionicons name="person-outline" size={18} color={colors.textMuted} />
                      <TextInput
                        style={[s.input, { color: colors.text, fontFamily }]}
                        value={name}
                        onChangeText={setName}
                        placeholder="Twoje imię"
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>

                  <View style={s.field}>
                    <Text style={[s.label, { color: colors.textLight, fontFamily }]}>Nazwa użytkownika</Text>
                    <View style={[s.inputRow, { backgroundColor: colors.background }, inputBorder(!!usernameError, !!usernameAvailable)]}>
                      <Ionicons name="at-outline" size={18} color={colors.textMuted} />
                      <TextInput
                        style={[s.input, { color: colors.text, fontFamily }]}
                        value={username}
                        onChangeText={handleUsernameChange}
                        placeholder="nazwa_uzytkownika"
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      {checkingUsername ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : usernameAvailable ? (
                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                      ) : usernameError ? (
                        <Ionicons name="alert-circle" size={18} color="#EF4444" />
                      ) : null}
                    </View>
                    {usernameError ? (
                      <Text style={[s.errorText, { fontFamily }]}>{usernameError}</Text>
                    ) : null}
                  </View>
                </>
              )}

              {/* Email */}
              <View style={s.field}>
                <Text style={[s.label, { color: colors.textLight, fontFamily }]}>Email</Text>
                <View style={[s.inputRow, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                  <TextInput
                    style={[s.input, { color: colors.text, fontFamily }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder={isLogin ? 'email lub nazwa_uzytkownika' : 'twój@email.com'}
                    placeholderTextColor={colors.textMuted}
                    keyboardType="default"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={s.field}>
                <Text style={[s.label, { color: colors.textLight, fontFamily }]}>Hasło</Text>
                <View style={[s.inputRow, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                  <TextInput
                    style={[s.input, { color: colors.text, fontFamily }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Helper row */}
              {isLogin && (
                <View style={s.helperRow}>
                  <TouchableOpacity>
                    <Text style={[s.helperText, { color: colors.primary, fontFamily }]}>Zapomniałeś hasła?</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleResendVerificationEmail}
                    disabled={resendLoading || resendCooldown > 0}
                  >
                    <Text style={[s.helperText, { color: colors.primary, fontFamily }, (resendLoading || resendCooldown > 0) && { opacity: 0.5 }]}>
                      {resendLoading ? 'Wysyłanie…' : resendCooldown > 0 ? `Za ${resendCooldown}s` : 'Wyślij weryfikację'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Submit */}
              <TouchableOpacity
                style={[s.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <View style={s.submitRow}>
                    <Text style={[s.submitText, { fontFamily }]}>{isLogin ? 'Zaloguj się' : 'Stwórz konto'}</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={s.divider}>
                <View style={[s.divLine, { backgroundColor: colors.borderLight }]} />
                <Text style={[s.divText, { color: colors.textMuted, fontFamily }]}>lub</Text>
                <View style={[s.divLine, { backgroundColor: colors.borderLight }]} />
              </View>

              {/* Google */}
              <TouchableOpacity
                style={[s.socialBtn, { backgroundColor: colors.background, borderColor: colors.borderLight }]}
                onPress={handleGoogleSignIn}
                disabled={googleLoading}
                activeOpacity={0.8}
              >
                <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} style={s.socialIcon} />
                <Text style={[s.socialText, { color: colors.text, fontFamily }]}>Kontynuuj z Google</Text>
              </TouchableOpacity>

              {/* Demo */}
              <TouchableOpacity
                style={[s.demoBtn, { borderColor: colors.border }]}
                onPress={handleDemoLogin}
                disabled={loading || googleLoading}
                activeOpacity={0.8}
              >
                <Ionicons name="flask-outline" size={16} color={colors.textLight} />
                <Text style={[s.demoText, { color: colors.textLight, fontFamily }]}>Demo Login</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xl },

  branding: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  logoEmoji: { fontSize: 36 },
  appName: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  tagline: { fontSize: 15, fontWeight: '500', marginTop: 4 },

  card: {
    borderRadius: 24, padding: Spacing.xl,
    ...Shadows.small,
  },

  toggle: { flexDirection: 'row', borderRadius: 14, padding: 3, marginBottom: 20 },
  toggleBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: 'center' },
  toggleActive: { ...Shadows.small },
  toggleText: { fontSize: 14, fontWeight: '600' },

  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginLeft: 2 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', height: 52,
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, gap: 10,
  },
  input: { flex: 1, fontSize: 15, height: '100%' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 2 },

  helperRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, marginTop: -4 },
  helperText: { fontSize: 13, fontWeight: '600' },

  submitBtn: {
    height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    marginTop: 4,
  },
  submitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divLine: { flex: 1, height: StyleSheet.hairlineWidth * 2 },
  divText: { fontSize: 13, fontWeight: '500', marginHorizontal: 12 },

  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, borderRadius: 14, borderWidth: 1, gap: 10,
  },
  socialIcon: { width: 20, height: 20 },
  socialText: { fontSize: 15, fontWeight: '600' },

  demoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 44, borderRadius: 12, borderWidth: 1, gap: 6, marginTop: 12,
  },
  demoText: { fontSize: 13, fontWeight: '600' },
});
