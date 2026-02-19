import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../src/store/store';
import { authService } from '../../src/services/authService';
import { Colors, Gradients } from '../../src/constants/theme';

export default function Register() {
  const router = useRouter();
  const { register } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
        Alert.alert(
          'Limit wiadomości email',
          'Za dużo prób rejestracji w krótkim czasie. Odczekaj kilka minut i spróbuj ponownie.',
          [
            { text: 'OK', style: 'cancel' },
            { text: 'Logowanie', onPress: () => router.replace('/(auth)/login') },
          ]
        );
      } else {
        Alert.alert('Błąd', message || 'Coś poszło nie tak');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Stwórz konto 🚀</Text>
          <Text style={styles.subtitle}>Dołącz do Cenny Grosz</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputBox}>
            <Ionicons name="person-outline" size={20} color={Colors.textMuted} />
            <TextInput style={styles.input} placeholder="Imię" value={name} onChangeText={setName} placeholderTextColor={Colors.textMuted} />
          </View>
          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={20} color={Colors.textMuted} />
            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={Colors.textMuted} />
          </View>
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} />
            <TextInput style={styles.input} placeholder="Hasło" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={Colors.textMuted} />
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
            <LinearGradient colors={Gradients.primary} style={styles.btnGradient}>
              {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Zarejestruj się</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Masz konto? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.footerLink}>Zaloguj się</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 24, paddingTop: 60 },
  back: { width: 40, height: 40, justifyContent: 'center' },
  header: { marginTop: 20, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 16, color: Colors.textLight, marginTop: 4 },
  form: { gap: 16 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 16, height: 56, gap: 12, borderWidth: 1, borderColor: Colors.border },
  input: { flex: 1, fontSize: 16, color: Colors.text },
  btn: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  btnGradient: { height: 56, justifyContent: 'center', alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32, paddingBottom: 32 },
  footerText: { color: Colors.textLight },
  footerLink: { color: Colors.primary, fontWeight: '600' },
});
