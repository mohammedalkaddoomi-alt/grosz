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
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDataStore } from '../../src/store/dataStore';
import { COLORS, SPACING, BORDER_RADIUS, GRADIENTS, WALLET_EMOJIS, CATEGORIES } from '../../src/constants/theme';
import { PL } from '../../src/constants/polish';
import type { Wallet } from '../../src/types';

const { width } = Dimensions.get('window');

export default function WalletsScreen() {
  const {
    wallets, transactions, selectedWallet, fetchWallets, fetchTransactions,
    createWallet, deleteWallet, selectWallet, createTransaction, deleteTransaction,
  } = useDataStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [walletName, setWalletName] = useState('');
  const [walletEmoji, setWalletEmoji] = useState('💰');
  const [isShared, setIsShared] = useState(false);
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txCategory, setTxCategory] = useState(CATEGORIES[0].name);
  const [txEmoji, setTxEmoji] = useState(CATEGORIES[0].emoji);
  const [txNote, setTxNote] = useState('');

  useEffect(() => {
    const loadData = async () => {
      await fetchWallets();
      await fetchTransactions();
    };
    loadData();
  }, []);

  // Auto-select first wallet if none selected
  useEffect(() => {
    if (wallets.length > 0 && !selectedWallet) {
      selectWallet(wallets[0]);
      fetchTransactions(wallets[0].id);
    }
  }, [wallets, selectedWallet]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchWallets(), fetchTransactions(selectedWallet?.id)]);
    setRefreshing(false);
  }, [selectedWallet]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const handleCreateWallet = async () => {
    if (!walletName.trim()) { Alert.alert('Błąd', 'Podaj nazwę portfela'); return; }
    setIsLoading(true);
    try {
      await createWallet({ name: walletName, emoji: walletEmoji, is_shared: isShared });
      setShowWalletModal(false);
      setWalletName(''); setWalletEmoji('💰'); setIsShared(false);
    } catch (err: any) { Alert.alert('Błąd', err.message); }
    finally { setIsLoading(false); }
  };

  const handleDeleteWallet = (wallet: Wallet) => {
    Alert.alert('Usuń portfel', `Usunąć "${wallet.name}"?`, [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: () => deleteWallet(wallet.id) },
    ]);
  };

  const handleCreateTransaction = async () => {
    if (!txAmount || parseFloat(txAmount) <= 0) { Alert.alert('Błąd', 'Podaj kwotę'); return; }
    if (!selectedWallet) { Alert.alert('Błąd', 'Wybierz portfel'); return; }
    setIsLoading(true);
    try {
      await createTransaction({ wallet_id: selectedWallet.id, amount: parseFloat(txAmount), type: txType, category: txCategory, emoji: txEmoji, note: txNote || undefined });
      await fetchTransactions(selectedWallet.id);
      setShowTransactionModal(false);
      setTxAmount(''); setTxNote(''); setTxType('expense'); setTxCategory(CATEGORIES[0].name); setTxEmoji(CATEGORIES[0].emoji);
    } catch (err: any) { Alert.alert('Błąd', err.message); }
    finally { setIsLoading(false); }
  };

  const walletTransactions = selectedWallet ? transactions.filter((tx) => tx.wallet_id === selectedWallet.id) : transactions;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1A1A2E', '#16213E']} style={styles.headerGradient}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.title}>{PL.myWallets}</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowWalletModal(true)}>
              <Ionicons name="add" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.walletsRow}>
            {wallets.map((wallet) => (
              <TouchableOpacity
                key={wallet.id}
                style={[styles.walletCard, selectedWallet?.id === wallet.id && styles.walletCardSelected]}
                onPress={() => { selectWallet(wallet); fetchTransactions(wallet.id); }}
                onLongPress={() => handleDeleteWallet(wallet)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={selectedWallet?.id === wallet.id ? GRADIENTS.primary : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                  style={styles.walletGradient}
                >
                  <View style={styles.walletHeader}>
                    <Text style={styles.walletEmoji}>{wallet.emoji}</Text>
                    {wallet.is_shared && (
                      <View style={styles.sharedBadge}>
                        <Ionicons name="people" size={10} color={COLORS.white} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.walletName} numberOfLines={1}>{wallet.name}</Text>
                  <Text style={styles.walletBalance}>{formatCurrency(wallet.balance)}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        {selectedWallet && (
          <TouchableOpacity style={styles.addTxButton} onPress={() => setShowTransactionModal(true)} activeOpacity={0.9}>
            <LinearGradient colors={GRADIENTS.primary} style={styles.addTxGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="add-circle" size={22} color={COLORS.white} />
              <Text style={styles.addTxText}>{PL.addTransaction}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>{selectedWallet ? `${selectedWallet.name}` : PL.transactions}</Text>
          
          {walletTransactions.length > 0 ? (
            <View style={styles.txList}>
              {walletTransactions.map((tx, i) => (
                <TouchableOpacity
                  key={tx.id}
                  style={[styles.txItem, i === walletTransactions.length - 1 && styles.lastTxItem]}
                  onLongPress={() => Alert.alert('Usuń?', '', [
                    { text: 'Anuluj', style: 'cancel' },
                    { text: 'Usuń', style: 'destructive', onPress: () => deleteTransaction(tx.id) },
                  ])}
                >
                  <View style={[styles.txIcon, { backgroundColor: tx.type === 'income' ? `${COLORS.income}15` : `${COLORS.expense}15` }]}>
                    <Text style={styles.txEmoji}>{tx.emoji}</Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txCategory}>{tx.category}</Text>
                    <Text style={styles.txMeta}>{tx.note || '-'} • {new Date(tx.created_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}</Text>
                  </View>
                  <Text style={[styles.txAmount, { color: tx.type === 'income' ? COLORS.income : COLORS.expense }]}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Brak transakcji</Text>
              <Text style={styles.emptyText}>{selectedWallet ? 'Dodaj pierwszą transakcję' : 'Wybierz portfel'}</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Wallet Modal */}
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
            <TextInput style={styles.textInput} value={walletName} onChangeText={setWalletName} placeholder="Konto główne" placeholderTextColor={COLORS.textMuted} />
            <Text style={styles.inputLabel}>Ikona</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll}>
              {WALLET_EMOJIS.map((e) => (
                <TouchableOpacity key={e} style={[styles.emojiBtn, walletEmoji === e && styles.emojiBtnSelected]} onPress={() => setWalletEmoji(e)}>
                  <Text style={styles.emojiBtnText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.switchRow} onPress={() => setIsShared(!isShared)}>
              <Ionicons name="people-outline" size={22} color={COLORS.text} />
              <Text style={styles.switchLabel}>{PL.sharedWallet}</Text>
              <View style={[styles.switch, isShared && styles.switchActive]}>
                <View style={[styles.switchThumb, isShared && styles.switchThumbActive]} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleCreateWallet} disabled={isLoading}>
              <LinearGradient colors={GRADIENTS.primary} style={styles.submitGradient}>
                {isLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitText}>{PL.save}</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Transaction Modal */}
      <Modal visible={showTransactionModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{PL.addTransaction}</Text>
              <TouchableOpacity onPress={() => setShowTransactionModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.typeToggle}>
              <TouchableOpacity style={[styles.typeBtn, txType === 'expense' && styles.typeBtnExpense]} onPress={() => setTxType('expense')}>
                <Ionicons name="arrow-down" size={18} color={txType === 'expense' ? COLORS.white : COLORS.expense} />
                <Text style={[styles.typeBtnText, txType === 'expense' && styles.typeBtnTextActive]}>{PL.expense}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeBtn, txType === 'income' && styles.typeBtnIncome]} onPress={() => setTxType('income')}>
                <Ionicons name="arrow-up" size={18} color={txType === 'income' ? COLORS.white : COLORS.income} />
                <Text style={[styles.typeBtnText, txType === 'income' && styles.typeBtnTextActive]}>{PL.income}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>{PL.amount}</Text>
            <TextInput style={styles.textInput} value={txAmount} onChangeText={setTxAmount} placeholder="0" placeholderTextColor={COLORS.textMuted} keyboardType="decimal-pad" />
            <Text style={styles.inputLabel}>{PL.category}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity key={c.name} style={[styles.catBtn, txCategory === c.name && styles.catBtnSelected]} onPress={() => { setTxCategory(c.name); setTxEmoji(c.emoji); }}>
                  <Text style={styles.catEmoji}>{c.emoji}</Text>
                  <Text style={[styles.catName, txCategory === c.name && styles.catNameSelected]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.inputLabel}>{PL.note} ({PL.optional})</Text>
            <TextInput style={styles.textInput} value={txNote} onChangeText={setTxNote} placeholder="Notatka..." placeholderTextColor={COLORS.textMuted} />
            <TouchableOpacity style={styles.submitBtn} onPress={handleCreateTransaction} disabled={isLoading}>
              <LinearGradient colors={txType === 'income' ? GRADIENTS.income : GRADIENTS.expense} style={styles.submitGradient}>
                {isLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitText}>{PL.save}</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerGradient: { paddingBottom: 20 },
  safeArea: { paddingHorizontal: SPACING.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md, marginTop: SPACING.sm },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.white },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  walletsRow: { paddingBottom: SPACING.md, gap: SPACING.sm },
  walletCard: { width: 140, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  walletCardSelected: {},
  walletGradient: { padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  walletEmoji: { fontSize: 28 },
  sharedBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  walletName: { fontSize: 14, fontWeight: '600', color: COLORS.white, marginBottom: 4 },
  walletBalance: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  content: { flex: 1, marginTop: -10, borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl, backgroundColor: COLORS.background, paddingTop: SPACING.md },
  addTxButton: { marginHorizontal: SPACING.lg, marginBottom: SPACING.md, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  addTxGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: SPACING.sm },
  addTxText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  scrollContent: { padding: SPACING.lg, paddingTop: 0, paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  txList: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.sm },
  txItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  lastTxItem: { borderBottomWidth: 0 },
  txIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  txEmoji: { fontSize: 20 },
  txInfo: { flex: 1, marginLeft: SPACING.sm },
  txCategory: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  txMeta: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: SPACING.md },
  emptyText: { fontSize: 14, color: COLORS.textLight, marginTop: SPACING.xs },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl, padding: SPACING.lg, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs, marginTop: SPACING.md },
  textInput: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, height: 52, fontSize: 16, color: COLORS.text },
  emojiScroll: { marginBottom: SPACING.sm },
  emojiBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  emojiBtnSelected: { backgroundColor: `${COLORS.primary}20`, borderWidth: 2, borderColor: COLORS.primary },
  emojiBtnText: { fontSize: 24 },
  catBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: 12, backgroundColor: COLORS.background, marginRight: SPACING.sm, alignItems: 'center', minWidth: 70 },
  catBtnSelected: { backgroundColor: `${COLORS.primary}20`, borderWidth: 2, borderColor: COLORS.primary },
  catEmoji: { fontSize: 22, marginBottom: 2 },
  catName: { fontSize: 11, color: COLORS.textLight },
  catNameSelected: { color: COLORS.primary, fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, marginTop: SPACING.sm, gap: SPACING.sm },
  switchLabel: { flex: 1, fontSize: 16, color: COLORS.text },
  switch: { width: 50, height: 28, borderRadius: 14, backgroundColor: COLORS.border, padding: 2 },
  switchActive: { backgroundColor: COLORS.primary },
  switchThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.white },
  switchThumbActive: { transform: [{ translateX: 22 }] },
  typeToggle: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.background, gap: SPACING.xs },
  typeBtnExpense: { backgroundColor: COLORS.expense },
  typeBtnIncome: { backgroundColor: COLORS.income },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  typeBtnTextActive: { color: COLORS.white },
  submitBtn: { marginTop: SPACING.lg, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  submitGradient: { alignItems: 'center', justifyContent: 'center', height: 56 },
  submitText: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
});
