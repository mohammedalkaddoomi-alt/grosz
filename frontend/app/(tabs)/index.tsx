import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useDataStore } from '../../src/store/dataStore';
import { COLORS, SPACING, BORDER_RADIUS, GRADIENTS } from '../../src/constants/theme';
import { PL } from '../../src/constants/polish';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { dashboardStats, transactions, goals, refreshAll } = useDataStore();
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const recentTransactions = transactions.slice(0, 4);
  const activeGoals = goals.filter((g) => !g.completed).slice(0, 2);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Dzień dobry';
    if (hour < 18) return 'Cześć';
    return 'Dobry wieczór';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1A1A2E', '#16213E']}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()} 👋</Text>
              <Text style={styles.userName}>{user?.name || 'Użytkowniku'}</Text>
            </View>
            <TouchableOpacity style={styles.notificationBtn}>
              <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <LinearGradient
              colors={GRADIENTS.primary}
              style={styles.balanceGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardDecor1} />
              <View style={styles.cardDecor2} />
              
              <Text style={styles.balanceLabel}>{PL.totalBalance}</Text>
              <Text style={styles.balanceAmount}>
                {formatCurrency(dashboardStats?.total_balance || 0)}
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <View style={styles.statIconBg}>
                    <Ionicons name="arrow-up" size={14} color={COLORS.income} />
                  </View>
                  <View>
                    <Text style={styles.statLabel}>Przychody</Text>
                    <Text style={styles.statValueIncome}>
                      +{formatCurrency(dashboardStats?.month_income || 0)}
                    </Text>
                  </View>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={styles.statIconBg}>
                    <Ionicons name="arrow-down" size={14} color={COLORS.expense} />
                  </View>
                  <View>
                    <Text style={styles.statLabel}>Wydatki</Text>
                    <Text style={styles.statValueExpense}>
                      -{formatCurrency(dashboardStats?.month_expenses || 0)}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <QuickAction
            icon="add-circle"
            label="Przychód"
            gradient={GRADIENTS.income}
            onPress={() => router.push('/wallets')}
          />
          <QuickAction
            icon="remove-circle"
            label="Wydatek"
            gradient={GRADIENTS.expense}
            onPress={() => router.push('/wallets')}
          />
          <QuickAction
            icon="swap-horizontal"
            label="Transfer"
            gradient={GRADIENTS.purple}
            onPress={() => router.push('/wallets')}
          />
          <QuickAction
            icon="flag"
            label="Cel"
            gradient={GRADIENTS.sunset}
            onPress={() => router.push('/goals')}
          />
        </View>

        {/* Goals Progress */}
        {activeGoals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{PL.yourGoals}</Text>
              <TouchableOpacity onPress={() => router.push('/goals')}>
                <Text style={styles.seeAll}>{PL.seeAll}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.goalsContainer}>
              {activeGoals.map((goal) => {
                const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                return (
                  <TouchableOpacity key={goal.id} style={styles.goalCard} activeOpacity={0.8}>
                    <View style={styles.goalHeader}>
                      <View style={styles.goalIconContainer}>
                        <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                      </View>
                      <View style={styles.goalInfo}>
                        <Text style={styles.goalName} numberOfLines={1}>{goal.name}</Text>
                        <Text style={styles.goalAmount}>
                          {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                        </Text>
                      </View>
                      <Text style={styles.goalPercent}>{Math.round(progress)}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <LinearGradient
                        colors={GRADIENTS.primary}
                        style={[styles.progressBarFill, { width: `${progress}%` }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{PL.recentTransactions}</Text>
            <TouchableOpacity onPress={() => router.push('/wallets')}>
              <Text style={styles.seeAll}>{PL.seeAll}</Text>
            </TouchableOpacity>
          </View>
          
          {recentTransactions.length > 0 ? (
            <View style={styles.transactionsCard}>
              {recentTransactions.map((tx, index) => (
                <View key={tx.id} style={[
                  styles.transactionItem,
                  index === recentTransactions.length - 1 && styles.lastTransaction
                ]}>
                  <View style={[
                    styles.txIconContainer,
                    { backgroundColor: tx.type === 'income' ? `${COLORS.income}15` : `${COLORS.expense}15` }
                  ]}>
                    <Text style={styles.txEmoji}>{tx.emoji}</Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txCategory}>{tx.category}</Text>
                    <Text style={styles.txDate}>
                      {new Date(tx.created_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <Text style={[
                    styles.txAmount,
                    { color: tx.type === 'income' ? COLORS.income : COLORS.expense }
                  ]}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Brak transakcji</Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => router.push('/wallets')}
              >
                <Text style={styles.emptyButtonText}>Dodaj pierwszą</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* AI Tip Card */}
        <TouchableOpacity 
          style={styles.aiCard}
          activeOpacity={0.9}
          onPress={() => router.push('/assistant')}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.aiGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.aiContent}>
              <View style={styles.aiIconBg}>
                <Ionicons name="sparkles" size={24} color={COLORS.white} />
              </View>
              <View style={styles.aiTextContainer}>
                <Text style={styles.aiTitle}>Asystent AI</Text>
                <Text style={styles.aiDescription}>Porozmawiaj o finansach</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const QuickAction = ({ icon, label, gradient, onPress }: any) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.8}>
    <LinearGradient colors={gradient} style={styles.quickActionIcon}>
      <Ionicons name={icon} size={22} color={COLORS.white} />
    </LinearGradient>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    paddingBottom: 40,
  },
  safeArea: {
    paddingHorizontal: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    marginTop: SPACING.sm,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 2,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  balanceGradient: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  cardDecor1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -50,
    right: -30,
  },
  cardDecor2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: -30,
    left: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: SPACING.xs,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statValueIncome: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.income,
  },
  statValueExpense: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.expense,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: SPACING.md,
  },
  content: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: 100,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  quickAction: {
    alignItems: 'center',
    width: (width - 48 - 36) / 4,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  quickActionLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  goalsContainer: {
    gap: SPACING.sm,
  },
  goalCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  goalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalEmoji: {
    fontSize: 22,
  },
  goalInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  goalName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  goalAmount: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  goalPercent: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  transactionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  lastTransaction: {
    borderBottomWidth: 0,
  },
  txIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txEmoji: {
    fontSize: 20,
  },
  txInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  txCategory: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  txDate: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  emptyButton: {
    backgroundColor: `${COLORS.primary}15`,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  emptyButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  aiCard: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  aiGradient: {
    padding: SPACING.md,
  },
  aiContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiTextContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  aiDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
});
