import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Asset } from 'expo-asset';
import { useTheme } from '../../src/contexts/ThemeContext';
import { themePresets } from '../../src/constants/themePresets';
import { Gradients, Shadows, BorderRadius, Spacing } from '../../src/constants/theme';
import { AnimatedCard, AnimatedButton } from '../../src/components/AnimatedComponents';
import { haptics } from '../../src/utils/haptics';
import { useDrawer } from '../../src/contexts/DrawerContext';
import { WallpaperBackground } from '../../src/components/WallpaperBackground';

// Bundled wallpaper images
const WALLPAPER_IMAGES = {
    dark_indigo: require('../../assets/wallpapers/dark_indigo.png'),
    soft_pastel: require('../../assets/wallpapers/soft_pastel.png'),
    sunset_warm: require('../../assets/wallpapers/sunset_warm.png'),
};

interface PresetWallpaper {
    id: string;
    name: string;
    type: 'image' | 'gradient';
    source?: any;
    gradient?: readonly [string, string, ...string[]];
    category: string;
}

const PRESET_WALLPAPERS: PresetWallpaper[] = [
    // Image-based presets
    { id: 'dark_indigo', name: 'Indygo', type: 'image', source: WALLPAPER_IMAGES.dark_indigo, category: 'Ciemne' },
    { id: 'soft_pastel', name: 'Pastel', type: 'image', source: WALLPAPER_IMAGES.soft_pastel, category: 'Jasne' },
    { id: 'sunset_warm', name: 'Zachód', type: 'image', source: WALLPAPER_IMAGES.sunset_warm, category: 'Ciep\u0142e' },
    // Gradient-based presets
    { id: 'ocean_deep', name: 'Ocean', type: 'gradient', gradient: ['#0F172A', '#1E3A5F', '#06B6D4'] as const, category: 'Ciemne' },
    { id: 'emerald', name: 'Szmaragd', type: 'gradient', gradient: ['#064E3B', '#059669', '#10B981'] as const, category: 'Natura' },
    { id: 'aurora', name: 'Aurora', type: 'gradient', gradient: ['#1E1B4B', '#7C3AED', '#06B6D4'] as const, category: 'Kosmiczne' },
    { id: 'noir', name: 'Noir', type: 'gradient', gradient: ['#000000', '#1E293B', '#334155'] as const, category: 'Ciemne' },
    { id: 'rose_gold', name: 'Różowe z\u0142oto', type: 'gradient', gradient: ['#FDF2F8', '#FBCFE8', '#F9A8D4'] as const, category: 'Jasne' },
    { id: 'violet_dream', name: 'Fiolet', type: 'gradient', gradient: ['#2E1065', '#7C3AED', '#A78BFA'] as const, category: 'Kosmiczne' },
];

const FONT_OPTIONS = [
    { id: 'system', name: 'System' },
    { id: 'spaceMono', name: 'Space Mono' },
    { id: 'serif', name: 'Serif' },
    { id: 'mono', name: 'Mono' },
] as const;

const TEXT_SCALE_OPTIONS = [
    { value: 0.85, label: 'Mały' },
    { value: 1, label: 'Normalny' },
    { value: 1.15, label: 'Duży' },
    { value: 1.3, label: 'XL' },
] as const;

const COLOR_PICKERS = [
    { key: 'primary', label: 'Główny' },
    { key: 'income', label: 'Przychód' },
    { key: 'expense', label: 'Wydatek' },
    { key: 'background', label: 'Tło' },
    { key: 'card', label: 'Karta' },
    { key: 'text', label: 'Tekst' },
] as const;

const COLOR_SWATCHES = ['#6366F1', '#10B981', '#EF4444', '#06B6D4', '#F59E0B', '#8B5CF6', '#0F172A', '#FFFFFF'];

