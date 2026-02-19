import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStore } from '../../src/store/store';
import { authService } from '../../src/services/authService';
import { Colors, Gradients, Shadows, BorderRadius, Spacing, Typography } from '../../src/constants/theme';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { AnimatedCard, AnimatedButton } from '../../src/components/AnimatedComponents';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();
const RESEND_COOLDOWN_SECONDS = 60;
const DEMO_LOGIN_EMAIL = 'demo@cennygrosz.app';
const DEMO_LOGIN_PASSWORD = 'demo123456';

export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login, register, init } = useStore();
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
    // Reset form errors when switching modes
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
        if (!isAvailable) {
          setUsernameError('Nazwa użytkownika zajęta');
        }
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
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const redirectTo = Linking.createURL('auth/callback');
      const { data, error } = await authService.signInWithGoogle(redirectTo);

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.url) {
        throw new Error('Nie udało się rozpocząć logowania Google');
      }

      // Open the OAuth URL
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success') {
        const { error: completionError } = await authService.completeOAuthSignIn(result.url);
        if (completionError) {
          throw completionError;
        }
        await init();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
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

    if (resendLoading || resendCooldown > 0) {
      return;
    }

    setResendLoading(true);
    const { error } = await authService.resendSignupConfirmation(trimmedEmail);
    setResendLoading(false);

    if (error) {
      const lower = String(error.message || '').toLowerCase();
      if (lower.includes('rate limit') || lower.includes('limit')) {
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
      }
      Alert.alert('Błąd', error.message || 'Nie udało się wysłać linku');
      return;
    }

    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    Alert.alert('Wysłano', 'Link weryfikacyjny został wysłany ponownie.');
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      return Alert.alert('Błąd', 'Wypełnij wszystkie pola');
    }
    if (!isLogin && !name.trim()) {
      return Alert.alert('Błąd', 'Podaj swoje imię');
    }
    if (!isLogin) {
      if (!username.trim()) return Alert.alert('Błąd', 'Podaj nazwę użytkownika');
      if (username.length < 3) return Alert.alert('Błąd', 'Nazwa użytkownika za krótka');
      if (usernameAvailable === false) return Alert.alert('Błąd', 'Nazwa użytkownika zajęta');
    }

    if (password.length < 6) {
      return Alert.alert('Błąd', 'Hasło musi mieć minimum 6 znaków');
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email.trim(), password);
        router.replace('/(tabs)');
      } else {
        await register(email.trim(), password, name.trim(), username.trim());
        const session = await authService.getCurrentSession();
        if (session) {
          router.replace('/(tabs)');
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
        Alert.alert(
          'Potwierdź email',
          'Najpierw potwierdź konto z linku w wiadomości email. Możesz też wysłać link ponownie.',
          [
            { text: 'Anuluj', style: 'cancel' },
            {
              text: 'Wyślij ponownie',
              onPress: () => {
                void handleResendVerificationEmail();
              }
            }
          ]
        );
        return;
      }

      if (lower.includes('rate limit') || lower.includes('limit emaili')) {
        Alert.alert(
          'Limit wiadomości email',
          'Za dużo prób rejestracji w krótkim czasie. Odczekaj kilka minut, potem spróbuj ponownie lub zaloguj się jeśli konto już istnieje.',
          [
            { text: 'OK', style: 'cancel' },
            {
              text: 'Przejdź do logowania',
              onPress: () => setIsLogin(true),
            }
          ]
        );
        return;
      }

      if (lower.includes('invalid login credentials') || lower.includes('nieprawidłowe dane logowania')) {
        const trimmedEmail = email.trim();
        const canResend = trimmedEmail.includes('@');

        Alert.alert(
          'Nieprawidłowe dane logowania',
          canResend
            ? 'Sprawdź email i hasło. Jeśli konto jest nowe, potwierdź email lub wyślij link ponownie.'
            : 'Sprawdź nazwę użytkownika i hasło.',
          canResend
            ? [
              { text: 'OK', style: 'cancel' },
              {
                text: 'Wyślij link ponownie',
                onPress: () => {
                  void handleResendVerificationEmail();
                }
              }
            ]
            : [{ text: 'OK', style: 'default' }]
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
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Błąd', e?.message || 'Nie udało się zalogować demo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background with Gradient */}
      <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {/* Logo & Header */}
            <Animated.View entering={FadeIn.delay(100).duration(800)}>
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Text style={styles.logoEmoji}>💰</Text>
                </View>
                <Text style={styles.appName}>Cenny Grosz</Text>
                <Text style={styles.tagline}>Finanse pod kontrolą</Text>
              </View>
            </Animated.View>

            {/* Auth Card */}
            <AnimatedCard entrance="slideUp" delay={300} style={styles.authCard}>
              {/* Toggle Switch */}
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleBtn, isLogin && styles.toggleBtnActive]}
                  onPress={() => !isLogin && toggleMode()}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Logowanie</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, !isLogin && styles.toggleBtnActive]}
                  onPress={() => isLogin && toggleMode()}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Rejestracja</Text>
                </TouchableOpacity>
              </View>

              {/* Form Fields */}
              <View style={styles.formContainer}>
                {!isLogin && (
                  <>
                    <View style={styles.inputWrapper}>
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

                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Nazwa użytkownika</Text>
                      <View style={[styles.inputContainer, usernameError ? { borderColor: Colors.error } : usernameAvailable ? { borderColor: Colors.success } : null]}>
                        <Ionicons name="at-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          value={username}
                          onChangeText={handleUsernameChange}
                          placeholder="nazwa_uzytkownika"
                          placeholderTextColor={Colors.textMuted}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                        {checkingUsername ? (
                          <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 10 }} />
                        ) : usernameAvailable ? (
                          <Ionicons name="checkmark-circle" size={20} color={Colors.success} style={{ marginRight: 10 }} />
                        ) : usernameError ? (
                          <Ionicons name="alert-circle" size={20} color={Colors.error} style={{ marginRight: 10 }} />
                        ) : null}
                      </View>
                      {usernameError ? <Text style={{ color: Colors.error, fontSize: 12, marginTop: 4, marginLeft: 4 }}>{usernameError}</Text> : null}
                    </View>
                  </>
                )}

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="email lub nazwa_uzytkownika"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="default"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                </View>

                <View style={styles.inputWrapper}>
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
                  <View style={styles.loginHelpRow}>
                    <TouchableOpacity style={styles.forgotBtn}>
                      <Text style={styles.forgotText}>Zapomniałeś hasła?</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.forgotBtn}
                      onPress={handleResendVerificationEmail}
                      disabled={resendLoading || resendCooldown > 0}
                    >
                      <Text style={[styles.forgotText, (resendLoading || resendCooldown > 0) && styles.forgotTextDisabled]}>
                        {resendLoading
                          ? 'Wysyłanie...'
                          : resendCooldown > 0
                            ? `Wyślij ponownie za ${resendCooldown}s`
                            : 'Wyślij weryfikację'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <AnimatedButton
                  style={styles.submitBtn}
                  onPress={handleSubmit}
                  disabled={loading}
                  hapticFeedback="medium"
                >
                  <LinearGradient colors={Gradients.primary} style={styles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    {loading ? (
                      <Text style={styles.submitText}>Przetwarzanie...</Text>
                    ) : (
                      <>
                        <Text style={styles.submitText}>{isLogin ? 'Zaloguj się' : 'Stwórz konto'}</Text>
                        <Ionicons name="arrow-forward" size={20} color={Colors.white} />
                      </>
                    )}
                  </LinearGradient>
                </AnimatedButton>
              </View>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>lub</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login */}
              <AnimatedButton
                style={styles.socialBtn}
                onPress={handleGoogleSignIn}
                disabled={googleLoading}
                hapticFeedback="light"
              >
                <View style={styles.socialIconContainer}>
                  <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} style={styles.socialIcon} />
                </View>
                <Text style={styles.socialBtnText}>Kontynuuj z Google</Text>
              </AnimatedButton>

              <AnimatedButton
                style={styles.demoBtn}
                onPress={handleDemoLogin}
                disabled={loading || googleLoading}
                hapticFeedback="light"
              >
                <Ionicons name="flask-outline" size={18} color={Colors.textLight} />
                <Text style={styles.demoBtnText}>Demo Login</Text>
              </AnimatedButton>
            </AnimatedCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },
  header: { alignItems: 'center', marginBottom: Spacing.xxl },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.medium,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoEmoji: { fontSize: 40 },
  appName: { fontSize: 32, fontWeight: '800', color: Colors.white, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 4, fontWeight: '500' },

  authCard: {
    backgroundColor: Colors.card,
    borderRadius: 32,
    padding: Spacing.xl,
    ...Shadows.large,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    padding: 4,
    marginBottom: Spacing.xl,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: Colors.card,
    ...Shadows.small,
  },
  toggleText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  toggleTextActive: { color: Colors.text, fontWeight: '700' },

  formContainer: { gap: Spacing.lg },
  inputWrapper: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.textLight, marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    height: 56,
  },
  inputIcon: { paddingLeft: Spacing.lg },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    color: Colors.text,
  },
  eyeBtn: { padding: Spacing.md },

  loginHelpRow: { flexDirection: 'row', justifyContent: 'space-between' },
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  forgotTextDisabled: { opacity: 0.6 },

  submitBtn: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  submitGradient: {
    flexDirection: 'row',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  submitText: { fontSize: 16, fontWeight: '700', color: Colors.white },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  dividerText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginHorizontal: Spacing.md,
    fontWeight: '500',
  },

  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    height: 56,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
  },
  socialIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIcon: { width: 22, height: 22 },
  socialBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  demoBtn: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    height: 44,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  demoBtnText: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '600',
  },
});
