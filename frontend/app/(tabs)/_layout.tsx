import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, GRADIENTS } from '../../src/constants/theme';
import { PL } from '../../src/constants/polish';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: PL.dashboard,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallets"
        options={{
          title: PL.wallets,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="wallet" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: PL.goals,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="flag" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: PL.assistant,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="sparkles" color={color} focused={focused} gradient={GRADIENTS.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: PL.settings,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="settings" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const TabIcon = ({ name, color, focused, gradient }: { name: string; color: string; focused: boolean; gradient?: string[] }) => {
  if (focused && gradient) {
    return (
      <LinearGradient colors={gradient} style={styles.activeIconBg}>
        <Ionicons name={name as any} size={22} color={COLORS.white} />
      </LinearGradient>
    );
  }
  
  if (focused) {
    return (
      <View style={[styles.activeIconBg, { backgroundColor: `${COLORS.primary}15` }]}>
        <Ionicons name={name as any} size={22} color={COLORS.primary} />
      </View>
    );
  }
  
  return <Ionicons name={`${name}-outline` as any} size={22} color={color} />;
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 88 : 70,
    paddingTop: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? 28 : SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 20,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  tabBarItem: {
    paddingTop: 4,
  },
  activeIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
