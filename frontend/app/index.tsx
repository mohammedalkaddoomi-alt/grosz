import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../src/store/store';
import { Colors, Gradients } from '../src/constants/theme';

export default function Welcome() {
  const router = useRouter();
  const { isLoggedIn } = useStore();

  useEffect(() => {
    if (isLoggedIn) router.replace('/(tabs)');
  }, [isLoggedIn]);

  return (
    <LinearGradient colors={Gradients.primary} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoBox}>
          <Text style={styles.logo}>💰</Text>
        </View>
        <Text style={styles.title}>Cenny Grosz</Text>
        <Text style={styles.subtitle}>Prosty sposób na zarządzanie{`\n`}Twoimi finansami</Text>
      </View>

      <View style={styles.features}>
        <Feature icon="wallet" text="Śledź wydatki" />
        <Feature icon="trending-up" text="Oszczędzaj" />
        <Feature icon="people" text="Wspólne konta" />
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.btnPrimaryText}>Rozpocznij</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.btnSecondaryText}>Mam już konto</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const Feature = ({ icon, text }: { icon: string; text: string }) => (
  <View style={styles.feature}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon as any} size={20} color={Colors.white} />
    </View>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 80 },
  content: { alignItems: 'center', marginBottom: 40 },
  logoBox: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logo: { fontSize: 40 },
  title: { fontSize: 32, fontWeight: '800', color: Colors.white, marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 24 },
  features: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 40 },
  feature: { alignItems: 'center' },
  featureIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  featureText: { fontSize: 12, color: Colors.white, fontWeight: '600' },
  buttons: { marginTop: 'auto', gap: 12 },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white, paddingVertical: 16, borderRadius: 16, gap: 8 },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  btnSecondary: { alignItems: 'center', paddingVertical: 16 },
  btnSecondaryText: { fontSize: 16, fontWeight: '600', color: Colors.white },
});
