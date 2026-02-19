
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { SecuritySettings } from '../../src/components/SecuritySettings';
import { Spacing } from '../../src/constants/theme';

export default function SecurityScreen() {
    const { colors: Colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: Colors.background }]}>
            <Stack.Screen
                options={{
                    title: 'Bezpieczeństwo',
                    headerStyle: { backgroundColor: Colors.background },
                    headerTintColor: Colors.text,
                    headerShadowVisible: false,
                }}
            />
            <ScrollView contentContainerStyle={styles.content}>
                <SecuritySettings />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.xl,
    },
});
