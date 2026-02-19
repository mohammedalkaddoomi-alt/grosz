// Theme presets with beautiful color combinations

export interface ThemePreset {
    id: string;
    name: string;
    emoji: string;
    colors: {
        primary: string;
        primaryDark: string;
        income: string;
        expense: string;
        background: string;
        backgroundDark: string;
        card: string;
        text: string;
        textSecondary: string;
        shared: string;
    };
}

export const themePresets: ThemePreset[] = [
    {
        id: 'default',
        name: 'Domyślny',
        emoji: '💙',
        colors: {
            primary: '#6366F1',
            primaryDark: '#4F46E5',
            income: '#10B981',
            expense: '#EF4444',
            background: '#F8FAFC',
            backgroundDark: '#F1F5F9',
            card: '#FFFFFF',
            text: '#0F172A',
            textSecondary: '#334155',
            shared: '#8B5CF6',
        },
    },
    {
        id: 'dark',
        name: 'Ciemny',
        emoji: '🌙',
        colors: {
            primary: '#818CF8',
            primaryDark: '#6366F1',
            income: '#34D399',
            expense: '#F87171',
            background: '#0F172A',
            backgroundDark: '#1E293B',
            card: '#1E293B',
            text: '#F8FAFC',
            textSecondary: '#CBD5E1',
            shared: '#A78BFA',
        },
    },
    {
        id: 'ocean',
        name: 'Ocean',
        emoji: '🌊',
        colors: {
            primary: '#0EA5E9',
            primaryDark: '#0284C7',
            income: '#14B8A6',
            expense: '#F43F5E',
            background: '#F0F9FF',
            backgroundDark: '#E0F2FE',
            card: '#FFFFFF',
            text: '#0C4A6E',
            textSecondary: '#075985',
            shared: '#06B6D4',
        },
    },
    {
        id: 'sunset',
        name: 'Zachód słońca',
        emoji: '🌅',
        colors: {
            primary: '#F59E0B',
            primaryDark: '#D97706',
            income: '#10B981',
            expense: '#DC2626',
            background: '#FFFBEB',
            backgroundDark: '#FEF3C7',
            card: '#FFFFFF',
            text: '#78350F',
            textSecondary: '#92400E',
            shared: '#F97316',
        },
    },
    {
        id: 'forest',
        name: 'Las',
        emoji: '🌲',
        colors: {
            primary: '#059669',
            primaryDark: '#047857',
            income: '#10B981',
            expense: '#DC2626',
            background: '#F0FDF4',
            backgroundDark: '#DCFCE7',
            card: '#FFFFFF',
            text: '#064E3B',
            textSecondary: '#065F46',
            shared: '#14B8A6',
        },
    },
    {
        id: 'rose',
        name: 'Róża',
        emoji: '🌹',
        colors: {
            primary: '#E11D48',
            primaryDark: '#BE123C',
            income: '#10B981',
            expense: '#DC2626',
            background: '#FFF1F2',
            backgroundDark: '#FFE4E6',
            card: '#FFFFFF',
            text: '#881337',
            textSecondary: '#9F1239',
            shared: '#EC4899',
        },
    },
    {
        id: 'purple',
        name: 'Fiolet',
        emoji: '💜',
        colors: {
            primary: '#9333EA',
            primaryDark: '#7E22CE',
            income: '#10B981',
            expense: '#DC2626',
            background: '#FAF5FF',
            backgroundDark: '#F3E8FF',
            card: '#FFFFFF',
            text: '#581C87',
            textSecondary: '#6B21A8',
            shared: '#A855F7',
        },
    },
];

export const getThemePreset = (id: string): ThemePreset => {
    return themePresets.find(preset => preset.id === id) || themePresets[0];
};
