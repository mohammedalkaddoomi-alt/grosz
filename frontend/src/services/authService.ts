import { supabase } from './supabase';
import { AuthError, User, Session } from '@supabase/supabase-js';
import { Database } from '../types/database';

type UserProfile = Database['public']['Tables']['users']['Row'];

export interface AuthResponse {
    user: User | null;
    session: Session | null;
    error: AuthError | null;
    data?: { url: string } | null;
}

class AuthService {
    private isRateLimitError(error: any): boolean {
        const message = `${error?.message || ''}`.toLowerCase();
        return message.includes('rate limit') || message.includes('over_email_send_rate_limit');
    }

    private normalizeUsername(username: string): string {
        return username.trim().toLowerCase().replace(/[^a-z0-9._]/g, '');
    }

    private isValidUsername(username: string): boolean {
        return /^[a-z0-9._]{3,30}$/.test(username);
    }

    private createAuthError(message: string): AuthError {
        return {
            name: 'AuthError',
            message,
            status: 400,
        } as AuthError;
    }

    private isUsernameConflictError(error: any): boolean {
        const code = error?.code;
        const details = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
        return code === '23505' && details.includes('username');
    }

    /**
     * Check if a username is available
     */
    async checkUsernameAvailability(username: string): Promise<boolean> {
        const normalizedUsername = this.normalizeUsername(username);

        // Frontend validation should still prevent invalid values from submit.
        if (!this.isValidUsername(normalizedUsername)) {
            return false;
        }

        try {
            // Prefer RPC (SECURITY DEFINER) because unauthenticated users may fail direct table reads.
            const { data, error } = await (supabase as any).rpc('check_username_available', {
                username_check: normalizedUsername,
            });

            if (!error) {
                return !!data;
            }

            console.warn('RPC error checking username availability, trying table fallback:', error);
        } catch (rpcError) {
            console.warn('Unexpected RPC failure checking username availability:', rpcError);
        }

        // Fallback: direct query. This works when RLS/policies allow public username search.
        try {
            const { data, error } = await (supabase as any)
                .from('users')
                .select('id')
                .eq('username', normalizedUsername)
                .maybeSingle();

            if (!error) {
                return !data;
            }

            console.warn('Fallback query failed while checking username availability:', error);
        } catch (queryError) {
            console.warn('Unexpected fallback failure checking username availability:', queryError);
        }

        // If availability cannot be determined, don't block signup UI as "taken".
        return true;
    }

