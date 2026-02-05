import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/store';
import { Colors, Gradients } from '../../src/constants/theme';

// Common emojis for quick selection
const EMOJI_OPTIONS = ['🍔', '🚗', '🛒', '🎬', '📄', '💊', '💰', '💻', '🎁', '📈', '🏠', '✈️', '🎮', '📱', '👕', '💪', '🎓', '🐕', '☕', '🍕', '🎵', '⚽', '🎨', '💇', '🔧'];

export default function AddTransaction() {
  const router = useRouter();
  const { activeWallet, addTransaction, categories, loadCategories, addCategory } = useStore();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  
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
    if (!activeWallet) return Alert.alert('Błąd', 'Brak portfela');

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Nowa transakcja</Text>
          </View>

          {/* Type Toggle */}
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]}
              onPress={() => { setType('expense'); setSelectedCategory(null); }}
            >
              <LinearGradient colors={type === 'expense' ? Gradients.expense : [Colors.card, Colors.card]} style={styles.typeBtnInner}>
                <Ionicons name="arrow-down" size={20} color={type === 'expense' ? Colors.white : Colors.expense} />
                <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>Wydatek</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'income' && styles.typeBtnActive]}
              onPress={() => { setType('income'); setSelectedCategory(null); }}
            >
              <LinearGradient colors={type === 'income' ? Gradients.income : [Colors.card, Colors.card]} style={styles.typeBtnInner}>
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
              <Ionicons name="add-circle" size={24} color={Colors.primary} />
              <Text style={styles.addCategoryText}>Nowa</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {filteredCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryBtn, 
                  selectedCategory?.id === cat.id && { 
                    backgroundColor: type === 'income' ? '#10B98120' : '#F43F5E20',
                    borderColor: type === 'income' ? Colors.income : Colors.expense 
                  }
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={[
                  styles.categoryName, 
                  selectedCategory?.id === cat.id && { color: type === 'income' ? Colors.income : Colors.expense }
                ]}>
                  {cat.name}
                </Text>
                {!cat.is_default && (
                  <View style={styles.customBadge}>
                    <Text style={styles.customBadgeText}>własna</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

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
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            <LinearGradient colors={type === 'income' ? Gradients.income : Gradients.expense} style={styles.submitGradient}>
              <Text style={styles.submitText}>{loading ? 'Dodawanie...' : 'Dodaj transakcję'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

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

            <Text style={styles.modalLabel}>Typ: {type === 'income' ? 'Przychód 💰' : 'Wydatek 💸'}</Text>

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
  container: { flex: 1, backgroundColor: Colors.background, padding: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  typeToggle: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  typeBtn: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  typeBtnActive: {},
  typeBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8, borderRadius: 16 },
  typeBtnText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  typeBtnTextActive: { color: Colors.white },
  amountBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 20, padding: 20, marginBottom: 24 },
  currency: { fontSize: 24, fontWeight: '700', color: Colors.textMuted, marginRight: 8 },
  amountInput: { flex: 1, fontSize: 40, fontWeight: '800', color: Colors.text },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textLight },
  addCategoryBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addCategoryText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  categoryScroll: { marginBottom: 24 },
  categoryBtn: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, backgroundColor: Colors.card, marginRight: 10, borderWidth: 2, borderColor: 'transparent', minWidth: 80 },
  categoryEmoji: { fontSize: 24, marginBottom: 4 },
  categoryName: { fontSize: 12, fontWeight: '600', color: Colors.textLight },
  customBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: Colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  customBadgeText: { fontSize: 8, color: Colors.white, fontWeight: '600' },
  noteInput: { backgroundColor: Colors.card, borderRadius: 16, paddingHorizontal: 16, height: 56, fontSize: 16, color: Colors.text, marginBottom: 24 },
  submitBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 40 },
  submitGradient: { height: 56, justifyContent: 'center', alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  modalLabel: { fontSize: 14, fontWeight: '600', color: Colors.textLight, marginBottom: 8, marginTop: 12 },
  modalInput: { backgroundColor: Colors.background, borderRadius: 12, paddingHorizontal: 16, height: 52, fontSize: 16, color: Colors.text },
  emojiScroll: { marginBottom: 16 },
  emojiBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  emojiBtnSelected: { backgroundColor: Colors.primary + '20', borderWidth: 2, borderColor: Colors.primary },
  emojiBtnText: { fontSize: 24 },
  previewBox: { backgroundColor: Colors.background, borderRadius: 12, padding: 16, marginBottom: 20 },
  previewLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 8 },
  previewCategory: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewEmoji: { fontSize: 32 },
  previewName: { fontSize: 18, fontWeight: '600', color: Colors.text },
  modalSubmitBtn: { borderRadius: 12, overflow: 'hidden' },
  modalSubmitGradient: { height: 52, justifyContent: 'center', alignItems: 'center' },
  modalSubmitText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});
