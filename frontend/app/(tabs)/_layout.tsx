import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../src/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          ...Shadows.medium,
        },
        tabBarLabelStyle: { 
          fontSize: 11, 
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: -4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Główna',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIcon : undefined}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="wallets"
        options={{
          title: 'Portfele',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIcon : undefined}>
              <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Dodaj',
          tabBarIcon: ({ focused }) => (
            <View style={styles.addButton}>
              <Ionicons name="add" size={28} color={Colors.white} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Cele',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIcon : undefined}>
              <Ionicons name={focused ? 'flag' : 'flag-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIcon : undefined}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            </View>
          ),
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
    </Tabs>
  );
}

const styles = {
  activeIcon: {
    transform: [{ scale: 1.1 }],
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
    ...Shadows.medium,
  },
};
