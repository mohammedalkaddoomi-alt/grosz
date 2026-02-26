import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '../src/types';
import { useTheme } from '../src/contexts/ThemeContext';
import { Shadows } from '../src/constants/theme';
import Animated, { FadeInRight } from 'react-native-reanimated';

interface SubscriptionCardProps {
    subscription: Subscription;
    onPress: () => void;
    index: number;
}

const formatMoney = (value: number) =>
    new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value || 0);

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ subscription, onPress, index }) => {
    const { colors, settings } = useTheme();
    const isDark = settings.preset === 'dark';

    const parseDate = (value: string) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return new Date(`${value}T00:00:00`);
        }
        return new Date(value);
    };

    const getDaysRemaining = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextPayment = parseDate(subscription.next_payment_date);
        nextPayment.setHours(0, 0, 0, 0);
        const diffTime = nextPayment.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const daysRemaining = getDaysRemaining();
    const isUrgent = daysRemaining <= 3;

    const getBadgeLabel = () => {
        if (daysRemaining < 0) {
            return `${Math.abs(daysRemaining)} dni po terminie`;
        }
        if (daysRemaining === 0) {
            return 'Płatność dzisiaj';
        }
        if (daysRemaining === 1) {
            return '1 dzień';
        }
        return `${daysRemaining} dni`;
    };

    const getBurnRateText = () => {
        const price = subscription.price;
        if (subscription.billing_cycle === 'monthly') {
            return `~${formatMoney(price * 12)} / rok`;
        }
        if (subscription.billing_cycle === 'yearly') {
            return `~${formatMoney(price / 12)} / m-c`;
        }
        if (subscription.billing_cycle === 'weekly') {
            return `~${formatMoney(price * 52)} / rok`;
        }
        return '';
    };

    const isPotentiallyUnused = subscription.price >= 50 && subscription.id.length % 2 === 0; // Simple demo mock

    return (
        <Animated.View
            entering={FadeInRight.delay(index * 100).springify()}
            style={[
                styles.container,
                {
                    backgroundColor: colors.card,
                    shadowColor: Shadows.medium.shadowColor,
                }
            ]}
        >
            <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        {subscription.icon ? (
                            <Image source={{ uri: subscription.icon }} style={styles.icon} />
                        ) : (
                            <View style={[styles.placeholderIcon, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                                <Text style={[styles.placeholderText, { color: colors.text }]}>
                                    {subscription.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.info}>
                        <Text style={[styles.name, { color: colors.text }]}>{subscription.name}</Text>
                        <Text style={[styles.cycle, { color: colors.textLight }]}>
                            {subscription.billing_cycle === 'weekly' ? 'Tygodniowo' :
                                subscription.billing_cycle === 'monthly' ? 'Miesięcznie' : 'Rocznie'}
                        </Text>
                    </View>
                    <View style={styles.priceContainer}>
                        <Text style={[styles.price, { color: colors.text }]}>
                            {formatMoney(subscription.price)}
                        </Text>
                        <Text style={[styles.burnRate, { color: colors.textLight }]}>
                            {getBurnRateText()}
                        </Text>
                    </View>
                </View>

                <View style={[styles.footer, { borderTopColor: colors.border }]}>
                    <View style={styles.dateContainer}>
                        <Ionicons name="calendar-outline" size={14} color={colors.textLight} />
                        <Text style={[styles.dateText, { color: colors.textLight }]}>
                            Następna: {parseDate(subscription.next_payment_date).toLocaleDateString('pl-PL')}
                        </Text>
                    </View>
                    <View style={[
                        styles.badge,
                        { backgroundColor: isUrgent ? 'rgba(255, 59, 48, 0.1)' : 'rgba(52, 199, 89, 0.1)' }
                    ]}>
                        <Text style={[
                            styles.badgeText,
                            { color: isUrgent ? '#FF3B30' : '#34C759' }
                        ]}>
                            {getBadgeLabel()}
                        </Text>
                    </View>
                </View>

                {isPotentiallyUnused && (
                    <View style={[styles.suggestionBar, { backgroundColor: colors.warning + '15' }]}>
                        <Ionicons name="bulb-outline" size={14} color={colors.warning} />
                        <Text style={[styles.suggestionText, { color: colors.warning }]}>
                            Rzadko używane? Rozważ anulowanie.
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
        borderRadius: 16,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    content: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        marginRight: 12,
    },
    icon: {
        width: 40,
        height: 40,
        borderRadius: 10,
    },
    placeholderIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    cycle: {
        fontSize: 12,
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    price: {
        fontSize: 16,
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateText: {
        fontSize: 12,
        fontWeight: '500',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    burnRate: {
        fontSize: 11,
        marginTop: 2,
    },
    suggestionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        padding: 8,
        borderRadius: 8,
    },
    suggestionText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
