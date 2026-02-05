import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../src/store/store';
import { Colors, Gradients } from '../../src/constants/theme';

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
                      <Ionicons name="add-circle" size={16} color={Colors.primary} />
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
            <Text style={styles.emptyText}>Stwórz swój pierwszy cel oszczędnościowy!</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowNewGoalModal(true)}>
              <LinearGradient colors={Gradients.primary} style={styles.emptyBtnGradient}>
                <Ionicons name="add" size={20} color={Colors.white} />
                <Text style={styles.emptyBtnText}>Nowy cel</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
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

            <Text style={styles.modalLabel}>Ikona</Text>
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
              <Text style={styles.modalTitle}>Wpłać na cel 💰</Text>
              <TouchableOpacity onPress={() => setShowContributeModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {selectedGoal && (
              <View style={styles.contributeGoalInfo}>
                <Text style={styles.contributeGoalEmoji}>{selectedGoal.emoji}</Text>
                <Text style={styles.contributeGoalName}>{selectedGoal.name}</Text>
                <Text style={styles.contributeGoalProgress}>
                  {formatMoney(selectedGoal.current_amount)} / {formatMoney(selectedGoal.target_amount)}
                </Text>
                <View style={styles.contributeProgressBar}>
                  <LinearGradient
                    colors={Gradients.primary}
                    style={[styles.contributeProgressFill, { 
                      width: `${Math.min((selectedGoal.current_amount / selectedGoal.target_amount) * 100, 100)}%` 
                    }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
              </View>
            )}

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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textLight, marginTop: 2 },
  addBtn: { borderRadius: 14, overflow: 'hidden' },
  addBtnGradient: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingTop: 0, paddingBottom: 100 },
  
  // Summary card
  summaryCard: { borderRadius: 20, padding: 20, marginBottom: 24 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1 },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  summaryAmount: { fontSize: 22, fontWeight: '700', color: Colors.white, marginTop: 4 },
  summaryDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 16 },
  overallProgress: { marginTop: 16 },
  overallProgressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden' },
  overallProgressFill: { height: '100%', backgroundColor: Colors.white, borderRadius: 4 },
  overallProgressText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 8, textAlign: 'center' },
  
  // Section
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.textLight, marginBottom: 12, textTransform: 'uppercase' },
  
  // Goal card
  goalCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 12 },
  goalCardCompleted: { opacity: 0.8 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  goalIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  goalIconCompleted: { backgroundColor: Colors.income + '15' },
  goalEmoji: { fontSize: 24 },
  goalInfo: { flex: 1, marginLeft: 12 },
  goalName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  goalAmounts: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  goalAmountsCompleted: { fontSize: 13, color: Colors.income, marginTop: 2, fontWeight: '600' },
  goalPercent: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  goalPercentText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  progressBar: { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', borderRadius: 4 },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalRemaining: { fontSize: 13, color: Colors.textLight },
  contributeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '15', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  contributeBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  
  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 14, color: Colors.textLight, marginTop: 4, marginBottom: 24 },
  emptyBtn: { borderRadius: 14, overflow: 'hidden' },
  emptyBtnGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 24, gap: 8 },
  emptyBtnText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  modalLabel: { fontSize: 14, fontWeight: '600', color: Colors.textLight, marginBottom: 8, marginTop: 12 },
  modalInput: { backgroundColor: Colors.background, borderRadius: 12, paddingHorizontal: 16, height: 52, fontSize: 16, color: Colors.text },
  emojiScroll: { marginBottom: 16 },
  emojiBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  emojiBtnSelected: { backgroundColor: Colors.primary + '20', borderWidth: 2, borderColor: Colors.primary },
  emojiBtnText: { fontSize: 24 },
  modalSubmitBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 20 },
  modalSubmitGradient: { height: 52, justifyContent: 'center', alignItems: 'center' },
  modalSubmitText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  
  // Contribute modal
  contributeGoalInfo: { alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 16 },
  contributeGoalEmoji: { fontSize: 48, marginBottom: 8 },
  contributeGoalName: { fontSize: 18, fontWeight: '600', color: Colors.text },
  contributeGoalProgress: { fontSize: 14, color: Colors.textLight, marginTop: 4, marginBottom: 12 },
  contributeProgressBar: { width: '100%', height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  contributeProgressFill: { height: '100%', borderRadius: 4 },
});
