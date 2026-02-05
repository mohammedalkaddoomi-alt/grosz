import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/store';
import { Colors, Shadows, BorderRadius, Spacing } from '../../src/constants/theme';

export default function Transactions() {
  const router = useRouter();
  const { transactions, wallets, deleteTransaction, loadData } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatMoney = (n: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0 }).format(n);

  const handleDelete = (id: string) => {
    Alert.alert('Usuń transakcję', 'Na pewno chcesz usunąć tę transakcję?', [
      { text: 'Nie', style: 'cancel' },
      { text: 'Tak', style: 'destructive', onPress: () => deleteTransaction(id) },
    ]);
  };

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.type === filter);

  const getWalletName = (walletId: string) => {
    const wallet = wallets.find(w => w.id === walletId);
    return wallet ? { name: wallet.name, emoji: wallet.emoji, is_shared: wallet.is_shared } : null;
  };

  // Group transactions by date
  const groupedTransactions: { [key: string]: typeof transactions } = {};
  filteredTransactions.forEach(tx => {
    const date = new Date(tx.created_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!groupedTransactions[date]) {
      groupedTransactions[date] = [];
    }
    groupedTransactions[date].push(tx);
  });

  const sections = Object.entries(groupedTransactions).map(([date, txs]) => ({
    date,
    transactions: txs,
    total: txs.reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0),
  }));

  const renderTransaction = (tx: any) => {
    const wallet = getWalletName(tx.wallet_id);
    return (
      <TouchableOpacity 
        key={tx.id}
        style={styles.txItem} 
        onLongPress={() => handleDelete(tx.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.txIcon, { backgroundColor: tx.type === 'income' ? Colors.incomeLight : Colors.expenseLight }]}>
          <Text style={styles.txEmoji}>{tx.emoji}</Text>
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txCategory}>{tx.category}</Text>
          {tx.note && <Text style={styles.txNote} numberOfLines={1}>{tx.note}</Text>}
          <View style={styles.txMeta}>
            <Text style={styles.txTime}>
              {new Date(tx.created_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {wallet && (
              <View style={[styles.walletTag, wallet.is_shared && styles.walletTagShared]}>
                <Text style={styles.walletTagEmoji}>{wallet.emoji}</Text>
                <Text style={[styles.walletTagText, wallet.is_shared && styles.walletTagTextShared]} numberOfLines={1}>
                  {wallet.name}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Text style={[styles.txAmount, { color: tx.type === 'income' ? Colors.income : Colors.expense }]}>
          {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSection = ({ item }: { item: typeof sections[0] }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionDate}>{item.date}</Text>
        <Text style={[styles.sectionTotal, item.total >= 0 ? styles.sectionTotalPositive : styles.sectionTotalNegative]}>
          {item.total >= 0 ? '+' : ''}{formatMoney(item.total)}
        </Text>
      </View>
      <View style={styles.sectionContent}>
        {item.transactions.map(renderTransaction)}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Historia transakcji</Text>
          <Text style={styles.subtitle}>{filteredTransactions.length} transakcji</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>Wszystkie</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'income' && styles.filterTabActiveIncome]}
          onPress={() => setFilter('income')}
        >
          <Ionicons name="arrow-up" size={16} color={filter === 'income' ? Colors.white : Colors.income} />
          <Text style={[styles.filterTabText, filter === 'income' && styles.filterTabTextActive]}>Przychody</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'expense' && styles.filterTabActiveExpense]}
          onPress={() => setFilter('expense')}
        >
          <Ionicons name="arrow-down" size={16} color={filter === 'expense' ? Colors.white : Colors.expense} />
          <Text style={[styles.filterTabText, filter === 'expense' && styles.filterTabTextActive]}>Wydatki</Text>
        </TouchableOpacity>
      </View>

      {sections.length > 0 ? (
        <FlatList
          data={sections}
          renderItem={renderSection}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        />
      ) : (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyText}>Brak transakcji</Text>
          <Text style={styles.emptySubtext}>
            {filter !== 'all' ? `Brak ${filter === 'income' ? 'przychodów' : 'wydatków'}` : 'Dodaj swoją pierwszą transakcję'}
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/add')}>
            <Text style={styles.emptyBtnText}>Dodaj transakcję</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.hint}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
        <Text style={styles.hintText}>Przytrzymaj transakcję, aby ją usunąć</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
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
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  filterTabs: { 
    flexDirection: 'row', 
    paddingHorizontal: Spacing.xl, 
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterTab: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.lg, 
    paddingVertical: Spacing.sm, 
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card,
    ...Shadows.small,
  },
  filterTabActive: { backgroundColor: Colors.primary },
  filterTabActiveIncome: { backgroundColor: Colors.income },
  filterTabActiveExpense: { backgroundColor: Colors.expense },
  filterTabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterTabTextActive: { color: Colors.white },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  section: { marginBottom: Spacing.xl },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  sectionDate: { fontSize: 14, fontWeight: '600', color: Colors.textLight, textTransform: 'capitalize' },
  sectionTotal: { fontSize: 14, fontWeight: '700' },
  sectionTotalPositive: { color: Colors.income },
  sectionTotalNegative: { color: Colors.expense },
  sectionContent: { 
    backgroundColor: Colors.card, 
    borderRadius: BorderRadius.xl, 
    overflow: 'hidden',
    ...Shadows.small,
  },
  txItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: Spacing.lg, 
    borderBottomWidth: 1, 
    borderBottomColor: Colors.borderLight,
  },
  txIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
  txEmoji: { fontSize: 22 },
  txInfo: { flex: 1, marginLeft: Spacing.md },
  txCategory: { fontSize: 16, fontWeight: '600', color: Colors.text },
  txNote: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  txMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  txTime: { fontSize: 12, color: Colors.textMuted },
  walletTag: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4,
    backgroundColor: Colors.backgroundDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  walletTagShared: { backgroundColor: Colors.sharedLight },
  walletTagEmoji: { fontSize: 10 },
  walletTagText: { fontSize: 10, color: Colors.textMuted, maxWidth: 80 },
  walletTagTextShared: { color: Colors.shared },
  txAmount: { fontSize: 16, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xxl },
  emptyIcon: { 
    width: 80, 
    height: 80, 
    borderRadius: BorderRadius.full, 
    backgroundColor: Colors.backgroundDark, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyText: { fontSize: 20, fontWeight: '700', color: Colors.text },
  emptySubtext: { fontSize: 14, color: Colors.textMuted, marginTop: Spacing.sm, textAlign: 'center' },
  emptyBtn: { 
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '600', color: Colors.white },
  hint: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  hintText: { fontSize: 12, color: Colors.textMuted },
});
