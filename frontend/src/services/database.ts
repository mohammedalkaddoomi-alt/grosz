import { supabase } from './supabase';
import { Database } from '../types/database';
import {
    WageSettings,
    Subscription,
    Wallet as AppWallet,
    Transaction as AppTransaction,
    WalletInvitation,
    Goal as AppGoal,
    GoalActivity as AppGoalActivity,
} from '../types';

type Tables = Database['public']['Tables'];
type Wallet = Tables['wallets']['Row'];
type Transaction = Tables['transactions']['Row'];
type GoalRow = Tables['goals']['Row'];
type GoalActivityRow = Tables['goal_activities']['Row'];
type Category = Tables['categories']['Row'];
type WalletInvitationRow = Tables['wallet_invitations']['Row'];
type WalletMemberWithUser = {
    wallet_id: string;
    user_id: string;
    role: 'owner' | 'member';
    joined_at: string;
    users: {
        id: string;
        email: string;
        name: string;
    } | null;
};

type TransactionWithRelations = Transaction & {
    categories?: {
        id: string;
        name: string;
        emoji: string;
        type: 'income' | 'expense';
    } | null;
    users?: {
        id: string;
        name: string;
        email: string;
    } | null;
    wallets?: {
        id: string;
        name: string;
        emoji: string;
    } | null;
};

type WalletInvitationWithRelations = WalletInvitationRow & {
    wallets?: {
        id: string;
        name: string;
        emoji: string;
        is_shared: boolean;
        owner_id: string;
    } | null;
    inviter?: {
        id: string;
        name: string;
        email: string;
        username: string | null;
    } | null;
};

type GoalWithUser = GoalRow & {
    users?: {
        name: string;
    } | null;
};

type GoalActivityWithUser = GoalActivityRow & {
    users?: {
        name: string;
    } | null;
};

