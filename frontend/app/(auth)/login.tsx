import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../src/store/store';
import { Colors, Gradients } from '../../src/constants/theme';

export default function Login() {
  const router = useRouter();
  const { login } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Błąd', 'Wypełnij wszystkie pola');
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Błąd', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={Colors.text} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Witaj ponownie 👋</Text>
        <Text style={styles.subtitle}>Zaloguj się do konta</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputBox}>
          <Ionicons name="mail-outline" size={20} color={Colors.textMuted} />
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={Colors.textMuted} />
        </View>
        <View style={styles.inputBox}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} />
          <TextInput style={styles.input} placeholder="Hasło" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={Colors.textMuted} />
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          <LinearGradient colors={Gradients.primary} style={styles.btnGradient}>
            {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Zaloguj się</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Nie masz konta? </Text>
        <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
          <Text style={styles.footerLink}>Zarejestruj się</Text>
        </TouchableOpacity>
      </View>
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
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', paddingBottom: 32 },
  footerText: { color: Colors.textLight },
  footerLink: { color: Colors.primary, fontWeight: '600' },
});
