import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../src/contexts/ThemeContext';
import { useStore } from '../src/store/store';

interface AddSubscriptionModalProps {
    visible: boolean;
    onClose: () => void;
}

export const AddSubscriptionModal: React.FC<AddSubscriptionModalProps> = ({ visible, onClose }) => {
    const { colors, settings } = useTheme();
    const isDark = settings.preset === 'dark';
    const { addSubscription } = useStore();
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [currency, setCurrency] = useState('PLN');
    const [billingCycle, setBillingCycle] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
    const [nextPaymentDate, setNextPaymentDate] = useState(new Date());
    const [reminderEnabled, setReminderEnabled] = useState(true);
    const [reminderDays, setReminderDays] = useState('1');
    const [showDatePicker, setShowDatePicker] = useState(false);

    const toDateOnlyString = (date: Date) => {
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const closeModal = () => {
        onClose();
        resetForm();
    };

    const handleSave = async () => {
        const normalizedName = name.trim();
        const normalizedPrice = Number(price.replace(',', '.'));
        const normalizedCurrency = currency.trim().toUpperCase() || 'PLN';
        const reminderValue = Number.parseInt(reminderDays || '1', 10);

        if (!normalizedName) {
            Alert.alert('Błąd', 'Podaj nazwę subskrypcji');
            return;
        }

        if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
            Alert.alert('Błąd', 'Podaj poprawną cenę');
            return;
        }

        if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
            Alert.alert('Błąd', 'Waluta musi mieć 3 litery (np. PLN)');
            return;
        }

        if (reminderEnabled && (!Number.isFinite(reminderValue) || reminderValue < 0)) {
            Alert.alert('Błąd', 'Podaj poprawną liczbę dni przypomnienia');
            return;
        }

        const paymentDate = new Date(nextPaymentDate);
        paymentDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (paymentDate < today) {
            Alert.alert('Błąd', 'Data płatności nie może być z przeszłości');
            return;
        }

        try {
            setSaving(true);
            await addSubscription({
                name: normalizedName,
                price: normalizedPrice,
                currency: normalizedCurrency,
                billing_cycle: billingCycle,
                start_date: toDateOnlyString(new Date()),
                next_payment_date: toDateOnlyString(nextPaymentDate),
                reminder_enabled: reminderEnabled,
                reminder_days_before: reminderEnabled ? reminderValue : 0,
                icon: null,
            });
            closeModal();
        } catch (error) {
            console.error('Error adding subscription:', error);
            Alert.alert('Błąd', 'Nie udało się dodać subskrypcji. Spróbuj ponownie.');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setName('');
        setPrice('');
        setCurrency('PLN');
        setBillingCycle('monthly');
        setNextPaymentDate(new Date());
        setReminderEnabled(true);
        setReminderDays('1');
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={closeModal}
        >
            <BlurView intensity={isDark ? 80 : 100} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
                <View style={styles.container}>
                    <View style={[styles.content, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: colors.text }]}>New Subscription</Text>
                            <TouchableOpacity onPress={closeModal} style={styles.closeButton} disabled={saving}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>Name</Text>
                                <TextInput
                                    style={[styles.input, {
                                        color: colors.text,
                                        backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                                        borderColor: isDark ? '#3A3A3C' : '#E5E5EA'
                                    }]}
                                    placeholder="Netflix, Spotify, etc."
                                    placeholderTextColor={colors.textLight}
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                    <Text style={[styles.label, { color: colors.text }]}>Price</Text>
                                    <TextInput
                                        style={[styles.input, {
                                            color: colors.text,
                                            backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                                            borderColor: isDark ? '#3A3A3C' : '#E5E5EA'
                                        }]}
                                        placeholder="0.00"
                                        placeholderTextColor={colors.textLight}
                                        keyboardType="numeric"
                                        value={price}
                                        onChangeText={text => setPrice(text.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { width: 80 }]}>
                                    <Text style={[styles.label, { color: colors.text }]}>Currency</Text>
                                    <TextInput
                                        style={[styles.input, {
                                            color: colors.text,
                                            backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                                            borderColor: isDark ? '#3A3A3C' : '#E5E5EA'
                                        }]}
                                        value={currency}
                                        onChangeText={text => setCurrency(text.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))}
                                        autoCapitalize="characters"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>Billing Cycle</Text>
                                <View style={styles.segmentContainer}>
                                    {(['weekly', 'monthly', 'yearly'] as const).map((cycle) => (
                                        <TouchableOpacity
                                            key={cycle}
                                            style={[
                                                styles.segmentButton,
                                                billingCycle === cycle && { backgroundColor: colors.primary },
                                                { borderColor: isDark ? '#3A3A3C' : '#E5E5EA' }
                                            ]}
                                            onPress={() => setBillingCycle(cycle)}
                                        >
                                            <Text style={[
                                                styles.segmentText,
                                                { color: billingCycle === cycle ? '#FFFFFF' : colors.text }
                                            ]}>
                                                {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>Next Payment</Text>
                                <TouchableOpacity
                                    style={[styles.dateButton, {
                                        backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                                        borderColor: isDark ? '#3A3A3C' : '#E5E5EA'
                                    }]}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={{ color: colors.text }}>
                                        {nextPaymentDate.toLocaleDateString()}
                                    </Text>
                                    <Ionicons name="calendar" size={20} color={colors.textLight} />
                                </TouchableOpacity>
                            </View>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={nextPaymentDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event: any, selectedDate?: Date) => {
                                        setShowDatePicker(false);
                                        if (selectedDate) setNextPaymentDate(selectedDate);
                                    }}
                                />
                            )}

                            <View style={styles.inputGroup}>
                                <View style={styles.switchRow}>
                                    <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Remind me</Text>
                                    <TouchableOpacity
                                        style={[
                                            styles.switch,
                                            { backgroundColor: reminderEnabled ? colors.primary : (isDark ? '#3A3A3C' : '#E5E5EA') }
                                        ]}
                                        onPress={() => setReminderEnabled(!reminderEnabled)}
                                    >
                                        <View style={[
                                            styles.switchKnob,
                                            { transform: [{ translateX: reminderEnabled ? 20 : 0 }] }
                                        ]} />
                                    </TouchableOpacity>
                                </View>

                                {reminderEnabled && (
                                    <View style={styles.reminderInputContainer}>
                                        <Text style={{ color: colors.text }}>Days before:</Text>
                                        <TextInput
                                            style={[styles.smallInput, {
                                                color: colors.text,
                                                backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                                                borderColor: isDark ? '#3A3A3C' : '#E5E5EA'
                                            }]}
                                            keyboardType="numeric"
                                            value={reminderDays}
                                            onChangeText={text => setReminderDays(text.replace(/[^0-9]/g, ''))}
                                        />
                                    </View>
                                )}
                            </View>
                        </ScrollView>

                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton, { borderColor: isDark ? '#3A3A3C' : '#E5E5EA' }]}
                                onPress={closeModal}
                                disabled={saving}
                            >
                                <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }, saving && styles.buttonDisabled]}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    content: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 4,
    },
    form: {
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        opacity: 0.7,
    },
    input: {
        height: 48,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    segmentContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    segmentButton: {
        flex: 1,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    segmentText: {
        fontSize: 14,
        fontWeight: '600',
    },
    dateButton: {
        height: 48,
        borderRadius: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    switch: {
        width: 50,
        height: 30,
        borderRadius: 15,
        padding: 2,
    },
    switchKnob: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    reminderInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    smallInput: {
        width: 60,
        height: 40,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        borderWidth: 1,
        textAlign: 'center',
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    button: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    cancelButton: {
        borderWidth: 1,
    },
    saveButton: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
    },
});
