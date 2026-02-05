import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/store';
import { Colors, Gradients } from '../../src/constants/theme';

export default function Home() {
  const router = useRouter();
  const { user, stats, transactions, loadData } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatMoney = (n: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0 }).format(n);

  const recentTx = transactions.slice(0, 5);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Cześć {user?.name?.split(' ')[0]} 👋</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
        </View>

        {/* Balance Card */}
        <LinearGradient colors={Gradients.primary} style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Całkowite saldo</Text>
          <Text style={styles.balanceAmount}>{formatMoney(stats?.total_balance || 0)}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(16,185,129,0.3)' }]}>
                <Ionicons name="arrow-up" size={16} color="#10B981" />
              </View>
              <View>
                <Text style={styles.statLabel}>Przychody</Text>
                <Text style={styles.statValue}>+{formatMoney(stats?.month_income || 0)}</Text>
              </View>
            </View>
            <View style={styles.statBox}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(244,63,94,0.3)' }]}>
                <Ionicons name="arrow-down" size={16} color="#F43F5E" />
              </View>
              <View>
                <Text style={styles.statLabel}>Wydatki</Text>
                <Text style={styles.statValue}>-{formatMoney(stats?.month_expenses || 0)}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.actions}>
          <ActionButton icon="add" label="Dodaj" color={Colors.income} gradient={Gradients.income} onPress={() => router.push('/(tabs)/add')} />
          <ActionButton icon="remove" label="Wydaj" color={Colors.expense} gradient={Gradients.expense} onPress={() => router.push('/(tabs)/add')} />
          <ActionButton icon="chatbubble" label="AI" color={Colors.primary} gradient={Gradients.primary} onPress={() => router.push('/(tabs)/chat')} />
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ostatnie transakcje</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
              <Text style={styles.seeAll}>Zobacz wszystko</Text>
            </TouchableOpacity>
          </View>

          {recentTx.length > 0 ? (
            recentTx.map((tx) => (
              <View key={tx.id} style={styles.txItem}>
                <View style={[styles.txIcon, { backgroundColor: tx.type === 'income' ? '#10B98115' : '#F43F5E15' }]}>
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
              <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Brak transakcji</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ActionButton = ({ icon, label, gradient, onPress }: any) => (
  <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
    <LinearGradient colors={gradient} style={styles.actionIcon}>
      <Ionicons name={icon} size={24} color={Colors.white} />
    </LinearGradient>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16 },
  greeting: { fontSize: 24, fontWeight: '700', color: Colors.text },
  date: { fontSize: 14, color: Colors.textLight, marginTop: 2, textTransform: 'capitalize' },
  balanceCard: { margin: 20, padding: 24, borderRadius: 24 },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  balanceAmount: { fontSize: 36, fontWeight: '800', color: Colors.white, marginVertical: 8 },
  statsRow: { flexDirection: 'row', marginTop: 16, gap: 16 },
  statBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  statIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  statValue: { fontSize: 14, fontWeight: '700', color: Colors.white },
  actions: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, marginBottom: 20 },
  actionBtn: { alignItems: 'center' },
  actionIcon: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: Colors.text },
  section: { backgroundColor: Colors.card, marginHorizontal: 20, borderRadius: 20, padding: 16, marginBottom: 100 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  seeAll: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  txItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  txIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  txEmoji: { fontSize: 20 },
  txInfo: { flex: 1, marginLeft: 12 },
  txCategory: { fontSize: 15, fontWeight: '600', color: Colors.text },
  txDate: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 14, color: Colors.textMuted, marginTop: 8 },
});
