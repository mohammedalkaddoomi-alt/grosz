import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, RefreshControl, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../src/store/store';
import { Colors, Gradients, Shadows, BorderRadius, Spacing } from '../../src/constants/theme';

const WALLET_EMOJIS = ['💰', '💳', '🏦', '💵', '🪙', '💎', '🏠', '🚗', '✈️', '🎓', '👶', '🐕', '🎁', '💒', '🏖️', '🎮', '💼', '🛒', '🍔', '☕'];

export default function Wallets() {
  const { wallets, loadData, createWallet, deleteWallet, inviteToWallet, removeFromWallet, user } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  
  // Create wallet modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [walletEmoji, setWalletEmoji] = useState('💰');
  const [isShared, setIsShared] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Manage wallet modal
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatMoney = (n: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0 }).format(n);

  const handleCreateWallet = async () => {
    if (!walletName.trim()) return Alert.alert('Błąd', 'Podaj nazwę portfela');

    setCreating(true);
    try {
      await createWallet({
        name: walletName.trim(),
        emoji: walletEmoji,
        is_shared: isShared,
      });
      setShowCreateModal(false);
      setWalletName('');
      setWalletEmoji('💰');
      setIsShared(false);
      Alert.alert('Sukces! 🎉', isShared ? 'Wspólny portfel został utworzony' : 'Portfel został utworzony');
    } catch (e: any) {
      Alert.alert('Błąd', e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWallet = (wallet: any) => {
    if (wallet.owner_id !== user?.id) {
      return Alert.alert('Błąd', 'Tylko właściciel może usunąć portfel');
    }
    Alert.alert(
      'Usuń portfel',
      `Usunąć "${wallet.name}"? Wszystkie transakcje zostaną usunięte.`,
      [
        { text: 'Nie', style: 'cancel' },
        { text: 'Tak', style: 'destructive', onPress: async () => {
          try {
            await deleteWallet(wallet.id);
            Alert.alert('Sukces', 'Portfel został usunięty');
          } catch (e: any) {
            Alert.alert('Błąd', e.message);
          }
        }},
      ]
    );
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return Alert.alert('Błąd', 'Podaj email użytkownika');
    if (!selectedWallet) return;

    setInviting(true);
    try {
      await inviteToWallet(selectedWallet.id, inviteEmail.trim());
      setInviteEmail('');
      Alert.alert('Sukces! 🎉', 'Zaproszenie zostało wysłane');
      await loadData();
    } catch (e: any) {
      Alert.alert('Błąd', e.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!selectedWallet) return;
    
    Alert.alert(
      'Usuń członka',
      `Usunąć ${memberEmail} z portfela?`,
      [
        { text: 'Nie', style: 'cancel' },
        { text: 'Tak', style: 'destructive', onPress: async () => {
          try {
            await removeFromWallet(selectedWallet.id, memberId);
            Alert.alert('Sukces', 'Członek został usunięty');
            await loadData();
            // Refresh selected wallet data
            const updated = wallets.find(w => w.id === selectedWallet.id);
            if (updated) setSelectedWallet(updated);
          } catch (e: any) {
            Alert.alert('Błąd', e.message);
          }
        }},
      ]
    );
  };

  const openManageModal = (wallet: any) => {
    setSelectedWallet(wallet);
    setShowManageModal(true);
  };

  const personalWallets = wallets.filter(w => !w.is_shared);
  const sharedWallets = wallets.filter(w => w.is_shared);

  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);
  const personalBalance = personalWallets.reduce((acc, w) => acc + w.balance, 0);
  const sharedBalance = sharedWallets.reduce((acc, w) => acc + w.balance, 0);

  const renderWalletCard = (wallet: any, isSharedSection: boolean) => (
    <TouchableOpacity
      key={wallet.id}
      style={styles.walletCard}
      onPress={() => isSharedSection ? openManageModal(wallet) : null}
      onLongPress={() => handleDeleteWallet(wallet)}
      activeOpacity={0.7}
    >
      <View style={styles.walletCardContent}>
        <View style={[styles.walletIcon, isSharedSection && styles.walletIconShared]}>
          <Text style={styles.walletEmoji}>{wallet.emoji}</Text>
        </View>
        <View style={styles.walletInfo}>
          <Text style={styles.walletName} numberOfLines={1}>{wallet.name}</Text>
          <View style={styles.walletMeta}>
            {wallet.is_shared && (
              <View style={styles.sharedBadge}>
                <Ionicons name="people" size={12} color={Colors.shared} />
                <Text style={styles.sharedBadgeText}>Wspólny</Text>
              </View>
            )}
            {wallet.owner_id === user?.id && wallet.is_shared && (
              <View style={styles.ownerBadge}>
                <Text style={styles.ownerBadgeText}>Właściciel</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.walletBalance}>
          <Text style={[styles.walletBalanceAmount, wallet.balance < 0 && styles.negativeBalance]}>
            {formatMoney(wallet.balance)}
          </Text>
          {isSharedSection && (
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Portfele</Text>
          <Text style={styles.subtitle}>Zarządzaj swoimi finansami</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreateModal(true)}>
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
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.summaryCardPrimary]}>
            <Text style={styles.summaryLabel}>Łącznie</Text>
            <Text style={styles.summaryAmount}>{formatMoney(totalBalance)}</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Ionicons name="person" size={20} color={Colors.primary} />
            <Text style={styles.summaryLabelSmall}>Osobiste</Text>
            <Text style={styles.summaryAmountSmall}>{formatMoney(personalBalance)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="people" size={20} color={Colors.shared} />
            <Text style={styles.summaryLabelSmall}>Wspólne</Text>
            <Text style={styles.summaryAmountSmall}>{formatMoney(sharedBalance)}</Text>
          </View>
        </View>

        {/* Personal Wallets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="person" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Osobiste portfele</Text>
            </View>
            <Text style={styles.sectionCount}>{personalWallets.length}</Text>
          </View>
          {personalWallets.length > 0 ? (
            personalWallets.map(wallet => renderWalletCard(wallet, false))
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>Brak osobistych portfeli</Text>
            </View>
          )}
        </View>

        {/* Shared Wallets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="people" size={20} color={Colors.shared} />
              <Text style={styles.sectionTitle}>Wspólne portfele</Text>
            </View>
            <Text style={styles.sectionCount}>{sharedWallets.length}</Text>
          </View>
          {sharedWallets.length > 0 ? (
            sharedWallets.map(wallet => renderWalletCard(wallet, true))
          ) : (
            <View style={styles.emptySection}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={32} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptySectionText}>Brak wspólnych portfeli</Text>
              <Text style={styles.emptySectionSubtext}>Utwórz wspólny portfel, aby dzielić wydatki z innymi</Text>
              <TouchableOpacity 
                style={styles.createSharedBtn} 
                onPress={() => { setIsShared(true); setShowCreateModal(true); }}
              >
                <Text style={styles.createSharedBtnText}>Utwórz wspólny portfel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Wallet Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nowy portfel</Text>
              <TouchableOpacity onPress={() => { setShowCreateModal(false); setIsShared(false); }}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Nazwa portfela</Text>
            <TextInput
              style={styles.modalInput}
              value={walletName}
              onChangeText={setWalletName}
              placeholder="Np. Oszczędności"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.modalLabel}>Wybierz emoji</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll}>
              {WALLET_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.emojiBtn, walletEmoji === emoji && styles.emojiBtnSelected]}
                  onPress={() => setWalletEmoji(emoji)}
                >
                  <Text style={styles.emojiBtnText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.modalLabel}>Typ portfela</Text>
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[styles.typeOption, !isShared && styles.typeOptionActive]}
                onPress={() => setIsShared(false)}
              >
                <Ionicons name="person" size={20} color={!isShared ? Colors.white : Colors.text} />
                <Text style={[styles.typeOptionText, !isShared && styles.typeOptionTextActive]}>Osobisty</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeOption, styles.typeOptionShared, isShared && styles.typeOptionSharedActive]}
                onPress={() => setIsShared(true)}
              >
                <Ionicons name="people" size={20} color={isShared ? Colors.white : Colors.shared} />
                <Text style={[styles.typeOptionText, styles.typeOptionTextShared, isShared && styles.typeOptionTextActive]}>Wspólny</Text>
              </TouchableOpacity>
            </View>

            {isShared && (
              <View style={styles.sharedInfo}>
                <Ionicons name="information-circle" size={20} color={Colors.shared} />
                <Text style={styles.sharedInfoText}>
                  Wspólny portfel pozwala dzielić wydatki z innymi użytkownikami. Po utworzeniu możesz zaprosić innych.
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleCreateWallet} disabled={creating}>
              <LinearGradient colors={isShared ? Gradients.purple : Gradients.primary} style={styles.modalSubmitGradient}>
                <Text style={styles.modalSubmitText}>{creating ? 'Tworzę...' : 'Utwórz portfel'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Manage Wallet Modal */}
      <Modal visible={showManageModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalWalletEmoji}>{selectedWallet?.emoji}</Text>
                <Text style={styles.modalTitle}>{selectedWallet?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => { setShowManageModal(false); setSelectedWallet(null); setInviteEmail(''); }}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.walletStats}>
              <View style={styles.walletStatItem}>
                <Text style={styles.walletStatLabel}>Saldo</Text>
                <Text style={styles.walletStatValue}>{formatMoney(selectedWallet?.balance || 0)}</Text>
              </View>
              <View style={styles.walletStatItem}>
                <Text style={styles.walletStatLabel}>Członkowie</Text>
                <Text style={styles.walletStatValue}>{(selectedWallet?.members?.length || 0) + 1}</Text>
              </View>
            </View>

            {selectedWallet?.owner_id === user?.id && (
              <>
                <Text style={styles.modalLabel}>Zaproś użytkownika</Text>
                <View style={styles.inviteRow}>
                  <TextInput
                    style={styles.inviteInput}
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    placeholder="Email użytkownika"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.inviteBtn} onPress={handleInvite} disabled={inviting}>
                    <LinearGradient colors={Gradients.purple} style={styles.inviteBtnGradient}>
                      {inviting ? (
                        <Text style={styles.inviteBtnText}>...</Text>
                      ) : (
                        <Ionicons name="person-add" size={20} color={Colors.white} />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <Text style={styles.modalLabel}>Członkowie portfela</Text>
            <View style={styles.membersList}>
              {/* Owner */}
              <View style={styles.memberItem}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {selectedWallet?.owner_id === user?.id ? user?.name?.charAt(0) : '?'}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {selectedWallet?.owner_id === user?.id ? user?.name : 'Właściciel'}
                  </Text>
                  <Text style={styles.memberEmail}>
                    {selectedWallet?.owner_id === user?.id ? user?.email : ''}
                  </Text>
                </View>
                <View style={styles.ownerTag}>
                  <Text style={styles.ownerTagText}>Właściciel</Text>
                </View>
              </View>

              {/* Members */}
              {selectedWallet?.members_details?.map((member: any) => (
                <View key={member.id} style={styles.memberItem}>
                  <View style={[styles.memberAvatar, styles.memberAvatarSecondary]}>
                    <Text style={styles.memberAvatarText}>{member.name?.charAt(0) || '?'}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                  </View>
                  {selectedWallet?.owner_id === user?.id && (
                    <TouchableOpacity 
                      style={styles.removeMemberBtn}
                      onPress={() => handleRemoveMember(member.id, member.email)}
                    >
                      <Ionicons name="close-circle" size={24} color={Colors.expense} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {(!selectedWallet?.members_details || selectedWallet?.members_details?.length === 0) && (
                <View style={styles.noMembers}>
                  <Text style={styles.noMembersText}>Brak innych członków</Text>
                </View>
              )}
            </View>

            {selectedWallet?.owner_id === user?.id && (
              <TouchableOpacity 
                style={styles.deleteWalletBtn} 
                onPress={() => { setShowManageModal(false); handleDeleteWallet(selectedWallet); }}
              >
                <Ionicons name="trash-outline" size={20} color={Colors.expense} />
                <Text style={styles.deleteWalletBtnText}>Usuń portfel</Text>
              </TouchableOpacity>
            )}
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
  summaryRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  summaryCard: { 
    flex: 1, 
    backgroundColor: Colors.card, 
    borderRadius: BorderRadius.xl, 
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.small,
  },
  summaryCardPrimary: {
    backgroundColor: Colors.primary,
  },
  summaryLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  summaryAmount: { fontSize: 28, fontWeight: '800', color: Colors.white, marginTop: 4 },
  summaryLabelSmall: { fontSize: 12, color: Colors.textLight, marginTop: Spacing.sm },
  summaryAmountSmall: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 4 },
  section: { marginTop: Spacing.xxl },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: Spacing.md,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  sectionCount: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: Colors.textMuted,
    backgroundColor: Colors.backgroundDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  walletCard: { 
    backgroundColor: Colors.card, 
    borderRadius: BorderRadius.xl, 
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  walletCardContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: Spacing.lg,
  },
  walletIcon: { 
    width: 52, 
    height: 52, 
    borderRadius: BorderRadius.lg, 
    backgroundColor: Colors.primary + '15', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  walletIconShared: { backgroundColor: Colors.sharedLight },
  walletEmoji: { fontSize: 24 },
  walletInfo: { flex: 1, marginLeft: Spacing.md },
  walletName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  walletMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  sharedBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4,
    backgroundColor: Colors.sharedLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  sharedBadgeText: { fontSize: 11, color: Colors.shared, fontWeight: '600' },
  ownerBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  ownerBadgeText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  walletBalance: { alignItems: 'flex-end', flexDirection: 'row', gap: Spacing.sm },
  walletBalanceAmount: { fontSize: 18, fontWeight: '700', color: Colors.text },
  negativeBalance: { color: Colors.expense },
  emptySection: { 
    backgroundColor: Colors.card, 
    borderRadius: BorderRadius.xl, 
    padding: Spacing.xxl,
    alignItems: 'center',
    ...Shadows.small,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptySectionText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  emptySectionSubtext: { fontSize: 14, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
  createSharedBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.sharedLight,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  createSharedBtnText: { fontSize: 14, fontWeight: '600', color: Colors.shared },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: Colors.card, 
    borderTopLeftRadius: BorderRadius.xxl, 
    borderTopRightRadius: BorderRadius.xxl, 
    padding: Spacing.xxl, 
    maxHeight: '85%',
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: Spacing.xl,
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  modalWalletEmoji: { fontSize: 28 },
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
  emojiScroll: { marginBottom: Spacing.sm },
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
  typeToggle: { flexDirection: 'row', gap: Spacing.md },
  typeOption: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background, 
    paddingVertical: Spacing.lg, 
    borderRadius: BorderRadius.md,
  },
  typeOptionActive: { backgroundColor: Colors.primary },
  typeOptionShared: {},
  typeOptionSharedActive: { backgroundColor: Colors.shared },
  typeOptionText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  typeOptionTextShared: { color: Colors.shared },
  typeOptionTextActive: { color: Colors.white },
  sharedInfo: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: Spacing.sm, 
    backgroundColor: Colors.sharedLight, 
    padding: Spacing.md, 
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  sharedInfoText: { flex: 1, fontSize: 13, color: Colors.shared, lineHeight: 18 },
  modalSubmitBtn: { borderRadius: BorderRadius.md, overflow: 'hidden', marginTop: Spacing.xl },
  modalSubmitGradient: { height: 52, justifyContent: 'center', alignItems: 'center' },
  modalSubmitText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  
  // Manage modal
  walletStats: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  walletStatItem: { 
    flex: 1, 
    backgroundColor: Colors.background, 
    padding: Spacing.lg, 
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  walletStatLabel: { fontSize: 12, color: Colors.textLight },
  walletStatValue: { fontSize: 20, fontWeight: '700', color: Colors.text, marginTop: 4 },
  inviteRow: { flexDirection: 'row', gap: Spacing.sm },
  inviteInput: { 
    flex: 1, 
    backgroundColor: Colors.background, 
    borderRadius: BorderRadius.md, 
    paddingHorizontal: Spacing.lg, 
    height: 52, 
    fontSize: 16, 
    color: Colors.text,
  },
  inviteBtn: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  inviteBtnGradient: { width: 52, height: 52, justifyContent: 'center', alignItems: 'center' },
  inviteBtnText: { fontSize: 16, color: Colors.white },
  membersList: { backgroundColor: Colors.background, borderRadius: BorderRadius.md, overflow: 'hidden' },
  memberItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  memberAvatar: { 
    width: 44, 
    height: 44, 
    borderRadius: BorderRadius.full, 
    backgroundColor: Colors.primary, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  memberAvatarSecondary: { backgroundColor: Colors.shared },
  memberAvatarText: { fontSize: 18, fontWeight: '700', color: Colors.white },
  memberInfo: { flex: 1, marginLeft: Spacing.md },
  memberName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  memberEmail: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  ownerTag: { 
    backgroundColor: Colors.primary + '15', 
    paddingHorizontal: Spacing.sm, 
    paddingVertical: 4, 
    borderRadius: BorderRadius.full,
  },
  ownerTagText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  removeMemberBtn: { padding: Spacing.xs },
  noMembers: { padding: Spacing.lg, alignItems: 'center' },
  noMembersText: { fontSize: 14, color: Colors.textMuted },
  deleteWalletBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.expenseLight,
    borderRadius: BorderRadius.md,
  },
  deleteWalletBtnText: { fontSize: 15, fontWeight: '600', color: Colors.expense },
});
