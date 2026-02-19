import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../src/store/store';
import { useTheme } from '../src/contexts/ThemeContext';
import { Spacing, BorderRadius, Shadows } from '../src/constants/theme';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function Welcome() {
  const router = useRouter();
  const { isLoggedIn } = useStore();
  const { colors, fontFamily, scaleFont } = useTheme();

  useEffect(() => {
    if (isLoggedIn) router.replace('/(tabs)');
  }, [isLoggedIn]);

  const features = [
    { icon: 'shield-checkmark-outline' as const, title: 'Bezpieczne', desc: 'Szyfrowane dane', color: '#6366F1' },
    { icon: 'people-outline' as const, title: 'Wspólne', desc: 'Dziel wydatki', color: '#10B981' },
    { icon: 'flash-outline' as const, title: 'Szybkie', desc: 'Błyskawiczne wpisy', color: '#F59E0B' },
    { icon: 'bar-chart-outline' as const, title: 'Analiza', desc: 'Wykresy i trendy', color: '#3B82F6' },
  ];

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.content}>
          {/* Branding */}
          <Animated.View entering={FadeIn.delay(100).duration(700)} style={s.branding}>
            <View style={[s.logoCircle, { backgroundColor: `${colors.primary}14` }]}>
              <Text style={s.logoEmoji}>💰</Text>
            </View>
            <Text style={[s.brandName, { color: colors.text, fontFamily }]}>Cenny Grosz</Text>
            <Text style={[s.tagline, { color: colors.textLight, fontFamily }]}>Twój inteligentny portfel</Text>
          </Animated.View>

          {/* Features */}
          <View style={s.features}>
            {features.map((f, i) => (
              <Animated.View
                key={f.title}
                entering={FadeInDown.delay(300 + i * 100).duration(500)}
                style={[s.featureRow, { backgroundColor: colors.card }]}
              >
                <View style={[s.featureIcon, { backgroundColor: `${f.color}14` }]}>
                  <Ionicons name={f.icon} size={22} color={f.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.featureTitle, { color: colors.text, fontFamily }]}>{f.title}</Text>
                  <Text style={[s.featureDesc, { color: colors.textMuted, fontFamily }]}>{f.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <Animated.View entering={FadeInUp.delay(700).duration(500)} style={s.actions}>
          <Text style={[s.ctaTitle, { color: colors.text, fontFamily }]}>Zarządzaj mądrze</Text>
          <Text style={[s.ctaDesc, { color: colors.textLight, fontFamily }]}>
            Przejmij pełną kontrolę nad swoimi finansami już dziś.
          </Text>

          <TouchableOpacity
            style={[s.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push({ pathname: '/(auth)/login', params: { initialIsLogin: 'false' } } as any)}
            activeOpacity={0.85}
          >
            <Text style={[s.primaryText, { fontFamily }]}>Rozpocznij przygodę</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity style={s.secondaryBtn} onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
            <Text style={[s.secondaryText, { color: colors.textLight, fontFamily }]}>
              Mam już konto • <Text style={{ color: colors.primary, fontWeight: '700' }}>Zaloguj się</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl },

  branding: { alignItems: 'center', marginBottom: 36 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  logoEmoji: { fontSize: 36 },
  brandName: { fontSize: 32, fontWeight: '800', letterSpacing: -0.8 },
  tagline: { fontSize: 15, fontWeight: '500', marginTop: 4 },

  features: { gap: 10, paddingHorizontal: 4 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 16, gap: 14,
    ...Shadows.small,
  },
  featureIcon: {
    width: 44, height: 44, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  featureTitle: { fontSize: 15, fontWeight: '700' },
  featureDesc: { fontSize: 13, fontWeight: '500', marginTop: 1 },

  actions: { paddingHorizontal: Spacing.xl, paddingBottom: 24 },
  ctaTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  ctaDesc: { fontSize: 14, fontWeight: '500', textAlign: 'center', marginTop: 6, marginBottom: 24, lineHeight: 20 },

  primaryBtn: {
    height: 54, borderRadius: 16, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  primaryText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  secondaryBtn: { marginTop: 16, paddingVertical: 8, alignItems: 'center' },
  secondaryText: { fontSize: 14, fontWeight: '500' },
});
