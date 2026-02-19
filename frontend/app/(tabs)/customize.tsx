import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../src/contexts/ThemeContext';
import { themePresets } from '../../src/constants/themePresets';
import { Gradients, Shadows, BorderRadius, Spacing } from '../../src/constants/theme';
import { AnimatedCard, AnimatedButton } from '../../src/components/AnimatedComponents';
import { haptics } from '../../src/utils/haptics';

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
            {settings.wallpaper && (
                <Image
                    source={{ uri: settings.wallpaper.uri }}
                    style={[styles.wallpaper, { opacity: settings.wallpaper.opacity }]}
                    blurRadius={settings.wallpaper.blur}
                />
            )}

            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Personalizacja</Text>
                <Text style={[styles.subtitle, { color: colors.textLight }]}>Dostosuj wygląd aplikacji</Text>
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

                {/* Wallpaper */}
                <AnimatedCard entrance="slideUp" delay={220}>
                    <View style={[styles.section, { backgroundColor: colors.card }]}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="image" size={24} color={colors.primary} />
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tapeta</Text>
                        </View>

                        {settings.wallpaper ? (
                            <View style={styles.wallpaperPreview}>
                                <Image source={{ uri: settings.wallpaper.uri }} style={styles.wallpaperImage} />
                                <View style={styles.wallpaperControls}>
                                    <View style={styles.opacityControl}>
                                        <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>
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
                                    <TouchableOpacity
                                        style={[styles.removeBtn, { backgroundColor: colors.expenseLight }]}
                                        onPress={handleRemoveWallpaper}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={colors.expense} />
                                        <Text style={[styles.removeBtnText, { color: colors.expense }]}>Usuń</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.addWallpaperBtn} onPress={handleWallpaperPick}>
                                <LinearGradient colors={Gradients.primary} style={styles.addWallpaperGradient}>
                                    <Ionicons name="add-circle-outline" size={32} color="#FFF" />
                                    <Text style={styles.addWallpaperText}>Dodaj tapetę</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                </AnimatedCard>

                {/* Preview */}
                <AnimatedCard entrance="slideUp" delay={280}>
                    <View style={[styles.section, { backgroundColor: colors.card }]}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="eye-outline" size={24} color={colors.primary} />
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Podgląd</Text>
                        </View>
                        <View style={styles.previewContainer}>
                            <LinearGradient colors={[colors.primary, colors.shared]} style={styles.previewCard}>
                                <Text style={styles.previewAmount}>12,450 zł</Text>
                                <Text style={styles.previewLabel}>Całkowity bilans</Text>
                            </LinearGradient>
                            <View style={styles.previewActions}>
                                <View style={[styles.previewAction, { backgroundColor: colors.incomeLight }]}>
                                    <Ionicons name="arrow-down" size={20} color={colors.income} />
                                    <Text style={[styles.previewActionText, { color: colors.income }]}>Przychód</Text>
                                </View>
                                <View style={[styles.previewAction, { backgroundColor: colors.expenseLight }]}>
                                    <Ionicons name="arrow-up" size={20} color={colors.expense} />
                                    <Text style={[styles.previewActionText, { color: colors.expense }]}>Wydatek</Text>
                                </View>
                            </View>
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

                <View style={{ height: 100 }} />
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
    header: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
    title: { fontSize: scaleFont(30), fontWeight: '800', letterSpacing: -0.8, fontFamily },
    subtitle: { fontSize: scaleFont(15), marginTop: 6, fontWeight: '500', fontFamily },
    scrollContent: { flex: 1, paddingHorizontal: Spacing.xl },
    section: {
        borderRadius: 20,
        padding: Spacing.lg + 2,
        marginBottom: Spacing.md,
        ...Shadows.medium,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
    sectionTitle: { fontSize: scaleFont(19), fontWeight: '800', letterSpacing: -0.5, fontFamily },
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
    wallpaperPreview: { gap: Spacing.md },
    wallpaperImage: {
        width: '100%',
        height: 200,
        borderRadius: BorderRadius.lg,
    },
    wallpaperControls: { gap: Spacing.md },
    opacityControl: { gap: Spacing.sm },
    controlLabel: { fontSize: scaleFont(14), fontWeight: '600', fontFamily },
    sliderContainer: {
        flexDirection: 'row',
        gap: Spacing.md,
        alignItems: 'center',
    },
    sliderDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    removeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
    },
    removeBtnText: { fontSize: scaleFont(15), fontWeight: '700', fontFamily },
    addWallpaperBtn: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
    addWallpaperGradient: {
        padding: Spacing.xxl,
        alignItems: 'center',
        gap: Spacing.sm,
    },
    addWallpaperText: { fontSize: scaleFont(16), fontWeight: '700', color: '#FFF', fontFamily },
    previewContainer: { gap: Spacing.md },
    previewCard: {
        padding: Spacing.xxl,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
    },
    previewAmount: { fontSize: scaleFont(36), fontWeight: '900', color: '#FFF', letterSpacing: -1, fontFamily },
    previewLabel: { fontSize: scaleFont(14), color: 'rgba(255,255,255,0.8)', marginTop: 4, fontFamily },
    previewActions: { flexDirection: 'row', gap: Spacing.md },
    previewAction: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
    },
    previewActionText: { fontSize: scaleFont(15), fontWeight: '700', fontFamily },
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
