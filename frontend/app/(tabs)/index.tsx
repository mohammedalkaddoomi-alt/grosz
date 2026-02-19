import React, { useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useStore } from '../../src/store/store';
import { BorderRadius, Elevation, Spacing, Typography } from '../../src/constants/theme';
import { AnimatedButton, AnimatedCard, AnimatedNumber } from '../../src/components/AnimatedComponents';
import { WorkCalculatorModal } from '../../src/components/WorkCalculatorModal';
import { WageSettingsModal } from '../../src/components/WageSettingsModal';
import { SubscriptionCard } from '../../components/SubscriptionCard';
import { AddSubscriptionModal } from '../../components/AddSubscriptionModal';
import { Subscription, Transaction, Wallet } from '../../src/types';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useDrawer } from '../../src/contexts/DrawerContext';
import { WallpaperBackground } from '../../src/components/WallpaperBackground';

interface QuickAction {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
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
  const { openDrawer } = useDrawer();
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

  const quickActions: QuickAction[] = [
    {
      id: 'add',
      label: 'Nowy wpis',
      icon: 'add-circle-outline',
      color: colors.primary,
      onPress: () => router.push('/add'),
    },
    {
      id: 'planner',
      label: 'Ile godzin?',
      icon: 'time-outline',
      color: colors.income,
      onPress: () => setShowCalculator(true),
    },
    {
      id: 'ai',
      label: 'AI',
      icon: 'sparkles-outline',
      color: colors.info,
      onPress: () => router.push('/chat'),
    },
    {
      id: 'wallets',
      label: 'Portfele',
      icon: 'wallet-outline',
      color: colors.warning,
      onPress: () => router.push('/wallets'),
    },
    {
      id: 'goals',
      label: 'Cele',
      icon: 'flag-outline',
      color: colors.shared,
      onPress: () => router.push('/goals'),
    },
  ];

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
    } catch {
      Alert.alert('Błąd', 'Nie udało się zaktualizować subskrypcji');
    }
  };

  const confirmDeleteSubscription = (subscription: Subscription) => {
    Alert.alert('Usuń subskrypcję', `Czy na pewno chcesz usunąć "${subscription.name}"?`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSubscription(subscription.id);
          } catch {
            Alert.alert('Błąd', 'Nie udało się usunąć subskrypcji');
          }
        },
      },
    ]);
  };

  const openSubscriptionActions = (subscription: Subscription) => {
    Alert.alert(subscription.name, 'Wybierz akcję dla subskrypcji', [
      { text: 'Oznacz jako opłaconą', onPress: () => void markSubscriptionAsPaid(subscription) },
      { text: 'Usuń', style: 'destructive', onPress: () => confirmDeleteSubscription(subscription) },
      { text: 'Anuluj', style: 'cancel' },
    ]);
  };

  const monthResult = (stats?.month_income || 0) - (stats?.month_expenses || 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {settings.wallpaper && <WallpaperBackground wallpaper={settings.wallpaper} />}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header with Hamburger ── */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <TouchableOpacity onPress={openDrawer} style={styles.hamburger} activeOpacity={0.7}>
            <Ionicons name="menu-outline" size={26} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'Użytkowniku'}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile')} style={styles.profileButton} activeOpacity={0.7}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Balance Card — Flat & Clean ── */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo łączne</Text>
          <AnimatedNumber
            value={stats?.total_balance || 0}
            formatter={(value) => formatMoney(value)}
            style={styles.balanceValue}
          />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="trending-up-outline" size={16} color={colors.income} />
              <Text style={[styles.statValue, { color: colors.income }]}>
                {formatMoney(stats?.month_income || 0)}
              </Text>
            </View>
            <View style={styles.statDot} />
            <View style={styles.statItem}>
              <Ionicons name="trending-down-outline" size={16} color={colors.expense} />
              <Text style={[styles.statValue, { color: colors.expense }]}>
                {formatMoney(stats?.month_expenses || 0)}
              </Text>
            </View>
            <View style={styles.statDot} />
            <View style={styles.statItem}>
              <Ionicons name="analytics-outline" size={16} color={monthResult >= 0 ? colors.income : colors.expense} />
              <Text style={[styles.statValue, { color: monthResult >= 0 ? colors.income : colors.expense }]}>
                {formatMoney(monthResult)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Quick Actions — Horizontal Scroll ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Szybkie akcje</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsScroll}
          >
            {quickActions.map((action, index) => (
              <Animated.View key={action.id} entering={FadeInRight.delay(150 + index * 60).duration(400)}>
                <AnimatedButton style={styles.quickActionPill} onPress={action.onPress} hapticFeedback="light">
                  <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}14` }]}>
                    <Ionicons name={action.icon} size={18} color={action.color} />
                  </View>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </AnimatedButton>
              </Animated.View>
            ))}
          </ScrollView>
        </View>

        {/* ── Subscriptions ── */}
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
                <Ionicons name="repeat-outline" size={22} color={colors.income} />
              </View>
              <Text style={styles.emptyTitle}>Brak aktywnych subskrypcji</Text>
              <Text style={styles.emptyDescription}>Dodaj je, aby pilnować stałych kosztów.</Text>
              <AnimatedButton style={styles.emptyButton} onPress={() => setShowAddSubscription(true)} hapticFeedback="light">
                <Text style={styles.emptyButtonText}>Dodaj pierwszą</Text>
              </AnimatedButton>
            </AnimatedCard>
          )}
        </View>

        {/* ── Recent Transactions ── */}
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
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.transactionIconWrap,
                        { backgroundColor: isIncome ? colors.incomeLight : colors.expenseLight },
                      ]}
                    >
                      <Ionicons
                        name={isIncome ? 'arrow-down-outline' : 'arrow-up-outline'}
                        size={16}
                        color={isIncome ? colors.income : colors.expense}
                      />
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

        <View style={{ height: 40 }} />
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
      paddingBottom: 20,
    },

    /* ── Header ── */
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
    },
    hamburger: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.md,
    },
    headerCenter: {
      flex: 1,
      marginLeft: Spacing.sm,
    },
    greeting: {
      fontSize: scaleFont(13),
      color: colors.textLight,
      fontWeight: '500',
      fontFamily,
    },
    userName: {
      fontSize: scaleFont(20),
      color: colors.text,
      fontWeight: '700',
      letterSpacing: -0.4,
      fontFamily,
    },
    profileButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    profileAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileAvatarText: {
      fontSize: scaleFont(16),
      fontWeight: '700',
      color: '#FFFFFF',
      fontFamily,
    },

    /* ── Balance Card ── */
    balanceCard: {
      marginHorizontal: Spacing.xl,
      marginTop: Spacing.sm,
      marginBottom: Spacing.xxl,
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xxl,
      borderWidth: 1,
      borderColor: colors.borderLight,
      ...Elevation.level2,
    },
    balanceLabel: {
      fontSize: scaleFont(12),
      color: colors.textMuted,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontFamily,
    },
    balanceValue: {
      marginTop: Spacing.sm,
      fontSize: scaleFont(36),
      lineHeight: scaleFont(42),
      color: colors.text,
      fontWeight: '800',
      letterSpacing: -1.2,
      fontFamily,
    },
    statsRow: {
      marginTop: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statValue: {
      fontSize: scaleFont(13),
      fontWeight: '600',
      letterSpacing: -0.2,
      fontFamily,
    },
    statDot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: colors.border,
      marginHorizontal: Spacing.sm,
    },

    /* ── Sections ── */
    section: {
      marginBottom: Spacing.xxl,
    },
    sectionHeader: {
      paddingHorizontal: Spacing.xl,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      fontSize: scaleFont(17),
      color: colors.text,
      fontWeight: '700',
      letterSpacing: -0.3,
      paddingHorizontal: Spacing.xl,
      fontFamily,
    },
    sectionLink: {
      color: colors.primary,
      fontSize: scaleFont(13),
      fontWeight: '600',
      fontFamily,
    },

    /* ── Quick Actions ── */
    quickActionsScroll: {
      paddingHorizontal: Spacing.xl,
      gap: Spacing.sm,
      paddingTop: Spacing.sm,
    },
    quickActionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.pill,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: colors.borderLight,
      ...Elevation.level1,
    },
    quickActionIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.sm,
    },
    quickActionLabel: {
      fontSize: scaleFont(14),
      fontWeight: '600',
      color: colors.text,
      letterSpacing: -0.2,
      fontFamily,
    },

    /* ── Empty State ── */
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
      ...Elevation.level1,
    },
    emptyIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
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
      fontWeight: '600',
      fontFamily,
    },

    /* ── Transactions ── */
    transactionsCard: {
      marginHorizontal: Spacing.xl,
      borderRadius: BorderRadius.xl,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderLight,
      paddingHorizontal: Spacing.lg,
      ...Elevation.level1,
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
      width: 36,
      height: 36,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    transactionMeta: {
      flex: 1,
      marginLeft: 12,
      marginRight: Spacing.sm,
    },
    transactionTitle: {
      fontSize: scaleFont(15),
      color: colors.text,
      fontWeight: '600',
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
      fontWeight: '700',
      letterSpacing: -0.2,
      fontFamily,
    },
  });
