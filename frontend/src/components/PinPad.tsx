
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
    withSpring
} from 'react-native-reanimated';
import { Colors, Typography } from '../constants/theme';

const { width } = Dimensions.get('window');
const PIN_LENGTH = 4;

interface PinPadProps {
    mode: 'setup' | 'verify' | 'change';
    onSuccess: (pin: string) => void | boolean | Promise<void | boolean>;
    onBiometricAuth?: () => void;
    isBiometricAvailable?: boolean;
    onCancel?: () => void;
}

export const PinPad: React.FC<PinPadProps> = ({
    mode,
    onSuccess,
    onBiometricAuth,
    isBiometricAvailable = false,
    onCancel
}) => {
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState<'enter' | 'confirm'>('enter');
    const [error, setError] = useState<string | null>(null);

    // Animation values
    const shakeX = useSharedValue(0);

    const getTitle = () => {
        if (mode === 'verify') return 'Wpisz PIN';
        if (mode === 'change') return step === 'enter' ? 'Nowy PIN' : 'Potwierdź nowy PIN';
        return step === 'enter' ? 'Ustaw PIN' : 'Potwierdź PIN';
    };

    const getSubtitle = () => {
        if (error) return error;
        if (mode === 'verify') return 'Wprowadź 4-cyfrowy PIN, aby odblokować aplikację';
        if (step === 'enter') return 'Ustaw 4-cyfrowy PIN dla bezpieczeństwa';
        return 'Wprowadź PIN ponownie, aby potwierdzić';
    };

    const shake = () => {
        shakeX.value = withSequence(
            withTiming(-10, { duration: 50 }),
            withTiming(10, { duration: 50 }),
            withTiming(-10, { duration: 50 }),
            withTiming(10, { duration: 50 }),
            withTiming(0, { duration: 50 })
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    };

    const handlePress = (key: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setError(null);

        if (key === 'backspace') {
            setPin(prev => prev.slice(0, -1));
            return;
        }

        if (pin.length < PIN_LENGTH) {
            const newPin = pin + key;
            setPin(newPin);

            if (newPin.length === PIN_LENGTH) {
                handleComplete(newPin);
            }
        }
    };

    const handleComplete = async (completedPin: string) => {
        if (mode === 'verify') {
            const result = await onSuccess(completedPin);
            if (result === false) {
                setError('Nieprawidłowy PIN');
                shake();
            }
            setTimeout(() => setPin(''), 200);
        } else {
            // Setup or Change mode
            if (step === 'enter') {
                setConfirmPin(completedPin);
                setPin('');
                setStep('confirm');
            } else {
                if (completedPin === confirmPin) {
                    await onSuccess(completedPin);
                } else {
                    setError('PIN-y nie są takie same');
                    shake();
                    setPin('');
                    setConfirmPin('');
                    setStep('enter');
                }
            }
        }
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shakeX.value }],
    }));

    const renderDot = (index: number) => {
        const filled = index < pin.length;
        return (
            <View
                key={index}
                style={[
                    styles.dot,
                    filled && styles.dotFilled,
                    error ? styles.dotError : null
                ]}
            />
        );
    };

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.header, animatedStyle]}>
                <Text style={styles.title}>{getTitle()}</Text>
                <Text style={[styles.subtitle, error && styles.errorText]}>{getSubtitle()}</Text>
            </Animated.View>

            <View style={styles.dotsContainer}>
                {[...Array(PIN_LENGTH)].map((_, i) => renderDot(i))}
            </View>

            <View style={styles.keypad}>
                {[
                    ['1', '2', '3'],
                    ['4', '5', '6'],
                    ['7', '8', '9'],
                    ['biometric', '0', 'backspace']
                ].map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.row}>
                        {row.map((key) => {
                            if (key === 'biometric') {
                                if (mode === 'verify' && isBiometricAvailable) {
                                    return (
                                        <TouchableOpacity
                                            key={key}
                                            style={styles.key}
                                            onPress={onBiometricAuth}
                                        >
                                            <Ionicons name="finger-print" size={32} color={Colors.primary} />
                                        </TouchableOpacity>
                                    );
                                }
                                return <View key={key} style={styles.key} />; // Empty placeholder
                            }

                            if (key === 'backspace') {
                                return (
                                    <TouchableOpacity
                                        key={key}
                                        style={styles.key}
                                        onPress={() => handlePress('backspace')}
                                    >
                                        <Ionicons name="backspace-outline" size={28} color={Colors.text} />
                                    </TouchableOpacity>
                                );
                            }

                            return (
                                <TouchableOpacity
                                    key={key}
                                    style={styles.key}
                                    onPress={() => handlePress(key)}
                                >
                                    <Text style={styles.keyText}>{key}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </View>

            {onCancel && (
                <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                    <Text style={styles.cancelText}>Anuluj</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        ...Typography.h2,
        color: Colors.text,
        marginBottom: 10,
    },
    subtitle: {
        ...Typography.body,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    errorText: {
        color: Colors.error,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 60,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    dotFilled: {
        backgroundColor: Colors.primary,
    },
    dotError: {
        borderColor: Colors.error,
        backgroundColor: Colors.error,
    },
    keypad: {
        width: '100%',
        maxWidth: 300,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    key: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.card, // Adjust based on theme
        // Add shadow/elevation if needed
    },
    keyText: {
        ...Typography.h2,
        color: Colors.text,
    },
    cancelButton: {
        marginTop: 30,
        padding: 10,
    },
    cancelText: {
        ...Typography.body,
        color: Colors.textSecondary,
    },
});
