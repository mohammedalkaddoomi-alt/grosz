import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/store';
import { Colors, Gradients, Categories } from '../../src/constants/theme';

export default function AddTransaction() {
  const router = useRouter();
  const { activeWallet, addTransaction } = useStore();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(Categories[0]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) return Alert.alert('Błąd', 'Podaj kwotę');
    if (!activeWallet) return Alert.alert('Błąd', 'Brak portfela');

    setLoading(true);
    try {
      await addTransaction({
        wallet_id: activeWallet.id,
        amount: parseFloat(amount),
        type,
        category: category.name,
        emoji: category.emoji,
        note: note || undefined,
      });
      Alert.alert('Sukces!', 'Transakcja dodana', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('Błąd', e.message);
    } finally {
      setLoading(false);
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
              onPress={() => setType('expense')}
            >
              <LinearGradient colors={type === 'expense' ? Gradients.expense : [Colors.card, Colors.card]} style={styles.typeBtnInner}>
                <Ionicons name="arrow-down" size={20} color={type === 'expense' ? Colors.white : Colors.expense} />
                <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>Wydatek</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'income' && styles.typeBtnActive]}
              onPress={() => setType('income')}
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
          <Text style={styles.label}>Kategoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {Categories.map((cat) => (
              <TouchableOpacity
                key={cat.name}
                style={[styles.categoryBtn, category.name === cat.name && { backgroundColor: cat.color + '20', borderColor: cat.color }]}
                onPress={() => setCategory(cat)}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={[styles.categoryName, category.name === cat.name && { color: cat.color }]}>{cat.name}</Text>
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
  label: { fontSize: 14, fontWeight: '600', color: Colors.textLight, marginBottom: 12 },
  categoryScroll: { marginBottom: 24 },
  categoryBtn: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, backgroundColor: Colors.card, marginRight: 10, borderWidth: 2, borderColor: 'transparent' },
  categoryEmoji: { fontSize: 24, marginBottom: 4 },
  categoryName: { fontSize: 12, fontWeight: '600', color: Colors.textLight },
  noteInput: { backgroundColor: Colors.card, borderRadius: 16, paddingHorizontal: 16, height: 56, fontSize: 16, color: Colors.text, marginBottom: 24 },
  submitBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 40 },
  submitGradient: { height: 56, justifyContent: 'center', alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});
