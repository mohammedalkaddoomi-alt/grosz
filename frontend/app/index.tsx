import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { PL } from '../src/constants/polish';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Brand */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>💰</Text>
          </View>
          <Text style={styles.brandName}>Cenny Grosz</Text>
          <Text style={styles.subtitle}>{PL.welcomeSubtitle}</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <FeatureItem icon="wallet-outline" text="Śledź przychody i wydatki" />
          <FeatureItem icon="people-outline" text="Portfele wspólne z partnerem" />
          <FeatureItem icon="flag-outline" text="Cele oszczędnościowe" />
          <FeatureItem icon="chatbubbles-outline" text="Asystent AI do planowania" />
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={styles.primaryButtonText}>{PL.register}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.secondaryButtonText}>{PL.login}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const FeatureItem = ({ icon, text }: { icon: string; text: string }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon as any} size={24} color={COLORS.primary} />
    </View>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoEmoji: {
    fontSize: 48,
  },
  brandName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  featuresContainer: {
    gap: SPACING.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.md,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  buttonsContainer: {
    gap: SPACING.md,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '600',
  },
});
