import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, Shadows, BorderRadius, Spacing } from '../constants/theme';
import { AnimatedButton, AnimatedCard } from './AnimatedComponents';
import { haptics } from '../utils/haptics';
import type { WagePeriod } from '../types';

interface WageSettingsModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (settings: { wage_amount: number; wage_period: WagePeriod; currency: string }) => void;
    initialSettings?: {
        wage_amount: number;
        wage_period: WagePeriod;
        currency: string;
    } | null;
}

const WAGE_PERIODS: { value: WagePeriod; label: string; icon: string }[] = [
    { value: 'hourly', label: 'Godzinowo', icon: 'time-outline' },
    { value: 'daily', label: 'Dziennie', icon: 'sunny-outline' },
    { value: 'weekly', label: 'Tygodniowo', icon: 'calendar-outline' },
    { value: 'monthly', label: 'Miesięcznie', icon: 'calendar' },
];

export const WageSettingsModal: React.FC<WageSettingsModalProps> = ({
    visible,
    onClose,
    onSave,
    initialSettings,
}) => {
    const [wageAmount, setWageAmount] = useState(initialSettings?.wage_amount?.toString() || '');
    const [wagePeriod, setWagePeriod] = useState<WagePeriod>(initialSettings?.wage_period || 'hourly');
    const [currency] = useState(initialSettings?.currency || 'PLN');

    useEffect(() => {
        if (!visible) return;
        setWageAmount(initialSettings?.wage_amount ? String(initialSettings.wage_amount) : '');
        setWagePeriod(initialSettings?.wage_period || 'hourly');
    }, [visible, initialSettings]);

    const handleSave = () => {
        const amount = parseFloat(wageAmount.replace(',', '.'));
        if (isNaN(amount) || amount <= 0) {
            haptics.error();
            return;
        }

        haptics.success();
        onSave({
            wage_amount: amount,
            wage_period: wagePeriod,
            currency,
        });
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalContainer}
            >
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <LinearGradient colors={Gradients.primary} style={styles.headerIcon}>
                                <Ionicons name="cash-outline" size={24} color={Colors.white} />
                            </LinearGradient>
                            <View>
                                <Text style={styles.headerTitle}>Stawka zarobków</Text>
                                <Text style={styles.headerSubtitle}>Ustaw swoją stawkę</Text>
                            </View>
                        </View>
                        <AnimatedButton onPress={onClose} hapticFeedback="light">
                            <View style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </View>
                        </AnimatedButton>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Wage Amount Input */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Kwota</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    value={wageAmount}
                                    onChangeText={(text) => setWageAmount(text.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                                    placeholder="0.00"
                                    keyboardType="decimal-pad"
                                    placeholderTextColor={Colors.textMuted}
                                />
                                <Text style={styles.currency}>{currency}</Text>
                            </View>
                        </View>

                        {/* Period Selection */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Okres</Text>
                            <View style={styles.periodList}>
                                {WAGE_PERIODS.map((period) => (
                                    <AnimatedButton
                                        key={period.value}
                                        onPress={() => {
                                            setWagePeriod(period.value);
                                            haptics.light();
                                        }}
                                        hapticFeedback="light"
                                    >
                                        <View
                                            style={[
                                                styles.periodRow,
                                                wagePeriod === period.value && styles.periodRowActive,
                                            ]}
                                        >
                                            <View style={[styles.periodIconWrap, wagePeriod === period.value && styles.periodIconWrapActive]}>
                                                <Ionicons
                                                    name={period.icon as any}
                                                    size={20}
                                                    color={wagePeriod === period.value ? Colors.white : Colors.primary}
                                                />
                                            </View>
                                            <Text
                                                style={[
                                                    styles.periodLabel,
                                                    wagePeriod === period.value && styles.periodLabelActive,
                                                ]}
                                            >
                                                {period.label}
                                            </Text>
                                            {wagePeriod === period.value && (
                                                <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                                            )}
                                        </View>
                                    </AnimatedButton>
                                ))}
                            </View>
                        </View>

                        {/* Preview */}
                        {wageAmount && parseFloat(wageAmount.replace(',', '.')) > 0 && (
                            <AnimatedCard entrance="scale" delay={100}>
                                <View style={styles.previewCard}>
                                    <View style={styles.previewIcon}>
                                        <Ionicons name="information-circle" size={20} color={Colors.primary} />
                                    </View>
                                    <View style={styles.previewContent}>
                                        <Text style={styles.previewTitle}>Twoja stawka</Text>
                                        <Text style={styles.previewValue}>
                                            {parseFloat(wageAmount.replace(',', '.')).toFixed(2)} {currency} / {WAGE_PERIODS.find(p => p.value === wagePeriod)?.label.toLowerCase()}
                                        </Text>
                                    </View>
                                </View>
                            </AnimatedCard>
                        )}
                    </ScrollView>

                    {/* Save Button */}
                    <AnimatedButton onPress={handleSave} hapticFeedback="medium">
                        <LinearGradient colors={Gradients.primary} style={styles.saveButton}>
                            <Ionicons name="checkmark-circle" size={24} color={Colors.white} />
                            <Text style={styles.saveButtonText}>Zapisz ustawienia</Text>
                        </LinearGradient>
                    </AnimatedButton>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.overlay,
    },
    modalContent: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: Spacing.xl,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
        maxHeight: '90%',
        ...Shadows.premium,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    headerIcon: {
        width: 56,
        height: 56,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.medium,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: Colors.textLight,
        marginTop: 2,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginBottom: Spacing.xxl,
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: Spacing.md,
        letterSpacing: -0.3,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        ...Shadows.medium,
    },
    input: {
        flex: 1,
        fontSize: 32,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -1,
    },
    currency: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.textLight,
        marginLeft: Spacing.sm,
    },
    periodList: {
        gap: Spacing.sm,
    },
    periodRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.xl,
        paddingVertical: 14,
        paddingHorizontal: Spacing.lg,
        borderWidth: 2,
        borderColor: Colors.border,
        ...Shadows.small,
    },
    periodRowActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '08',
    },
    periodIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    periodIconWrapActive: {
        backgroundColor: Colors.primary,
    },
    periodLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        letterSpacing: -0.2,
    },
    periodLabelActive: {
        color: Colors.primary,
    },
    previewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        gap: Spacing.md,
        ...Shadows.medium,
    },
    previewIcon: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewContent: {
        flex: 1,
    },
    previewTitle: {
        fontSize: 14,
        color: Colors.textLight,
        fontWeight: '500',
    },
    previewValue: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginTop: 2,
        letterSpacing: -0.3,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.xl,
        marginTop: Spacing.lg,
        ...Shadows.medium,
    },
    saveButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.white,
        letterSpacing: -0.3,
    },
});
