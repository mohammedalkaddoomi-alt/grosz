import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, RefreshControl, Image } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/store';
import { Colors, Gradients, Shadows, BorderRadius, Spacing, Typography } from '../../src/constants/theme';
import { Wallet } from '../../src/types';
import { AnimatedCard, AnimatedButton } from '../../src/components/AnimatedComponents';
import { WorkCalculatorModal } from '../../src/components/WorkCalculatorModal';
import { WageSettingsModal } from '../../src/components/WageSettingsModal';
import { useDrawer } from '../../src/contexts/DrawerContext';
import { WallpaperBackground } from '../../src/components/WallpaperBackground';
import { supabase } from '../../src/services/supabase';

const WALLET_EMOJIS = ['💰', '💳', '🏦', '💵', '🪙', '💎', '🏠', '🚗', '✈️', '🎓', '👶', '🐕', '🎁', '💒', '🏖️', '🎮', '💼', '🛒', '🍔', '☕'];

export default function Wallets() {
  const { colors, settings } = useTheme();
  const { openDrawer } = useDrawer();
  const router = useRouter();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const {
    wallets,
    activeWallet,
    setActiveWallet,
    loadData,
    createWallet,
    deleteWallet,
    inviteToWallet,
    removeFromWallet,
    leaveWallet,
    walletInvitations,
    loadWalletInvitations,
    acceptWalletInvitation,
    rejectWalletInvitation,
    user,
    transactions,
    wageSettings,
    saveWageSettings,
    calculateWorkTime
  } = useStore();
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
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviting, setInviting] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Work calculator modals
  const [showCalculator, setShowCalculator] = useState(false);
  const [showWageSettings, setShowWageSettings] = useState(false);

  useEffect(() => {
    void Promise.all([loadData(), loadWalletInvitations()]);
  }, [loadData, loadWalletInvitations]);

  useEffect(() => {
    if (!showManageModal || !selectedWallet?.id) return;
    const refreshedWallet = wallets.find((w: Wallet) => w.id === selectedWallet.id);
    if (refreshedWallet) {
      setSelectedWallet(refreshedWallet);
    }
  }, [wallets, showManageModal, selectedWallet?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), loadWalletInvitations()]);
    setRefreshing(false);
  };

  // ===== REAL-TIME: Subscribe to transaction/member changes on shared wallets =====
  const sharedWalletIdKey = useMemo(
    () => wallets.filter((w: Wallet) => w.is_shared).map((w: Wallet) => w.id).join(','),
    [wallets]
  );

  useEffect(() => {
    if (!sharedWalletIdKey) return;
    const sharedWalletIds = sharedWalletIdKey.split(',');

    const channel = supabase.channel('shared-wallets-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `wallet_id=in.(${sharedWalletIds.join(',')})`,
      }, () => {
        loadData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wallet_members',
        filter: `wallet_id=in.(${sharedWalletIds.join(',')})`,
      }, () => {
        loadData();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'wallet_invitations',
      }, () => {
        loadWalletInvitations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sharedWalletIdKey]);

  // Get transactions for the selected shared wallet
  const selectedWalletTransactions = useMemo(() => {
    if (!selectedWallet?.is_shared) return [];
    return (transactions || [])
      .filter((t: any) => t.wallet_id === selectedWallet?.id)
      .slice(0, 10);
  }, [selectedWallet?.id, selectedWallet?.is_shared, transactions]);

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
        {
          text: 'Tak', style: 'destructive', onPress: async () => {
            try {
              await deleteWallet(wallet.id);
              Alert.alert('Sukces', 'Portfel został usunięty');
            } catch (e: any) {
              Alert.alert('Błąd', e.message);
            }
          }
        },
      ]
    );
  };

  const handleInvite = async () => {
    const normalizedUsername = inviteUsername.trim().toLowerCase().replace(/^@/, '');
    if (!normalizedUsername) return Alert.alert('Błąd', 'Podaj nazwę użytkownika');
    if (!/^[a-z0-9._]{3,30}$/.test(normalizedUsername)) {
      return Alert.alert('Błąd', 'Nazwa użytkownika musi mieć 3-30 znaków: litery, cyfry, kropka lub podkreślenie');
    }
    if (!selectedWallet) return;
    if (normalizedUsername === (user?.username || '').toLowerCase()) {
      return Alert.alert('Błąd', 'Nie możesz zaprosić samego siebie');
    }

    setInviting(true);
    try {
      await inviteToWallet(selectedWallet.id, normalizedUsername);
      setInviteUsername('');
      Alert.alert('Sukces! 🎉', `Zaproszenie wysłane do @${normalizedUsername}. Użytkownik musi je zaakceptować.`);
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
        {
          text: 'Tak', style: 'destructive', onPress: async () => {
            try {
              await removeFromWallet(selectedWallet.id, memberId);
              Alert.alert('Sukces', 'Członek został usunięty');
              await loadData();
              const updated = useStore.getState().wallets.find((w: any) => w.id === selectedWallet.id);
              if (updated) {
                setSelectedWallet(updated);
              }
            } catch (e: any) {
              Alert.alert('Błąd', e.message);
            }
          }
        },
      ]
    );
  };

  const handleLeaveWallet = () => {
    if (!selectedWallet || selectedWallet.owner_id === user?.id) return;
    Alert.alert(
      'Opuścić portfel?',
      `Czy na pewno chcesz opuścić "${selectedWallet.name}"?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Opuść',
          style: 'destructive',
          onPress: async () => {
            setLeaving(true);
            try {
              await leaveWallet(selectedWallet.id);
              setShowManageModal(false);
              setSelectedWallet(null);
              setInviteUsername('');
              Alert.alert('Gotowe', 'Opuściłeś wspólny portfel');
              await loadData();
            } catch (e: any) {
              Alert.alert('Błąd', e?.message || 'Nie udało się opuścić portfela');
            } finally {
              setLeaving(false);
            }
          },
        },
      ],
    );
  };

  const openManageModal = (wallet: any) => {
    const latestWallet = wallets.find((w: Wallet) => w.id === wallet.id) || wallet;
    setSelectedWallet(latestWallet);
    setShowManageModal(true);
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await acceptWalletInvitation(invitationId);
      Alert.alert('Sukces', 'Dołączyłeś do wspólnego portfela');
    } catch (error: any) {
      Alert.alert('Błąd', error?.message || 'Nie udało się zaakceptować zaproszenia');
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    try {
      await rejectWalletInvitation(invitationId);
      Alert.alert('Gotowe', 'Zaproszenie zostało odrzucone');
    } catch (error: any) {
      Alert.alert('Błąd', error?.message || 'Nie udało się odrzucić zaproszenia');
    }
  };

  const personalWallets = wallets.filter((w: Wallet) => !w.is_shared);
  const sharedWallets = wallets.filter((w: Wallet) => w.is_shared);

  const totalBalance = wallets.reduce((acc: number, w: Wallet) => acc + w.balance, 0);
  const personalBalance = personalWallets.reduce((acc: number, w: Wallet) => acc + w.balance, 0);
  const sharedBalance = sharedWallets.reduce((acc: number, w: Wallet) => acc + w.balance, 0);

  const renderWalletCard = (wallet: any, isSharedSection: boolean, index: number = 0) => (
    <AnimatedCard key={wallet.id} entrance="slideLeft" delay={100 + index * 40}>
      <TouchableOpacity
        style={[styles.walletCard, activeWallet?.id === wallet.id && styles.walletCardActive]}
        onPress={() => {
          setActiveWallet(wallet);
          if (isSharedSection) {
            openManageModal(wallet);
          }
        }}
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
                  <Ionicons name="people" size={12} color={colors.shared} />
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
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </AnimatedCard>
  );

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
          <Text style={styles.title}>Portfele</Text>
          <Text style={styles.subtitle}>Zarządzaj swoimi finansami</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreateModal(true)}>
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
        {/* Summary Cards */}
        <AnimatedCard entrance="slideRight" delay={50}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.summaryCardPrimary]}>
              <Text style={styles.summaryLabel}>Łącznie</Text>
              <Text style={styles.summaryAmount}>{formatMoney(totalBalance)}</Text>
            </View>
          </View>
        </AnimatedCard>
        <AnimatedCard entrance="slideRight" delay={150}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Ionicons name="person" size={20} color={colors.primary} />
              <Text style={styles.summaryLabelSmall}>Osobiste</Text>
              <Text style={styles.summaryAmountSmall}>{formatMoney(personalBalance)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Ionicons name="people" size={20} color={colors.shared} />
              <Text style={styles.summaryLabelSmall}>Wspólne</Text>
              <Text style={styles.summaryAmountSmall}>{formatMoney(sharedBalance)}</Text>
            </View>
          </View>
        </AnimatedCard>

        {/* Incoming Invitations */}
        {walletInvitations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="mail-unread" size={20} color={colors.warning} />
                <Text style={styles.sectionTitle}>Zaproszenia do portfeli</Text>
              </View>
              <Text style={styles.sectionCount}>{walletInvitations.length}</Text>
            </View>
            {walletInvitations.map((invitation: any) => (
              <View key={invitation.id} style={styles.inviteCard}>
                <View style={styles.inviteTop}>
                  <View style={styles.inviteWalletIcon}>
                    <Text style={styles.inviteWalletEmoji}>{invitation.wallet?.emoji || '💼'}</Text>
                  </View>
                  <View style={styles.inviteInfo}>
                    <Text style={styles.inviteWalletName}>{invitation.wallet?.name || 'Wspólny portfel'}</Text>
                    <Text style={styles.inviteMeta}>
                      Zaprasza: @{invitation.inviter?.username || invitation.inviter?.name || 'użytkownik'}
                    </Text>
                  </View>
                </View>
                <View style={styles.inviteActions}>
                  <TouchableOpacity style={styles.inviteRejectBtn} onPress={() => handleRejectInvitation(invitation.id)}>
                    <Text style={styles.inviteRejectText}>Odrzuć</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.inviteAcceptBtn} onPress={() => handleAcceptInvitation(invitation.id)}>
                    <Text style={styles.inviteAcceptText}>Akceptuj</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Personal Wallets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="person" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Osobiste portfele</Text>
            </View>
            <Text style={styles.sectionCount}>{personalWallets.length}</Text>
          </View>
          {personalWallets.length > 0 ? (
            personalWallets.map((wallet: any, index: number) => renderWalletCard(wallet, false, index))
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
              <Ionicons name="people" size={20} color={colors.shared} />
              <Text style={styles.sectionTitle}>Wspólne portfele</Text>
            </View>
            <Text style={styles.sectionCount}>{sharedWallets.length}</Text>
          </View>
          {sharedWallets.length > 0 ? (
            sharedWallets.map((wallet: any, index: number) => renderWalletCard(wallet, true, index))
          ) : (
            <View style={styles.emptySection}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={32} color={colors.textMuted} />
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

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Create Wallet Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nowy portfel</Text>
              <TouchableOpacity onPress={() => { setShowCreateModal(false); setIsShared(false); }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Nazwa portfela</Text>
            <TextInput
              style={styles.modalInput}
              value={walletName}
              onChangeText={setWalletName}
              placeholder="Np. Oszczędności"
              placeholderTextColor={colors.textMuted}
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
                <Ionicons name="person" size={20} color={!isShared ? colors.white : colors.text} />
                <Text style={[styles.typeOptionText, !isShared && styles.typeOptionTextActive]}>Osobisty</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeOption, styles.typeOptionShared, isShared && styles.typeOptionSharedActive]}
                onPress={() => setIsShared(true)}
              >
                <Ionicons name="people" size={20} color={isShared ? colors.white : colors.shared} />
                <Text style={[styles.typeOptionText, styles.typeOptionTextShared, isShared && styles.typeOptionTextActive]}>Wspólny</Text>
              </TouchableOpacity>
            </View>

            {isShared && (
              <View style={styles.sharedInfo}>
                <Ionicons name="information-circle" size={20} color={colors.shared} />
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
              <TouchableOpacity onPress={() => { setShowManageModal(false); setSelectedWallet(null); setInviteUsername(''); }}>
                <Ionicons name="close" size={24} color={colors.text} />
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

            {/* Quick Add Transaction Button */}
            <TouchableOpacity
              style={styles.quickAddBtn}
              onPress={() => {
                setActiveWallet(selectedWallet);
                setShowManageModal(false);
                router.push('/(tabs)/add');
              }}
            >
              <LinearGradient colors={Gradients.primary} style={styles.quickAddGradient}>
                <Ionicons name="add-circle" size={22} color={Colors.white} />
                <Text style={styles.quickAddText}>Dodaj transakcję</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Work Calculator Button for Shared Wallet */}
            <TouchableOpacity
              style={styles.calculatorBtn}
              onPress={() => {
                setShowManageModal(false);
                setShowCalculator(true);
              }}
            >
              <LinearGradient colors={Gradients.blue} style={styles.calculatorBtnGradient}>
                <Ionicons name="calculator" size={20} color={colors.white} />
                <Text style={styles.calculatorBtnText}>Ile godzin? ⏱️</Text>
              </LinearGradient>
            </TouchableOpacity>

            {selectedWallet?.owner_id === user?.id && (
              <>
                <View style={styles.inviteLabelRow}>
                  <Text style={[styles.modalLabel, { marginBottom: 0 }]}>Zaproś użytkownika</Text>
                  <TouchableOpacity
                    style={styles.copyLinkBtn}
                    onPress={() => Alert.alert('Skopiowano link', `Skopiowano link zaproszenia do portfela "${selectedWallet?.name}".`)}
                  >
                    <Ionicons name="link" size={16} color={colors.primary} />
                    <Text style={styles.copyLinkText}>Kopiuj link</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inviteRow}>
                  <TextInput
                    style={styles.inviteInput}
                    value={inviteUsername}
                    onChangeText={setInviteUsername}
                    placeholder="Nazwa użytkownika, np. adam_nowak"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.inviteBtn} onPress={handleInvite} disabled={inviting}>
                    <LinearGradient colors={Gradients.purple} style={styles.inviteBtnGradient}>
                      {inviting ? (
                        <Text style={styles.inviteBtnText}>...</Text>
                      ) : (
                        <Ionicons name="person-add" size={20} color={colors.white} />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.qrCodeBtn}
                  onPress={() => Alert.alert('Kod QR', 'W przyszłości pokażemy tutaj kod QR do szybkiego zapraszania!')}
                >
                  <Ionicons name="qr-code-outline" size={20} color={colors.textLight} />
                  <Text style={styles.qrCodeText}>Pokaż kod QR</Text>
                </TouchableOpacity>
              </>
            )}

            <Text style={styles.modalLabel}>Członkowie portfela</Text>
            <View style={styles.membersList}>
              {/* Owner */}
              <View style={styles.memberItem}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {selectedWallet?.owner_id === user?.id
                      ? (user?.name?.charAt(0) || '?')
                      : (selectedWallet?.owner_details?.name?.charAt(0) || '?')}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {selectedWallet?.owner_id === user?.id
                      ? user?.name
                      : (selectedWallet?.owner_details?.name || 'Właściciel')}
                  </Text>
                  <Text style={styles.memberEmail}>
                    {selectedWallet?.owner_id === user?.id
                      ? user?.email
                      : (selectedWallet?.owner_details?.email || '')}
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
                      <Ionicons name="close-circle" size={24} color={colors.expense} />
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
                <Ionicons name="trash-outline" size={20} color={colors.expense} />
                <Text style={styles.deleteWalletBtnText}>Usuń portfel</Text>
              </TouchableOpacity>
            )}

            {/* Recent Transactions with Attribution */}
            {selectedWallet?.is_shared && (
              <>
                <Text style={styles.modalLabel}>Ostatnie transakcje</Text>
                <View style={styles.membersList}>
                  {selectedWalletTransactions.length > 0 ? (
                    selectedWalletTransactions.map((tx: any) => (
                      <View key={tx.id} style={styles.memberItem}>
                        <View style={[
                          styles.txTypeIcon,
                          { backgroundColor: tx.type === 'income' ? colors.incomeLight : colors.expenseLight }
                        ]}>
                          <Text style={{ fontSize: 16 }}>{tx.emoji || (tx.type === 'income' ? '➕' : '➖')}</Text>
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName} numberOfLines={1}>
                            {tx.category || tx.note || (tx.type === 'income' ? 'Przychód' : 'Wydatek')}
                          </Text>
                          <Text style={styles.memberEmail}>
                            {tx.user_name || 'Nieznany'} • {new Date(tx.created_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                          </Text>
                        </View>
                        <Text style={[
                          styles.walletBalanceAmount,
                          { fontSize: 15, color: tx.type === 'income' ? colors.income : colors.expense }
                        ]}>
                          {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.noMembers}>
                      <Text style={styles.noMembersText}>Brak transakcji</Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {selectedWallet?.owner_id !== user?.id && (
              <TouchableOpacity
                style={[styles.deleteWalletBtn, styles.leaveWalletBtn]}
                onPress={handleLeaveWallet}
                disabled={leaving}
              >
                <Ionicons name="exit-outline" size={20} color={colors.warning} />
                <Text style={styles.leaveWalletBtnText}>
                  {leaving ? 'Opuszczanie...' : 'Opuść portfel'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Work Calculator Modal */}
      <WorkCalculatorModal
        visible={showCalculator}
        onClose={() => setShowCalculator(false)}
        wageSettings={wageSettings}
        onOpenSettings={() => {
          setShowCalculator(false);
          setShowWageSettings(true);
        }}
        calculateWorkTime={calculateWorkTime}
        sharedWalletMembers={selectedWallet?.members_details?.map((m: any) => ({
          id: m.id,
          name: m.name,
          wageSettings: null, // TODO: Load member wage settings
        }))}
      />

      {/* Wage Settings Modal */}
      <WageSettingsModal
        visible={showWageSettings}
        onClose={() => setShowWageSettings(false)}
        onSave={async (settings) => {
          await saveWageSettings(settings);
          setShowWageSettings(false);
          setShowCalculator(true);
        }}
        initialSettings={wageSettings}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  wallpaper: { ...StyleSheet.absoluteFillObject },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  title: { ...Typography.h1, color: colors.text, fontSize: 24 },
  hamburger: { width: 44, height: 44, alignItems: 'center' as const, justifyContent: 'center' as const, borderRadius: 12, marginRight: Spacing.sm },
  subtitle: { ...Typography.caption, color: colors.textLight, marginTop: 4 },
  addBtn: { borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadows.medium },
  addBtnGradient: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: Spacing.xl },

  summaryRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.small,
  },
  summaryCardPrimary: {
    backgroundColor: Colors.primary,
    ...Shadows.medium,
  },
  summaryLabel: { ...Typography.small, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  summaryAmount: { ...Typography.h2, color: colors.white, marginTop: 4 },
  summaryLabelSmall: { ...Typography.small, color: colors.textLight, marginTop: Spacing.sm },
  summaryAmountSmall: { ...Typography.bodyBold, color: colors.text, marginTop: 2 },

  section: { marginTop: Spacing.xl, marginBottom: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle: { ...Typography.h3, color: colors.text },
  sectionCount: {
    ...Typography.small,
    color: colors.textMuted,
    backgroundColor: colors.backgroundDark,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  inviteCard: {
    backgroundColor: colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  inviteTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  inviteWalletIcon: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteWalletEmoji: {
    fontSize: 20,
  },
  inviteInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  inviteWalletName: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  inviteMeta: {
    ...Typography.caption,
    color: colors.textLight,
    marginTop: 2,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  inviteRejectBtn: {
    flex: 1,
    backgroundColor: colors.expenseLight,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  inviteRejectText: {
    ...Typography.bodyBold,
    color: colors.expense,
  },
  inviteAcceptBtn: {
    flex: 1,
    backgroundColor: colors.income,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  inviteAcceptText: {
    ...Typography.bodyBold,
    color: colors.white,
  },

  walletCard: {
    backgroundColor: colors.card,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  walletCardActive: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  walletCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.incomeLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletIconShared: { backgroundColor: Colors.sharedLight },
  walletEmoji: { fontSize: 24 },
  walletInfo: { flex: 1, marginLeft: Spacing.lg },
  walletName: { ...Typography.bodyBold, color: colors.text },
  walletMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.sharedLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  sharedBadgeText: { fontSize: 10, color: Colors.shared, fontWeight: '700' },
  ownerBadge: {
    backgroundColor: Colors.incomeLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  ownerBadgeText: { fontSize: 10, color: Colors.income, fontWeight: '700' },
  walletBalance: { alignItems: 'flex-end', flexDirection: 'row', gap: Spacing.sm },
  walletBalanceAmount: { ...Typography.bodyBold, fontSize: 18, color: colors.text },
  negativeBalance: { color: Colors.error },

  emptySection: {
    backgroundColor: colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxxxl,
    alignItems: 'center',
    ...Shadows.small,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptySectionText: { ...Typography.bodyBold, color: colors.text },
  emptySectionSubtext: { ...Typography.caption, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  createSharedBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.sharedLight,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.pill,
  },
  createSharedBtnText: { fontSize: 14, fontWeight: '700', color: Colors.shared },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    maxHeight: '85%',
    ...Shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  modalWalletEmoji: { fontSize: 28 },
  modalTitle: { ...Typography.h2, color: colors.text },
  modalLabel: { ...Typography.small, color: colors.textLight, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    height: 52,
    ...Typography.body,
    color: colors.text,
  },
  emojiScroll: { marginBottom: Spacing.sm },
  emojiBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.background,
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
    backgroundColor: colors.background,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  typeOptionActive: { backgroundColor: Colors.primary },
  typeOptionShared: {},
  typeOptionSharedActive: { backgroundColor: Colors.shared },
  typeOptionText: { ...Typography.bodyBold, fontSize: 15, color: colors.text },
  typeOptionTextShared: { color: Colors.shared },
  typeOptionTextActive: { color: colors.white },
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
  modalSubmitGradient: { height: 56, justifyContent: 'center', alignItems: 'center' },
  modalSubmitText: { ...Typography.bodyBold, color: colors.white },

  walletStats: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  walletStatItem: {
    flex: 1,
    backgroundColor: colors.background,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  walletStatLabel: { ...Typography.small, color: colors.textLight },
  walletStatValue: { ...Typography.h3, color: colors.text, marginTop: 4 },
  inviteRow: { flexDirection: 'row', gap: Spacing.sm },
  inviteInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    height: 52,
    ...Typography.body,
    color: colors.text,
  },
  inviteBtn: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  inviteBtnGradient: { width: 52, height: 52, justifyContent: 'center', alignItems: 'center' },
  inviteBtnText: { fontSize: 16, color: colors.white },
  membersList: { backgroundColor: colors.background, borderRadius: BorderRadius.md, overflow: 'hidden' },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarSecondary: { backgroundColor: Colors.shared },
  memberAvatarText: { fontSize: 18, fontWeight: '700', color: colors.white },
  memberInfo: { flex: 1, marginLeft: Spacing.md },
  memberName: { ...Typography.bodyBold, color: colors.text },
  memberEmail: { ...Typography.caption, color: colors.textLight, marginTop: 2 },
  ownerTag: {
    backgroundColor: Colors.incomeLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  ownerTagText: { fontSize: 10, fontWeight: '700', color: Colors.income },
  removeMemberBtn: { padding: Spacing.xs },
  noMembers: { padding: Spacing.lg, alignItems: 'center' },
  noMembersText: { ...Typography.caption, color: colors.textMuted },
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
  deleteWalletBtnText: { ...Typography.bodyBold, color: Colors.expense },
  leaveWalletBtn: {
    backgroundColor: colors.warning + '20',
  },
  leaveWalletBtnText: { ...Typography.bodyBold, color: colors.warning },
  calculatorBtn: { borderRadius: BorderRadius.md, overflow: 'hidden', marginBottom: Spacing.md },
  calculatorBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  calculatorBtnText: { ...Typography.bodyBold, color: colors.white },
  txTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  quickAddBtn: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden' as const,
    marginBottom: Spacing.md,
  },
  quickAddGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: Spacing.sm,
    height: 52,
  },
  quickAddText: {
    ...Typography.bodyBold,
    color: colors.white,
  },
  inviteLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  copyLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.primary + '15',
    borderRadius: BorderRadius.sm,
  },
  copyLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  qrCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  qrCodeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
});
