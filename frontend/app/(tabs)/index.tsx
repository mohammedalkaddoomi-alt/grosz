import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useStore } from '../../src/store/store';
import { BorderRadius, Elevation, Spacing, Typography } from '../../src/constants/theme';
import { AnimatedButton, AnimatedCard, AnimatedNumber } from '../../src/components/AnimatedComponents';
import { WorkCalculatorModal } from '../../src/components/WorkCalculatorModal';
import { WageSettingsModal } from '../../src/components/WageSettingsModal';
import { SubscriptionCard } from '../../components/SubscriptionCard';
import { AddSubscriptionModal } from '../../components/AddSubscriptionModal';
import { Subscription, Transaction, Wallet } from '../../src/types';
import { useTheme } from '../../src/contexts/ThemeContext';

interface QuickAction {
  id: string;
  label: string;
  caption: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  onPress: () => void;
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Dzień dobry';
  if (hour < 18) return 'Miłego dnia';
  return 'Dobry wieczór';
};

export default function Home() {
  const router = useRouter();
  const { colors, settings, fontFamily, scaleFont } = useTheme();
  const {
    user,
    stats,
    transactions,
    wallets,
    loadData,
    wageSettings,
    saveWageSettings,
    calculateWorkTime,
    subscriptions,
    loadSubscriptions,
    updateSubscription,
    deleteSubscription,
  } = useStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showWageSettings, setShowWageSettings] = useState(false);
  const [showAddSubscription, setShowAddSubscription] = useState(false);

  const styles = useMemo(() => getStyles(colors, fontFamily, scaleFont), [colors, fontFamily, scaleFont]);

  useEffect(() => {
    void loadData();
    if (user) {
      void loadSubscriptions();
    }
  }, [user, loadData, loadSubscriptions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), loadSubscriptions()]);
    setRefreshing(false);
  };

  const recentTransactions = transactions.slice(0, 5);
  const sharedWalletCount = wallets.filter((wallet: Wallet) => wallet.is_shared).length;

  const quickActions: QuickAction[] = [
    {
      id: 'add',
      label: 'Nowy wpis',
      caption: 'Przychód lub wydatek',
      icon: 'add-circle-outline',
      gradient: [colors.primary, colors.accent],
      onPress: () => router.push('/add'),
    },
    {
      id: 'planner',
      label: 'Planer czasu',
      caption: 'Ile godzin pracy',
      icon: 'time-outline',
      gradient: [colors.income, colors.accent],
      onPress: () => setShowCalculator(true),
    },
    {
      id: 'ai',
      label: 'Asystent AI',
      caption: 'Analiza finansów',
      icon: 'sparkles-outline',
      gradient: [colors.info, colors.primary],
      onPress: () => router.push('/chat'),
    },
    {
      id: 'wallets',
      label: 'Portfele',
      caption: 'Konta i udziały',
      icon: 'wallet-outline',
      gradient: [colors.warning, colors.secondary],
      onPress: () => router.push('/wallets'),
    },
  ];

  const openComingSoon = () => {
    Alert.alert('Wkrótce', 'Ta funkcja będzie dostępna w kolejnej iteracji.');
  };

  const parseDate = (value: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T00:00:00`);
    }
    return new Date(value);
  };

  const formatDateOnly = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getNextPaymentDate = (dateValue: string, cycle: Subscription['billing_cycle']) => {
    const date = parseDate(dateValue);
    date.setHours(0, 0, 0, 0);

    if (cycle === 'weekly') {
      date.setDate(date.getDate() + 7);
      return formatDateOnly(date);
    }

    const currentDay = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + (cycle === 'monthly' ? 1 : 12));
    const maxDayInNewMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(currentDay, maxDayInNewMonth));
    return formatDateOnly(date);
  };

  const markSubscriptionAsPaid = async (subscription: Subscription) => {
    try {
      const nextPaymentDate = getNextPaymentDate(subscription.next_payment_date, subscription.billing_cycle);
      await updateSubscription(subscription.id, { next_payment_date: nextPaymentDate });
      Alert.alert('Zaktualizowano', `Kolejna płatność: ${parseDate(nextPaymentDate).toLocaleDateString('pl-PL')}`);
    } catch (error) {
      console.error('Failed to update subscription:', error);
      Alert.alert('Błąd', 'Nie udało się zaktualizować subskrypcji');
    }
  };

  const confirmDeleteSubscription = (subscription: Subscription) => {
    Alert.alert(
      'Usuń subskrypcję',
      `Czy na pewno chcesz usunąć "${subscription.name}"?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSubscription(subscription.id);
            } catch (error) {
              console.error('Failed to delete subscription:', error);
              Alert.alert('Błąd', 'Nie udało się usunąć subskrypcji');
            }
          },
        },
      ],
    );
  };

  const openSubscriptionActions = (subscription: Subscription) => {
    Alert.alert(
      subscription.name,
      'Wybierz akcję dla subskrypcji',
      [
        {
          text: 'Oznacz jako opłaconą',
          onPress: () => {
            void markSubscriptionAsPaid(subscription);
          },
        },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: () => confirmDeleteSubscription(subscription),
        },
        { text: 'Anuluj', style: 'cancel' },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {settings.wallpaper && (
        <Image
          source={{ uri: settings.wallpaper.uri }}
          style={[styles.wallpaper, { opacity: settings.wallpaper.opacity }]}
          blurRadius={settings.wallpaper.blur}
        />
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View entering={FadeIn.duration(500)} style={styles.heroBlock}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroGreeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'Użytkowniku'}</Text>
                <Text style={styles.heroDate}>
                  {new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
              </View>
              <AnimatedButton
                style={styles.heroIconButton}
                hapticFeedback="light"
                onPress={() => router.push('/profile')}
              >
                <Ionicons name="person-circle-outline" size={28} color="#FFFFFF" />
              </AnimatedButton>
            </View>

            <View style={styles.balanceWrap}>
              <Text style={styles.balanceLabel}>Saldo łączne</Text>
              <AnimatedNumber
                value={stats?.total_balance || 0}
                formatter={(value) => formatMoney(value)}
                style={styles.balanceValue}
              />
            </View>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatChip}>
                <Text style={styles.heroStatLabel}>Portfele</Text>
                <Text style={styles.heroStatValue}>{wallets.length}</Text>
              </View>
              <View style={styles.heroStatChip}>
                <Text style={styles.heroStatLabel}>Wspólne</Text>
                <Text style={styles.heroStatValue}>{sharedWalletCount}</Text>
              </View>
              <View style={styles.heroStatChip}>
                <Text style={styles.heroStatLabel}>Mies. wynik</Text>
                <Text style={styles.heroStatValue}>
                  {formatMoney((stats?.month_income || 0) - (stats?.month_expenses || 0))}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Szybkie akcje</Text>
            <TouchableOpacity onPress={openComingSoon}>
              <Text style={styles.sectionLink}>Więcej</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <Animated.View key={action.id} entering={FadeInDown.delay(120 + index * 70).duration(500)} style={styles.quickActionCell}>
                <AnimatedButton style={styles.quickActionCard} onPress={action.onPress} hapticFeedback="light">
                  <LinearGradient colors={action.gradient} style={styles.quickActionIconWrap}>
                    <Ionicons name={action.icon} size={20} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.quickActionTitle}>{action.label}</Text>
                  <Text style={styles.quickActionCaption}>{action.caption}</Text>
                </AnimatedButton>
              </Animated.View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Subskrypcje</Text>
            <TouchableOpacity onPress={() => setShowAddSubscription(true)}>
              <Text style={styles.sectionLink}>Dodaj</Text>
            </TouchableOpacity>
          </View>

          {subscriptions && subscriptions.length > 0 ? (
            <View style={styles.sectionList}>
              {subscriptions.slice(0, 3).map((subscription: Subscription, index: number) => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  onPress={() => openSubscriptionActions(subscription)}
                  index={index}
                />
              ))}
            </View>
          ) : (
            <AnimatedCard entrance="slideUp" style={styles.emptyCard}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.incomeLight }]}>
                <Ionicons name="repeat-outline" size={24} color={colors.income} />
              </View>
              <Text style={styles.emptyTitle}>Brak aktywnych subskrypcji</Text>
              <Text style={styles.emptyDescription}>Dodaj je, aby pilnować stałych kosztów.</Text>
              <AnimatedButton style={styles.emptyButton} onPress={() => setShowAddSubscription(true)} hapticFeedback="light">
                <Text style={styles.emptyButtonText}>Dodaj pierwszą</Text>
              </AnimatedButton>
            </AnimatedCard>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ostatnie transakcje</Text>
            <TouchableOpacity onPress={() => router.push('/transactions')}>
              <Text style={styles.sectionLink}>Historia</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionsCard}>
            {recentTransactions.length === 0 ? (
              <Text style={styles.noDataText}>Brak ostatnich operacji</Text>
            ) : (
              recentTransactions.map((tx: Transaction, index: number) => {
                const isIncome = tx.type === 'income';
                return (
                  <TouchableOpacity
                    key={tx.id}
                    style={[styles.transactionRow, index !== recentTransactions.length - 1 && styles.transactionRowBorder]}
                    onPress={() => router.push('/transactions')}
                  >
                    <View
                      style={[
                        styles.transactionIconWrap,
                        { backgroundColor: isIncome ? colors.incomeLight : colors.expenseLight },
                      ]}
                    >
                      <Text style={styles.transactionEmoji}>{tx.emoji || (isIncome ? '💸' : '💳')}</Text>
                    </View>
                    <View style={styles.transactionMeta}>
                      <Text style={styles.transactionTitle}>{tx.category || 'Transakcja'}</Text>
                      <Text style={styles.transactionSubtitle}>
                        {new Date(tx.created_at).toLocaleDateString('pl-PL')}
                      </Text>
                    </View>
                    <Text style={[styles.transactionAmount, { color: isIncome ? colors.income : colors.expense }]}>
                      {isIncome ? '+' : '-'}{formatMoney(tx.amount)}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      <WorkCalculatorModal
        visible={showCalculator}
        onClose={() => setShowCalculator(false)}
        wageSettings={wageSettings}
        onOpenSettings={() => {
          setShowCalculator(false);
          setTimeout(() => setShowWageSettings(true), 300);
        }}
        calculateWorkTime={calculateWorkTime}
        sharedWalletMembers={wallets.find((wallet: Wallet) => wallet.is_shared)?.members_details || []}
      />

      <WageSettingsModal
        visible={showWageSettings}
        onClose={() => setShowWageSettings(false)}
        onSave={async (updatedSettings) => {
          await saveWageSettings(updatedSettings);
          setShowWageSettings(false);
          setTimeout(() => setShowCalculator(true), 300);
        }}
        initialSettings={wageSettings}
      />

      <AddSubscriptionModal visible={showAddSubscription} onClose={() => setShowAddSubscription(false)} />
    </SafeAreaView>
  );
}

const getStyles = (colors: any, fontFamily: string | undefined, scaleFont: (size: number) => number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    wallpaper: {
      ...StyleSheet.absoluteFillObject,
    },
    scrollContent: {
      paddingBottom: 120,
    },
    heroBlock: {
      marginHorizontal: Spacing.xl,
      marginTop: Spacing.md,
      marginBottom: Spacing.xxl,
    },
    heroCard: {
      borderRadius: 30,
      paddingHorizontal: Spacing.xxl,
      paddingVertical: Spacing.xxl,
      ...Elevation.level5,
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    heroTextWrap: {
      flex: 1,
      paddingRight: Spacing.sm,
    },
    heroGreeting: {
      ...Typography.h3,
      color: '#FFFFFF',
      fontWeight: '800',
      letterSpacing: -0.3,
      fontFamily,
    },
    heroDate: {
      marginTop: 4,
      fontSize: scaleFont(13),
      color: 'rgba(255,255,255,0.82)',
      textTransform: 'capitalize',
      fontWeight: '500',
      fontFamily,
    },
    heroIconButton: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.22)',
    },
    balanceWrap: {
      marginTop: Spacing.xxl,
    },
    balanceLabel: {
      fontSize: scaleFont(13),
      color: 'rgba(255,255,255,0.78)',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      fontFamily,
    },
    balanceValue: {
      marginTop: Spacing.sm,
      fontSize: scaleFont(40),
      lineHeight: scaleFont(46),
      color: '#FFFFFF',
      fontFamily: fontFamily || 'SpaceMono',
      letterSpacing: -1.2,
    },
    heroStatsRow: {
      marginTop: Spacing.xl,
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    heroStatChip: {
      flex: 1,
      borderRadius: BorderRadius.lg,
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 10,
    },
    heroStatLabel: {
      fontSize: scaleFont(10),
      color: 'rgba(255,255,255,0.72)',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontWeight: '700',
      fontFamily,
    },
    heroStatValue: {
      marginTop: 4,
      fontSize: scaleFont(14),
      color: '#FFFFFF',
      fontWeight: '700',
      letterSpacing: -0.2,
      fontFamily,
    },
    section: {
      marginBottom: Spacing.xxl,
    },
    sectionHeader: {
      paddingHorizontal: Spacing.xl,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.lg,
    },
    sectionTitle: {
      ...Typography.h3,
      color: colors.text,
      fontSize: scaleFont(21),
      letterSpacing: -0.5,
      fontFamily,
    },
    sectionLink: {
      color: colors.primary,
      fontSize: scaleFont(13),
      fontWeight: '700',
      letterSpacing: 0.2,
      textTransform: 'uppercase',
      fontFamily,
    },
    quickActionsGrid: {
      marginHorizontal: Spacing.xl,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: Spacing.md,
    },
    quickActionCell: {
      width: '48.2%',
    },
    quickActionCard: {
      borderRadius: BorderRadius.xl,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: Spacing.lg,
      minHeight: 132,
      ...Elevation.level2,
    },
    quickActionIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.md,
    },
    quickActionTitle: {
      fontSize: scaleFont(15),
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.3,
      fontFamily,
    },
    quickActionCaption: {
      marginTop: 4,
      fontSize: scaleFont(12),
      color: colors.textLight,
      lineHeight: scaleFont(16),
      fontWeight: '500',
      fontFamily,
    },
    sectionList: {
      marginHorizontal: Spacing.xl,
    },
    emptyCard: {
      marginHorizontal: Spacing.xl,
      borderRadius: BorderRadius.xl,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderLight,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.xxl,
      alignItems: 'center',
      ...Elevation.level2,
    },
    emptyIconCircle: {
      width: 52,
      height: 52,
      borderRadius: BorderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.md,
    },
    emptyTitle: {
      ...Typography.bodyBold,
      color: colors.text,
      fontWeight: '700',
      fontFamily,
    },
    emptyDescription: {
      marginTop: 4,
      ...Typography.caption,
      color: colors.textLight,
      textAlign: 'center',
      fontFamily,
    },
    emptyButton: {
      marginTop: Spacing.lg,
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.pill,
      paddingHorizontal: Spacing.xl,
      paddingVertical: 10,
    },
    emptyButtonText: {
      color: '#FFFFFF',
      fontSize: scaleFont(13),
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      fontFamily,
    },
    transactionsCard: {
      marginHorizontal: Spacing.xl,
      borderRadius: BorderRadius.xl,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderLight,
      paddingHorizontal: Spacing.lg,
      ...Elevation.level2,
    },
    noDataText: {
      ...Typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: Spacing.xl,
      fontFamily,
    },
    transactionRow: {
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
    },
    transactionRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    transactionIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    transactionEmoji: {
      fontSize: scaleFont(20),
    },
    transactionMeta: {
      flex: 1,
      marginLeft: 12,
      marginRight: Spacing.sm,
    },
    transactionTitle: {
      fontSize: scaleFont(15),
      color: colors.text,
      fontWeight: '700',
      letterSpacing: -0.2,
      fontFamily,
    },
    transactionSubtitle: {
      marginTop: 2,
      fontSize: scaleFont(12),
      color: colors.textLight,
      fontWeight: '500',
      fontFamily,
    },
    transactionAmount: {
      fontSize: scaleFont(15),
      fontWeight: '800',
      letterSpacing: -0.2,
      fontFamily,
    },
  });
