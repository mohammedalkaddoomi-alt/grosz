
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/store';
import { Colors, Typography } from '../constants/theme';
import { PinPad } from './PinPad';
import * as Haptics from 'expo-haptics';

export const SecuritySettings = () => {
    const {
        securitySettings,
        enablePin,
        disablePin,
        toggleBiometrics,
        loadSecuritySettings
    } = useStore();

    const [showPinSetup, setShowPinSetup] = useState(false);
    const [showPinChange, setShowPinChange] = useState(false);

    useEffect(() => {
        loadSecuritySettings();
    }, []);

    const handlePinToggle = async (value: boolean) => {
        Haptics.selectionAsync();
        if (value) {
            setShowPinSetup(true);
        } else {
            Alert.alert(
                "Disable Security",
                "Are you sure you want to remove your PIN? This will also disable biometric login.",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Remove",
                        style: "destructive",
                        onPress: async () => {
                            await disablePin();
                        }
                    }
                ]
            );
        }
    };

    const handleBiometricToggle = async (value: boolean) => {
        Haptics.selectionAsync();
        await toggleBiometrics(value);
    };

    const handlePinSetupSuccess = async (pin: string) => {
        await enablePin(pin);
        setShowPinSetup(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Security</Text>

            <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>App PIN</Text>
                    <Text style={styles.settingDescription}>Secure app access with a 4-digit PIN</Text>
                </View>
                <Switch
                    trackColor={{ false: Colors.border, true: Colors.success }}
                    thumbColor={Colors.white}
                    ios_backgroundColor={Colors.border}
                    onValueChange={handlePinToggle}
                    value={securitySettings.isPinEnabled}
                />
            </View>

            {securitySettings.isPinEnabled && (
                <>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Biometrics</Text>
                            <Text style={styles.settingDescription}>Use FaceID / TouchID to unlock</Text>
                        </View>
                        <Switch
                            trackColor={{ false: Colors.border, true: Colors.success }}
                            thumbColor={Colors.white}
                            ios_backgroundColor={Colors.border}
                            onValueChange={handleBiometricToggle}
                            value={securitySettings.isBiometricsEnabled}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => setShowPinChange(true)}
                    >
                        <Text style={styles.actionText}>Change PIN</Text>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </>
            )}

            {/* PIN Setup Modal */}
            <Modal visible={showPinSetup} animationType="slide">
                <View style={styles.modalContainer}>
                    <PinPad
                        mode="setup"
                        onSuccess={handlePinSetupSuccess}
                        onCancel={() => setShowPinSetup(false)}
                    />
                </View>
            </Modal>

            {/* PIN Change Modal */}
            <Modal visible={showPinChange} animationType="slide">
                <View style={styles.modalContainer}>
                    <PinPad
                        mode="change"
                        onSuccess={handlePinSetupSuccess}
                        onCancel={() => setShowPinChange(false)}
                    />
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    header: {
        ...Typography.h3,
        color: Colors.text,
        marginBottom: 15,
        marginTop: 10,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    settingInfo: {
        flex: 1,
        paddingRight: 10,
    },
    settingLabel: {
        ...Typography.body,
        fontWeight: '600',
        color: Colors.text,
    },
    settingDescription: {
        ...Typography.caption,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    actionButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    actionText: {
        ...Typography.body,
        color: Colors.primary,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: 50,
    }
});
