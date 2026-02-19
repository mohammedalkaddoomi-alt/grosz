import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/store';
import { authService } from '../../src/services/authService';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Spacing, Shadows, BorderRadius } from '../../src/constants/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

export default function Register() {
  const router = useRouter();
  const { register, init } = useStore();
  const { colors, fontFamily, scaleFont } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) return Alert.alert('Błąd', 'Wypełnij wszystkie pola');
    if (password.length < 6) return Alert.alert('Błąd', 'Hasło min. 6 znaków');
    setLoading(true);
    try {
      const username = email.split('@')[0] + Math.floor(Math.random() * 1000).toString();
      await register(email, password, name, username);
      const session = await authService.getCurrentSession();
      if (session) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Konto utworzone', 'Sprawdź email i potwierdź rejestrację, potem zaloguj się.');
        router.replace('/(auth)/login');
      }
    } catch (e: any) {
      const message = String(e?.message || '');
      const lower = message.toLowerCase();
      if (lower.includes('rate limit') || lower.includes('limit emaili')) {
        Alert.alert('Limit wiadomości', 'Odczekaj kilka minut i spróbuj ponownie.', [
          { text: 'OK', style: 'cancel' },
          { text: 'Logowanie', onPress: () => router.replace('/(auth)/login') },
        ]);
      } else {
        Alert.alert('Błąd', message || 'Coś poszło nie tak');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const redirectTo = Linking.createURL('auth/callback');
      const { data, error } = await authService.signInWithGoogle(redirectTo);
      if (error) throw new Error(error.message);
      if (!data?.url) throw new Error('Nie udało się rozpocząć logowania Google');
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === 'success') {
        const { error: completionError } = await authService.completeOAuthSignIn(result.url);
        if (completionError) throw completionError;
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

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Back */}
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>

            {/* Header */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)}>
              <Text style={[s.title, { color: colors.text, fontFamily }]}>Stwórz konto 🚀</Text>
              <Text style={[s.subtitle, { color: colors.textLight, fontFamily }]}>Dołącz do Cenny Grosz</Text>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.delay(250).duration(500)} style={[s.card, { backgroundColor: colors.card }]}>
              {/* Name */}
              <View style={s.field}>
                <Text style={[s.label, { color: colors.textLight, fontFamily }]}>Imię</Text>
                <View style={[s.inputRow, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
                  <Ionicons name="person-outline" size={18} color={colors.textMuted} />
                  <TextInput
                    style={[s.input, { color: colors.text, fontFamily }]}
                    placeholder="Twoje imię"
                    placeholderTextColor={colors.textMuted}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Email */}
              <View style={s.field}>
                <Text style={[s.label, { color: colors.textLight, fontFamily }]}>Email</Text>
                <View style={[s.inputRow, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                  <TextInput
                    style={[s.input, { color: colors.text, fontFamily }]}
                    placeholder="twój@email.com"
                    placeholderTextColor={colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
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
                    placeholder="Minimum 6 znaków"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[s.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <View style={s.submitRow}>
                    <Text style={[s.submitText, { fontFamily }]}>Zarejestruj się</Text>
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
            </Animated.View>

            {/* Footer */}
            <View style={s.footer}>
              <Text style={[s.footerText, { color: colors.textLight, fontFamily }]}>Masz konto? </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text style={[s.footerLink, { color: colors.primary, fontFamily }]}>Zaloguj się</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  backBtn: { width: 44, height: 44, justifyContent: 'center', marginTop: Spacing.sm },

  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6, marginTop: 8 },
  subtitle: { fontSize: 15, fontWeight: '500', marginTop: 4, marginBottom: 28 },

  card: { borderRadius: 24, padding: Spacing.xl, ...Shadows.small },

  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginLeft: 2 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', height: 52,
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, gap: 10,
  },
  input: { flex: 1, fontSize: 15, height: '100%' },

  submitBtn: {
    height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 4,
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

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28, paddingBottom: 20 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '700' },
});
