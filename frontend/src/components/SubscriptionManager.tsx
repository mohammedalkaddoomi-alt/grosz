import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/store';
import { Colors, Shadows, BorderRadius, Spacing } from '../constants/theme';
import { AnimatedCard } from './AnimatedComponents';
import { BlurView } from 'expo-blur';

export const SubscriptionManager = () => {
    const { subscriptions, addSubscription, deleteSubscription, wageSettings } = useStore();
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [currency, setCurrency] = useState(wageSettings?.currency || 'PLN');
    const [billingCycle, setBillingCycle] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
    const [nextPaymentDate, setNextPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    const handleAddString = async () => {
        if (!name || !price || !nextPaymentDate) {
            Alert.alert('Błąd', 'Wypełnij wszystkie wymagane pola');
            return;
        }

        setLoading(true);
        try {
            await addSubscription({
                name,
                price: parseFloat(price),
                currency,
                billing_cycle: billingCycle,
                next_payment_date: nextPaymentDate,
                start_date: new Date().toISOString().split('T')[0],
                reminder_enabled: true,
                reminder_days_before: 1,
                icon: null
            });
            setModalVisible(false);
            resetForm();
        } catch (error) {
            Alert.alert('Błąd', 'Nie udało się dodać subskrypcji');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            'Usuń subskrypcję',
            'Czy na pewno chcesz usunąć tę subskrypcję?',
            [
                { text: 'Anuluj', style: 'cancel' },
                { text: 'Usuń', style: 'destructive', onPress: () => deleteSubscription(id) }
            ]
        );
    };

    const resetForm = () => {
        setName('');
        setPrice('');
        setBillingCycle('monthly');
        setNextPaymentDate(new Date().toISOString().split('T')[0]);
    };

    const getTotalMonthlyCost = () => {
        return subscriptions.reduce((acc: number, sub: any) => {
            let monthlyPrice = sub.price;
            if (sub.billing_cycle === 'weekly') monthlyPrice = sub.price * 4;
            if (sub.billing_cycle === 'yearly') monthlyPrice = sub.price / 12;
            return acc + monthlyPrice;
        }, 0);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Subskrypcje</Text>
                    <Text style={styles.subtitle}>
                        Miesięcznie: {getTotalMonthlyCost().toFixed(2)} {wageSettings?.currency || 'PLN'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
                {subscriptions.map((sub: any, index: number) => (
                    <AnimatedCard
                        key={sub.id}
                        entrance="slideLeft"
                        delay={index * 100}
                        style={styles.card}
                    >
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconPlaceholder, { backgroundColor: Colors.primary + '20' }]}>
                                <Text style={{ fontSize: 20 }}>{sub.name[0]?.toUpperCase()}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleDelete(sub.id)}>
                                <Ionicons name="trash-outline" size={20} color={Colors.error} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.cardTitle} numberOfLines={1}>{sub.name}</Text>
                        <Text style={styles.cardPrice}>
                            {sub.price} {sub.currency}
                            <Text style={styles.cardCycle}>/{sub.billing_cycle === 'monthly' ? 'msc' : sub.billing_cycle === 'yearly' ? 'rok' : 'tydz'}</Text>
                        </Text>

                        <View style={styles.dateTag}>
                            <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
                            <Text style={styles.dateText}>Next: {sub.next_payment_date}</Text>
                        </View>
                    </AnimatedCard>
                ))}

                {subscriptions.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Brak subskrypcji</Text>
                    </View>
                )}
            </ScrollView>

            {/* Add Subscription Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nowa subskrypcja</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formItem}>
                            <Text style={styles.label}>Nazwa</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Netflix, Spotify..."
                                placeholderTextColor={Colors.textMuted}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.formItem, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>Cena</Text>
                                <TextInput
                                    style={styles.input}
                                    value={price}
                                    onChangeText={setPrice}
                                    keyboardType="numeric"
                                    placeholder="0.00"
                                    placeholderTextColor={Colors.textMuted}
                                />
                            </View>
                            <View style={[styles.formItem, { flex: 1 }]}>
                                <Text style={styles.label}>Waluta</Text>
                                <TextInput
                                    style={styles.input}
                                    value={currency}
                                    onChangeText={setCurrency}
                                    placeholder="PLN"
                                    placeholderTextColor={Colors.textMuted}
                                />
                            </View>
                        </View>

                        <View style={styles.formItem}>
                            <Text style={styles.label}>Cykl rozliczeniowy</Text>
                            <View style={styles.cycleSelector}>
                                {(['weekly', 'monthly', 'yearly'] as const).map((cycle) => (
                                    <TouchableOpacity
                                        key={cycle}
                                        style={[styles.cycleOption, billingCycle === cycle && styles.cycleOptionActive]}
                                        onPress={() => setBillingCycle(cycle)}
                                    >
                                        <Text style={[styles.cycleText, billingCycle === cycle && styles.cycleTextActive]}>
                                            {cycle === 'monthly' ? 'Miesięcznie' : cycle === 'yearly' ? 'Rocznie' : 'Tygodniowo'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.formItem}>
                            <Text style={styles.label}>Data płatności (RRRR-MM-DD)</Text>
                            <TextInput
                                style={styles.input}
                                value={nextPaymentDate}
                                onChangeText={setNextPaymentDate}
                                placeholder="2024-01-01"
                                placeholderTextColor={Colors.textMuted}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleAddString}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Dodaj</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    subtitle: {
        fontSize: 12,
        color: Colors.textMuted,
        marginTop: 2,
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.small,
    },
    list: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.md,
    },
    card: {
        width: 140,
        padding: Spacing.md,
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.lg,
        ...Shadows.small,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    iconPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
    },
    cardPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    cardCycle: {
        fontSize: 10,
        fontWeight: '400',
        color: Colors.textMuted,
    },
    dateTag: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.sm,
        backgroundColor: Colors.background,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    dateText: {
        fontSize: 10,
        color: Colors.textMuted,
        marginLeft: 4,
    },
    emptyState: {
        padding: Spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    emptyText: {
        color: Colors.textMuted,
        fontStyle: 'italic',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: Colors.card,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        padding: Spacing.xl,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
    },
    formItem: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: 12,
        color: Colors.textMuted,
        marginBottom: Spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        color: Colors.text,
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
    },
    cycleSelector: {
        flexDirection: 'row',
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.md,
        padding: 4,
    },
    cycleOption: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: BorderRadius.sm,
    },
    cycleOptionActive: {
        backgroundColor: Colors.primary,
    },
    cycleText: {
        fontSize: 12,
        color: Colors.textMuted,
    },
    cycleTextActive: {
        color: '#FFF',
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        marginTop: Spacing.md,
    },
    submitText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
