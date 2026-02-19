import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, Image, ScrollView } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/store';
import { Shadows, BorderRadius, Spacing } from '../../src/constants/theme';
import { reportService } from '../../src/services/reportService';
import { Transaction, Wallet } from '../../src/types';
import { AnimatedButton, AnimatedCard } from '../../src/components/AnimatedComponents';
import { haptics } from '../../src/utils/haptics';

export default function Transactions() {
  const router = useRouter();
  const { colors: Colors, settings, fontFamily, scaleFont } = useTheme();
  const styles = useMemo(() => getStyles(Colors, fontFamily, scaleFont), [Colors, fontFamily, scaleFont]);
  const { user, activeWallet, transactions, wallets, deleteTransaction, loadData } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [walletFilter, setWalletFilter] = useState<string>('all');

  useEffect(() => {
    if (walletFilter === 'all') return;
    const walletExists = wallets.some((wallet: Wallet) => wallet.id === walletFilter);
    if (!walletExists) {
      setWalletFilter('all');
    }
  }, [wallets, walletFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatMoney = (n: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0 }).format(n);

  const handleDelete = (id: string) => {
    Alert.alert('Usuń transakcję', 'Na pewno chcesz usunąć tę transakcję?', [
      { text: 'Nie', style: 'cancel' },
      {
        text: 'Tak',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(id);
          } catch (error: any) {
            Alert.alert('Błąd', error?.message || 'Nie udało się usunąć transakcji');
          }
        },
      },
    ]);
  };

  const canDeleteTransaction = (tx: Transaction) => {
    if (tx.user_id && tx.user_id === user?.id) return true;
    const wallet = wallets.find((w: Wallet) => w.id === tx.wallet_id);
    return wallet?.owner_id === user?.id;
  };

  const handleExport = async (format: 'pdf' | 'csv') => {
    try {
      if (format === 'csv') {
        await reportService.generateCSV(filteredTransactions);
      } else {
        await reportService.generatePDF(filteredTransactions);
      }
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się wygenerować raportu');
    }
  };

  const showExportOptions = () => {
    Alert.alert(
      'Eksportuj dane',
      'Wybierz format raportu:',
      [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Plik CSV', onPress: () => handleExport('csv') },
        { text: 'Dokument PDF', onPress: () => handleExport('pdf') },
      ]
    );
  };

  const filteredTransactions = transactions.filter((tx: Transaction) => {
    const matchesType = filter === 'all' || tx.type === filter;
    const matchesWallet = walletFilter === 'all' || tx.wallet_id === walletFilter;
    return matchesType && matchesWallet;
  });

  const getWalletName = (walletId: string) => {
    const wallet = wallets.find((w: Wallet) => w.id === walletId);
    return wallet ? { name: wallet.name, emoji: wallet.emoji, is_shared: wallet.is_shared } : null;
  };

  // Group transactions by date
  const groupedTransactions: { [key: string]: typeof transactions } = {};
  filteredTransactions.forEach((tx: Transaction) => {
    const date = new Date(tx.created_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!groupedTransactions[date]) {
      groupedTransactions[date] = [];
    }
    groupedTransactions[date].push(tx);
  });

  const sections = Object.entries(groupedTransactions).map(([date, txs]) => ({
    date,
    transactions: txs,
    total: txs.reduce((acc: number, tx: Transaction) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0),
  }));

  const renderTransaction = (tx: Transaction, index: number = 0) => {
    const wallet = getWalletName(tx.wallet_id);
    const canDelete = canDeleteTransaction(tx);
    return (
      <AnimatedCard key={tx.id} entrance="scale" delay={index * 25}>
        <TouchableOpacity
          style={styles.txItem}
          onLongPress={() => {
            if (canDelete) {
              handleDelete(tx.id);
            } else {
              Alert.alert('Brak uprawnień', 'Możesz usuwać tylko własne transakcje lub jako właściciel portfela.');
            }
          }}
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
              {wallet?.is_shared && (
                <Text style={styles.txAuthor}>
                  {tx.user_id === user?.id ? 'Dodano przez Ciebie' : `Dodano przez ${tx.user_name || 'członka'}`}
                </Text>
              )}
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
      </AnimatedCard>
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
        {item.transactions.map((tx: any, index: number) => renderTransaction(tx, index))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
      {/* Wallpaper Background */}
      {settings.wallpaper && (
        <Image
          source={{ uri: settings.wallpaper.uri }}
          style={[styles.wallpaper, { opacity: settings.wallpaper.opacity }]}
          blurRadius={settings.wallpaper.blur}
        />
      )}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Historia transakcji</Text>
          <Text style={styles.subtitle}>{filteredTransactions.length} transakcji</Text>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={showExportOptions}>
          <Ionicons name="download-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <AnimatedCard entrance="slideUp" delay={100}>
        <View style={styles.filterTabs}>
          <AnimatedButton
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => { setFilter('all'); haptics.selection(); }}
            hapticFeedback="light"
          >
            <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>Wszystkie</Text>
          </AnimatedButton>
          <AnimatedButton
            style={[styles.filterTab, filter === 'income' && styles.filterTabActiveIncome]}
            onPress={() => { setFilter('income'); haptics.selection(); }}
            hapticFeedback="light"
          >
            <Ionicons name="arrow-up" size={16} color={filter === 'income' ? Colors.white : Colors.income} />
            <Text style={[styles.filterTabText, filter === 'income' && styles.filterTabTextActive]}>Przychody</Text>
          </AnimatedButton>
          <AnimatedButton
            style={[styles.filterTab, filter === 'expense' && styles.filterTabActiveExpense]}
            onPress={() => { setFilter('expense'); haptics.selection(); }}
            hapticFeedback="light"
          >
            <Ionicons name="arrow-down" size={16} color={filter === 'expense' ? Colors.white : Colors.expense} />
            <Text style={[styles.filterTabText, filter === 'expense' && styles.filterTabTextActive]}>Wydatki</Text>
          </AnimatedButton>
        </View>
      </AnimatedCard>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.walletFilterRow}
      >
        <AnimatedButton
          style={[styles.walletFilterChip, walletFilter === 'all' && styles.walletFilterChipActive]}
          onPress={() => { setWalletFilter('all'); haptics.selection(); }}
          hapticFeedback="light"
        >
          <Text style={[styles.walletFilterText, walletFilter === 'all' && styles.walletFilterTextActive]}>
            Wszystkie portfele
          </Text>
        </AnimatedButton>

        {activeWallet && (
          <AnimatedButton
            style={[styles.walletFilterChip, walletFilter === activeWallet.id && styles.walletFilterChipActive]}
            onPress={() => { setWalletFilter(activeWallet.id); haptics.selection(); }}
            hapticFeedback="light"
          >
            <Text style={[styles.walletFilterText, walletFilter === activeWallet.id && styles.walletFilterTextActive]}>
              Aktywny: {activeWallet.emoji} {activeWallet.name}
            </Text>
          </AnimatedButton>
        )}

        {wallets
          .filter((wallet: Wallet) => wallet.id !== activeWallet?.id)
          .map((wallet: Wallet) => (
          <AnimatedButton
            key={wallet.id}
            style={[styles.walletFilterChip, walletFilter === wallet.id && styles.walletFilterChipActive]}
            onPress={() => { setWalletFilter(wallet.id); haptics.selection(); }}
            hapticFeedback="light"
          >
            <Text style={[styles.walletFilterText, walletFilter === wallet.id && styles.walletFilterTextActive]}>
              {wallet.emoji} {wallet.name}
            </Text>
          </AnimatedButton>
          ))}
      </ScrollView>

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
            {walletFilter !== 'all'
              ? 'Brak transakcji dla wybranego portfela'
              : filter !== 'all'
                ? `Brak ${filter === 'income' ? 'przychodów' : 'wydatków'}`
                : 'Dodaj swoją pierwszą transakcję'}
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

const getStyles = (Colors: any, fontFamily: string | undefined, scaleFont: (size: number) => number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  wallpaper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
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
  exportBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    ...Shadows.small,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { fontSize: scaleFont(22), fontWeight: '800', color: Colors.text, letterSpacing: -0.5, fontFamily },
  subtitle: { fontSize: scaleFont(13), color: Colors.textLight, marginTop: 2, fontFamily },
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
    paddingHorizontal: Spacing.lg + 2,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card,
    ...Shadows.small,
  },
  filterTabActive: { backgroundColor: Colors.primary },
  filterTabActiveIncome: { backgroundColor: Colors.income },
  filterTabActiveExpense: { backgroundColor: Colors.expense },
  filterTabText: { fontSize: scaleFont(14), fontWeight: '700', color: Colors.textSecondary, letterSpacing: -0.2, fontFamily },
  filterTabTextActive: { color: Colors.white },
  walletFilterRow: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  walletFilterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card,
    ...Shadows.small,
  },
  walletFilterChipActive: {
    backgroundColor: Colors.primary,
  },
  walletFilterText: {
    fontSize: scaleFont(12),
    fontWeight: '700',
    color: Colors.textSecondary,
    fontFamily,
  },
  walletFilterTextActive: {
    color: Colors.white,
  },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  section: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  sectionDate: { fontSize: scaleFont(14), fontWeight: '600', color: Colors.textLight, textTransform: 'capitalize', fontFamily },
  sectionTotal: { fontSize: scaleFont(14), fontWeight: '700', fontFamily },
  sectionTotalPositive: { color: Colors.income },
  sectionTotalNegative: { color: Colors.expense },
  sectionContent: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  txIcon: { width: 52, height: 52, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  txEmoji: { fontSize: scaleFont(24) },
  txInfo: { flex: 1, marginLeft: Spacing.md },
  txCategory: { fontSize: scaleFont(17), fontWeight: '700', color: Colors.text, letterSpacing: -0.3, fontFamily },
  txNote: { fontSize: scaleFont(13), color: Colors.textLight, marginTop: 2, fontFamily },
  txMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  txTime: { fontSize: scaleFont(12), color: Colors.textMuted, fontFamily },
  txAuthor: { fontSize: scaleFont(12), color: Colors.textLight, fontFamily },
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
  walletTagEmoji: { fontSize: scaleFont(10) },
  walletTagText: { fontSize: scaleFont(10), color: Colors.textMuted, maxWidth: 80, fontFamily },
  walletTagTextShared: { color: Colors.shared },
  txAmount: { fontSize: scaleFont(16), fontWeight: '700', fontFamily },
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
  emptyText: { fontSize: scaleFont(20), fontWeight: '700', color: Colors.text, fontFamily },
  emptySubtext: { fontSize: scaleFont(14), color: Colors.textMuted, marginTop: Spacing.sm, textAlign: 'center', fontFamily },
  emptyBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  emptyBtnText: { fontSize: scaleFont(14), fontWeight: '600', color: Colors.white, fontFamily },
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
  hintText: { fontSize: scaleFont(12), color: Colors.textMuted, fontFamily },
});
