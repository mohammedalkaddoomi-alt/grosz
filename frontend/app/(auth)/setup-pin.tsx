import React from 'react';
import { View, StyleSheet, Alert, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { PinPad } from '../../src/components/PinPad';
import { useStore } from '../../src/store/store';
import { securityService } from '../../src/services/securityService';
import * as Haptics from 'expo-haptics';

export default function SetupPinScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const { user, loadSecuritySettings, securitySettings } = useStore();

    // Prevent going back to login screen without setting a PIN
    React.useEffect(() => {
        const backAction = () => {
            Alert.alert(
                'Wymagany PIN',
                'Ze względów bezpieczeństwa musisz ustawić kod PIN dla tego urządzenia, aby kontynuować.',
                [{ text: 'OK' }]
            );
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, []);

    const handlePinSetup = async (pin: string) => {
        try {
            await securityService.setPin(pin, user?.id);
            // Ensure store sees the new settings so the app doesn't immediately lock itself loop
            await loadSecuritySettings();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Allow user to set up biometrics if available and they want to
            const hasHardware = await securityService.checkHardwareSupport();
            if (hasHardware && !securitySettings.isBiometricsEnabled) {
                Alert.alert(
                    'Kod PIN ustawiony',
                    'Czy chcesz również włączyć logowanie biometryczne (Face ID / Odcisk palca)?',
                    [
                        {
                            text: 'Nie teraz',
                            style: 'cancel',
                            onPress: () => router.replace('/(tabs)')
                        },
                        {
                            text: 'Włącz',
                            style: 'default',
                            onPress: async () => {
                                await securityService.setBiometricsEnabled(true, user?.id);
                                await loadSecuritySettings();
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                Alert.alert('Sukces', 'Logowanie biometryczne zostało włączone.', [
                                    { text: 'OK', onPress: () => router.replace('/(tabs)') }
                                ]);
                            }
                        }
                    ]
                );
            } else {
                router.replace('/(tabs)');
            }
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Błąd', error.message || 'Wystąpił błąd podczas ustawiania PINu.');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <PinPad
                    mode="setup"
                    onSuccess={handlePinSetup}
                // No cancel button here because PIN setup is mandatory after fresh login/registration
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
