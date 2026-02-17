import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeSettings, loadThemeSettings, saveThemeSettings, defaultThemeSettings, normalizeThemeSettings } from '../utils/themeStorage';
import { getThemePreset } from '../constants/themePresets';
import { Colors as DefaultColors } from '../constants/theme';
import { useStore } from '../store/store';

const FONT_FAMILY_MAP: Record<NonNullable<ThemeSettings['fontFamily']>, string | undefined> = {
    system: undefined,
    spaceMono: 'SpaceMono',
    serif: 'serif',
    mono: 'monospace',
};

interface ThemeContextType {
    settings: ThemeSettings;
    colors: typeof DefaultColors;
    fontFamily?: string;
    scaleFont: (size: number) => number;
    updateTheme: (settings: Partial<ThemeSettings>) => Promise<void>;
    resetTheme: () => Promise<void>;
    isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [settings, setSettings] = useState<ThemeSettings>(defaultThemeSettings);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    // Subscribe only to auth identity changes to avoid re-rendering the whole app on every store update.
    useEffect(() => {
        const readUserId = () => {
            const state = (useStore as any).getState?.();
            const loggedIn = !!state?.isLoggedIn;
            const id = state?.user?.id || null;
            setUserId(loggedIn ? id : null);
        };

        readUserId();
        const unsubscribe = (useStore as any).subscribe?.(
            (state: any) => [state?.isLoggedIn, state?.user?.id] as const,
            (next: readonly [boolean, string | null], prev: readonly [boolean, string | null]) => {
                if (next[0] !== prev[0] || next[1] !== prev[1]) {
                    setUserId(next[0] ? (next[1] || null) : null);
                }
            }
        );

        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, []);

    // Load theme on mount and whenever auth user changes
    useEffect(() => {
        void loadSavedTheme();
    }, [userId]);

    const loadSavedTheme = async () => {
        setIsLoading(true);
        try {
            const saved = await loadThemeSettings(userId);
            setSettings(saved);
        } catch (error) {
            console.error('Failed to load theme:', error);
            setSettings(defaultThemeSettings);
        } finally {
            setIsLoading(false);
        }
    };

    const updateTheme = async (newSettings: Partial<ThemeSettings>) => {
        const updated = normalizeThemeSettings({ ...settings, ...newSettings });
        setSettings(updated);
        await saveThemeSettings(updated, userId);
    };

    const resetTheme = async () => {
        setSettings(defaultThemeSettings);
        await saveThemeSettings(defaultThemeSettings, userId);
    };

    // Generate dynamic colors based on current settings
    const getColors = () => {
        const preset = getThemePreset(settings.preset);

        // Merge preset colors with custom colors
        const baseColors: typeof DefaultColors = {
            ...DefaultColors,
            ...preset.colors,
            ...(settings.customColors || {}),
        };

        return baseColors;
    };

    const colors = getColors();
    const fontFamily = FONT_FAMILY_MAP[settings.fontFamily || 'system'];
    const scaleFont = (size: number) => {
        const multiplier = settings.textScale || 1;
        return Math.max(10, Math.round(size * multiplier));
    };

    return (
        <ThemeContext.Provider value={{ settings, colors, fontFamily, scaleFont, updateTheme, resetTheme, isLoading }}>
            {children}
        </ThemeContext.Provider>
    );
};
