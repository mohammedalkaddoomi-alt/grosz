import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, Shadows, BorderRadius, Spacing } from '../constants/theme';
import { AnimatedButton, AnimatedCard } from './AnimatedComponents';
import { haptics } from '../utils/haptics';
import type { WageSettings, WorkCalculation } from '../types';

interface WorkCalculatorModalProps {
    visible: boolean;
    onClose: () => void;
    wageSettings: WageSettings | null;
    onOpenSettings: () => void;
    calculateWorkTime: (itemPrice: number) => WorkCalculation | null;
    sharedWalletMembers?: Array<{ id: string; name: string; wageSettings?: WageSettings | null }>;
}

export const WorkCalculatorModal: React.FC<WorkCalculatorModalProps> = ({
    visible,
    onClose,
    wageSettings,
    onOpenSettings,
    calculateWorkTime,
    sharedWalletMembers,
}) => {
    const [itemPrice, setItemPrice] = useState('');
    const [calculation, setCalculation] = useState<WorkCalculation | null>(null);

    useEffect(() => {
        if (itemPrice && parseFloat(itemPrice) > 0 && wageSettings) {
            const result = calculateWorkTime(parseFloat(itemPrice));
            setCalculation(result);
        } else {
            setCalculation(null);
        }
    }, [itemPrice, wageSettings, calculateWorkTime]);

    const formatTime = (hours: number) => {
        if (hours < 1) {
            const minutes = Math.round(hours * 60);
            return `${minutes} min`;
        } else if (hours < 24) {
            const h = Math.floor(hours);
            const m = Math.round((hours - h) * 60);
            return m > 0 ? `${h}h ${m}min` : `${h}h`;
        } else {
            const days = Math.floor(hours / 8);
            const remainingHours = Math.round(hours % 8);
            return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
        }
    };

    const formatMoney = (n: number) => new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: wageSettings?.currency || 'PLN',
        minimumFractionDigits: 0
    }).format(n);

    const getTimeDisplay = () => {
        if (!calculation) return null;

        const { hoursNeeded, daysNeeded, weeksNeeded, monthsNeeded } = calculation;

        if (hoursNeeded < 8) {
            return { value: formatTime(hoursNeeded), label: 'Czas pracy', icon: 'time' };
        } else if (daysNeeded < 7) {
            return { value: `${daysNeeded.toFixed(1)} dni`, label: 'Dni pracy', icon: 'sunny' };
        } else if (weeksNeeded < 4) {
            return { value: `${weeksNeeded.toFixed(1)} tyg`, label: 'Tygodni pracy', icon: 'calendar' };
        } else {
            return { value: `${monthsNeeded.toFixed(1)} mies`, label: 'Miesięcy pracy', icon: 'calendar' };
        }
    };

    const timeDisplay = getTimeDisplay();

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
                            <LinearGradient colors={Gradients.blue} style={styles.headerIcon}>
                                <Ionicons name="time" size={24} color={Colors.white} />
                            </LinearGradient>
                            <View>
                                <Text style={styles.headerTitle}>Ile godzin?</Text>
                                <Text style={styles.headerSubtitle}>Sprawdź ile musisz pracować</Text>
                            </View>
                        </View>
                        <AnimatedButton onPress={onClose} hapticFeedback="light">
                            <View style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </View>
                        </AnimatedButton>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {!wageSettings ? (
                            /* No Wage Settings */
                            <AnimatedCard entrance="scale" delay={100}>
                                <View style={styles.emptyState}>
                                    <View style={styles.emptyIcon}>
                                        <Ionicons name="settings-outline" size={48} color={Colors.primary} />
                                    </View>
                                    <Text style={styles.emptyTitle}>Ustaw swoją stawkę</Text>
                                    <Text style={styles.emptyText}>
                                        Najpierw musisz ustawić swoją stawkę godzinową, aby korzystać z kalkulatora
                                    </Text>
                                    <AnimatedButton onPress={onOpenSettings} hapticFeedback="medium">
                                        <LinearGradient colors={Gradients.primary} style={styles.setupButton}>
                                            <Ionicons name="add-circle" size={20} color={Colors.white} />
                                            <Text style={styles.setupButtonText}>Ustaw stawkę</Text>
                                        </LinearGradient>
                                    </AnimatedButton>
                                </View>
                            </AnimatedCard>
                        ) : (
                            <>
                                {/* Current Wage Display */}
                                <AnimatedCard entrance="slideUp" delay={50}>
                                    <View style={styles.wageCard}>
                                        <View style={styles.wageInfo}>
                                            <Text style={styles.wageLabel}>Twoja stawka</Text>
                                            <Text style={styles.wageValue}>
                                                {formatMoney(wageSettings.wage_amount)} / {wageSettings.wage_period === 'hourly' ? 'godz' : wageSettings.wage_period === 'daily' ? 'dzień' : wageSettings.wage_period === 'weekly' ? 'tydz' : 'mies'}
                                            </Text>
                                        </View>
                                        <AnimatedButton onPress={onOpenSettings} hapticFeedback="light">
                                            <View style={styles.editButton}>
                                                <Ionicons name="pencil" size={18} color={Colors.primary} />
                                            </View>
                                        </AnimatedButton>
                                    </View>
                                </AnimatedCard>

                                {/* Item Price Input */}
                                <AnimatedCard entrance="slideUp" delay={100}>
                                    <View style={styles.section}>
                                        <Text style={styles.label}>Cena przedmiotu</Text>
                                        <View style={styles.inputContainer}>
                                            <Ionicons name="pricetag" size={24} color={Colors.primary} />
                                            <TextInput
                                                style={styles.input}
                                                value={itemPrice}
                                                onChangeText={(text) => setItemPrice(text.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                                                placeholder="0.00"
                                                keyboardType="decimal-pad"
                                                placeholderTextColor={Colors.textMuted}
                                            />
                                            <Text style={styles.currency}>{wageSettings.currency}</Text>
                                        </View>
                                    </View>
                                </AnimatedCard>

                                {/* Calculation Result */}
                                {calculation && timeDisplay && (
                                    <AnimatedCard entrance="scale" delay={150}>
                                        <LinearGradient colors={Gradients.primary} style={styles.resultCard}>
                                            <View style={styles.resultIcon}>
                                                <Ionicons name={timeDisplay.icon as any} size={32} color={Colors.white} />
                                            </View>
                                            <Text style={styles.resultLabel}>{timeDisplay.label}</Text>
                                            <Text style={styles.resultValue}>{timeDisplay.value}</Text>

                                            {/* Detailed Breakdown */}
                                            <View style={styles.breakdown}>
                                                <View style={styles.breakdownItem}>
                                                    <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.8)" />
                                                    <Text style={styles.breakdownText}>
                                                        {formatTime(calculation.hoursNeeded)}
                                                    </Text>
                                                </View>
                                                <View style={styles.breakdownDivider} />
                                                <View style={styles.breakdownItem}>
                                                    <Ionicons name="sunny-outline" size={16} color="rgba(255,255,255,0.8)" />
                                                    <Text style={styles.breakdownText}>
                                                        {calculation.daysNeeded.toFixed(1)} dni
                                                    </Text>
                                                </View>
                                            </View>
                                        </LinearGradient>
                                    </AnimatedCard>
                                )}

                                {/* Shared Wallet Members Calculations */}
                                {sharedWalletMembers && sharedWalletMembers.length > 0 && calculation && (
                                    <AnimatedCard entrance="slideUp" delay={200}>
                                        <View style={styles.sharedSection}>
                                            <View style={styles.sharedHeader}>
                                                <Ionicons name="people" size={20} color={Colors.shared} />
                                                <Text style={styles.sharedTitle}>Wspólny portfel</Text>
                                            </View>

                                            {/* Combined Calculation — both working together */}
                                            {(() => {
                                                const parsedPrice = parseFloat(itemPrice);
                                                if (!parsedPrice || parsedPrice <= 0) return null;

                                                // Calculate own hourly rate
                                                let ownHourly = wageSettings!.wage_amount;
                                                if (wageSettings!.wage_period === 'daily') ownHourly /= 8;
                                                if (wageSettings!.wage_period === 'weekly') ownHourly /= 40;
                                                if (wageSettings!.wage_period === 'monthly') ownHourly /= 160;

                                                // Sum all hourly rates (own + members)
                                                let combinedHourly = ownHourly;
                                                const membersWithWage = sharedWalletMembers.filter(m => m.wageSettings);
                                                membersWithWage.forEach(m => {
                                                    let mHourly = m.wageSettings!.wage_amount;
                                                    if (m.wageSettings!.wage_period === 'daily') mHourly /= 8;
                                                    if (m.wageSettings!.wage_period === 'weekly') mHourly /= 40;
                                                    if (m.wageSettings!.wage_period === 'monthly') mHourly /= 160;
                                                    combinedHourly += mHourly;
                                                });

                                                if (!Number.isFinite(combinedHourly) || combinedHourly <= 0) return null;
                                                const combinedHours = parsedPrice / combinedHourly;
                                                const totalPeople = membersWithWage.length + 1;

                                                return totalPeople > 1 ? (
                                                    <LinearGradient
                                                        colors={['#6C5CE7', '#a29bfe']}
                                                        style={styles.combinedCard}
                                                    >
                                                        <View style={styles.combinedIcon}>
                                                            <Ionicons name="people-circle" size={28} color={Colors.white} />
                                                        </View>
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={styles.combinedLabel}>
                                                                Razem ({totalPeople} osoby)
                                                            </Text>
                                                            <Text style={styles.combinedValue}>
                                                                {formatTime(combinedHours)}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.combinedBadge}>
                                                            <Text style={styles.combinedBadgeText}>
                                                                {Math.round((1 - combinedHours / calculation.hoursNeeded) * 100)}% szybciej
                                                            </Text>
                                                        </View>
                                                    </LinearGradient>
                                                ) : null;
                                            })()}

                                            {/* Individual member breakdown */}
                                            {sharedWalletMembers.map((member) => {
                                                if (!member.wageSettings) return null;
                                                const memberWage = member.wageSettings.wage_amount;
                                                const memberPeriod = member.wageSettings.wage_period;
                                                const parsedItemPrice = parseFloat(itemPrice);
                                                if (!memberWage || !parsedItemPrice) return null;
                                                let hourlyRate = memberWage;
                                                if (memberPeriod === 'daily') hourlyRate = memberWage / 8;
                                                if (memberPeriod === 'weekly') hourlyRate = memberWage / 40;
                                                if (memberPeriod === 'monthly') hourlyRate = memberWage / 160;
                                                if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) return null;
                                                const memberHoursNeeded = parsedItemPrice / hourlyRate;

                                                return (
                                                    <View key={member.id} style={styles.memberCard}>
                                                        <View style={styles.memberInfo}>
                                                            <View style={styles.memberAvatar}>
                                                                <Text style={styles.memberInitial}>
                                                                    {member.name.charAt(0).toUpperCase()}
                                                                </Text>
                                                            </View>
                                                            <View style={styles.memberDetails}>
                                                                <Text style={styles.memberName}>{member.name}</Text>
                                                                <Text style={styles.memberWage}>
                                                                    {formatMoney(member.wageSettings.wage_amount)} / {member.wageSettings.wage_period === 'hourly' ? 'godz' : member.wageSettings.wage_period === 'daily' ? 'dzień' : member.wageSettings.wage_period === 'weekly' ? 'tydz' : 'mies'}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        <View style={styles.memberTime}>
                                                            <Text style={styles.memberTimeValue}>
                                                                {formatTime(memberHoursNeeded)}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                );
                                            })}

                                            {/* Prompt for members without wage */}
                                            {sharedWalletMembers.some(m => !m.wageSettings) && (
                                                <View style={styles.noWageHint}>
                                                    <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
                                                    <Text style={styles.noWageHintText}>
                                                        Niektórzy członkowie nie ustawili stawki
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </AnimatedCard>
                                )}
                            </>
                        )}
                    </ScrollView>
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
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xxxl,
        paddingHorizontal: Spacing.xl,
    },
    emptyIcon: {
        width: 96,
        height: 96,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: Spacing.sm,
        letterSpacing: -0.5,
    },
    emptyText: {
        fontSize: 15,
        color: Colors.textLight,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: Spacing.xl,
    },
    setupButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.xl,
        ...Shadows.medium,
    },
    setupButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.white,
        letterSpacing: -0.3,
    },
    wageCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        ...Shadows.medium,
    },
    wageInfo: {
        flex: 1,
    },
    wageLabel: {
        fontSize: 14,
        color: Colors.textLight,
        fontWeight: '500',
    },
    wageValue: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
        marginTop: 4,
        letterSpacing: -0.5,
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginBottom: Spacing.xl,
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
        gap: Spacing.md,
        ...Shadows.medium,
    },
    input: {
        flex: 1,
        fontSize: 28,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -1,
    },
    currency: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textLight,
    },
    resultCard: {
        alignItems: 'center',
        padding: Spacing.xxl,
        borderRadius: BorderRadius.xxl,
        marginBottom: Spacing.lg,
        ...Shadows.large,
    },
    resultIcon: {
        width: 64,
        height: 64,
        borderRadius: BorderRadius.full,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    resultLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '600',
        marginBottom: Spacing.sm,
    },
    resultValue: {
        fontSize: 48,
        fontWeight: '900',
        color: Colors.white,
        letterSpacing: -2,
        marginBottom: Spacing.lg,
    },
    breakdown: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingTop: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    breakdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    breakdownDivider: {
        width: 1,
        height: 16,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    breakdownText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },
    sharedSection: {
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.xxl,
        padding: Spacing.lg,
        ...Shadows.medium,
    },
    sharedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    sharedTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        letterSpacing: -0.3,
    },
    memberCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        flex: 1,
    },
    memberAvatar: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.shared + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    memberInitial: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.shared,
    },
    memberDetails: {
        flex: 1,
    },
    memberName: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
        letterSpacing: -0.3,
    },
    memberWage: {
        fontSize: 13,
        color: Colors.textLight,
        marginTop: 2,
    },
    memberTime: {
        alignItems: 'flex-end',
    },
    memberTimeValue: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.primary,
        letterSpacing: -0.3,
    },
    combinedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.md,
        gap: Spacing.md,
    },
    combinedIcon: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.full,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    combinedLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '600',
    },
    combinedValue: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.white,
        letterSpacing: -1,
        marginTop: 2,
    },
    combinedBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    combinedBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.white,
    },
    noWageHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingTop: Spacing.md,
        marginTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
    },
    noWageHintText: {
        fontSize: 12,
        color: Colors.textMuted,
        fontStyle: 'italic',
    },
});
