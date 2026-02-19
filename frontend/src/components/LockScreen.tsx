
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { PinPad } from './PinPad';
import { useStore } from '../store/store';
import { securityService } from '../services/securityService';
import * as Haptics from 'expo-haptics';

export const LockScreen = () => {
    const { isAppLocked, unlockApp, securitySettings, user } = useStore();
    const [biometricAvailable, setBiometricAvailable] = useState(false);

    useEffect(() => {
        checkBiometrics();
        if (isAppLocked && securitySettings.isBiometricsEnabled) {
            handleBiometricAuth();
        }
    }, [isAppLocked, securitySettings.isBiometricsEnabled]);

    const checkBiometrics = async () => {
        const available = await securityService.checkHardwareSupport();
        setBiometricAvailable(available);
    };

    const handleBiometricAuth = async () => {
        const success = await securityService.authenticateBiometrics();
        if (success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            unlockApp();
        }
    };

    const handlePinSuccess = async (pin: string) => {
        const isValid = await securityService.verifyPin(pin, user?.id);
        if (isValid) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            unlockApp();
        }
        return isValid;
    };

    if (!isAppLocked) return null;

    return (
        <Modal animationType="fade" visible={isAppLocked} transparent>
            <View style={styles.container}>
                <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.content}>
                    <PinPad
                        mode="verify"
                        onSuccess={handlePinSuccess}
                        onBiometricAuth={handleBiometricAuth}
                        isBiometricAvailable={biometricAvailable && securitySettings.isBiometricsEnabled}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    content: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
