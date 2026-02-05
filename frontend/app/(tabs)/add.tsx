import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/store';
import { Colors, Gradients, Shadows, BorderRadius, Spacing } from '../../src/constants/theme';

// Common emojis for quick selection
const EMOJI_OPTIONS = ['🍔', '🚗', '🛒', '🎬', '📄', '💊', '💰', '💻', '🎁', '📈', '🏠', '✈️', '🎮', '📱', '👕', '💪', '🎓', '🐕', '☕', '🍕', '🎵', '⚽', '🎨', '💇', '🔧'];

export default function AddTransaction() {
  const router = useRouter();
  const { wallets, activeWallet, setActiveWallet, addTransaction, categories, loadCategories, addCategory } = useStore();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Wallet selection
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  // New category modal
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('📌');
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    loadCategories(type);
  }, [type]);

  // Filter categories by type
  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) return Alert.alert('Błąd', 'Podaj kwotę');
    if (!selectedCategory) return Alert.alert('Błąd', 'Wybierz kategorię');
    if (!activeWallet) return Alert.alert('Błąd', 'Wybierz portfel');

    setLoading(true);
    try {
      await addTransaction({
        wallet_id: activeWallet.id,
        amount: parseFloat(amount),
        type,
        category: selectedCategory.name,
        emoji: selectedCategory.emoji,
        note: note || undefined,
      });
      Alert.alert('Sukces! ✨', 'Transakcja dodana', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('Błąd', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return Alert.alert('Błąd', 'Podaj nazwę kategorii');
    
    setCreatingCategory(true);
    try {
      await addCategory({
        name: newCategoryName.trim(),
        emoji: newCategoryEmoji,
        type: type,
      });
      setShowNewCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryEmoji('📌');
      Alert.alert('Sukces!', 'Kategoria utworzona');
    } catch (e: any) {
      Alert.alert('Błąd', e.message);
    } finally {
      setCreatingCategory(false);
    }
  };

  const formatMoney = (n: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0 }).format(n);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Nowa transakcja</Text>
            <Text style={styles.subtitle}>Dodaj przychód lub wydatek</Text>
          </View>

          {/* Wallet Selector */}
          <TouchableOpacity style={styles.walletSelector} onPress={() => setShowWalletModal(true)}>
            <View style={styles.walletSelectorLeft}>
              <View style={[styles.walletIcon, activeWallet?.is_shared && styles.walletIconShared]}>
                <Text style={styles.walletEmoji}>{activeWallet?.emoji || '💰'}</Text>
              </View>
              <View>
                <Text style={styles.walletName}>{activeWallet?.name || 'Wybierz portfel'}</Text>
                <Text style={styles.walletBalance}>
                  Saldo: {formatMoney(activeWallet?.balance || 0)}
                  {activeWallet?.is_shared && ' • Wspólny'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Type Toggle */}
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]}
              onPress={() => { setType('expense'); setSelectedCategory(null); }}
              activeOpacity={0.7}
            >
              <LinearGradient 
                colors={type === 'expense' ? Gradients.expense : [Colors.card, Colors.card]} 
                style={styles.typeBtnInner}
              >
                <Ionicons name="arrow-down" size={20} color={type === 'expense' ? Colors.white : Colors.expense} />
                <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>Wydatek</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'income' && styles.typeBtnActive]}
              onPress={() => { setType('income'); setSelectedCategory(null); }}
              activeOpacity={0.7}
            >
              <LinearGradient 
                colors={type === 'income' ? Gradients.income : [Colors.card, Colors.card]} 
                style={styles.typeBtnInner}
              >
                <Ionicons name="arrow-up" size={20} color={type === 'income' ? Colors.white : Colors.income} />
                <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActive]}>Przychód</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <View style={styles.amountBox}>
            <Text style={styles.currency}>zł</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Category */}
          <View style={styles.categoryHeader}>
            <Text style={styles.label}>Kategoria</Text>
            <TouchableOpacity style={styles.addCategoryBtn} onPress={() => setShowNewCategoryModal(true)}>
              <Ionicons name="add-circle" size={22} color={Colors.primary} />
              <Text style={styles.addCategoryText}>Nowa</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.categoriesGrid}>
            {filteredCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryBtn, 
                  selectedCategory?.id === cat.id && { 
                    backgroundColor: type === 'income' ? Colors.incomeLight : Colors.expenseLight,
                    borderColor: type === 'income' ? Colors.income : Colors.expense 
                  }
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={[
                  styles.categoryName, 
                  selectedCategory?.id === cat.id && { color: type === 'income' ? Colors.income : Colors.expense }
                ]} numberOfLines={1}>
                  {cat.name}
                </Text>
                {!cat.is_default && (
                  <View style={styles.customBadge}>
                    <Text style={styles.customBadgeText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Note */}
          <Text style={styles.label}>Notatka (opcjonalne)</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Np. Zakupy w Biedronce"
            placeholderTextColor={Colors.textMuted}
          />

          {/* Submit */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
            <LinearGradient colors={type === 'income' ? Gradients.income : Gradients.expense} style={styles.submitGradient}>
              <Text style={styles.submitText}>{loading ? 'Dodawanie...' : 'Dodaj transakcję'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Wallet Selection Modal */}
      <Modal visible={showWalletModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Wybierz portfel</Text>
              <TouchableOpacity onPress={() => setShowWalletModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.walletList}>
              {wallets.map((wallet) => (
                <TouchableOpacity
                  key={wallet.id}
                  style={[styles.walletOption, activeWallet?.id === wallet.id && styles.walletOptionActive]}
                  onPress={() => { setActiveWallet(wallet); setShowWalletModal(false); }}
                >
                  <View style={[styles.walletOptionIcon, wallet.is_shared && styles.walletOptionIconShared]}>
                    <Text style={styles.walletOptionEmoji}>{wallet.emoji}</Text>
                  </View>
                  <View style={styles.walletOptionInfo}>
                    <Text style={styles.walletOptionName}>{wallet.name}</Text>
                    <View style={styles.walletOptionMeta}>
                      <Text style={styles.walletOptionBalance}>{formatMoney(wallet.balance)}</Text>
                      {wallet.is_shared && (
                        <View style={styles.sharedTag}>
                          <Ionicons name="people" size={12} color={Colors.shared} />
                          <Text style={styles.sharedTagText}>Wspólny</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {activeWallet?.id === wallet.id && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* New Category Modal */}
      <Modal visible={showNewCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nowa kategoria</Text>
              <TouchableOpacity onPress={() => setShowNewCategoryModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.typeIndicator}>
              <Ionicons 
                name={type === 'income' ? 'arrow-up' : 'arrow-down'} 
                size={16} 
                color={type === 'income' ? Colors.income : Colors.expense} 
              />
              <Text style={[styles.typeIndicatorText, { color: type === 'income' ? Colors.income : Colors.expense }]}>
                {type === 'income' ? 'Przychód' : 'Wydatek'}
              </Text>
            </View>

            <Text style={styles.modalLabel}>Nazwa kategorii</Text>
            <TextInput
              style={styles.modalInput}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Np. Kawa"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.modalLabel}>Wybierz emoji</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll}>
              {EMOJI_OPTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.emojiBtn, newCategoryEmoji === emoji && styles.emojiBtnSelected]}
                  onPress={() => setNewCategoryEmoji(emoji)}
                >
                  <Text style={styles.emojiBtnText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>Podgląd:</Text>
              <View style={styles.previewCategory}>
                <Text style={styles.previewEmoji}>{newCategoryEmoji}</Text>
                <Text style={styles.previewName}>{newCategoryName || 'Nazwa'}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleCreateCategory} disabled={creatingCategory}>
              <LinearGradient colors={Gradients.primary} style={styles.modalSubmitGradient}>
                <Text style={styles.modalSubmitText}>{creatingCategory ? 'Tworzę...' : 'Utwórz kategorię'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textLight, marginTop: 4 },
  walletSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  walletSelectorLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletIconShared: { backgroundColor: Colors.sharedLight },
  walletEmoji: { fontSize: 22 },
  walletName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  walletBalance: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  typeToggle: { flexDirection: 'row', gap: Spacing.md, marginHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  typeBtn: { flex: 1, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.small },
  typeBtnActive: {},
  typeBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.lg, gap: Spacing.sm, borderRadius: BorderRadius.xl },
  typeBtnText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  typeBtnTextActive: { color: Colors.white },
  amountBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Colors.card, 
    borderRadius: BorderRadius.xl, 
    padding: Spacing.xl, 
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.small,
  },
  currency: { fontSize: 28, fontWeight: '700', color: Colors.textMuted, marginRight: Spacing.sm },
  amountInput: { flex: 1, fontSize: 44, fontWeight: '800', color: Colors.text },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: Spacing.xl, marginBottom: Spacing.md },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textLight, marginHorizontal: Spacing.xl, marginBottom: Spacing.sm },
  addCategoryBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addCategoryText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  categoriesGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingHorizontal: Spacing.xl - 4, 
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  categoryBtn: { 
    alignItems: 'center', 
    paddingVertical: Spacing.md, 
    paddingHorizontal: Spacing.md, 
    borderRadius: BorderRadius.lg, 
    backgroundColor: Colors.card, 
    borderWidth: 2, 
    borderColor: 'transparent', 
    width: '30%',
    ...Shadows.small,
  },
  categoryEmoji: { fontSize: 26, marginBottom: 4 },
  categoryName: { fontSize: 11, fontWeight: '600', color: Colors.textLight, textAlign: 'center' },
  customBadge: { 
    position: 'absolute', 
    top: 4, 
    right: 4, 
    backgroundColor: Colors.primary, 
    width: 16, 
    height: 16, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  customBadgeText: { fontSize: 10, color: Colors.white, fontWeight: '600' },
  noteInput: { 
    backgroundColor: Colors.card, 
    borderRadius: BorderRadius.xl, 
    paddingHorizontal: Spacing.lg, 
    height: 56, 
    fontSize: 16, 
    color: Colors.text, 
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.small,
  },
  submitBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden', marginHorizontal: Spacing.xl, ...Shadows.medium },
  submitGradient: { height: 56, justifyContent: 'center', alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: Colors.card, 
    borderTopLeftRadius: BorderRadius.xxl, 
    borderTopRightRadius: BorderRadius.xxl, 
    padding: Spacing.xxl, 
    maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  modalTitle: { fontSize: 22, fontWeight: '700', color: Colors.text },
  modalLabel: { fontSize: 14, fontWeight: '600', color: Colors.textLight, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  modalInput: { backgroundColor: Colors.background, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, height: 52, fontSize: 16, color: Colors.text },
  typeIndicator: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: Spacing.xs,
    backgroundColor: Colors.background,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  typeIndicatorText: { fontSize: 13, fontWeight: '600' },
  emojiScroll: { marginBottom: Spacing.md },
  emojiBtn: { width: 48, height: 48, borderRadius: BorderRadius.md, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm },
  emojiBtnSelected: { backgroundColor: Colors.primary + '20', borderWidth: 2, borderColor: Colors.primary },
  emojiBtnText: { fontSize: 24 },
  previewBox: { backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.xl },
  previewLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: Spacing.sm },
  previewCategory: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  previewEmoji: { fontSize: 32 },
  previewName: { fontSize: 18, fontWeight: '600', color: Colors.text },
  modalSubmitBtn: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  modalSubmitGradient: { height: 52, justifyContent: 'center', alignItems: 'center' },
  modalSubmitText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  
  // Wallet list
  walletList: { maxHeight: 400 },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  walletOptionActive: { backgroundColor: Colors.primary + '10', borderWidth: 1, borderColor: Colors.primary },
  walletOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletOptionIconShared: { backgroundColor: Colors.sharedLight },
  walletOptionEmoji: { fontSize: 22 },
  walletOptionInfo: { flex: 1, marginLeft: Spacing.md },
  walletOptionName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  walletOptionMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  walletOptionBalance: { fontSize: 14, color: Colors.textLight },
  sharedTag: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: Colors.sharedLight, 
    paddingHorizontal: Spacing.sm, 
    paddingVertical: 2, 
    borderRadius: BorderRadius.full,
  },
  sharedTagText: { fontSize: 11, color: Colors.shared, fontWeight: '600' },
});
