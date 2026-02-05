import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/store';
import { Colors, Gradients, Shadows, BorderRadius, Spacing } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

export default function Home() {
  const router = useRouter();
  const { user, stats, transactions, wallets, loadData } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatMoney = (n: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0 }).format(n);

  const recentTx = transactions.slice(0, 5);
  const sharedWallets = wallets.filter(w => w.is_shared);
  const personalWallets = wallets.filter(w => !w.is_shared);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Cześć, {user?.name?.split(' ')[0]} 👋</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <LinearGradient colors={Gradients.primary} style={styles.balanceCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Całkowite saldo</Text>
            <View style={styles.walletBadge}>
              <Ionicons name="wallet-outline" size={14} color={Colors.white} />
              <Text style={styles.walletCount}>{wallets.length} portfeli</Text>
            </View>
          </View>
          <Text style={styles.balanceAmount}>{formatMoney(stats?.total_balance || 0)}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(16,185,129,0.25)' }]}>
                <Ionicons name="trending-up" size={18} color="#10B981" />
              </View>
              <View>
                <Text style={styles.statLabel}>Przychody</Text>
                <Text style={styles.statValue}>+{formatMoney(stats?.month_income || 0)}</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(239,68,68,0.25)' }]}>
                <Ionicons name="trending-down" size={18} color="#EF4444" />
              </View>
              <View>
                <Text style={styles.statLabel}>Wydatki</Text>
                <Text style={styles.statValue}>-{formatMoney(stats?.month_expenses || 0)}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Szybkie akcje</Text>
          <View style={styles.actions}>
            <ActionButton icon="add" label="Przychód" color={Colors.income} gradient={Gradients.income} onPress={() => router.push('/(tabs)/add')} />
            <ActionButton icon="remove" label="Wydatek" color={Colors.expense} gradient={Gradients.expense} onPress={() => router.push('/(tabs)/add')} />
            <ActionButton icon="people" label="Wspólne" color={Colors.shared} gradient={Gradients.purple} onPress={() => router.push('/(tabs)/wallets')} />
            <ActionButton icon="chatbubble-ellipses" label="AI" color={Colors.primary} gradient={Gradients.primary} onPress={() => router.push('/(tabs)/chat')} />
          </View>
        </View>

        {/* Shared Wallets Preview */}
        {sharedWallets.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="people" size={20} color={Colors.shared} />
                <Text style={styles.sectionTitle}>Wspólne portfele</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/wallets')}>
                <Text style={styles.seeAll}>Zobacz wszystko</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletsScroll}>
              {sharedWallets.slice(0, 3).map((wallet) => (
                <TouchableOpacity key={wallet.id} style={styles.walletCard} onPress={() => router.push('/(tabs)/wallets')}>
                  <LinearGradient colors={Gradients.purple} style={styles.walletGradient}>
                    <Text style={styles.walletEmoji}>{wallet.emoji}</Text>
                    <Text style={styles.walletName} numberOfLines={1}>{wallet.name}</Text>
                    <Text style={styles.walletBalance}>{formatMoney(wallet.balance)}</Text>
                    <View style={styles.walletMembers}>
                      <Ionicons name="people-outline" size={12} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.walletMembersText}>Wspólny</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ostatnie transakcje</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
              <Text style={styles.seeAll}>Zobacz wszystko</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionsCard}>
            {recentTx.length > 0 ? (
              recentTx.map((tx, index) => (
                <View key={tx.id} style={[styles.txItem, index === recentTx.length - 1 && styles.txItemLast]}>
                  <View style={[styles.txIcon, { backgroundColor: tx.type === 'income' ? Colors.incomeLight : Colors.expenseLight }]}>
                    <Text style={styles.txEmoji}>{tx.emoji}</Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txCategory}>{tx.category}</Text>
                    <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}</Text>
                  </View>
                  <Text style={[styles.txAmount, { color: tx.type === 'income' ? Colors.income : Colors.expense }]}>
                    {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="receipt-outline" size={32} color={Colors.textMuted} />
                </View>
                <Text style={styles.emptyText}>Brak transakcji</Text>
                <Text style={styles.emptySubtext}>Dodaj swoją pierwszą transakcję</Text>
              </View>
            )}
          </View>
        </View>

        {/* Goals Progress */}
        {stats?.goals_progress?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Cele oszczędnościowe</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/goals')}>
                <Text style={styles.seeAll}>Zobacz wszystko</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.goalsCard}>
              {stats.goals_progress.slice(0, 2).map((goal: any) => (
                <View key={goal.id} style={styles.goalItem}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalIcon}>
                      <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                    </View>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <Text style={styles.goalProgress}>{formatMoney(goal.current)} / {formatMoney(goal.target)}</Text>
                    </View>
                    <Text style={styles.goalPercent}>{Math.round(goal.progress)}%</Text>
                  </View>
                  <View style={styles.goalProgressBar}>
                    <LinearGradient
                      colors={goal.progress >= 100 ? Gradients.income : Gradients.primary}
                      style={[styles.goalProgressFill, { width: `${Math.min(goal.progress, 100)}%` }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const ActionButton = ({ icon, label, gradient, onPress }: any) => (
  <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.7}>
    <LinearGradient colors={gradient} style={styles.actionIcon}>
      <Ionicons name={icon} size={22} color={Colors.white} />
    </LinearGradient>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: Spacing.xl, 
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 26, fontWeight: '700', color: Colors.text, letterSpacing: -0.5 },
  date: { fontSize: 14, color: Colors.textLight, marginTop: 4, textTransform: 'capitalize' },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  balanceCard: { 
    marginHorizontal: Spacing.xl, 
    padding: Spacing.xxl, 
    borderRadius: BorderRadius.xxl,
    ...Shadows.large,
  },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  walletBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  walletCount: { fontSize: 12, color: Colors.white, fontWeight: '600' },
  balanceAmount: { fontSize: 38, fontWeight: '800', color: Colors.white, marginVertical: 12, letterSpacing: -1 },
  statsRow: { flexDirection: 'row', marginTop: Spacing.lg, alignItems: 'center' },
  statBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },
  statIcon: { width: 40, height: 40, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  statValue: { fontSize: 15, fontWeight: '700', color: Colors.white, marginTop: 2 },
  actionsContainer: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md },
  actionBtn: { alignItems: 'center', width: (width - 80) / 4 },
  actionIcon: { 
    width: 56, 
    height: 56, 
    borderRadius: BorderRadius.lg, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: Spacing.sm,
    ...Shadows.medium,
  },
  actionLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  section: { marginTop: Spacing.xxl, paddingHorizontal: Spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  seeAll: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  walletsScroll: { marginHorizontal: -Spacing.xl, paddingHorizontal: Spacing.xl },
  walletCard: { 
    width: 160, 
    marginRight: Spacing.md, 
    borderRadius: BorderRadius.xl, 
    overflow: 'hidden',
    ...Shadows.medium,
  },
  walletGradient: { padding: Spacing.lg },
  walletEmoji: { fontSize: 28, marginBottom: Spacing.sm },
  walletName: { fontSize: 14, fontWeight: '600', color: Colors.white, marginBottom: 4 },
  walletBalance: { fontSize: 18, fontWeight: '700', color: Colors.white },
  walletMembers: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm },
  walletMembersText: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  transactionsCard: { 
    backgroundColor: Colors.card, 
    borderRadius: BorderRadius.xl, 
    padding: Spacing.lg,
    ...Shadows.small,
  },
  txItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: Spacing.md, 
    borderBottomWidth: 1, 
    borderBottomColor: Colors.borderLight,
  },
  txItemLast: { borderBottomWidth: 0 },
  txIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
  txEmoji: { fontSize: 22 },
  txInfo: { flex: 1, marginLeft: Spacing.md },
  txCategory: { fontSize: 15, fontWeight: '600', color: Colors.text },
  txDate: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyIcon: { 
    width: 64, 
    height: 64, 
    borderRadius: BorderRadius.full, 
    backgroundColor: Colors.backgroundDark, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  emptySubtext: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  goalsCard: { 
    backgroundColor: Colors.card, 
    borderRadius: BorderRadius.xl, 
    padding: Spacing.lg,
    ...Shadows.small,
  },
  goalItem: { marginBottom: Spacing.lg },
  goalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  goalIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: BorderRadius.md, 
    backgroundColor: Colors.primaryDark + '15', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  goalEmoji: { fontSize: 20 },
  goalInfo: { flex: 1, marginLeft: Spacing.md },
  goalName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  goalProgress: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  goalPercent: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  goalProgressBar: { 
    height: 8, 
    backgroundColor: Colors.backgroundDark, 
    borderRadius: BorderRadius.full, 
    overflow: 'hidden',
  },
  goalProgressFill: { height: '100%', borderRadius: BorderRadius.full },
});