    /**
     * Register a new user with email and password
     */
    async register(email: string, password: string, name: string, username: string): Promise<AuthResponse> {
        const normalizedUsername = this.normalizeUsername(username);

        if (!this.isValidUsername(normalizedUsername)) {
            return {
                user: null,
                session: null,
                error: this.createAuthError('Nazwa użytkownika musi mieć 3-30 znaków: litery, cyfry, kropka lub podkreślenie'),
            };
        }

        const isAvailable = await this.checkUsernameAvailability(normalizedUsername);
        if (!isAvailable) {
            return {
                user: null,
                session: null,
                error: this.createAuthError('Nazwa użytkownika zajęta'),
            };
        }

        try {
            // Sign up the user
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        username: normalizedUsername,
                    },
                },
            });

            if (error) throw error;

            // Create user profile in users table
            // If signUp returns no session (email confirmation flow), skip direct insert.
            // Profile will be created later when user logs in and ensureUserProfile runs.
            if (data.user && data.session) {
                const { error: profileError } = await (supabase as any)
                    .from('users')
                    .insert({
                        id: data.user.id,
                        email: data.user.email!,
                        name,
                        username: normalizedUsername,
                    });

                if (profileError) {
                    console.error('Error creating user profile:', profileError);
                    await supabase.auth.signOut();

                    if (this.isUsernameConflictError(profileError)) {
                        return {
                            user: null,
                            session: null,
                            error: this.createAuthError('Nazwa użytkownika zajęta'),
                        };
                    }

                    return {
                        user: null,
                        session: null,
                        error: this.createAuthError('Nie udało się utworzyć profilu użytkownika'),
                    };
                }
            }

            return { user: data.user, session: data.session, error: null };
        } catch (error) {
            if (this.isRateLimitError(error)) {
                return {
                    user: null,
                    session: null,
                    error: this.createAuthError('Limit emaili został przekroczony. Odczekaj chwilę i spróbuj ponownie.'),
                };
            }
            return { user: null, session: null, error: error as AuthError };
        }
    }

    /**
     * Sign in with email and password
     */
    async login(emailOrUsername: string, password: string): Promise<AuthResponse> {
        try {
            const identifier = emailOrUsername.trim().toLowerCase();
            let email = identifier;

            // Allow login with username as well.
            if (!identifier.includes('@')) {
                const username = this.normalizeUsername(identifier);
                if (!this.isValidUsername(username)) {
                    return {
                        user: null,
                        session: null,
                        error: this.createAuthError('Podaj poprawny email lub nazwę użytkownika'),
                    };
                }

                const { data: userByUsername, error: userLookupError } = await (supabase as any)
                    .from('users')
                    .select('email')
                    .eq('username', username)
                    .maybeSingle();

                if (userLookupError || !userByUsername?.email) {
                    return {
                        user: null,
                        session: null,
                        error: this.createAuthError('Nieprawidłowe dane logowania'),
                    };
                }

                email = userByUsername.email;
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Recover missing profile for users who registered with email confirmation
            // and did not have a session at signup-time.
            if (data.user) {
                await this.ensureUserProfile(data.user);
            }

            return { user: data.user, session: data.session, error: null };
        } catch (error) {
            return { user: null, session: null, error: error as AuthError };
        }
    }

    /**
     * Sign in with Google using Supabase OAuth
     */
    async signInWithGoogle(redirectTo?: string): Promise<AuthResponse> {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    ...(redirectTo ? { redirectTo } : {}),
                    skipBrowserRedirect: true, // We'll handle the browser ourselves
                },
            });

            if (error) throw error;

            // Return the OAuth URL for the app to open
            return {
                user: null,
                session: null,
                error: null,
                data: { url: data.url }
            };
        } catch (error) {
            return { user: null, session: null, error: error as AuthError };
        }
    }

    /**
     * Complete OAuth sign in from callback URL
     */
    async completeOAuthSignIn(callbackUrl: string): Promise<{ error: AuthError | Error | null }> {
        try {
            const [, hash = ''] = callbackUrl.split('#');
            const queryPart = callbackUrl.includes('?')
                ? callbackUrl.split('?')[1].split('#')[0]
                : '';

            const queryParams = new URLSearchParams(queryPart);
            const hashParams = new URLSearchParams(hash);

            const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
            const oauthError = hashParams.get('error_description') || queryParams.get('error_description');

            if (oauthError) {
                return { error: new Error(oauthError) };
            }

            if (!accessToken || !refreshToken) {
                return { error: new Error('Brak tokenów logowania z Google') };
            }

            const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
            });

            if (error) {
                return { error };
            }

            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    }

    /**
     * Sign out the current user
     */
    async logout(): Promise<{ error: AuthError | null }> {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error: error as AuthError };
        }
    }

    /**
     * Get the current user
     */
    async getCurrentUser(): Promise<User | null> {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            return user;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    /**
     * Get the current session
     */
    async getCurrentSession(): Promise<Session | null> {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            return session;
        } catch (error) {
            console.error('Error getting current session:', error);
            return null;
        }
    }

    /**
     * Ensure user profile exists (for OAuth users)
     * Creates a profile if it doesn't exist
     */
    async ensureUserProfile(user: User): Promise<void> {
        try {
            // Check if profile exists
            const { data: existingProfile } = await (supabase as any)
                .from('users')
                .select('id')
                .eq('id', user.id)
                .single();

            // If profile doesn't exist, create it
            if (!existingProfile) {
                const name = user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    user.email?.split('@')[0] ||
                    'User';

                const avatar_url = user.user_metadata?.avatar_url ||
                    user.user_metadata?.picture ||
                    null;

                // Reuse preferred username from signup metadata if present.
                const preferredUsername = this.normalizeUsername(user.user_metadata?.username || '');

                // Generate a base username
                let baseUsername = this.isValidUsername(preferredUsername)
                    ? preferredUsername
                    : (user.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'user');
                if (baseUsername.length < 3) baseUsername = baseUsername + '123';

                let username = baseUsername;
                let isAvailable = await this.checkUsernameAvailability(username);
                let counter = 1;

                // If taken, append numbers until found
                while (!isAvailable && counter < 20) { // Limit attempts
                    username = `${baseUsername}${Math.floor(Math.random() * 10000)}`;
                    isAvailable = await this.checkUsernameAvailability(username);
                    counter++;
                }

                // If still not available after attempts, use timestamp
                if (!isAvailable) {
                    username = `${baseUsername}${Date.now().toString().slice(-4)}`;
                }

                const { error: profileError } = await (supabase as any)
                    .from('users')
                    .insert({
                        id: user.id,
                        email: user.email!,
                        name,
                        username,
                        avatar_url,
                    });

                if (profileError) {
                    console.error('Error creating user profile:', profileError);
                }
            }
        } catch (error) {
            console.error('Error ensuring user profile:', error);
        }
    }

    /**
     * Get user profile from users table
     */
    async getUserProfile(userId: string): Promise<UserProfile | null> {
        try {
            const { data, error } = await (supabase as any)
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    }

    /**
     * Update user profile
     */
    async updateUserProfile(userId: string, updates: { name?: string; avatar_url?: string }) {
        try {
            const { data, error } = await (supabase as any)
                .from('users')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    }

    /**
     * Send password reset email
     */
    async resetPassword(email: string): Promise<{ error: AuthError | null }> {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error: error as AuthError };
        }
    }

    /**
     * Resend signup confirmation email
     */
    async resendSignupConfirmation(email: string): Promise<{ error: AuthError | null }> {
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
            });
            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error: error as AuthError };
        }
    }

    /**
     * Update user password
     */
    async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });
            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error: error as AuthError };
        }
    }

    /**
     * Listen to auth state changes
     */
    onAuthStateChange(callback: (event: string, session: Session | null) => void) {
        return supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
    }
}

export const authService = new AuthService();
