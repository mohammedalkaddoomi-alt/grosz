import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../src/store/authStore';
import { COLORS, SPACING, BORDER_RADIUS, GRADIENTS } from '../src/constants/theme';
import { PL } from '../src/constants/polish';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

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
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#0F3460']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative circles */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.decorCircle3} />

        {/* Content */}
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <LinearGradient
              colors={GRADIENTS.primary}
              style={styles.logoCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logoEmoji}>💰</Text>
            </LinearGradient>
            <Text style={styles.brandName}>Cenny Grosz</Text>
            <Text style={styles.subtitle}>{PL.welcomeSubtitle}</Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <FeatureCard
              icon="trending-up"
              title="Śledź finanse"
              description="Przychody i wydatki w jednym miejscu"
              gradient={GRADIENTS.income}
            />
            <FeatureCard
              icon="people"
              title="Portfele wspólne"
              description="Zarządzaj finansami z partnerem"
              gradient={GRADIENTS.purple}
            />
            <FeatureCard
              icon="flag"
              title="Cele oszczędnościowe"
              description="Osiągaj marzenia krok po kroku"
              gradient={GRADIENTS.sunset}
            />
            <FeatureCard
              icon="sparkles"
              title="Asystent AI"
              description="Inteligentne porady finansowe"
              gradient={GRADIENTS.ocean}
            />
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={GRADIENTS.primary}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryButtonText}>{PL.register}</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>{PL.login}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const FeatureCard = ({ icon, title, description, gradient }: any) => (
  <View style={styles.featureCard}>
    <LinearGradient
      colors={gradient}
      style={styles.featureIcon}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Ionicons name={icon} size={20} color={COLORS.white} />
    </LinearGradient>
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },
  decorCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    top: -100,
    right: -100,
  },
  decorCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(99, 179, 237, 0.1)',
    bottom: 200,
    left: -80,
  },
  decorCircle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    bottom: 100,
    right: -50,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoEmoji: {
    fontSize: 48,
  },
  brandName: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: SPACING.xs,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  featuresContainer: {
    gap: SPACING.sm,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  buttonsContainer: {
    gap: SPACING.md,
  },
  primaryButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: SPACING.sm,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 18,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
