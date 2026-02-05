import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDataStore } from '../../src/store/dataStore';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, WALLET_EMOJIS, CATEGORIES } from '../../src/constants/theme';
import { PL } from '../../src/constants/polish';
import type { Wallet } from '../../src/types';

export default function WalletsScreen() {
  const {
    wallets,
    transactions,
    selectedWallet,
    fetchWallets,
    fetchTransactions,
    createWallet,
    deleteWallet,
    selectWallet,
    createTransaction,
    deleteTransaction,
  } = useDataStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Wallet form state
  const [walletName, setWalletName] = useState('');
  const [walletEmoji, setWalletEmoji] = useState('💰');
  const [isShared, setIsShared] = useState(false);

  // Transaction form state
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txCategory, setTxCategory] = useState(CATEGORIES[0].name);
  const [txEmoji, setTxEmoji] = useState(CATEGORIES[0].emoji);
  const [txNote, setTxNote] = useState('');

  useEffect(() => {
    fetchWallets();
    fetchTransactions();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchWallets(), fetchTransactions(selectedWallet?.id)]);
    setRefreshing(false);
  }, [selectedWallet]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  const handleCreateWallet = async () => {
    if (!walletName.trim()) {
      Alert.alert('Błąd', 'Podaj nazwę portfela');
      return;
    }

    setIsLoading(true);
    try {
      await createWallet({ name: walletName, emoji: walletEmoji, is_shared: isShared });
      setShowWalletModal(false);
      setWalletName('');
      setWalletEmoji('💰');
      setIsShared(false);
    } catch (err: any) {
      Alert.alert('Błąd', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWallet = (wallet: Wallet) => {
    Alert.alert(
      'Usuń portfel',
      `Czy na pewno chcesz usunąć portfel "${wallet.name}"? Wszystkie transakcje zostaną usunięte.`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWallet(wallet.id);
            } catch (err: any) {
              Alert.alert('Błąd', err.message);
            }
          },
        },
      ]
    );
  };

  const handleCreateTransaction = async () => {
    if (!txAmount || parseFloat(txAmount) <= 0) {
      Alert.alert('Błąd', 'Podaj prawidłową kwotę');
      return;
    }

    if (!selectedWallet) {
      Alert.alert('Błąd', 'Wybierz portfel');
      return;
    }

    setIsLoading(true);
    try {
      await createTransaction({
        wallet_id: selectedWallet.id,
        amount: parseFloat(txAmount),
        type: txType,
        category: txCategory,
        emoji: txEmoji,
        note: txNote || undefined,
      });
      await fetchTransactions(selectedWallet.id);
      setShowTransactionModal(false);
      resetTransactionForm();
    } catch (err: any) {
      Alert.alert('Błąd', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetTransactionForm = () => {
    setTxAmount('');
    setTxType('expense');
    setTxCategory(CATEGORIES[0].name);
    setTxEmoji(CATEGORIES[0].emoji);
    setTxNote('');
  };

  const handleSelectCategory = (category: { name: string; emoji: string }) => {
    setTxCategory(category.name);
    setTxEmoji(category.emoji);
  };

  const walletTransactions = selectedWallet
    ? transactions.filter((tx) => tx.wallet_id === selectedWallet.id)
    : transactions;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{PL.myWallets}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowWalletModal(true)}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Wallets List */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.walletsScroll}
          contentContainerStyle={styles.walletsContainer}
        >
          {wallets.map((wallet) => (
            <TouchableOpacity
              key={wallet.id}
              style={[
                styles.walletCard,
                selectedWallet?.id === wallet.id && styles.walletCardSelected,
              ]}
              onPress={() => {
                selectWallet(wallet);
                fetchTransactions(wallet.id);
              }}
              onLongPress={() => handleDeleteWallet(wallet)}
            >
              <View style={styles.walletHeader}>
                <Text style={styles.walletEmoji}>{wallet.emoji}</Text>
                {wallet.is_shared && (
                  <View style={styles.sharedBadge}>
                    <Ionicons name="people" size={12} color={COLORS.white} />
                  </View>
                )}
              </View>
              <Text style={styles.walletName}>{wallet.name}</Text>
              <Text style={styles.walletBalance}>{formatCurrency(wallet.balance)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Add Transaction Button */}
        {selectedWallet && (
          <TouchableOpacity
            style={styles.addTransactionButton}
            onPress={() => setShowTransactionModal(true)}
          >
            <Ionicons name="add-circle" size={24} color={COLORS.white} />
            <Text style={styles.addTransactionText}>{PL.addTransaction}</Text>
          </TouchableOpacity>
        )}

        {/* Transactions List */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>
            {selectedWallet ? `${PL.transactions} - ${selectedWallet.name}` : PL.transactions}
          </Text>
          {walletTransactions.length > 0 ? (
            walletTransactions.map((tx) => (
              <TouchableOpacity
                key={tx.id}
                style={styles.transactionItem}
                onLongPress={() => {
                  Alert.alert('Usuń transakcję', 'Czy na pewno chcesz usunąć tę transakcję?', [
                    { text: 'Anuluj', style: 'cancel' },
                    {
                      text: 'Usuń',
                      style: 'destructive',
                      onPress: () => deleteTransaction(tx.id),
                    },
                  ]);
                }}
              >
                <View style={styles.txIcon}>
                  <Text style={styles.txEmoji}>{tx.emoji}</Text>
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txCategory}>{tx.category}</Text>
                  <Text style={styles.txNote}>{tx.note || '-'}</Text>
                  <Text style={styles.txDate}>
                    {new Date(tx.created_at).toLocaleDateString('pl-PL')}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.txAmount,
                    { color: tx.type === 'income' ? COLORS.income : COLORS.expense },
                  ]}
                >
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color={COLORS.textLight} />
              <Text style={styles.emptyText}>Brak transakcji</Text>
              <Text style={styles.emptySubtext}>
                {selectedWallet ? 'Dodaj pierwszą transakcję' : 'Wybierz portfel'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Wallet Modal */}
      <Modal visible={showWalletModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{PL.addWallet}</Text>
              <TouchableOpacity onPress={() => setShowWalletModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>{PL.walletName}</Text>
            <TextInput
              style={styles.textInput}
              value={walletName}
              onChangeText={setWalletName}
              placeholder="Np. Konto główne"
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.inputLabel}>Ikona</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiPicker}>
              {WALLET_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiOption,
                    walletEmoji === emoji && styles.emojiOptionSelected,
                  ]}
                  onPress={() => setWalletEmoji(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.switchRow}
              onPress={() => setIsShared(!isShared)}
            >
              <View style={styles.switchInfo}>
                <Ionicons name="people-outline" size={24} color={COLORS.text} />
                <Text style={styles.switchLabel}>{PL.sharedWallet}</Text>
              </View>
              <View style={[styles.switch, isShared && styles.switchActive]}>
                <View style={[styles.switchThumb, isShared && styles.switchThumbActive]} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleCreateWallet}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>{PL.save}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Transaction Modal */}
      <Modal visible={showTransactionModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{PL.addTransaction}</Text>
              <TouchableOpacity onPress={() => setShowTransactionModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Type Toggle */}
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  txType === 'expense' && styles.typeButtonExpense,
                ]}
                onPress={() => setTxType('expense')}
              >
                <Ionicons name="arrow-down" size={20} color={txType === 'expense' ? COLORS.white : COLORS.expense} />
                <Text style={[styles.typeButtonText, txType === 'expense' && styles.typeButtonTextActive]}>
                  {PL.expense}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  txType === 'income' && styles.typeButtonIncome,
                ]}
                onPress={() => setTxType('income')}
              >
                <Ionicons name="arrow-up" size={20} color={txType === 'income' ? COLORS.white : COLORS.income} />
                <Text style={[styles.typeButtonText, txType === 'income' && styles.typeButtonTextActive]}>
                  {PL.income}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>{PL.amount}</Text>
            <TextInput
              style={styles.textInput}
              value={txAmount}
              onChangeText={setTxAmount}
              placeholder="0.00"
              placeholderTextColor={COLORS.textLight}
              keyboardType="decimal-pad"
            />

            <Text style={styles.inputLabel}>{PL.category}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiPicker}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.name}
                  style={[
                    styles.categoryOption,
                    txCategory === cat.name && styles.categoryOptionSelected,
                  ]}
                  onPress={() => handleSelectCategory(cat)}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>{PL.note} ({PL.optional})</Text>
            <TextInput
              style={styles.textInput}
              value={txNote}
              onChangeText={setTxNote}
              placeholder="Np. Zakupy w Biedronce"
              placeholderTextColor={COLORS.textLight}
            />

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleCreateTransaction}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>{PL.save}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  walletsScroll: {
    maxHeight: 160,
  },
  walletsContainer: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  walletCard: {
    width: 140,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginRight: SPACING.sm,
    ...SHADOWS.sm,
  },
  walletCardSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  walletEmoji: {
    fontSize: 32,
  },
  sharedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  walletBalance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  addTransactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  addTransactionText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  transactionsSection: {
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
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
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  txNote: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  txDate: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 48,
    fontSize: 16,
    color: COLORS.text,
  },
  emojiPicker: {
    maxHeight: 60,
    marginBottom: SPACING.sm,
  },
  emojiOption: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  emojiOptionSelected: {
    backgroundColor: COLORS.primaryLight + '40',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  emojiText: {
    fontSize: 24,
  },
  categoryOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    marginRight: SPACING.sm,
    alignItems: 'center',
    minWidth: 80,
  },
  categoryOptionSelected: {
    backgroundColor: COLORS.primaryLight + '40',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  categoryName: {
    fontSize: 12,
    color: COLORS.text,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  switchLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    padding: 2,
  },
  switchActive: {
    backgroundColor: COLORS.primary,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  typeToggle: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    gap: SPACING.xs,
  },
  typeButtonExpense: {
    backgroundColor: COLORS.expense,
  },
  typeButtonIncome: {
    backgroundColor: COLORS.income,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  typeButtonTextActive: {
    color: COLORS.white,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