const normalizeHex = (value: string) => {
    const cleaned = value.trim().replace(/[^#a-fA-F0-9]/g, '');
    if (!cleaned) return '';
    return cleaned.startsWith('#') ? cleaned.toUpperCase() : `#${cleaned.toUpperCase()}`;
};

const isHexColor = (value: string) => /^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(value);

export default function Customize() {
    const { settings, colors, fontFamily, scaleFont, updateTheme, resetTheme } = useTheme();
    const { openDrawer } = useDrawer();
    const styles = useMemo(() => getStyles(colors, fontFamily, scaleFont), [colors, fontFamily, scaleFont]);
    const [wallpaperOpacity, setWallpaperOpacity] = useState(settings.wallpaper?.opacity || 0.3);
    const [colorInputs, setColorInputs] = useState<Record<string, string>>({
        primary: settings.customColors?.primary || '',
        income: settings.customColors?.income || '',
        expense: settings.customColors?.expense || '',
        background: settings.customColors?.background || '',
        card: settings.customColors?.card || '',
        text: settings.customColors?.text || '',
    });

    const handleThemeSelect = async (presetId: string) => {
        haptics.medium();
        await updateTheme({ preset: presetId });
    };

    const handleWallpaperPick = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Brak uprawnień', 'Potrzebujemy dostępu do galerii');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [9, 16],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                haptics.success();
                await updateTheme({
                    wallpaper: {
                        uri: result.assets[0].uri,
                        opacity: wallpaperOpacity,
                        blur: 0,
                    },
                });
            }
        } catch (error) {
            Alert.alert('Błąd', 'Nie udało się wybrać zdjęcia');
        }
    };

    const handleRemoveWallpaper = async () => {
        haptics.light();
        await updateTheme({ wallpaper: null });
    };

    const handleOpacityChange = async (value: number) => {
        setWallpaperOpacity(value);
        if (settings.wallpaper) {
            await updateTheme({
                wallpaper: {
                    ...settings.wallpaper,
                    opacity: value,
                },
            });
        }
    };

    const handleFontChange = async (nextFont: 'system' | 'spaceMono' | 'serif' | 'mono') => {
        haptics.selection();
        await updateTheme({ fontFamily: nextFont });
    };

    const handleScaleChange = async (nextScale: 0.85 | 1 | 1.15 | 1.3) => {
        haptics.selection();
        await updateTheme({ textScale: nextScale });
    };

    const setCustomColor = async (key: string, value: string) => {
        const normalized = normalizeHex(value);
        if (!isHexColor(normalized)) {
            Alert.alert('Nieprawidłowy kolor', 'Podaj poprawny HEX, np. #6366F1');
            return;
        }
        haptics.selection();
        await updateTheme({
            customColors: {
                ...(settings.customColors || {}),
                [key]: normalized,
            },
        });
        setColorInputs((prev) => ({ ...prev, [key]: normalized }));
    };

    const clearCustomColors = async () => {
        haptics.light();
        await updateTheme({ customColors: undefined });
        setColorInputs({
            primary: '',
            income: '',
            expense: '',
            background: '',
            card: '',
            text: '',
        });
    };

    const handleReset = () => {
        Alert.alert(
            'Resetuj ustawienia',
            'Czy na pewno chcesz przywrócić domyślny wygląd?',
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Resetuj',
                    style: 'destructive',
                    onPress: async () => {
                        haptics.heavy();
                        await resetTheme();
                        setWallpaperOpacity(0.3);
                        setColorInputs({
                            primary: '',
                            income: '',
                            expense: '',
                            background: '',
                            card: '',
                            text: '',
                        });
                    },
                },
            ]
        );
    };

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
                    <Text style={[styles.title, { color: colors.text }]}>Personalizacja</Text>
                    <Text style={[styles.subtitle, { color: colors.textLight }]}>Dostosuj wygl\u0105d aplikacji</Text>
                </View>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Color Themes */}
                <AnimatedCard entrance="slideUp" delay={100}>
                    <View style={[styles.section, { backgroundColor: colors.card }]}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="color-palette" size={24} color={colors.primary} />
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Motyw kolorów</Text>
                        </View>
                        <View style={styles.themesGrid}>
                            {themePresets.map((preset, index) => (
                                <TouchableOpacity
                                    key={preset.id}
                                    style={[
                                        styles.themeCard,
                                        { backgroundColor: colors.backgroundDark },
                                        settings.preset === preset.id && styles.themeCardActive,
                                    ]}
                                    onPress={() => handleThemeSelect(preset.id)}
                                >
                                    <LinearGradient
                                        colors={[preset.colors.primary, preset.colors.shared]}
                                        style={styles.themePreview}
                                    >
                                        <Text style={styles.themeEmoji}>{preset.emoji}</Text>
                                    </LinearGradient>
                                    <Text style={[styles.themeName, { color: colors.text }]}>{preset.name}</Text>
                                    {settings.preset === preset.id && (
                                        <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]}>
                                            <Ionicons name="checkmark" size={16} color="#FFF" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </AnimatedCard>

                <AnimatedCard entrance="slideUp" delay={150}>
                    <View style={[styles.section, { backgroundColor: colors.card }]}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="text" size={24} color={colors.primary} />
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Typografia</Text>
                        </View>

                        <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>Czcionka</Text>
                        <View style={styles.optionRow}>
                            {FONT_OPTIONS.map((font) => {
                                const active = (settings.fontFamily || 'system') === font.id;
                                return (
                                    <TouchableOpacity
                                        key={font.id}
                                        style={[styles.optionChip, active && styles.optionChipActive]}
                                        onPress={() => handleFontChange(font.id)}
                                    >
                                        <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>{font.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={[styles.controlLabel, { color: colors.textSecondary, marginTop: Spacing.md }]}>Rozmiar tekstu</Text>
                        <View style={styles.optionRow}>
                            {TEXT_SCALE_OPTIONS.map((option) => {
                                const active = (settings.textScale || 1) === option.value;
                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[styles.optionChip, active && styles.optionChipActive]}
                                        onPress={() => handleScaleChange(option.value)}
                                    >
                                        <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </AnimatedCard>

                <AnimatedCard entrance="slideUp" delay={180}>
                    <View style={[styles.section, { backgroundColor: colors.card }]}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="color-fill-outline" size={24} color={colors.primary} />
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Kolory własne</Text>
                        </View>

                        {COLOR_PICKERS.map((item) => (
                            <View key={item.key} style={styles.colorRow}>
                                <Text style={[styles.colorLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                                <View style={styles.swatchRow}>
                                    {COLOR_SWATCHES.map((swatch) => (
                                        <TouchableOpacity
                                            key={`${item.key}-${swatch}`}
                                            style={[styles.swatch, { backgroundColor: swatch }]}
                                            onPress={() => setCustomColor(item.key, swatch)}
                                        />
                                    ))}
                                </View>
                                <View style={styles.colorInputRow}>
                                    <TextInput
                                        style={[styles.colorInput, { color: colors.text, borderColor: colors.border }]}
                                        value={colorInputs[item.key] || ''}
                                        onChangeText={(text) => setColorInputs((prev) => ({ ...prev, [item.key]: normalizeHex(text) }))}
                                        placeholder="#6366F1"
                                        placeholderTextColor={colors.textMuted}
                                        autoCapitalize="characters"
                                    />
                                    <TouchableOpacity
                                        style={[styles.applyBtn, { backgroundColor: colors.primary }]}
                                        onPress={() => setCustomColor(item.key, colorInputs[item.key] || '')}
                                    >
                                        <Text style={styles.applyBtnText}>Ustaw</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity style={[styles.clearCustomBtn, { borderColor: colors.border }]} onPress={clearCustomColors}>
                            <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
                            <Text style={[styles.clearCustomBtnText, { color: colors.textSecondary }]}>Wyczyść kolory własne</Text>
                        </TouchableOpacity>
                    </View>
                </AnimatedCard>

                {/* Wallpaper — Presets + Custom */}
                <AnimatedCard entrance="slideUp" delay={220}>
                    <View style={[styles.section, { backgroundColor: colors.card }]}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="image" size={24} color={colors.primary} />
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tapeta</Text>
                        </View>

                        {/* Active wallpaper controls */}
                        {settings.wallpaper && (
                            <View style={styles.activeWallpaperBar}>
                                {settings.wallpaper.uri.startsWith('gradient:') ? (
                                    <LinearGradient
                                        colors={settings.wallpaper.uri.replace('gradient:', '').split(',') as unknown as readonly [string, string, ...string[]]}
                                        style={styles.activeThumb}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    />
                                ) : (
                                    <Image source={{ uri: settings.wallpaper.uri }} style={styles.activeThumb} />
                                )}
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.controlLabel, { color: colors.textSecondary, marginBottom: 4 }]}>
                                        Przezroczystość: {Math.round(wallpaperOpacity * 100)}%
                                    </Text>
                                    <View style={styles.sliderContainer}>
                                        {[0.1, 0.2, 0.3, 0.4, 0.5].map((value) => (
                                            <TouchableOpacity
                                                key={value}
                                                style={[
                                                    styles.sliderDot,
                                                    { backgroundColor: colors.borderLight },
                                                    wallpaperOpacity === value && { backgroundColor: colors.primary },
                                                ]}
                                                onPress={() => handleOpacityChange(value)}
                                            />
                                        ))}
                                    </View>
                                </View>
                                <TouchableOpacity onPress={handleRemoveWallpaper} style={styles.removeIconBtn}>
                                    <Ionicons name="close-circle" size={24} color={colors.expense} />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Preset wallpapers grid */}
                        <Text style={[styles.controlLabel, { color: colors.textSecondary, marginBottom: Spacing.sm }]}>
                            Gotowe tapety
                        </Text>
                        <View style={styles.presetGrid}>
                            {PRESET_WALLPAPERS.map((wallpaper) => (
                                <TouchableOpacity
                                    key={wallpaper.id}
                                    style={styles.presetCard}
                                    onPress={async () => {
                                        haptics.medium();
                                        if (wallpaper.type === 'image' && wallpaper.source) {
                                            const asset = Asset.fromModule(wallpaper.source);
                                            await asset.downloadAsync();
                                            await updateTheme({
                                                wallpaper: {
                                                    uri: asset.localUri || asset.uri,
                                                    opacity: wallpaperOpacity,
                                                    blur: 0,
                                                },
                                            });
                                        } else if (wallpaper.type === 'gradient' && wallpaper.gradient) {
                                            // For gradients, we store a special URI format
                                            await updateTheme({
                                                wallpaper: {
                                                    uri: `gradient:${wallpaper.gradient.join(',')}`,
                                                    opacity: wallpaperOpacity,
                                                    blur: 0,
                                                },
                                            });
                                        }
                                    }}
                                    activeOpacity={0.7}
                                >
                                    {wallpaper.type === 'image' ? (
                                        <Image source={wallpaper.source} style={styles.presetImage} />
                                    ) : (
                                        <LinearGradient
                                            colors={wallpaper.gradient as unknown as readonly [string, string, ...string[]]}
                                            style={styles.presetGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        />
                                    )}
                                    <Text style={[styles.presetName, { color: colors.text }]}>{wallpaper.name}</Text>
                                    <Text style={[styles.presetCategory, { color: colors.textMuted }]}>{wallpaper.category}</Text>
                                </TouchableOpacity>
                            ))}

                            {/* Custom image picker tile */}
                            <TouchableOpacity style={styles.presetCard} onPress={handleWallpaperPick} activeOpacity={0.7}>
                                <View style={[styles.customPickerTile, { backgroundColor: colors.backgroundDark, borderColor: colors.border }]}>
                                    <Ionicons name="add-outline" size={28} color={colors.primary} />
                                </View>
                                <Text style={[styles.presetName, { color: colors.primary }]}>Własna</Text>
                                <Text style={[styles.presetCategory, { color: colors.textMuted }]}>Z galerii</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </AnimatedCard>

                {/* Reset Button */}
                <TouchableOpacity
                    onPress={handleReset}
                    style={styles.resetBtn}
                >
                    <View style={[styles.resetBtnInner, { backgroundColor: colors.card }]}>
                        <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
                        <Text style={[styles.resetBtnText, { color: colors.textSecondary }]}>
                            Przywróć domyślne ustawienia
                        </Text>
                    </View>
                </TouchableOpacity>

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (colors: any, fontFamily: string | undefined, scaleFont: (size: number) => number) => StyleSheet.create({
    container: { flex: 1 },
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
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
    },
    hamburger: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        marginRight: Spacing.sm,
    },
    title: { fontSize: scaleFont(24), fontWeight: '800', letterSpacing: -0.8, fontFamily },
    subtitle: { fontSize: scaleFont(14), marginTop: 4, fontWeight: '500', fontFamily },
    scrollContent: { flex: 1, paddingHorizontal: Spacing.xl },
    section: {
        borderRadius: 20,
        padding: Spacing.lg + 2,
        marginBottom: Spacing.md,
        ...Shadows.medium,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
    sectionTitle: { fontSize: scaleFont(17), fontWeight: '700', letterSpacing: -0.3, fontFamily },
    themesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    themeCard: {
        width: '30%',
        aspectRatio: 1,
        borderRadius: BorderRadius.lg,
        padding: Spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    themeCardActive: {
        borderWidth: 2,
        borderColor: colors.primary,
    },
    themePreview: {
        width: 56,
        height: 56,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    themeEmoji: { fontSize: scaleFont(28) },
    themeName: { fontSize: scaleFont(12), fontWeight: '600', textAlign: 'center', fontFamily },
    activeIndicator: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    optionChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        backgroundColor: colors.backgroundDark,
    },
    optionChipActive: { backgroundColor: colors.primary },
    optionChipText: { fontSize: scaleFont(13), color: colors.text, fontWeight: '600', fontFamily },
    optionChipTextActive: { color: colors.white },
    colorRow: {
        marginBottom: Spacing.md,
        paddingBottom: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    colorLabel: { fontSize: scaleFont(14), fontWeight: '700', marginBottom: Spacing.sm, fontFamily },
    swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
    swatch: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: colors.border },
    colorInputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    colorInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: scaleFont(14),
        fontFamily,
    },
    applyBtn: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    applyBtnText: { color: '#FFF', fontWeight: '700', fontSize: scaleFont(13), fontFamily },
    clearCustomBtn: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    clearCustomBtnText: { fontSize: scaleFont(13), fontWeight: '600', fontFamily },

    /* ── Wallpaper Presets ── */
    activeWallpaperBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundDark,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
        gap: Spacing.md,
    },
    activeThumb: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.md,
    },
    removeIconBtn: {
        padding: 4,
    },
    controlLabel: { fontSize: scaleFont(14), fontWeight: '600', fontFamily },
    sliderContainer: {
        flexDirection: 'row',
        gap: Spacing.sm,
        alignItems: 'center',
    },
    sliderDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    presetGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    presetCard: {
        width: '30%',
        alignItems: 'center',
    },
    presetImage: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.xs,
    },
    presetGradient: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.xs,
    },
    presetName: {
        fontSize: scaleFont(12),
        fontWeight: '600',
        textAlign: 'center',
        fontFamily,
    },
    presetCategory: {
        fontSize: scaleFont(10),
        fontWeight: '500',
        textAlign: 'center',
        marginTop: 1,
        fontFamily,
    },
    customPickerTile: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.xs,
        borderWidth: 2,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },

    resetBtn: { marginTop: Spacing.md },
    resetBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        ...Shadows.small,
    },
    resetBtnText: { fontSize: scaleFont(15), fontWeight: '600', fontFamily },
});
