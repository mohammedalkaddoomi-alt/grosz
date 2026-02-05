import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useDataStore } from '../../src/store/dataStore';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/constants/theme';
import { PL } from '../../src/constants/polish';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { dashboardStats, transactions, goals, refreshAll, isLoading } = useDataStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshAll();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  const recentTransactions = transactions.slice(0, 5);
  const activeGoals = goals.filter(g => !g.completed).slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{PL.hello}, {user?.name?.split(' ')[0] || 'Użytkowniku'} 👋</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('pl-PL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </View>
          <View style={styles.logoSmall}>
            <Text style={styles.logoEmoji}>💰</Text>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{PL.totalBalance}</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrency(dashboardStats?.total_balance || 0)}
          </Text>
          <View style={styles.balanceStats}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: COLORS.incomeLight + '40' }]}>
                <Ionicons name="arrow-up" size={16} color={COLORS.income} />
              </View>
              <View>
                <Text style={styles.statLabel}>{PL.monthIncome}</Text>
                <Text style={[styles.statValue, { color: COLORS.income }]}>
                  +{formatCurrency(dashboardStats?.month_income || 0)}
                </Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: COLORS.expenseLight + '40' }]}>
                <Ionicons name="arrow-down" size={16} color={COLORS.expense} />
              </View>
              <View>
                <Text style={styles.statLabel}>{PL.monthExpenses}</Text>
                <Text style={[styles.statValue, { color: COLORS.expense }]}>
                  -{formatCurrency(dashboardStats?.month_expenses || 0)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: COLORS.income + '15' }]}
            onPress={() => router.push('/wallets')}
          >
            <Ionicons name="add-circle" size={28} color={COLORS.income} />
            <Text style={styles.quickActionText}>{PL.income}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: COLORS.expense + '15' }]}
            onPress={() => router.push('/wallets')}
          >
            <Ionicons name="remove-circle" size={28} color={COLORS.expense} />
            <Text style={styles.quickActionText}>{PL.expense}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: COLORS.primary + '15' }]}
            onPress={() => router.push('/goals')}
          >
            <Ionicons name="flag" size={28} color={COLORS.primary} />
            <Text style={styles.quickActionText}>{PL.goals}</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{PL.recentTransactions}</Text>
            <TouchableOpacity onPress={() => router.push('/wallets')}>
              <Text style={styles.seeAll}>{PL.seeAll}</Text>
            </TouchableOpacity>
          </View>
          {recentTransactions.length > 0 ? (
            recentTransactions.map((tx) => (
              <View key={tx.id} style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
                  <Text style={styles.transactionEmoji}>{tx.emoji}</Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionCategory}>{tx.category}</Text>
                  <Text style={styles.transactionNote}>{tx.note || '-'}</Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: tx.type === 'income' ? COLORS.income : COLORS.expense },
                  ]}
                >
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>Brak transakcji</Text>
            </View>
          )}
        </View>

        {/* Goals Progress */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{PL.yourGoals}</Text>
            <TouchableOpacity onPress={() => router.push('/goals')}>
              <Text style={styles.seeAll}>{PL.seeAll}</Text>
            </TouchableOpacity>
          </View>
          {activeGoals.length > 0 ? (
            activeGoals.map((goal) => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              return (
                <View key={goal.id} style={styles.goalItem}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalIcon}>
                      <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                    </View>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <Text style={styles.goalAmount}>
                        {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                      </Text>
                    </View>
                    <Text style={styles.goalPercent}>{Math.round(progress)}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="flag-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>Brak celów</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  date: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  logoSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 24,
  },
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  balanceLabel: {
    fontSize: 14,
    color: COLORS.white + '80',
    marginBottom: SPACING.xs,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  balanceStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.white + '70',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.white + '30',
    marginHorizontal: SPACING.md,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  quickAction: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionEmoji: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  transactionCategory: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  transactionNote: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  goalItem: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalEmoji: {
    fontSize: 20,
  },
  goalInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  goalName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  goalAmount: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  goalPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
});
