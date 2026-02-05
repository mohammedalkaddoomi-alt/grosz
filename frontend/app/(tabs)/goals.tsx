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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDataStore } from '../../src/store/dataStore';
import { COLORS, SPACING, BORDER_RADIUS, GRADIENTS, GOAL_EMOJIS } from '../../src/constants/theme';
import { PL } from '../../src/constants/polish';
import type { Goal } from '../../src/types';

export default function GoalsScreen() {
  const { goals, fetchGoals, createGoal, contributeToGoal, deleteGoal } = useDataStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [goalEmoji, setGoalEmoji] = useState('🎯');
  const [contributeAmount, setContributeAmount] = useState('');

  useEffect(() => { fetchGoals(); }, []);

  const onRefresh = useCallback(async () => { setRefreshing(true); await fetchGoals(); setRefreshing(false); }, []);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const handleCreateGoal = async () => {
    if (!goalName.trim() || !targetAmount || parseFloat(targetAmount) <= 0) { Alert.alert('Błąd', 'Wypełnij wszystkie pola'); return; }
    setIsLoading(true);
    try {
      await createGoal({ name: goalName, target_amount: parseFloat(targetAmount), emoji: goalEmoji });
      setShowModal(false); setGoalName(''); setTargetAmount(''); setGoalEmoji('🎯');
    } catch (err: any) { Alert.alert('Błąd', err.message); }
    finally { setIsLoading(false); }
  };

  const handleContribute = async () => {
    if (!contributeAmount || parseFloat(contributeAmount) <= 0 || !selectedGoal) return;
    setIsLoading(true);
    try {
      await contributeToGoal(selectedGoal.id, parseFloat(contributeAmount));
      setShowContributeModal(false); setContributeAmount(''); setSelectedGoal(null);
    } catch (err: any) { Alert.alert('Błąd', err.message); }
    finally { setIsLoading(false); }
  };

  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1A1A2E', '#16213E']} style={styles.headerGradient}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.title}>{PL.myGoals}</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
              <Ionicons name="add" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          {activeGoals.length > 0 && (
            <View style={styles.summaryCard}>
              <LinearGradient colors={GRADIENTS.sunset} style={styles.summaryGradient}>
                <Ionicons name="flag" size={32} color={COLORS.white} />
                <View style={styles.summaryText}>
                  <Text style={styles.summaryLabel}>Łączna kwota celów</Text>
                  <Text style={styles.summaryAmount}>{formatCurrency(activeGoals.reduce((acc, g) => acc + g.target_amount, 0))}</Text>
                </View>
              </LinearGradient>
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />} contentContainerStyle={styles.scrollContent}>
        {activeGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aktywne ({activeGoals.length})</Text>
            {activeGoals.map((goal) => {
              const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
              return (
                <TouchableOpacity key={goal.id} style={styles.goalCard} onPress={() => { setSelectedGoal(goal); setShowContributeModal(true); }} onLongPress={() => Alert.alert('Usuń?', '', [{ text: 'Anuluj' }, { text: 'Usuń', style: 'destructive', onPress: () => deleteGoal(goal.id) }])} activeOpacity={0.8}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalIcon}><Text style={styles.goalEmoji}>{goal.emoji}</Text></View>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <Text style={styles.goalAmount}>{formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}</Text>
                    </View>
                    <View style={styles.progressCircle}>
                      <Text style={styles.progressText}>{Math.round(progress)}%</Text>
                    </View>
                  </View>
                  <View style={styles.progressBarBg}>
                    <LinearGradient colors={GRADIENTS.sunset} style={[styles.progressBarFill, { width: `${progress}%` }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                  </View>
                  <View style={styles.goalFooter}>
                    <Text style={styles.remainingText}>Pozostało: {formatCurrency(goal.target_amount - goal.current_amount)}</Text>
                    <View style={styles.contributeChip}>
                      <Ionicons name="add" size={14} color={COLORS.primary} />
                      <Text style={styles.contributeText}>{PL.contribute}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {completedGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ukończone ({completedGoals.length})</Text>
            {completedGoals.map((goal) => (
              <View key={goal.id} style={[styles.goalCard, styles.goalCardCompleted]}>
                <View style={styles.goalHeader}>
                  <View style={[styles.goalIcon, styles.goalIconCompleted]}><Text style={styles.goalEmoji}>{goal.emoji}</Text></View>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalAmount}>{formatCurrency(goal.target_amount)}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={28} color={COLORS.income} />
                </View>
              </View>
            ))}
          </View>
        )}

        {goals.length === 0 && (
          <View style={styles.emptyState}>
            <LinearGradient colors={GRADIENTS.sunset} style={styles.emptyIcon}>
              <Ionicons name="flag" size={40} color={COLORS.white} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Brak celów</Text>
            <Text style={styles.emptyText}>Stwórz swój pierwszy cel!</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowModal(true)}>
              <LinearGradient colors={GRADIENTS.sunset} style={styles.emptyBtnGradient}>
                <Ionicons name="add" size={20} color={COLORS.white} />
                <Text style={styles.emptyBtnText}>{PL.addGoal}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Create Goal Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{PL.addGoal}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>{PL.goalName}</Text>
            <TextInput style={styles.textInput} value={goalName} onChangeText={setGoalName} placeholder="Wakacje w Grecji" placeholderTextColor={COLORS.textMuted} />
            <Text style={styles.inputLabel}>{PL.targetAmount}</Text>
            <TextInput style={styles.textInput} value={targetAmount} onChangeText={setTargetAmount} placeholder="5000" placeholderTextColor={COLORS.textMuted} keyboardType="decimal-pad" />
            <Text style={styles.inputLabel}>Ikona</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll}>
              {GOAL_EMOJIS.map((e) => (
                <TouchableOpacity key={e} style={[styles.emojiBtn, goalEmoji === e && styles.emojiBtnSelected]} onPress={() => setGoalEmoji(e)}>
                  <Text style={styles.emojiBtnText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.submitBtn} onPress={handleCreateGoal} disabled={isLoading}>
              <LinearGradient colors={GRADIENTS.sunset} style={styles.submitGradient}>
                {isLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitText}>{PL.save}</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Contribute Modal */}
      <Modal visible={showContributeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{PL.contribute}</Text>
              <TouchableOpacity onPress={() => setShowContributeModal(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            {selectedGoal && (
              <View style={styles.contributeInfo}>
                <Text style={styles.contributeEmoji}>{selectedGoal.emoji}</Text>
                <Text style={styles.contributeName}>{selectedGoal.name}</Text>
                <Text style={styles.contributeProgress}>{formatCurrency(selectedGoal.current_amount)} / {formatCurrency(selectedGoal.target_amount)}</Text>
              </View>
            )}
            <Text style={styles.inputLabel}>{PL.amount}</Text>
            <TextInput style={styles.textInput} value={contributeAmount} onChangeText={setContributeAmount} placeholder="100" placeholderTextColor={COLORS.textMuted} keyboardType="decimal-pad" />
            <TouchableOpacity style={styles.submitBtn} onPress={handleContribute} disabled={isLoading}>
              <LinearGradient colors={GRADIENTS.income} style={styles.submitGradient}>
                {isLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitText}>{PL.contribute}</Text>}
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
  summaryCard: { borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.sm },
  summaryGradient: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
  summaryText: { flex: 1 },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  summaryAmount: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  content: { flex: 1, marginTop: -10, borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: 100 },
  section: { marginBottom: SPACING.xl },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textLight, textTransform: 'uppercase', marginBottom: SPACING.md },
  goalCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm },
  goalCardCompleted: { opacity: 0.7 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  goalIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: `${COLORS.accent}15`, justifyContent: 'center', alignItems: 'center' },
  goalIconCompleted: { backgroundColor: `${COLORS.income}15` },
  goalEmoji: { fontSize: 26 },
  goalInfo: { flex: 1, marginLeft: SPACING.sm },
  goalName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  goalAmount: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  progressCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: `${COLORS.accent}15`, justifyContent: 'center', alignItems: 'center' },
  progressText: { fontSize: 14, fontWeight: '700', color: COLORS.accent },
  progressBarBg: { height: 8, backgroundColor: COLORS.borderLight, borderRadius: 4, overflow: 'hidden', marginBottom: SPACING.sm },
  progressBarFill: { height: '100%', borderRadius: 4 },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  remainingText: { fontSize: 13, color: COLORS.textLight },
  contributeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${COLORS.primary}15`, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  contributeText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  emptyText: { fontSize: 14, color: COLORS.textLight, marginTop: SPACING.xs, marginBottom: SPACING.lg },
  emptyBtn: { borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  emptyBtnGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 24, gap: SPACING.sm },
  emptyBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl, padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs, marginTop: SPACING.md },
  textInput: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, height: 52, fontSize: 16, color: COLORS.text },
  emojiScroll: { marginBottom: SPACING.sm },
  emojiBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  emojiBtnSelected: { backgroundColor: `${COLORS.accent}20`, borderWidth: 2, borderColor: COLORS.accent },
  emojiBtnText: { fontSize: 24 },
  contributeInfo: { alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, marginBottom: SPACING.md },
  contributeEmoji: { fontSize: 48, marginBottom: SPACING.xs },
  contributeName: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  contributeProgress: { fontSize: 14, color: COLORS.textLight, marginTop: SPACING.xs },
  submitBtn: { marginTop: SPACING.lg, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  submitGradient: { alignItems: 'center', justifyContent: 'center', height: 56 },
  submitText: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
});
