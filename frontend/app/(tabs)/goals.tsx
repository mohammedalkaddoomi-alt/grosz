import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../src/store/store';
import { Colors, Gradients, Shadows, BorderRadius, Spacing } from '../../src/constants/theme';

const GOAL_EMOJIS = ['🎯', '🏠', '🚗', '✈️', '💻', '📱', '🎓', '💍', '🏖️', '🎸', '🎮', '📷', '👶', '🐕', '💪', '🏋️', '🚀', '💎', '🎁', '🏦'];

export default function Goals() {
  const { goals, loadGoals, addGoal, contributeToGoal, deleteGoal } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  
  // New goal modal
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalEmoji, setGoalEmoji] = useState('🎯');
  const [creating, setCreating] = useState(false);
  
  // Contribute modal
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributing, setContributing] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGoals();
    setRefreshing(false);
  };

  const formatMoney = (n: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0 }).format(n);

  const handleCreateGoal = async () => {
    if (!goalName.trim()) return Alert.alert('Błąd', 'Podaj nazwę celu');
    if (!goalAmount || parseFloat(goalAmount) <= 0) return Alert.alert('Błąd', 'Podaj kwotę docelową');

    setCreating(true);
    try {
      await addGoal({
        name: goalName.trim(),
        target_amount: parseFloat(goalAmount),
        emoji: goalEmoji,
      });
      setShowNewGoalModal(false);
      setGoalName('');
      setGoalAmount('');
      setGoalEmoji('🎯');
      Alert.alert('Sukces! 🎯', 'Cel został utworzony');
    } catch (e: any) {
      Alert.alert('Błąd', e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleContribute = async () => {
    if (!contributeAmount || parseFloat(contributeAmount) <= 0) return Alert.alert('Błąd', 'Podaj kwotę');
    if (!selectedGoal) return;

    setContributing(true);
    try {
      await contributeToGoal(selectedGoal.id, parseFloat(contributeAmount));
      setShowContributeModal(false);
      setContributeAmount('');
      setSelectedGoal(null);
      Alert.alert('Świetnie! 💪', 'Wpłata została dodana');
    } catch (e: any) {
      Alert.alert('Błąd', e.message);
    } finally {
      setContributing(false);
    }
  };

  const handleDeleteGoal = (goal: any) => {
    Alert.alert(
      'Usuń cel',
      `Usunąć "${goal.name}"?`,
      [
        { text: 'Nie', style: 'cancel' },
        { text: 'Tak', style: 'destructive', onPress: () => deleteGoal(goal.id) },
      ]
    );
  };

  const openContributeModal = (goal: any) => {
    setSelectedGoal(goal);
    setShowContributeModal(true);
  };

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);
  const totalSaved = goals.reduce((acc, g) => acc + g.current_amount, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.target_amount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Cele oszczędnościowe</Text>
          <Text style={styles.subtitle}>Osiągaj swoje marzenia 🌟</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowNewGoalModal(true)}>
          <LinearGradient colors={Gradients.primary} style={styles.addBtnGradient}>
            <Ionicons name="add" size={24} color={Colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary Card */}
        {goals.length > 0 && (
          <LinearGradient colors={Gradients.primary} style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Zaoszczędzono</Text>
                <Text style={styles.summaryAmount}>{formatMoney(totalSaved)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Cel łącznie</Text>
                <Text style={styles.summaryAmount}>{formatMoney(totalTarget)}</Text>
              </View>
            </View>
            <View style={styles.overallProgress}>
              <View style={styles.overallProgressBar}>
                <View style={[styles.overallProgressFill, { width: `${totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0}%` }]} />
              </View>
              <Text style={styles.overallProgressText}>
                {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}% ogólnego celu
              </Text>
            </View>
          </LinearGradient>
        )}

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aktywne cele ({activeGoals.length})</Text>
            {activeGoals.map((goal) => {
              const progress = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
              const remaining = goal.target_amount - goal.current_amount;
              return (
                <TouchableOpacity
                  key={goal.id}
                  style={styles.goalCard}
                  onPress={() => openContributeModal(goal)}
                  onLongPress={() => handleDeleteGoal(goal)}
                  activeOpacity={0.7}
                >
                  <View style={styles.goalHeader}>
                    <View style={styles.goalIcon}>
                      <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                    </View>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <Text style={styles.goalAmounts}>
                        {formatMoney(goal.current_amount)} / {formatMoney(goal.target_amount)}
                      </Text>
                    </View>
                    <View style={styles.goalPercent}>
                      <Text style={styles.goalPercentText}>{Math.round(progress)}%</Text>
                    </View>
                  </View>
                  <View style={styles.progressBar}>
                    <LinearGradient
                      colors={progress >= 100 ? Gradients.income : Gradients.primary}
                      style={[styles.progressFill, { width: `${progress}%` }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </View>
                  <View style={styles.goalFooter}>
                    <Text style={styles.goalRemaining}>
                      {remaining > 0 ? `Pozostało: ${formatMoney(remaining)}` : 'Cel osiągnięty! 🎉'}
                    </Text>
                    <View style={styles.contributeBtn}>
                      <Ionicons name="add-circle" size={18} color={Colors.primary} />
                      <Text style={styles.contributeBtnText}>Wpłać</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ukończone cele ({completedGoals.length}) 🏆</Text>
            {completedGoals.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[styles.goalCard, styles.goalCardCompleted]}
                onLongPress={() => handleDeleteGoal(goal)}
                activeOpacity={0.7}
              >
                <View style={styles.goalHeader}>
                  <View style={[styles.goalIcon, styles.goalIconCompleted]}>
                    <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                  </View>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalAmountsCompleted}>{formatMoney(goal.target_amount)}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={28} color={Colors.income} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {goals.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="flag" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Brak celów</Text>
            <Text style={styles.emptyText}>Stwórz swój pierwszy cel oszczędnościowy i zacznij realizować marzenia!</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowNewGoalModal(true)}>
              <LinearGradient colors={Gradients.primary} style={styles.emptyBtnGradient}>
                <Ionicons name="add" size={20} color={Colors.white} />
                <Text style={styles.emptyBtnText}>Nowy cel</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* New Goal Modal */}
      <Modal visible={showNewGoalModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nowy cel 🎯</Text>
              <TouchableOpacity onPress={() => setShowNewGoalModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Nazwa celu</Text>
            <TextInput
              style={styles.modalInput}
              value={goalName}
              onChangeText={setGoalName}
              placeholder="Np. Wakacje w Grecji"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.modalLabel}>Kwota docelowa (zł)</Text>
            <TextInput
              style={styles.modalInput}
              value={goalAmount}
              onChangeText={setGoalAmount}
              placeholder="5000"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
            />

            <Text style={styles.modalLabel}>Wybierz emoji</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll}>
              {GOAL_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.emojiBtn, goalEmoji === emoji && styles.emojiBtnSelected]}
                  onPress={() => setGoalEmoji(emoji)}
                >
                  <Text style={styles.emojiBtnText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleCreateGoal} disabled={creating}>
              <LinearGradient colors={Gradients.primary} style={styles.modalSubmitGradient}>
                <Text style={styles.modalSubmitText}>{creating ? 'Tworzę...' : 'Utwórz cel'}</Text>
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
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalGoalEmoji}>{selectedGoal?.emoji}</Text>
                <Text style={styles.modalTitle}>{selectedGoal?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => { setShowContributeModal(false); setContributeAmount(''); }}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.goalStats}>
              <View style={styles.goalStatItem}>
                <Text style={styles.goalStatLabel}>Zebrano</Text>
                <Text style={styles.goalStatValue}>{formatMoney(selectedGoal?.current_amount || 0)}</Text>
              </View>
              <View style={styles.goalStatItem}>
                <Text style={styles.goalStatLabel}>Cel</Text>
                <Text style={styles.goalStatValue}>{formatMoney(selectedGoal?.target_amount || 0)}</Text>
              </View>
              <View style={styles.goalStatItem}>
                <Text style={styles.goalStatLabel}>Pozostało</Text>
                <Text style={[styles.goalStatValue, styles.goalStatRemaining]}>
                  {formatMoney((selectedGoal?.target_amount || 0) - (selectedGoal?.current_amount || 0))}
                </Text>
              </View>
            </View>

            <Text style={styles.modalLabel}>Kwota wpłaty (zł)</Text>
            <TextInput
              style={styles.modalInput}
              value={contributeAmount}
              onChangeText={setContributeAmount}
              placeholder="100"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
            />

            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleContribute} disabled={contributing}>
              <LinearGradient colors={Gradients.income} style={styles.modalSubmitGradient}>
                <Text style={styles.modalSubmitText}>{contributing ? 'Wpłacam...' : 'Wpłać'}</Text>
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
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: Spacing.xl, 
    paddingVertical: Spacing.lg,
  },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textLight, marginTop: 4 },
  addBtn: { borderRadius: BorderRadius.md, overflow: 'hidden', ...Shadows.medium },
  addBtnGradient: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: Spacing.xl },
  summaryCard: { 
    padding: Spacing.xxl, 
    borderRadius: BorderRadius.xxl, 
    marginBottom: Spacing.xl,
    ...Shadows.large,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.3)' },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  summaryAmount: { fontSize: 22, fontWeight: '700', color: Colors.white, marginTop: 4 },
  overallProgress: { marginTop: Spacing.xl },
  overallProgressBar: { 
    height: 10, 
    backgroundColor: 'rgba(255,255,255,0.3)', 
    borderRadius: BorderRadius.full, 
    overflow: 'hidden',
  },
  overallProgressFill: { height: '100%', backgroundColor: Colors.white, borderRadius: BorderRadius.full },
  overallProgressText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: Spacing.sm, textAlign: 'center' },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  goalCard: { 
    backgroundColor: Colors.card, 
    borderRadius: BorderRadius.xl, 
    padding: Spacing.lg, 
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  goalCardCompleted: { opacity: 0.8 },
  goalHeader: { flexDirection: 'row', alignItems: 'center' },
  goalIcon: { 
    width: 52, 
    height: 52, 
    borderRadius: BorderRadius.lg, 
    backgroundColor: Colors.primary + '15', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  goalIconCompleted: { backgroundColor: Colors.incomeLight },
  goalEmoji: { fontSize: 26 },
  goalInfo: { flex: 1, marginLeft: Spacing.md },
  goalName: { fontSize: 17, fontWeight: '600', color: Colors.text },
  goalAmounts: { fontSize: 14, color: Colors.textLight, marginTop: 4 },
  goalAmountsCompleted: { fontSize: 14, color: Colors.income, marginTop: 4, fontWeight: '600' },
  goalPercent: { 
    backgroundColor: Colors.primary + '15', 
    paddingHorizontal: Spacing.md, 
    paddingVertical: Spacing.sm, 
    borderRadius: BorderRadius.full,
  },
  goalPercentText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  progressBar: { 
    height: 8, 
    backgroundColor: Colors.backgroundDark, 
    borderRadius: BorderRadius.full, 
    marginTop: Spacing.md, 
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: BorderRadius.full },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
  goalRemaining: { fontSize: 13, color: Colors.textLight },
  contributeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  contributeBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  emptyState: { 
    alignItems: 'center', 
    paddingVertical: Spacing.xxxl * 2,
    paddingHorizontal: Spacing.xxl,
  },
  emptyIcon: { 
    width: 96, 
    height: 96, 
    borderRadius: BorderRadius.full, 
    backgroundColor: Colors.primary + '15', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 15, color: Colors.textLight, marginTop: Spacing.sm, textAlign: 'center', lineHeight: 22 },
  emptyBtn: { marginTop: Spacing.xl, borderRadius: BorderRadius.full, overflow: 'hidden', ...Shadows.medium },
  emptyBtnGradient: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md },
  emptyBtnText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  
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
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  modalGoalEmoji: { fontSize: 28 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: Colors.text },
  modalLabel: { fontSize: 14, fontWeight: '600', color: Colors.textLight, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  modalInput: { 
    backgroundColor: Colors.background, 
    borderRadius: BorderRadius.md, 
    paddingHorizontal: Spacing.lg, 
    height: 52, 
    fontSize: 16, 
    color: Colors.text,
  },
  emojiScroll: { marginBottom: Spacing.md },
  emojiBtn: { 
    width: 48, 
    height: 48, 
    borderRadius: BorderRadius.md, 
    backgroundColor: Colors.background, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: Spacing.sm,
  },
  emojiBtnSelected: { backgroundColor: Colors.primary + '20', borderWidth: 2, borderColor: Colors.primary },
  emojiBtnText: { fontSize: 24 },
  goalStats: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  goalStatItem: { 
    flex: 1, 
    backgroundColor: Colors.background, 
    padding: Spacing.md, 
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  goalStatLabel: { fontSize: 12, color: Colors.textLight },
  goalStatValue: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 4 },
  goalStatRemaining: { color: Colors.primary },
  modalSubmitBtn: { borderRadius: BorderRadius.md, overflow: 'hidden', marginTop: Spacing.xl },
  modalSubmitGradient: { height: 52, justifyContent: 'center', alignItems: 'center' },
  modalSubmitText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});
