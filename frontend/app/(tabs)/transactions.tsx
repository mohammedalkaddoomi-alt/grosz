import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../src/store/store';
import { Colors } from '../../src/constants/theme';

export default function Transactions() {
  const { transactions, deleteTransaction, loadData } = useStore();

  const formatMoney = (n: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0 }).format(n);

  const handleDelete = (id: string) => {
    Alert.alert('Usuń', 'Usunąć transakcję?', [
      { text: 'Nie', style: 'cancel' },
      { text: 'Tak', style: 'destructive', onPress: () => deleteTransaction(id) },
    ]);
  };

  const renderItem = ({ item: tx }: any) => (
    <TouchableOpacity style={styles.txItem} onLongPress={() => handleDelete(tx.id)}>
      <View style={[styles.txIcon, { backgroundColor: tx.type === 'income' ? '#10B98115' : '#F43F5E15' }]}>
        <Text style={styles.txEmoji}>{tx.emoji}</Text>
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txCategory}>{tx.category}</Text>
        <Text style={styles.txNote}>{tx.note || '-'}</Text>
        <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
      </View>
      <Text style={[styles.txAmount, { color: tx.type === 'income' ? Colors.income : Colors.expense }]}>
        {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Historia transakcji</Text>
      </View>

      {transactions.length > 0 ? (
        <FlatList
          data={transactions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Brak transakcji</Text>
          <Text style={styles.emptyHint}>Przytrzymaj aby usunąć</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  list: { padding: 20, paddingBottom: 100 },
  txItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, padding: 16, borderRadius: 16, marginBottom: 12 },
  txIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  txEmoji: { fontSize: 22 },
  txInfo: { flex: 1, marginLeft: 12 },
  txCategory: { fontSize: 16, fontWeight: '600', color: Colors.text },
  txNote: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  txDate: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  txAmount: { fontSize: 16, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.text, marginTop: 16 },
  emptyHint: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
});
