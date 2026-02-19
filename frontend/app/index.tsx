import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../src/store/store';
import { Colors, Gradients, Spacing, Typography, BorderRadius, Shadows } from '../src/constants/theme';
import { AnimatedCard, AnimatedButton } from '../src/components/AnimatedComponents';

export default function Welcome() {
  const router = useRouter();
  const { isLoggedIn } = useStore();

  useEffect(() => {
    if (isLoggedIn) router.replace('/(tabs)');
  }, [isLoggedIn]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.dark} style={StyleSheet.absoluteFillObject} />
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <AnimatedCard entrance="slideDown" delay={200} style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoEmoji}>💰</Text>
            </View>
            <Text style={styles.brandName}>Cenny Grosz</Text>
            <Text style={styles.tagline}>Twój inteligentny portfel</Text>
          </AnimatedCard>

          <AnimatedCard entrance="fade" delay={400} style={styles.illustrationWrap}>
            <View style={styles.featureGrid}>
              <FeatureItem icon="shield-checkmark" title="Bezpieczne" desc="Szyfrowane dane" />
              <FeatureItem icon="people" title="Wspólne" desc="Dziel wydatki" />
              <FeatureItem icon="flash" title="Szybkie" desc="Błyskawiczne wpisy" />
            </View>
          </AnimatedCard>
        </View>

        <View style={styles.footer}>
          <AnimatedCard entrance="slideUp" delay={600} style={styles.actionCard}>
            <Text style={welcomeStyles.title}>Zarządzaj mądrze</Text>
            <Text style={welcomeStyles.desc}>Przejmij pełną kontrolę nad swoimi finansami już dziś.</Text>

            <AnimatedButton
              style={styles.primaryBtn}
              onPress={() => router.push({ pathname: '/(auth)/login', params: { initialIsLogin: 'false' } } as any)}
              hapticFeedback="medium"
            >
              <LinearGradient colors={Gradients.primary} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.primaryBtnText}>Rozpocznij przygodę</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.white} />
              </LinearGradient>
            </AnimatedButton>

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.secondaryBtnText}>Mam już konto • <Text style={{ color: Colors.primary }}>Zaloguj się</Text></Text>
            </TouchableOpacity>
          </AnimatedCard>
        </View>
      </SafeAreaView>
    </View>
  );
}

const FeatureItem = ({ icon, title, desc }: { icon: string; title: string; desc: string }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIconWrap}>
      <Ionicons name={icon as any} size={24} color={Colors.primary} />
    </View>
    <View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDesc}>{desc}</Text>
    </View>
  </View>
);

const welcomeStyles = {
  title: { ...Typography.h1, color: Colors.text, textAlign: 'center' } as any,
  desc: { ...Typography.body, color: Colors.textLight, textAlign: 'center', marginTop: 8, marginBottom: Spacing.xxl } as any,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.text },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  safeArea: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.xxxl },
  header: { alignItems: 'center', marginBottom: Spacing.xxxxl },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xxl,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logoEmoji: { fontSize: 40 },
  brandName: { ...Typography.hero, color: Colors.white, textAlign: 'center' },
  tagline: { ...Typography.body, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 4 },

  illustrationWrap: { padding: Spacing.xxl },
  featureGrid: { gap: Spacing.xl },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  featureIconWrap: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  featureTitle: { ...Typography.h3, color: Colors.white },
  featureDesc: { ...Typography.small, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  footer: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  actionCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    ...Shadows.premium,
  },

  primaryBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.medium },
  btnGradient: { height: 60, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  primaryBtnText: { ...Typography.bodyBold, color: Colors.white },

  secondaryBtn: { marginTop: Spacing.lg, paddingVertical: Spacing.sm, alignItems: 'center' },
  secondaryBtnText: { ...Typography.caption, color: Colors.textSecondary },
});
