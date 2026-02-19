import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@grosz_theme_settings';

const getThemeStorageKey = (userId?: string | null) =>
    userId ? `${THEME_STORAGE_KEY}:${userId}` : `${THEME_STORAGE_KEY}:guest`;

export type ThemeFontFamily = 'system' | 'spaceMono' | 'serif' | 'mono';
export type ThemeTextScale = 0.85 | 1 | 1.15 | 1.3;

export interface ThemeSettings {
    preset: string;
    customColors?: {
        primary?: string;
        income?: string;
        expense?: string;
        background?: string;
        card?: string;
        text?: string;
        textSecondary?: string;
        shared?: string;
    };
    fontFamily?: ThemeFontFamily;
    textScale?: ThemeTextScale;
    wallpaper?: {
        uri: string;
        opacity: number;
        blur: number;
    } | null;
}

export const defaultThemeSettings: ThemeSettings = {
    preset: 'default',
    customColors: undefined,
    fontFamily: 'system',
    textScale: 1,
    wallpaper: null,
};

export const normalizeThemeSettings = (settings?: Partial<ThemeSettings> | null): ThemeSettings => ({
    ...defaultThemeSettings,
    ...(settings || {}),
    customColors: settings?.customColors || undefined,
    fontFamily: settings?.fontFamily || defaultThemeSettings.fontFamily,
    textScale: settings?.textScale || defaultThemeSettings.textScale,
});

export const saveThemeSettings = async (settings: ThemeSettings, userId?: string | null): Promise<void> => {
    try {
        await AsyncStorage.setItem(getThemeStorageKey(userId), JSON.stringify(normalizeThemeSettings(settings)));
    } catch (error) {
        console.error('Error saving theme settings:', error);
        throw error;
    }
};

export const loadThemeSettings = async (userId?: string | null): Promise<ThemeSettings> => {
    try {
        const stored = await AsyncStorage.getItem(getThemeStorageKey(userId));
        if (stored) {
            return normalizeThemeSettings(JSON.parse(stored));
        }

        // Backward compatibility with legacy single-key storage.
        const legacyStored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (legacyStored) {
            const normalized = normalizeThemeSettings(JSON.parse(legacyStored));
            await saveThemeSettings(normalized, userId);
            await AsyncStorage.removeItem(THEME_STORAGE_KEY);
            return normalized;
        }
        return defaultThemeSettings;
    } catch (error) {
        console.error('Error loading theme settings:', error);
        return defaultThemeSettings;
    }
};

export const clearThemeSettings = async (userId?: string | null): Promise<void> => {
    try {
        await AsyncStorage.removeItem(getThemeStorageKey(userId));
    } catch (error) {
        console.error('Error clearing theme settings:', error);
        throw error;
    }
};
