import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, RefreshControl, Image } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../src/store/store';
import { db } from '../../src/services/database';
import { Colors, Gradients, Shadows, BorderRadius, Spacing } from '../../src/constants/theme';
import { Goal, GoalActivity } from '../../src/types';
import { useDrawer } from '../../src/contexts/DrawerContext';
import { WallpaperBackground } from '../../src/components/WallpaperBackground';

const GOAL_EMOJIS = ['🎯', '🏠', '🚗', '✈️', '💻', '📱', '🎓', '💍', '🏖️', '🎸', '🎮', '📷', '👶', '🐕', '💪', '🏋️', '🚀', '💎', '🎁', '🏦'];

export default function Goals() {
  const { colors, settings, fontFamily, scaleFont } = useTheme();
  const { openDrawer } = useDrawer();
  const styles = useMemo(() => getStyles(colors, fontFamily, scaleFont), [colors, fontFamily, scaleFont]);
  const { user, goals, activeWallet, loadGoals, addGoal, contributeToGoal, deleteGoal } = useStore();
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
  const [goalActivities, setGoalActivities] = useState<GoalActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    void loadGoals();
  }, [activeWallet?.id, loadGoals]);

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
    const amount = parseFloat(contributeAmount);
    if (!contributeAmount || !Number.isFinite(amount) || amount <= 0) return Alert.alert('Błąd', 'Podaj kwotę');
    if (!selectedGoal) return;

    const remaining = Math.max((selectedGoal.target_amount || 0) - (selectedGoal.current_amount || 0), 0);
    if (remaining <= 0) {
      Alert.alert('Info', 'Ten cel jest już ukończony');
      return;
    }

    const effectiveAmount = Math.min(amount, remaining);
    setContributing(true);
    try {
      await contributeToGoal(selectedGoal.id, effectiveAmount);
      setShowContributeModal(false);
      setContributeAmount('');
      setSelectedGoal(null);

      if (effectiveAmount < amount) {
        Alert.alert('Świetnie! 💪', `Dodano ${formatMoney(effectiveAmount)}. Cel został domknięty.`);
      } else if (effectiveAmount === remaining) {
        Alert.alert('Gratulacje! 🎉', 'Cel został osiągnięty.');
      } else {
        Alert.alert('Świetnie! 💪', 'Wpłata została dodana');
      }
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
        {
          text: 'Tak',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal(goal.id);
            } catch (error: any) {
              Alert.alert('Błąd', error?.message || 'Nie udało się usunąć celu');
            }
          },
        },
      ]
    );
  };

  const openContributeModal = (goal: any) => {
    setSelectedGoal(goal);
    setGoalActivities([]);
    setShowContributeModal(true);
    setLoadingActivities(true);
    db.getGoalActivities(goal.id, 15)
      .then((activities) => setGoalActivities(activities))
      .catch((error) => {
        console.error('Failed to load goal activities:', error);
        setGoalActivities([]);
      })
      .finally(() => setLoadingActivities(false));
  };

  const activeGoals = (goals || []).filter((g: any) => !g.completed);
  const completedGoals = (goals || []).filter((g: any) => g.completed);
  const totalSaved = goals.reduce((acc: number, g: Goal) => acc + g.current_amount, 0);
  const totalTarget = goals.reduce((acc: number, g: Goal) => acc + g.target_amount, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Wallpaper Background */}
      {settings.wallpaper && <WallpaperBackground wallpaper={settings.wallpaper} />}
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openDrawer} style={styles.hamburger} activeOpacity={0.7}>
          <Ionicons name="menu-outline" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Cele oszczędnościowe</Text>
          <Text style={styles.subtitle}>
            {activeWallet?.is_shared
              ? `Wspólne cele: ${activeWallet.name}`
              : 'Osiągaj swoje marzenia 🌟'}
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowNewGoalModal(true)}>
          <LinearGradient colors={Gradients.primary} style={styles.addBtnGradient}>
            <Ionicons name="add" size={24} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
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
            {activeGoals.map((goal: Goal) => {
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
                    {!!goal.user_name && (
                      <View style={styles.goalMetaBadge}>
                        <Ionicons name="person-outline" size={12} color={colors.textMuted} />
                        <Text style={styles.goalMetaText}>
                          {goal.user_id === user?.id ? 'Ty' : goal.user_name}
                        </Text>
                      </View>
                    )}
                    <View style={styles.contributeBtn}>
                      <Ionicons name="add-circle" size={18} color={colors.primary} />
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
            {completedGoals.map((goal: Goal) => (
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
                    {!!goal.user_name && (
                      <Text style={styles.completedMetaText}>
                        Autor: {goal.user_id === user?.id ? 'Ty' : goal.user_name}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="checkmark-circle" size={28} color={colors.income} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {goals.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="flag" size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Brak celów</Text>
            <Text style={styles.emptyText}>Stwórz swój pierwszy cel oszczędnościowy i zacznij realizować marzenia!</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowNewGoalModal(true)}>
              <LinearGradient colors={Gradients.primary} style={styles.emptyBtnGradient}>
                <Ionicons name="add" size={20} color={colors.white} />
                <Text style={styles.emptyBtnText}>Nowy cel</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* New Goal Modal */}
      <Modal visible={showNewGoalModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nowy cel 🎯</Text>
              <TouchableOpacity onPress={() => setShowNewGoalModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Nazwa celu</Text>
            <TextInput
              style={styles.modalInput}
              value={goalName}
              onChangeText={setGoalName}
              placeholder="Np. Wakacje w Grecji"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.modalLabel}>Kwota docelowa (zł)</Text>
            <TextInput
              style={styles.modalInput}
              value={goalAmount}
              onChangeText={setGoalAmount}
              placeholder="5000"
              placeholderTextColor={colors.textMuted}
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
                <Ionicons name="close" size={24} color={colors.text} />
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
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />

            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleContribute} disabled={contributing}>
              <LinearGradient colors={Gradients.income} style={styles.modalSubmitGradient}>
                <Text style={styles.modalSubmitText}>{contributing ? 'Wpłacam...' : 'Wpłać'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.modalLabel}>Aktywność celu</Text>
            <View style={styles.activitiesList}>
              {loadingActivities ? (
                <Text style={styles.activitiesEmptyText}>Ładowanie aktywności...</Text>
              ) : goalActivities.length === 0 ? (
                <Text style={styles.activitiesEmptyText}>Brak aktywności</Text>
              ) : (
                goalActivities.map((activity) => (
                  <View key={activity.id} style={styles.activityItem}>
                    <View style={styles.activityIconWrap}>
                      <Ionicons
                        name={activity.action === 'created' ? 'flag-outline' : 'add-circle-outline'}
                        size={16}
                        color={activity.action === 'created' ? colors.primary : colors.income}
                      />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityText}>
                        {activity.action === 'created'
                          ? `${activity.user_name || 'Użytkownik'} utworzył cel`
                          : `${activity.user_name || 'Użytkownik'} wpłacił ${formatMoney(activity.amount || 0)}`}
                      </Text>
                      <Text style={styles.activityDate}>
                        {new Date(activity.created_at).toLocaleString('pl-PL')}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, fontFamily: string | undefined, scaleFont: (size: number) => number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  wallpaper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  title: { fontSize: scaleFont(24), fontWeight: '800', color: colors.text, letterSpacing: -0.8, fontFamily },
  hamburger: { width: 44, height: 44, alignItems: 'center' as const, justifyContent: 'center' as const, borderRadius: 12, marginRight: Spacing.sm },
  subtitle: { fontSize: scaleFont(15), color: colors.textLight, marginTop: 6, fontWeight: '500', fontFamily },
  addBtn: { borderRadius: BorderRadius.md, overflow: 'hidden', ...Shadows.medium },
  addBtnGradient: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: Spacing.xl },
  summaryCard: {
    padding: Spacing.xxl + 4,
    borderRadius: 28,
    marginBottom: Spacing.xl,
    ...Shadows.premium,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.3)' },
  summaryLabel: { fontSize: scaleFont(13), color: 'rgba(255,255,255,0.8)', fontFamily },
  summaryAmount: { fontSize: scaleFont(24), fontWeight: '800', color: colors.white, marginTop: 6, letterSpacing: -0.8, fontFamily },
  overallProgress: { marginTop: Spacing.xl },
  overallProgressBar: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  overallProgressFill: { height: '100%', backgroundColor: colors.white, borderRadius: BorderRadius.full },
  overallProgressText: { fontSize: scaleFont(13), color: 'rgba(255,255,255,0.9)', marginTop: Spacing.sm, textAlign: 'center', fontFamily },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: scaleFont(19), fontWeight: '800', color: colors.text, marginBottom: Spacing.md, letterSpacing: -0.5, fontFamily },
  goalCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: Spacing.lg + 2,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  goalCardCompleted: { opacity: 0.8 },
  goalHeader: { flexDirection: 'row', alignItems: 'center' },
  goalIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalIconCompleted: { backgroundColor: colors.incomeLight },
  goalEmoji: { fontSize: scaleFont(26) },
  goalInfo: { flex: 1, marginLeft: Spacing.md },
  goalName: { fontSize: scaleFont(18), fontWeight: '700', color: colors.text, letterSpacing: -0.4, fontFamily },
  goalAmounts: { fontSize: scaleFont(14), color: colors.textLight, marginTop: 4, fontFamily },
  goalAmountsCompleted: { fontSize: scaleFont(14), color: colors.income, marginTop: 4, fontWeight: '600', fontFamily },
  goalPercent: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  goalPercentText: { fontSize: scaleFont(14), fontWeight: '700', color: colors.primary, fontFamily },
  progressBar: {
    height: 8,
    backgroundColor: colors.backgroundDark,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: BorderRadius.full },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
  goalRemaining: { fontSize: scaleFont(13), color: colors.textLight, fontFamily },
  goalMetaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  goalMetaText: { fontSize: scaleFont(11), color: colors.textMuted, fontWeight: '600', fontFamily },
  contributeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  contributeBtnText: { fontSize: scaleFont(14), fontWeight: '600', color: colors.primary, fontFamily },
  completedMetaText: { fontSize: scaleFont(12), color: colors.textMuted, marginTop: 2, fontFamily },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl * 2,
    paddingHorizontal: Spacing.xxl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: { fontSize: scaleFont(22), fontWeight: '700', color: colors.text, fontFamily },
  emptyText: { fontSize: scaleFont(15), color: colors.textLight, marginTop: Spacing.sm, textAlign: 'center', lineHeight: scaleFont(22), fontFamily },
  emptyBtn: { marginTop: Spacing.xl, borderRadius: BorderRadius.full, overflow: 'hidden', ...Shadows.medium },
  emptyBtnGradient: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md },
  emptyBtnText: { fontSize: scaleFont(16), fontWeight: '600', color: colors.white, fontFamily },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  modalGoalEmoji: { fontSize: scaleFont(28) },
  modalTitle: { fontSize: scaleFont(22), fontWeight: '700', color: colors.text, fontFamily },
  modalLabel: { fontSize: scaleFont(14), fontWeight: '600', color: colors.textLight, marginBottom: Spacing.sm, marginTop: Spacing.lg, fontFamily },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    height: 52,
    fontSize: scaleFont(16),
    color: colors.text,
    fontFamily,
  },
  emojiScroll: { marginBottom: Spacing.md },
  emojiBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  emojiBtnSelected: { backgroundColor: colors.primary + '20', borderWidth: 2, borderColor: colors.primary },
  emojiBtnText: { fontSize: scaleFont(24) },
  goalStats: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  goalStatItem: {
    flex: 1,
    backgroundColor: colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  goalStatLabel: { fontSize: scaleFont(12), color: colors.textLight, fontFamily },
  goalStatValue: { fontSize: scaleFont(16), fontWeight: '700', color: colors.text, marginTop: 4, fontFamily },
  goalStatRemaining: { color: colors.primary },
  activitiesList: {
    marginTop: Spacing.sm,
    backgroundColor: colors.background,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    maxHeight: 220,
  },
  activitiesEmptyText: {
    fontSize: scaleFont(13),
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.md,
    fontFamily,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  activityIconWrap: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: { flex: 1 },
  activityText: { fontSize: scaleFont(13), color: colors.text, fontWeight: '600', fontFamily },
  activityDate: { fontSize: scaleFont(11), color: colors.textMuted, marginTop: 2, fontFamily },
  modalSubmitBtn: { borderRadius: BorderRadius.md, overflow: 'hidden', marginTop: Spacing.xl },
  modalSubmitGradient: { height: 52, justifyContent: 'center', alignItems: 'center' },
  modalSubmitText: { fontSize: scaleFont(16), fontWeight: '700', color: colors.white, fontFamily },
});
