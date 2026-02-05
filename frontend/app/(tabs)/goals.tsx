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
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, GOAL_EMOJIS } from '../../src/constants/theme';
import { PL } from '../../src/constants/polish';
import type { Goal } from '../../src/types';

export default function GoalsScreen() {
  const { goals, fetchGoals, createGoal, contributeToGoal, deleteGoal } = useDataStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [goalEmoji, setGoalEmoji] = useState('🎯');
  const [contributeAmount, setContributeAmount] = useState('');

  useEffect(() => {
    fetchGoals();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGoals();
    setRefreshing(false);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  const handleCreateGoal = async () => {
    if (!goalName.trim()) {
      Alert.alert('Błąd', 'Podaj nazwę celu');
      return;
    }
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      Alert.alert('Błąd', 'Podaj prawidłową kwotę docelową');
      return;
    }

    setIsLoading(true);
    try {
      await createGoal({
        name: goalName,
        target_amount: parseFloat(targetAmount),
        emoji: goalEmoji,
      });
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      Alert.alert('Błąd', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContribute = async () => {
    if (!contributeAmount || parseFloat(contributeAmount) <= 0) {
      Alert.alert('Błąd', 'Podaj prawidłową kwotę');
      return;
    }
    if (!selectedGoal) return;

    setIsLoading(true);
    try {
      await contributeToGoal(selectedGoal.id, parseFloat(contributeAmount));
      setShowContributeModal(false);
      setContributeAmount('');
      setSelectedGoal(null);
    } catch (err: any) {
      Alert.alert('Błąd', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGoal = (goal: Goal) => {
    Alert.alert(
      'Usuń cel',
      `Czy na pewno chcesz usunąć cel "${goal.name}"?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal(goal.id);
            } catch (err: any) {
              Alert.alert('Błąd', err.message);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setGoalName('');
    setTargetAmount('');
    setGoalEmoji('🎯');
  };

  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{PL.myGoals}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
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
        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aktywne cele ({activeGoals.length})</Text>
            {activeGoals.map((goal) => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              return (
                <TouchableOpacity
                  key={goal.id}
                  style={styles.goalCard}
                  onPress={() => {
                    setSelectedGoal(goal);
                    setShowContributeModal(true);
                  }}
                  onLongPress={() => handleDeleteGoal(goal)}
                >
                  <View style={styles.goalHeader}>
                    <View style={styles.goalIcon}>
                      <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                    </View>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <Text style={styles.goalAmount}>
                        {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                      </Text>
                    </View>
                    <View style={styles.goalProgress}>
                      <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
                    </View>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${Math.min(progress, 100)}%` }]} />
                  </View>
                  <View style={styles.goalActions}>
                    <Text style={styles.remainingText}>
                      Pozostało: {formatCurrency(goal.target_amount - goal.current_amount)}
                    </Text>
                    <TouchableOpacity
                      style={styles.contributeButton}
                      onPress={() => {
                        setSelectedGoal(goal);
                        setShowContributeModal(true);
                      }}
                    >
                      <Ionicons name="add-circle" size={20} color={COLORS.primary} />
                      <Text style={styles.contributeText}>{PL.contribute}</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ukończone cele ({completedGoals.length})</Text>
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
                    <Text style={styles.goalAmount}>{formatCurrency(goal.target_amount)}</Text>
                  </View>
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.income} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {goals.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="flag-outline" size={80} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>Brak celów</Text>
            <Text style={styles.emptyText}>Dodaj swój pierwszy cel oszczędnościowy!</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => setShowModal(true)}>
              <Ionicons name="add" size={20} color={COLORS.white} />
              <Text style={styles.emptyButtonText}>{PL.addGoal}</Text>
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
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>{PL.goalName}</Text>
            <TextInput
              style={styles.textInput}
              value={goalName}
              onChangeText={setGoalName}
              placeholder="Np. Wakacje w Grecji"
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.inputLabel}>{PL.targetAmount}</Text>
            <TextInput
              style={styles.textInput}
              value={targetAmount}
              onChangeText={setTargetAmount}
              placeholder="5000"
              placeholderTextColor={COLORS.textLight}
              keyboardType="decimal-pad"
            />

            <Text style={styles.inputLabel}>Ikona</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiPicker}>
              {GOAL_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiOption,
                    goalEmoji === emoji && styles.emojiOptionSelected,
                  ]}
                  onPress={() => setGoalEmoji(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleCreateGoal}
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

      {/* Contribute Modal */}
      <Modal visible={showContributeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{PL.contribute}</Text>
              <TouchableOpacity onPress={() => setShowContributeModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selectedGoal && (
              <View style={styles.contributeGoalInfo}>
                <Text style={styles.contributeGoalEmoji}>{selectedGoal.emoji}</Text>
                <Text style={styles.contributeGoalName}>{selectedGoal.name}</Text>
                <Text style={styles.contributeGoalProgress}>
                  {formatCurrency(selectedGoal.current_amount)} / {formatCurrency(selectedGoal.target_amount)}
                </Text>
              </View>
            )}

            <Text style={styles.inputLabel}>{PL.amount}</Text>
            <TextInput
              style={styles.textInput}
              value={contributeAmount}
              onChangeText={setContributeAmount}
              placeholder="100"
              placeholderTextColor={COLORS.textLight}
              keyboardType="decimal-pad"
            />

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleContribute}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>{PL.contribute}</Text>
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
    padding: SPACING.md,
    paddingBottom: 100,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  goalCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  goalCardCompleted: {
    opacity: 0.7,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalIconCompleted: {
    backgroundColor: COLORS.incomeLight + '20',
  },
  goalEmoji: {
    fontSize: 24,
  },
  goalInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  goalAmount: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  goalProgress: {
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  goalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  contributeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primaryLight + '20',
  },
  contributeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  completedBadge: {
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
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
  contributeGoalInfo: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  contributeGoalEmoji: {
    fontSize: 48,
    marginBottom: SPACING.xs,
  },
  contributeGoalName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  contributeGoalProgress: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
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
