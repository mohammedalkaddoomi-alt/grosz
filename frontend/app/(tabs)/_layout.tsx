import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Elevation, Spacing } from '../../src/constants/theme';
import { useTheme } from '../../src/contexts/ThemeContext';

const TabIcon = ({
  focused,
  active,
  inactive,
  color,
  primary,
}: {
  focused: boolean;
  active: keyof typeof Ionicons.glyphMap;
  inactive: keyof typeof Ionicons.glyphMap;
  color: string;
  primary: string;
}) => (
  <View
    style={[
      styles.tabIconWrap,
      focused && { backgroundColor: `${primary}1A`, transform: [{ translateY: -1 }] },
    ]}
  >
    <Ionicons name={focused ? active : inactive} size={20} color={focused ? primary : color} />
  </View>
);

export default function TabLayout() {
  const { colors, fontFamily, scaleFont } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          left: Spacing.lg,
          right: Spacing.lg,
          bottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.md,
          height: Platform.OS === 'ios' ? 80 : 72,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'ios' ? 22 : 12,
          backgroundColor: colors.card,
          borderTopWidth: 0,
          borderRadius: BorderRadius.xxl,
          ...Elevation.level3,
        },
        tabBarItemStyle: {
          paddingHorizontal: 2,
        },
        tabBarLabelStyle: {
          fontSize: scaleFont(11),
          fontWeight: '700',
          letterSpacing: 0.2,
          marginTop: 1,
          fontFamily,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Główna',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} active="home" inactive="home-outline" color={color} primary={colors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallets"
        options={{
          title: 'Portfele',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} active="wallet" inactive="wallet-outline" color={color} primary={colors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Dodaj',
          tabBarLabel: '',
          tabBarItemStyle: { marginTop: -16 },
          tabBarIcon: ({ focused }) => (
            <View style={styles.addButtonOuter}>
              <LinearGradient colors={[colors.primary, colors.accent]} style={styles.addButton}>
                <Ionicons name="add" size={26} color={colors.white} />
              </LinearGradient>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Cele',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} active="flag" inactive="flag-outline" color={color} primary={colors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} active="person" inactive="person-outline" color={color} primary={colors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="customize"
        options={{
          href: null, // Move to profile/settings flow instead of crowding bottom nav
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          href: null, // Hide from tab bar but keep accessible
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          href: null, // Hide from tab bar but keep accessible
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // Hide from tab bar but keep accessible
        }}
      />
      <Tabs.Screen
        name="security"
        options={{
          href: null, // Hide from tab bar but keep accessible
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    width: 34,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonOuter: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 3,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
