import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, SPACING, BORDER_RADIUS, GRADIENTS } from '../../src/constants/theme';
import { PL } from '../../src/constants/polish';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Błąd', 'Proszę wypełnić wszystkie pola');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Błąd', 'Hasła nie są identyczne');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Błąd', 'Hasło musi mieć minimum 6 znaków');
      return;
    }
    try {
      await register(email, password, name);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Błąd rejestracji', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#0F3460']}
        style={styles.gradient}
      >
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>

            <View style={styles.header}>
              <LinearGradient colors={GRADIENTS.income} style={styles.iconCircle}>
                <Ionicons name="rocket" size={32} color={COLORS.white} />
              </LinearGradient>
              <Text style={styles.title}>{PL.register}</Text>
              <Text style={styles.subtitle}>Stwórz konto i zacznij oszczędzać 🚀</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{PL.name}</Text>
                <View style={[styles.inputContainer, focused === 'name' && styles.inputFocused]}>
                  <Ionicons name="person-outline" size={20} color={focused === 'name' ? COLORS.income : 'rgba(255,255,255,0.5)'} />
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Jan Kowalski"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    autoCapitalize="words"
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused(null)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{PL.email}</Text>
                <View style={[styles.inputContainer, focused === 'email' && styles.inputFocused]}>
                  <Ionicons name="mail-outline" size={20} color={focused === 'email' ? COLORS.income : 'rgba(255,255,255,0.5)'} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="twoj@email.com"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{PL.password}</Text>
                <View style={[styles.inputContainer, focused === 'password' && styles.inputFocused]}>
                  <Ionicons name="lock-closed-outline" size={20} color={focused === 'password' ? COLORS.income : 'rgba(255,255,255,0.5)'} />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    secureTextEntry={!showPassword}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{PL.confirmPassword}</Text>
                <View style={[styles.inputContainer, focused === 'confirm' && styles.inputFocused]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={focused === 'confirm' ? COLORS.income : 'rgba(255,255,255,0.5)'} />
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    secureTextEntry={!showPassword}
                    onFocus={() => setFocused('confirm')}
                    onBlur={() => setFocused(null)}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.9}
              >
                <LinearGradient colors={GRADIENTS.income} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>{PL.register}</Text>
                      <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{PL.haveAccount}</Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.footerLink}>{PL.login}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  decorCircle1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(0, 217, 165, 0.1)', top: -100, right: -100,
  },
  decorCircle2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(56, 239, 125, 0.08)', bottom: 100, left: -80,
  },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: SPACING.lg, paddingTop: 60 },
  backButton: { width: 44, height: 44, justifyContent: 'center', marginBottom: SPACING.lg },
  header: { alignItems: 'center', marginBottom: 32 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  title: { fontSize: 32, fontWeight: '800', color: COLORS.white, marginBottom: SPACING.xs },
  subtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.6)' },
  form: { gap: SPACING.md },
  inputGroup: { gap: SPACING.xs },
  label: { fontSize: 14, fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginLeft: SPACING.xs },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.md, height: 56, gap: SPACING.sm,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputFocused: { borderColor: COLORS.income, backgroundColor: 'rgba(0, 217, 165, 0.1)' },
  input: { flex: 1, fontSize: 16, color: COLORS.white },
  submitButton: { borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', marginTop: SPACING.md },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, gap: SPACING.sm },
  submitButtonText: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', paddingTop: 32, gap: SPACING.xs },
  footerText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.6)' },
  footerLink: { fontSize: 14, color: COLORS.income, fontWeight: '600' },
});