class DatabaseService {
    private normalizeUsername(username: string): string {
        return username.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9._]/g, '');
    }

    private isValidUsername(username: string): boolean {
        return /^[a-z0-9._]{3,30}$/.test(username);
    }

    private normalizeWalletInvitation(invitation: WalletInvitationWithRelations): WalletInvitation {
        return {
            id: invitation.id,
            wallet_id: invitation.wallet_id,
            inviter_id: invitation.inviter_id,
            invitee_id: invitation.invitee_id,
            status: invitation.status,
            created_at: invitation.created_at,
            responded_at: invitation.responded_at,
            wallet: invitation.wallets
                ? {
                    id: invitation.wallets.id,
                    name: invitation.wallets.name,
                    emoji: invitation.wallets.emoji,
                    is_shared: invitation.wallets.is_shared,
                    owner_id: invitation.wallets.owner_id,
                }
                : undefined,
            inviter: invitation.inviter
                ? {
                    id: invitation.inviter.id,
                    name: invitation.inviter.name,
                    email: invitation.inviter.email,
                    username: invitation.inviter.username,
                }
                : undefined,
        };
    }

    private normalizeGoal(goal: GoalWithUser): AppGoal {
        return {
            id: goal.id,
            user_id: goal.user_id,
            wallet_id: goal.wallet_id,
            user_name: goal.users?.name,
            name: goal.name,
            emoji: goal.emoji,
            target_amount: Number(goal.target_amount),
            current_amount: Number(goal.current_amount),
            completed: Number(goal.current_amount) >= Number(goal.target_amount),
            created_at: goal.created_at,
        };
    }

    private normalizeGoalActivity(activity: GoalActivityWithUser): AppGoalActivity {
        return {
            id: activity.id,
            goal_id: activity.goal_id,
            user_id: activity.user_id,
            user_name: activity.users?.name,
            action: activity.action,
            amount: activity.amount == null ? null : Number(activity.amount),
            note: activity.note,
            created_at: activity.created_at,
        };
    }

    private normalizeTransaction(tx: TransactionWithRelations): AppTransaction {
        const createdAt = tx.date || tx.created_at;
        const categoryName = tx.categories?.name || 'Inne';
        const categoryEmoji = tx.categories?.emoji || (tx.type === 'income' ? '💰' : '💸');

        return {
            id: tx.id,
            wallet_id: tx.wallet_id,
            user_id: tx.user_id,
            user_name: tx.users?.name,
            amount: Number(tx.amount),
            type: tx.type,
            category: categoryName,
            emoji: categoryEmoji,
            note: tx.description || undefined,
            created_at: createdAt,
            categories: tx.categories
                ? {
                    name: tx.categories.name,
                    emoji: tx.categories.emoji,
                }
                : undefined,
            ...(tx.wallets?.name ? { wallet_name: tx.wallets.name } : {}),
        } as AppTransaction;
    }

    // ==================== WALLETS ====================

    /**
     * Get all wallets for the current user (owned or member of)
     */
    async getWallets(userId: string): Promise<AppWallet[]> {
        try {
            const [{ data: ownedWallets, error: ownedError }, { data: memberships, error: membershipError }] = await Promise.all([
                supabase
                    .from('wallets')
                    .select('*')
                    .eq('owner_id', userId),
                supabase
                    .from('wallet_members')
                    .select('wallet_id')
                    .eq('user_id', userId),
            ]);

            if (ownedError) throw ownedError;
            if (membershipError) throw membershipError;

            const membershipWalletIds = Array.from(new Set((memberships || []).map((m: any) => m.wallet_id)));
            let memberWallets: Wallet[] = [];

            if (membershipWalletIds.length > 0) {
                const { data, error } = await supabase
                    .from('wallets')
                    .select('*')
                    .in('id', membershipWalletIds);
                if (error) throw error;
                memberWallets = data || [];
            }

            const walletMap = new Map<string, Wallet>();
            [...(ownedWallets || []), ...memberWallets].forEach(wallet => {
                walletMap.set(wallet.id, wallet);
            });

            const wallets = Array.from(walletMap.values());
            if (wallets.length === 0) {
                return [];
            }

            const walletIds = wallets.map(wallet => wallet.id);
            const { data: walletMembers, error: walletMembersError } = await supabase
                .from('wallet_members')
                .select(`
                    wallet_id,
                    user_id,
                    role,
                    joined_at,
                    users(id, email, name)
                `)
                .in('wallet_id', walletIds);

            if (walletMembersError) throw walletMembersError;

            const membersByWallet = new Map<string, { members: string[]; membersDetails: { id: string; name: string; email: string; joined_at?: string }[] }>();
            const ownersByWallet = new Map<string, { id: string; name: string; email: string; joined_at?: string }>();

            (walletMembers as unknown as WalletMemberWithUser[] || []).forEach(member => {
                if (!membersByWallet.has(member.wallet_id)) {
                    membersByWallet.set(member.wallet_id, { members: [], membersDetails: [] });
                }
                if (member.role === 'owner' && member.users) {
                    ownersByWallet.set(member.wallet_id, {
                        id: member.users.id,
                        name: member.users.name,
                        email: member.users.email,
                        joined_at: member.joined_at,
                    });
                }
                const entry = membersByWallet.get(member.wallet_id)!;
                if (member.role === 'member' && member.users) {
                    entry.members.push(member.user_id);
                    entry.membersDetails.push({
                        id: member.users.id,
                        name: member.users.name,
                        email: member.users.email,
                        joined_at: member.joined_at,
                    });
                }
            });

            return wallets
                .map(wallet => {
                    const memberInfo = membersByWallet.get(wallet.id);
                    return {
                        ...wallet,
                        balance: 0,
                        owner_details: ownersByWallet.get(wallet.id),
                        members: memberInfo?.members || [],
                        members_details: memberInfo?.membersDetails || [],
                    } as AppWallet;
                })
                .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        } catch (error) {
            console.error('Error fetching wallets:', error);
            throw error;
        }
    }

    /**
     * Get a single wallet by ID
     */
    async getWallet(walletId: string): Promise<AppWallet | null> {
        try {
            const { data, error } = await supabase
                .from('wallets')
                .select('*')
                .eq('id', walletId)
                .single();

            if (error) throw error;
            if (!data) return null;
            return {
                ...(data as Wallet),
                balance: 0,
                members: [],
                members_details: [],
            } as AppWallet;
        } catch (error) {
            console.error('Error fetching wallet:', error);
            return null;
        }
    }

    /**
     * Create a new wallet
     */
    async createWallet(
        userId: string,
        wallet: { name: string; emoji: string; is_shared: boolean }
    ): Promise<AppWallet> {
        try {
            // Create the wallet
            const { data: walletData, error: walletError } = await (supabase as any)
                .from('wallets')
                .insert({
                    name: wallet.name,
                    emoji: wallet.emoji,
                    is_shared: wallet.is_shared,
                    owner_id: userId,
                })
                .select()
                .single();

            if (walletError) throw walletError;

            // Add the creator as a member with owner role
            const { error: memberError } = await (supabase as any)
                .from('wallet_members')
                .insert({
                    wallet_id: walletData.id,
                    user_id: userId,
                    role: 'owner',
                });

            if (memberError) throw memberError;

            return {
                ...walletData,
                balance: 0,
                members: [],
                members_details: [],
            } as AppWallet;
        } catch (error) {
            console.error('Error creating wallet:', error);
            throw error;
        }
    }

    /**
     * Update a wallet
     */
    async updateWallet(
        walletId: string,
        updates: { name?: string; emoji?: string }
    ): Promise<AppWallet> {
        try {
            const { data, error } = await (supabase as any)
                .from('wallets')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', walletId)
                .select()
                .single();

            if (error) throw error;
            return {
                ...data,
                balance: 0,
                members: [],
                members_details: [],
            } as AppWallet;
        } catch (error) {
            console.error('Error updating wallet:', error);
            throw error;
        }
    }

    /**
     * Delete a wallet
     */
    async deleteWallet(walletId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('wallets')
                .delete()
                .eq('id', walletId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting wallet:', error);
            throw error;
        }
    }

    // ==================== WALLET MEMBERS ====================

    /**
     * Get all members of a wallet
     */
    async getWalletMembers(walletId: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('wallet_members')
                .select(`
          *,
          users(id, email, name, avatar_url)
        `)
                .eq('wallet_id', walletId);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching wallet members:', error);
            throw error;
        }
    }

    /**
     * Invite a user to a wallet
     */
    async inviteToWallet(walletId: string, userId: string): Promise<void> {
        try {
            const { error } = await (supabase as any)
                .from('wallet_members')
                .insert({
                    wallet_id: walletId,
                    user_id: userId,
                    role: 'member',
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error inviting to wallet:', error);
            throw error;
        }
    }

    /**
     * Send a wallet invitation by username.
     * Membership is created only when invitee accepts.
     */
    async sendWalletInvitation(walletId: string, username: string): Promise<void> {
        try {
            const normalizedUsername = this.normalizeUsername(username);
            if (!this.isValidUsername(normalizedUsername)) {
                throw new Error('Podaj poprawną nazwę użytkownika');
            }

            const {
                data: { user: currentUser },
                error: currentUserError,
            } = await supabase.auth.getUser();

            if (currentUserError || !currentUser) {
                throw new Error('Brak aktywnej sesji');
            }

            const { data: wallet, error: walletError } = await supabase
                .from('wallets')
                .select('id, owner_id, is_shared')
                .eq('id', walletId)
                .single();

            if (walletError || !wallet) {
                throw new Error('Nie znaleziono portfela');
            }

            if ((wallet as any).owner_id !== currentUser.id) {
                throw new Error('Tylko właściciel może zapraszać do portfela');
            }

            if (!(wallet as any).is_shared) {
                throw new Error('Zaproszenia są dostępne tylko dla wspólnych portfeli');
            }

            // Find user by username
            const { data: foundUser, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('username', normalizedUsername)
                .maybeSingle();

            if (userError || !foundUser) {
                throw new Error('Nie znaleziono użytkownika o tej nazwie');
            }

            if ((foundUser as any).id === currentUser.id) {
                throw new Error('Nie możesz zaprosić samego siebie');
            }

            const { data: existingMember, error: existingMemberError } = await supabase
                .from('wallet_members')
                .select('user_id')
                .eq('wallet_id', walletId)
                .eq('user_id', (foundUser as any).id)
                .maybeSingle();

            if (existingMemberError) {
                throw existingMemberError;
            }

            if (existingMember) {
                throw new Error('Ten użytkownik jest już członkiem portfela');
            }

            const { data: existingInvite, error: existingInviteError } = await supabase
                .from('wallet_invitations')
                .select('id')
                .eq('wallet_id', walletId)
                .eq('invitee_id', (foundUser as any).id)
                .eq('status', 'pending')
                .maybeSingle();

            if (existingInviteError) throw existingInviteError;
            if (existingInvite) {
                throw new Error('Dla tego użytkownika jest już aktywne zaproszenie');
            }

            const { error } = await (supabase as any)
                .from('wallet_invitations')
                .insert({
                    wallet_id: walletId,
                    inviter_id: currentUser.id,
                    invitee_id: (foundUser as any).id,
                    status: 'pending',
                });

            if (error) {
                if ((error as any)?.code === '23505') {
                    throw new Error('Dla tego użytkownika jest już aktywne zaproszenie');
                }
                throw error;
            }
        } catch (error) {
            console.error('Error creating wallet invitation:', error);
            const code = (error as any)?.code;
            if (code === 'PGRST204' || code === '42P01') {
                throw new Error('Brak tabeli zaproszeń. Uruchom migrację SQL dla wallet_invitations.');
            }
            throw error;
        }
    }

    // Backward-compatible alias
    async addWalletMember(walletId: string, username: string): Promise<void> {
        return this.sendWalletInvitation(walletId, username);
    }

    /**
     * Get pending wallet invitations for the current user
     */
    async getWalletInvitations(userId: string): Promise<WalletInvitation[]> {
        try {
            const { data, error } = await (supabase as any)
                .from('wallet_invitations')
                .select('id, wallet_id, inviter_id, invitee_id, status, responded_at, created_at, updated_at')
                .eq('invitee_id', userId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) {
                // If migration not applied yet, keep app functional.
                const code = (error as any)?.code;
                if (code === 'PGRST204' || code === '42P01') {
                    return [];
                }
                throw error;
            }

            const invitations = (data || []) as WalletInvitationRow[];
            if (invitations.length === 0) return [];

            const walletIds = Array.from(new Set(invitations.map((item) => item.wallet_id)));
            const inviterIds = Array.from(new Set(invitations.map((item) => item.inviter_id)));

            const [{ data: walletsData, error: walletsError }, { data: usersData, error: usersError }] = await Promise.all([
                supabase
                    .from('wallets')
                    .select('id, name, emoji, is_shared, owner_id')
                    .in('id', walletIds),
                supabase
                    .from('users')
                    .select('id, name, email, username')
                    .in('id', inviterIds),
            ]);

            if (walletsError) throw walletsError;
            if (usersError) throw usersError;

            const walletMap = new Map((walletsData || []).map((wallet: any) => [wallet.id, wallet]));
            const inviterMap = new Map((usersData || []).map((person: any) => [person.id, person]));

            return invitations.map((invitation) => {
                const wallet = walletMap.get(invitation.wallet_id);
                const inviter = inviterMap.get(invitation.inviter_id);

                return {
                    id: invitation.id,
                    wallet_id: invitation.wallet_id,
                    inviter_id: invitation.inviter_id,
                    invitee_id: invitation.invitee_id,
                    status: invitation.status,
                    created_at: invitation.created_at,
                    responded_at: invitation.responded_at,
                    wallet: wallet
                        ? {
                            id: wallet.id,
                            name: wallet.name,
                            emoji: wallet.emoji,
                            is_shared: wallet.is_shared,
                            owner_id: wallet.owner_id,
                        }
                        : undefined,
                    inviter: inviter
                        ? {
                            id: inviter.id,
                            name: inviter.name,
                            email: inviter.email,
                            username: inviter.username,
                        }
                        : undefined,
                } as WalletInvitation;
            });
        } catch (error) {
            console.error('Error getting wallet invitations:', error);
            throw error;
        }
    }

    /**
     * Accept or reject wallet invitation.
     * On accept, user becomes wallet member.
     */
    async respondToWalletInvitation(invitationId: string, action: 'accept' | 'reject'): Promise<void> {
        try {
            const {
                data: { user: currentUser },
                error: currentUserError,
            } = await supabase.auth.getUser();

            if (currentUserError || !currentUser) {
                throw new Error('Brak aktywnej sesji');
            }

            const { data: invitation, error: invitationError } = await (supabase as any)
                .from('wallet_invitations')
                .select('id, wallet_id, invitee_id, status')
                .eq('id', invitationId)
                .single();

            if (invitationError || !invitation) {
                throw new Error('Nie znaleziono zaproszenia');
            }

            if ((invitation as any).invitee_id !== currentUser.id) {
                throw new Error('Nie masz uprawnień do tego zaproszenia');
            }

            if ((invitation as any).status !== 'pending') {
                throw new Error('To zaproszenie nie jest już aktywne');
            }

            if (action === 'accept') {
                const { error: memberError } = await (supabase as any)
                    .from('wallet_members')
                    .insert({
                        wallet_id: (invitation as any).wallet_id,
                        user_id: currentUser.id,
                        role: 'member',
                    });

                if (memberError && (memberError as any)?.code !== '23505') {
                    throw memberError;
                }
            }

            const { error: updateError } = await (supabase as any)
                .from('wallet_invitations')
                .update({
                    status: action === 'accept' ? 'accepted' : 'rejected',
                    responded_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', invitationId);

            if (updateError) throw updateError;
        } catch (error) {
            console.error('Error responding to wallet invitation:', error);
            const code = (error as any)?.code;
            if (code === 'PGRST204' || code === '42P01') {
                throw new Error('Brak tabeli zaproszeń. Uruchom migrację SQL dla wallet_invitations.');
            }
            throw error;
        }
    }

    // Alias for compatibility
    async removeWalletMember(walletId: string, userId: string): Promise<void> {
        return this.removeFromWallet(walletId, userId);
    }

    /**
     * Remove a member from a wallet
     */
    async removeFromWallet(walletId: string, userId: string): Promise<void> {
        try {
            const { data: membership, error: membershipError } = await supabase
                .from('wallet_members')
                .select('role')
                .eq('wallet_id', walletId)
                .eq('user_id', userId)
                .maybeSingle();

            if (membershipError) throw membershipError;
            if (!membership) throw new Error('Nie znaleziono członka portfela');
            if ((membership as any).role === 'owner') {
                throw new Error('Nie można usunąć właściciela portfela');
            }

            const { error } = await supabase
                .from('wallet_members')
                .delete()
                .eq('wallet_id', walletId)
                .eq('user_id', userId);

            if (error) throw error;
        } catch (error) {
            console.error('Error removing from wallet:', error);
            throw error;
        }
    }

    /**
     * Leave a wallet (remove self)
     */
    async leaveWallet(walletId: string, userId: string): Promise<void> {
        const { data: membership, error: membershipError } = await supabase
            .from('wallet_members')
            .select('role')
            .eq('wallet_id', walletId)
            .eq('user_id', userId)
            .maybeSingle();

        if (membershipError) throw membershipError;
        if (!membership) throw new Error('Nie należysz do tego portfela');
        if ((membership as any).role === 'owner') {
            throw new Error('Właściciel nie może opuścić portfela');
        }

        return this.removeFromWallet(walletId, userId);
    }

    // ==================== TRANSACTIONS ====================

    /**
     * Get transactions, optionally filtered by wallet
     */
    async getTransactions(walletId?: string): Promise<AppTransaction[]> {
        try {
            let query = supabase
                .from('transactions')
                .select(`
                    *,
                    categories(id, name, emoji, type),
                    users(id, name, email),
                    wallets(id, name, emoji)
                `)
                .order('date', { ascending: false });

            if (walletId) {
                query = query.eq('wallet_id', walletId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return (data || []).map(tx => this.normalizeTransaction(tx as TransactionWithRelations));
        } catch (error) {
            console.error('Error fetching transactions:', error);
            throw error;
        }
    }

    /**
     * Create a new transaction
     */
    async createTransaction(transaction: {
        wallet_id: string;
        category_id: string;
        user_id: string;
        amount: number;
        type: 'income' | 'expense';
        description?: string;
        date?: string;
    }): Promise<AppTransaction> {
        try {
            const { data, error } = await (supabase as any)
                .from('transactions')
                .insert({
                    ...transaction,
                    date: transaction.date || new Date().toISOString(),
                })
                .select(`
                    *,
                    categories(id, name, emoji, type),
                    users(id, name, email),
                    wallets(id, name, emoji)
                `)
                .single();

            if (error) throw error;
            return this.normalizeTransaction(data as TransactionWithRelations);
        } catch (error) {
            console.error('Error creating transaction:', error);
            throw error;
        }
    }

    /**
     * Delete a transaction
     */
    async deleteTransaction(transactionId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', transactionId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting transaction:', error);
            throw error;
        }
    }

    /**
     * Get wallet balance (sum of all transactions)
     */
    async getWalletBalance(walletId: string): Promise<number> {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('amount, type')
                .eq('wallet_id', walletId);

            if (error) throw error;

            const balance = (data || []).reduce((acc: number, transaction: any) => {
                return transaction.type === 'income'
                    ? acc + transaction.amount
                    : acc - transaction.amount;
            }, 0);

            return balance;
        } catch (error) {
            console.error('Error calculating wallet balance:', error);
            return 0;
        }
    }

    // ==================== GOALS ====================

    /**
     * Get all goals for a user
     */
    async getGoals(userId: string, walletId?: string, includeUnscoped: boolean = true): Promise<AppGoal[]> {
        try {
            if (walletId) {
                const [{ data: scopedGoals, error: scopedError }, unscopedResult] = await Promise.all([
                    supabase
                        .from('goals')
                        .select(`
                            *,
                            users(name)
                        `)
                        .eq('wallet_id', walletId)
                        .order('created_at', { ascending: false }),
                    includeUnscoped
                        ? supabase
                            .from('goals')
                            .select(`
                                *,
                                users(name)
                            `)
                            .eq('user_id', userId)
                            .is('wallet_id', null)
                            .order('created_at', { ascending: false })
                        : Promise.resolve({ data: [], error: null } as any),
                ]);

                if (scopedError) throw scopedError;
                if (unscopedResult.error) throw unscopedResult.error;

                const allGoals = [...(scopedGoals || []), ...(unscopedResult.data || [])] as GoalWithUser[];
                const deduped = Array.from(new Map(allGoals.map((goal: any) => [goal.id, goal])).values());
                return deduped.map((goal) => this.normalizeGoal(goal as GoalWithUser));
            }

            const { data, error } = await supabase
                .from('goals')
                .select(`
                    *,
                    users(name)
                `)
                .eq('user_id', userId)
                .is('wallet_id', null)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return ((data || []) as GoalWithUser[]).map((goal) => this.normalizeGoal(goal));
        } catch (error) {
            console.error('Error fetching goals:', error);
            throw error;
        }
    }

    /**
     * Create a new goal
     */
    async createGoal(goal: {
        user_id: string;
        wallet_id?: string | null;
        name: string;
        emoji: string;
        target_amount: number;
    }): Promise<AppGoal> {
        try {
            const { data, error } = await (supabase as any)
                .from('goals')
                .insert({
                    ...goal,
                    current_amount: 0,
                })
                .select(`
                    *,
                    users(name)
                `)
                .single();

            if (error) throw error;
            const createdGoal = this.normalizeGoal(data as GoalWithUser);
            await this.logGoalActivity(createdGoal.id, goal.user_id, 'created', null, null);
            return createdGoal;
        } catch (error) {
            console.error('Error creating goal:', error);
            throw error;
        }
    }

    /**
     * Update a goal
     */
    async updateGoal(id: string, updates: Partial<GoalRow>): Promise<AppGoal> {
        try {
            const { data, error } = await (supabase as any)
                .from('goals')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select(`
                    *,
                    users(name)
                `)
                .single();

            if (error) throw error;
            return this.normalizeGoal(data as GoalWithUser);
        } catch (error) {
            console.error('Error updating goal:', error);
            throw error;
        }
    }



    /**
     * Contribute to a goal
     */
    async contributeToGoal(goalId: string, amount: number, actorUserId?: string): Promise<AppGoal> {
        try {
            // Get current goal
            const { data: goal, error: fetchError } = await supabase
                .from('goals')
                .select('current_amount, target_amount, user_id')
                .eq('id', goalId)
                .single();

            if (fetchError) throw fetchError;
            const currentAmount = Number((goal as any).current_amount || 0);
            const targetAmount = Number((goal as any).target_amount || 0);
            const nextAmount = targetAmount > 0
                ? Math.min(currentAmount + amount, targetAmount)
                : currentAmount + amount;

            // Update with new amount
            const { data, error } = await (supabase as any)
                .from('goals')
                .update({
                    current_amount: nextAmount,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', goalId)
                .select(`
                    *,
                    users(name)
                `)
                .single();

            if (error) throw error;
            const effectiveAmount = nextAmount - currentAmount;
            if (effectiveAmount > 0) {
                const fallbackActor = String((goal as any).user_id || '');
                const userId = actorUserId || fallbackActor;
                if (userId) {
                    await this.logGoalActivity(goalId, userId, 'contributed', effectiveAmount, null);
                }
            }
            return this.normalizeGoal(data as GoalWithUser);
        } catch (error) {
            console.error('Error contributing to goal:', error);
            throw error;
        }
    }

    async getGoalActivities(goalId: string, limit: number = 20): Promise<AppGoalActivity[]> {
        try {
            const { data, error } = await (supabase as any)
                .from('goal_activities')
                .select(`
                    *,
                    users(name)
                `)
                .eq('goal_id', goalId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return ((data || []) as GoalActivityWithUser[]).map((activity) => this.normalizeGoalActivity(activity));
        } catch (error) {
            const errorMessage = String((error as any)?.message || '');
            const errorCode = String((error as any)?.code || '');
            if (
                errorCode === '42P01' ||
                errorCode === 'PGRST205' ||
                errorMessage.toLowerCase().includes('goal_activities')
            ) {
                return [];
            }
            console.error('Error getting goal activities:', error);
            throw error;
        }
    }

    private async logGoalActivity(
        goalId: string,
        userId: string,
        action: 'created' | 'contributed',
        amount?: number | null,
        note?: string | null
    ): Promise<void> {
        try {
            await (supabase as any)
                .from('goal_activities')
                .insert({
                    goal_id: goalId,
                    user_id: userId,
                    action,
                    amount: amount == null ? null : amount,
                    note: note ?? null,
                });
        } catch (error) {
            console.error('Error logging goal activity:', error);
        }
    }

    /**
     * Delete a goal
     */
    async deleteGoal(goalId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('goals')
                .delete()
                .eq('id', goalId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting goal:', error);
            throw error;
        }
    }

    // ==================== CATEGORIES ====================

    /**
     * Get categories, optionally filtered by type
     */
    async getCategories(type?: 'income' | 'expense', userId?: string): Promise<Category[]> {
        try {
            let query = supabase
                .from('categories')
                .select('*')
                .order('name', { ascending: true });

            if (type) {
                query = query.eq('type', type);
            }

            // Get system categories (user_id is null) and user's custom categories
            if (userId) {
                query = query.or(`user_id.is.null,user_id.eq.${userId}`);
            } else {
                query = query.is('user_id', null);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    }

    /**
     * Create a custom category
     */
    async createCategory(category: {
        name: string;
        emoji: string;
        type: 'income' | 'expense';
        user_id: string;
    }): Promise<Category> {
        try {
            const { data, error } = await supabase
                .from('categories')
                .insert(category as any)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating category:', error);
            throw error;
        }
    }

    /**
     * Delete a category
     */
    async deleteCategory(categoryId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', categoryId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    }

    // ==================== USER SEARCH ====================

    /**
     * Search for users by email
     */
    async searchUsers(query: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, email, name, avatar_url')
                .ilike('email', `%${query}%`)
                .limit(10);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error searching users:', error);
            return [];
        }
    }

    // ==================== DASHBOARD STATS ====================

    /**
     * Get dashboard statistics for a user
     */
    async getStats(userId: string) {
        try {
            // Get all user's wallets
            const wallets = await this.getWallets(userId);
            const walletIds = wallets.map(w => w.id);

            if (walletIds.length === 0) {
                return {
                    totalBalance: 0,
                    monthlyIncome: 0,
                    monthlyExpenses: 0,
                    walletsCount: 0,
                    goalsCount: 0,
                    recentTransactions: [],
                };
            }

            // Get all transactions from user's wallets
            const { data: transactions, error: transError } = await supabase
                .from('transactions')
                .select('*')
                .in('wallet_id', walletIds);

            if (transError) throw transError;

            // Calculate total balance
            const totalBalance = (transactions || []).reduce((acc: number, t: any) => {
                return t.type === 'income' ? acc + t.amount : acc - t.amount;
            }, 0);

            // Calculate monthly income and expenses
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthlyTransactions = (transactions || []).filter(
                (t: any) => new Date(t.date) >= firstDayOfMonth
            );

            const monthlyIncome = monthlyTransactions
                .filter((t: any) => t.type === 'income')
                .reduce((acc: number, t: any) => acc + t.amount, 0);

            const monthlyExpenses = monthlyTransactions
                .filter((t: any) => t.type === 'expense')
                .reduce((acc: number, t: any) => acc + t.amount, 0);

            // Get goals
            const goals = await this.getGoals(userId);

            return {
                totalBalance,
                monthlyIncome,
                monthlyExpenses,
                walletsCount: wallets.length,
                goalsCount: goals.length,
                recentTransactions: transactions?.slice(0, 5) || [],
            };
        } catch (error) {
            console.error('Error fetching stats:', error);
            throw error;
        }
    }

    // ==================== REAL-TIME SUBSCRIPTIONS ====================

    /**
     * Subscribe to wallet changes
     */
    subscribeToWallets(userId: string, callback: (payload: any) => void) {
        return supabase
            .channel('wallets-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'wallets',
                },
                callback
            )
            .subscribe();
    }

    /**
     * Subscribe to transaction changes for a specific wallet
     */
    subscribeToTransactions(walletId: string, callback: (payload: any) => void) {
        return supabase
            .channel(`transactions-${walletId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'transactions',
                    filter: `wallet_id=eq.${walletId}`,
                },
                callback
            )
            .subscribe();
    }

    /**
     * Subscribe to goal changes
     */
    subscribeToGoals(userId: string, callback: (payload: any) => void) {
        return supabase
            .channel('goals-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'goals',
                    filter: `user_id=eq.${userId}`,
                },
                callback
            )
            .subscribe();
    }

    // ==================== WAGE SETTINGS ====================

    /**
     * Get wage settings for a user
     */
    async getWageSettings(userId: string) {
        try {
            const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                // If no settings exist, return null
                if (error.code === 'PGRST116') return null;
                throw error;
            }
            return data;
        } catch (error) {
            console.error('Error fetching wage settings:', error);
            return null;
        }
    }

    /**
     * Save or update wage settings for a user
     */
    async saveWageSettings(settings: {
        user_id: string;
        wage_amount: number;
        wage_period: 'hourly' | 'daily' | 'weekly' | 'monthly';
        currency?: string;
    }) {
        try {
            // Check if settings already exist
            const existing = await this.getWageSettings(settings.user_id);

            if (existing) {
                // Update existing settings
                const { data, error } = await (supabase as any)
                    .from('user_settings')
                    .update({
                        wage_amount: settings.wage_amount,
                        wage_period: settings.wage_period,
                        currency: settings.currency || 'PLN',
                        updated_at: new Date().toISOString(),
                    } as any)
                    .eq('user_id', settings.user_id)
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } else {
                // Create new settings
                const { data, error } = await supabase
                    .from('user_settings')
                    .insert({
                        user_id: settings.user_id,
                        wage_amount: settings.wage_amount,
                        wage_period: settings.wage_period,
                        currency: settings.currency || 'PLN',
                    } as any)
                    .select()
                    .single();

                if (error) throw error;
                return data;
            }
        } catch (error) {
            console.error('Error saving wage settings:', error);
            throw error;
        }
    }

    /**
     * Calculate work time needed for an item price
     */
    calculateWorkTime(
        wageAmount: number,
        wagePeriod: 'hourly' | 'daily' | 'weekly' | 'monthly',
        itemPrice: number
    ) {
        // Convert wage to hourly rate
        let hourlyRate = wageAmount;

        switch (wagePeriod) {
            case 'daily':
                hourlyRate = wageAmount / 8; // Assuming 8-hour workday
                break;
            case 'weekly':
                hourlyRate = wageAmount / 40; // Assuming 40-hour work week
                break;
            case 'monthly':
                hourlyRate = wageAmount / 160; // Assuming ~160 hours per month
                break;
        }

        const hoursNeeded = itemPrice / hourlyRate;
        const daysNeeded = hoursNeeded / 8;
        const weeksNeeded = hoursNeeded / 40;
        const monthsNeeded = hoursNeeded / 160;

        return {
            itemPrice,
            wageAmount,
            wagePeriod,
            hoursNeeded,
            daysNeeded,
            weeksNeeded,
            monthsNeeded,
        };
    }

    // Subscriptions
    async getSubscriptions(userId: string): Promise<Subscription[]> {
        try {
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', userId)
                .order('next_payment_date', { ascending: true });

            if (error) throw error;
            return (data || []) as unknown as Subscription[];
        } catch (error) {
            console.error('Error getting subscriptions:', error);
            return [];
        }
    }

    async createSubscription(subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>): Promise<Subscription> {
        try {
            const { data, error } = await supabase
                .from('subscriptions')
                .insert(subscription as any)
                .select()
                .single();

            if (error) throw error;
            return data as unknown as Subscription;
        } catch (error) {
            console.error('Error creating subscription:', error);
            throw error;
        }
    }

    async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription> {
        try {
            const { data, error } = await (supabase as any)
                .from('subscriptions')
                .update(updates as any)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as unknown as Subscription;
        } catch (error) {
            console.error('Error updating subscription:', error);
            throw error;
        }
    }

    async deleteSubscription(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('subscriptions')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting subscription:', error);
            throw error;
        }
    }
}

export const db = new DatabaseService();
