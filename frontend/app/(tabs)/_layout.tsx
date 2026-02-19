import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { DrawerMenu } from '../../src/components/DrawerMenu';
import { DrawerProvider } from '../../src/contexts/DrawerContext';

export default function TabLayout() {
  return (
    <DrawerProvider>
      <View style={styles.container}>
        {/* All screens rendered by Tabs — bar is hidden */}
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="wallets" />
          <Tabs.Screen name="add" />
          <Tabs.Screen name="goals" />
          <Tabs.Screen name="profile" />
          <Tabs.Screen name="customize" />
          <Tabs.Screen name="transactions" />
          <Tabs.Screen name="chat" />
          <Tabs.Screen name="settings" />
          <Tabs.Screen name="security" />
          <Tabs.Screen name="analytics" />
        </Tabs>

        {/* Drawer overlays everything */}
        <DrawerMenu />
      </View>
    </DrawerProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
