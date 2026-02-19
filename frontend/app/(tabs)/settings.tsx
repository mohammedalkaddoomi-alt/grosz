import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import { Colors, Shadows, BorderRadius, Spacing } from '../../src/constants/theme';
import { AnimatedCard, AnimatedButton } from '../../src/components/AnimatedComponents';
import { haptics } from '../../src/utils/haptics';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useStore } from '../../src/store/store';
import { reportService } from '../../src/services/reportService';
import { notificationService } from '../../src/services/notificationService';

export default function Settings() {
    const router = useRouter();
    const { settings: themeSettings, updateTheme } = useTheme();
    const { transactions, securitySettings, toggleBiometrics } = useStore();

    // Settings state
    const [pushNotifications, setPushNotifications] = useState(true);
    const [transactionAlerts, setTransactionAlerts] = useState(true);
    const [budgetWarnings, setBudgetWarnings] = useState(true);
    const [biometricAuth, setBiometricAuth] = useState(securitySettings.isBiometricsEnabled);
    const [autoLock, setAutoLock] = useState(true);
    const [darkMode, setDarkMode] = useState(themeSettings.preset === 'dark');

    useEffect(() => {
        setDarkMode(themeSettings.preset === 'dark');
    }, [themeSettings.preset]);

    useEffect(() => {
        setBiometricAuth(securitySettings.isBiometricsEnabled);
    }, [securitySettings.isBiometricsEnabled]);

    const handleToggle = (setter: (value: boolean) => void, currentValue: boolean) => {
        haptics.light();
        setter(!currentValue);
    };

    const handlePushNotificationsToggle = async () => {
        if (!pushNotifications) {
            const granted = await notificationService.registerForPushNotificationsAsync();
            if (!granted) {
                Alert.alert('Brak uprawnień', 'Włącz powiadomienia w ustawieniach telefonu.');
                return;
            }
        }
        handleToggle(setPushNotifications, pushNotifications);
    };

    const handleBiometricToggle = async () => {
        const nextValue = !biometricAuth;
        if (nextValue && !securitySettings.isPinEnabled) {
            Alert.alert(
                'Najpierw ustaw PIN',
                'Biometria wymaga aktywnego PIN-u. Przejść do ustawień bezpieczeństwa?',
                [
                    { text: 'Anuluj', style: 'cancel' },
                    { text: 'Przejdź', onPress: () => router.push('/(tabs)/security') },
                ]
            );
            return;
        }

        await toggleBiometrics(nextValue);
        setBiometricAuth(nextValue);
    };

    const handleDarkModeToggle = async () => {
        const nextValue = !darkMode;
        setDarkMode(nextValue);
        haptics.light();
        await updateTheme({ preset: nextValue ? 'dark' : 'default' });
    };

    const handleExportData = () => {
        const exportTransactions = async (format: 'json' | 'csv') => {
            if (!transactions.length) {
                Alert.alert('Brak danych', 'Nie masz jeszcze transakcji do eksportu.');
                return;
            }

            try {
                if (format === 'json') {
                    await reportService.generateJSON(transactions);
                } else {
                    await reportService.generateCSV(transactions);
                }
                haptics.success();
            } catch (error) {
                Alert.alert('Błąd', 'Nie udało się wyeksportować danych.');
            }
        };

        Alert.alert(
            'Eksportuj dane',
            'Wybierz format eksportu danych:',
            [
                { text: 'Anuluj', style: 'cancel' },
                { text: 'JSON', onPress: () => { void exportTransactions('json'); } },
                { text: 'CSV', onPress: () => { void exportTransactions('csv'); } },
            ]
        );
    };

    const handleClearCache = () => {
        const clearCache = async () => {
            const cacheDirectory = (FileSystem as any).cacheDirectory;
            if (cacheDirectory) {
                const files = await FileSystem.readDirectoryAsync(cacheDirectory);
                await Promise.all(
                    files.map((file) =>
                        FileSystem.deleteAsync(`${cacheDirectory}${file}`, { idempotent: true }).catch(() => null)
                    )
                );
            }
            haptics.success();
            Alert.alert('Sukces', 'Pamięć podręczna została wyczyszczona');
        };

        Alert.alert(
            'Wyczyść pamięć podręczną',
            'Czy na pewno chcesz wyczyścić pamięć podręczną?',
            [
                { text: 'Nie', style: 'cancel' },
                { text: 'Tak', onPress: () => { void clearCache(); } },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Usuń konto',
            'UWAGA: Ta operacja jest nieodwracalna. Wszystkie Twoje dane zostaną trwale usunięte.',
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Usuń konto',
                    style: 'destructive',
                    onPress: () => Alert.alert('Informacja', 'Funkcja usuwania konta zostanie wkrótce dodana')
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <AnimatedButton style={styles.backBtn} onPress={() => router.back()} hapticFeedback="light">
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </AnimatedButton>
                <Text style={styles.title}>Ustawienia</Text>
                <View style={styles.backBtn} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Notifications Section */}
                <AnimatedCard entrance="slideRight" delay={50}>
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="notifications" size={20} color={Colors.primary} />
                            <Text style={styles.sectionTitle}>Powiadomienia</Text>
                        </View>

                        <SettingRow
                            icon="notifications-outline"
                            label="Powiadomienia push"
                            subtitle="Otrzymuj powiadomienia o transakcjach"
                            value={pushNotifications}
                            onToggle={handlePushNotificationsToggle}
                        />
                        <SettingRow
                            icon="receipt-outline"
                            label="Alerty transakcji"
                            subtitle="Powiadamiaj o każdej transakcji"
                            value={transactionAlerts}
                            onToggle={() => handleToggle(setTransactionAlerts, transactionAlerts)}
                        />
                        <SettingRow
                            icon="warning-outline"
                            label="Ostrzeżenia budżetowe"
                            subtitle="Powiadom gdy przekroczysz budżet"
                            value={budgetWarnings}
                            onToggle={() => handleToggle(setBudgetWarnings, budgetWarnings)}
                            isLast
                        />
                    </View>
                </AnimatedCard>

                {/* Security Section */}
                <AnimatedCard entrance="slideLeft" delay={150}>
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
                            <Text style={styles.sectionTitle}>Bezpieczeństwo</Text>
                        </View>

                        <SettingRow
                            icon="finger-print"
                            label="Uwierzytelnianie biometryczne"
                            subtitle="Użyj Face ID lub Touch ID"
                            value={biometricAuth}
                            onToggle={handleBiometricToggle}
                        />
                        <SettingRow
                            icon="lock-closed-outline"
                            label="Automatyczna blokada"
                            subtitle="Blokuj aplikację po 5 minutach"
                            value={autoLock}
                            onToggle={() => handleToggle(setAutoLock, autoLock)}
                        />
                        <SettingButton
                            icon="key-outline"
                            label="Zmień PIN"
                            onPress={() => router.push('/(tabs)/security')}
                            isLast
                        />
                    </View>
                </AnimatedCard>

                {/* Appearance Section */}
                <AnimatedCard entrance="slideRight" delay={250}>
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="color-palette" size={20} color={Colors.primary} />
                            <Text style={styles.sectionTitle}>Wygląd</Text>
                        </View>

                        <SettingRow
                            icon="moon-outline"
                            label="Tryb ciemny"
                            subtitle="Użyj ciemnego motywu"
                            value={darkMode}
                            onToggle={handleDarkModeToggle}
                        />
                        <SettingButton
                            icon="language-outline"
                            label="Język"
                            value="Polski"
                            onPress={() => Alert.alert('Informacja', 'Funkcja zmiany języka zostanie wkrótce dodana')}
                        />
                        <SettingButton
                            icon="cash-outline"
                            label="Waluta"
                            value="PLN (zł)"
                            onPress={() => Alert.alert('Informacja', 'Funkcja zmiany waluty zostanie wkrótce dodana')}
                            isLast
                        />
                    </View>
                </AnimatedCard>

                {/* Data & Privacy Section */}
                <AnimatedCard entrance="slideLeft" delay={350}>
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="server" size={20} color={Colors.primary} />
                            <Text style={styles.sectionTitle}>Dane i prywatność</Text>
                        </View>

                        <SettingButton
                            icon="download-outline"
                            label="Eksportuj dane"
                            subtitle="Pobierz kopię swoich danych"
                            onPress={handleExportData}
                        />
                        <SettingButton
                            icon="trash-outline"
                            label="Wyczyść pamięć podręczną"
                            subtitle="Zwolnij miejsce na urządzeniu"
                            onPress={handleClearCache}
                        />
                        <SettingButton
                            icon="shield-outline"
                            label="Polityka prywatności"
                            onPress={() => Alert.alert('Informacja', 'Polityka prywatności zostanie wkrótce dodana')}
                        />
                        <SettingButton
                            icon="document-text-outline"
                            label="Regulamin"
                            onPress={() => Alert.alert('Informacja', 'Regulamin zostanie wkrótce dodany')}
                            isLast
                        />
                    </View>
                </AnimatedCard>

                {/* About Section */}
                <AnimatedCard entrance="slideRight" delay={450}>
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="information-circle" size={20} color={Colors.primary} />
                            <Text style={styles.sectionTitle}>O aplikacji</Text>
                        </View>

                        <SettingButton
                            icon="code-outline"
                            label="Wersja aplikacji"
                            value="1.0.0"
                            onPress={() => { }}
                            disabled
                        />
                        <SettingButton
                            icon="help-circle-outline"
                            label="Centrum pomocy"
                            onPress={() => Alert.alert('Informacja', 'Centrum pomocy zostanie wkrótce dodana')}
                        />
                        <SettingButton
                            icon="mail-outline"
                            label="Kontakt"
                            value="support@grosz.pl"
                            onPress={() => {
                                Linking.openURL('mailto:support@grosz.pl?subject=Cenny%20Grosz%20Support')
                                    .catch(() => Alert.alert('Błąd', 'Nie udało się otworzyć aplikacji email.'));
                            }}
                            isLast
                        />
                    </View>
                </AnimatedCard>

                {/* Danger Zone */}
                <AnimatedCard entrance="scale" delay={550}>
                    <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
                        <Ionicons name="warning" size={22} color={Colors.expense} />
                        <Text style={styles.dangerButtonText}>Usuń konto</Text>
                    </TouchableOpacity>
                </AnimatedCard>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

// Setting Row Component with Toggle
const SettingRow = ({
    icon,
    label,
    subtitle,
    value,
    onToggle,
    isLast = false
}: {
    icon: string;
    label: string;
    subtitle?: string;
    value: boolean;
    onToggle: () => void;
    isLast?: boolean;
}) => (
    <View style={[styles.settingRow, isLast && styles.settingRowLast]}>
        <View style={styles.settingIcon}>
            <Ionicons name={icon as any} size={22} color={Colors.primary} />
        </View>
        <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>{label}</Text>
            {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
        <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: Colors.backgroundDark, true: Colors.primary + '40' }}
            thumbColor={value ? Colors.primary : Colors.textMuted}
            ios_backgroundColor={Colors.backgroundDark}
        />
    </View>
);

// Setting Button Component
const SettingButton = ({
    icon,
    label,
    subtitle,
    value,
    onPress,
    isLast = false,
    disabled = false
}: {
    icon: string;
    label: string;
    subtitle?: string;
    value?: string;
    onPress: () => void;
    isLast?: boolean;
    disabled?: boolean;
}) => (
    <TouchableOpacity
        style={[styles.settingRow, isLast && styles.settingRowLast]}
        onPress={onPress}
        activeOpacity={disabled ? 1 : 0.7}
        disabled={disabled}
    >
        <View style={styles.settingIcon}>
            <Ionicons name={icon as any} size={22} color={Colors.primary} />
        </View>
        <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>{label}</Text>
            {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
        {value ? (
            <Text style={styles.settingValue}>{value}</Text>
        ) : !disabled && (
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        )}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.md,
        ...Shadows.small,
    },
    title: { fontSize: 22, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
    scrollContent: { paddingHorizontal: Spacing.xl },
    section: {
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.lg,
        overflow: 'hidden',
        ...Shadows.medium,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.sm,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, letterSpacing: -0.3 },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    settingRowLast: { borderBottomWidth: 0 },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    settingInfo: { flex: 1 },
    settingLabel: { fontSize: 16, fontWeight: '600', color: Colors.text },
    settingSubtitle: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
    settingValue: { fontSize: 14, color: Colors.textMuted, marginRight: Spacing.sm },
    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.expenseLight,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.xl,
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
        ...Shadows.small,
    },
    dangerButtonText: { fontSize: 16, fontWeight: '600', color: Colors.expense },
});
