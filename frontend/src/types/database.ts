export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    name: string
                    username: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    name: string
                    username?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    name?: string
                    username?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            wallets: {
                Row: {
                    id: string
                    name: string
                    emoji: string
                    is_shared: boolean
                    owner_id: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    emoji: string
                    is_shared?: boolean
                    owner_id: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    emoji?: string
                    is_shared?: boolean
                    owner_id?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            wallet_members: {
                Row: {
                    id: string
                    wallet_id: string
                    user_id: string
                    role: 'owner' | 'member'
                    joined_at: string
                }
                Insert: {
                    id?: string
                    wallet_id: string
                    user_id: string
                    role?: 'owner' | 'member'
                    joined_at?: string
                }
                Update: {
                    id?: string
                    wallet_id?: string
                    user_id?: string
                    role?: 'owner' | 'member'
                    joined_at?: string
                }
            }
            wallet_invitations: {
                Row: {
                    id: string
                    wallet_id: string
                    inviter_id: string
                    invitee_id: string
                    status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
                    responded_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    wallet_id: string
                    inviter_id: string
                    invitee_id: string
                    status?: 'pending' | 'accepted' | 'rejected' | 'cancelled'
                    responded_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    wallet_id?: string
                    inviter_id?: string
                    invitee_id?: string
                    status?: 'pending' | 'accepted' | 'rejected' | 'cancelled'
                    responded_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            categories: {
                Row: {
                    id: string
                    name: string
                    emoji: string
                    type: 'income' | 'expense'
                    user_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    emoji: string
                    type: 'income' | 'expense'
                    user_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    emoji?: string
                    type?: 'income' | 'expense'
                    user_id?: string | null
                    created_at?: string
                }
            }
            transactions: {
                Row: {
                    id: string
                    wallet_id: string
                    category_id: string
                    user_id: string
                    amount: number
                    type: 'income' | 'expense'
                    description: string | null
                    date: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    wallet_id: string
                    category_id: string
                    user_id: string
                    amount: number
                    type: 'income' | 'expense'
                    description?: string | null
                    date?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    wallet_id?: string
                    category_id?: string
                    user_id?: string
                    amount?: number
                    type?: 'income' | 'expense'
                    description?: string | null
                    date?: string
                    created_at?: string
                }
            }
            goals: {
                Row: {
                    id: string
                    user_id: string
                    wallet_id: string | null
                    name: string
                    emoji: string
                    target_amount: number
                    current_amount: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    wallet_id?: string | null
                    name: string
                    emoji: string
                    target_amount: number
                    current_amount?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    wallet_id?: string | null
                    name?: string
                    emoji?: string
                    target_amount?: number
                    current_amount?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            goal_activities: {
                Row: {
                    id: string
                    goal_id: string
                    user_id: string
                    action: 'created' | 'contributed'
                    amount: number | null
                    note: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    goal_id: string
                    user_id: string
                    action: 'created' | 'contributed'
                    amount?: number | null
                    note?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    goal_id?: string
                    user_id?: string
                    action?: 'created' | 'contributed'
                    amount?: number | null
                    note?: string | null
                    created_at?: string
                }
            }
            chat_history: {
                Row: {
                    id: string
                    user_id: string
                    message: string
                    response: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    message: string
                    response: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    message?: string
                    response?: string
                    created_at?: string
                }
            }
            user_settings: {
                Row: {
                    id: string
                    user_id: string
                    wage_amount: number
                    wage_period: 'hourly' | 'daily' | 'weekly' | 'monthly'
                    currency: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    wage_amount: number
                    wage_period: 'hourly' | 'daily' | 'weekly' | 'monthly'
                    currency?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    wage_amount?: number
                    wage_period?: 'hourly' | 'daily' | 'weekly' | 'monthly'
                    currency?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            subscriptions: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    price: number
                    currency: string
                    billing_cycle: 'weekly' | 'monthly' | 'yearly'
                    start_date: string
                    next_payment_date: string
                    reminder_enabled: boolean
                    reminder_days_before: number
                    icon: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    price: number
                    currency?: string
                    billing_cycle: 'weekly' | 'monthly' | 'yearly'
                    start_date?: string
                    next_payment_date: string
                    reminder_enabled?: boolean
                    reminder_days_before?: number
                    icon?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    price?: number
                    currency?: string
                    billing_cycle?: 'weekly' | 'monthly' | 'yearly'
                    start_date?: string
                    next_payment_date?: string
                    reminder_enabled?: boolean
                    reminder_days_before?: number
                    icon?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
