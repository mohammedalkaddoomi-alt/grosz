import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useDrawer } from '../contexts/DrawerContext';
import { useTheme } from '../contexts/ThemeContext';
import { useStore } from '../store/store';
import { Spacing, BorderRadius, Colors } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;

interface NavItem {
    key: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconActive: keyof typeof Ionicons.glyphMap;
    route: string;
    group: 'main' | 'tools' | 'account';
}

const NAV_ITEMS: NavItem[] = [
    { key: 'home', label: 'Główna', icon: 'home-outline', iconActive: 'home', route: '/(tabs)', group: 'main' },
    { key: 'wallets', label: 'Portfele', icon: 'wallet-outline', iconActive: 'wallet', route: '/(tabs)/wallets', group: 'main' },
    { key: 'transactions', label: 'Transakcje', icon: 'receipt-outline', iconActive: 'receipt', route: '/(tabs)/transactions', group: 'main' },
    { key: 'goals', label: 'Cele', icon: 'flag-outline', iconActive: 'flag', route: '/(tabs)/goals', group: 'main' },
    { key: 'add', label: 'Nowy wpis', icon: 'add-circle-outline', iconActive: 'add-circle', route: '/(tabs)/add', group: 'tools' },
    { key: 'analytics', label: 'Analiza', icon: 'bar-chart-outline', iconActive: 'bar-chart', route: '/(tabs)/analytics', group: 'tools' },
    { key: 'chat', label: 'Asystent AI', icon: 'sparkles-outline', iconActive: 'sparkles', route: '/(tabs)/chat', group: 'tools' },
    { key: 'profile', label: 'Profil', icon: 'person-outline', iconActive: 'person', route: '/(tabs)/profile', group: 'account' },
    { key: 'settings', label: 'Ustawienia', icon: 'settings-outline', iconActive: 'settings', route: '/(tabs)/settings', group: 'account' },
    { key: 'customize', label: 'Wygląd', icon: 'color-palette-outline', iconActive: 'color-palette', route: '/(tabs)/customize', group: 'account' },
];

const GROUP_LABELS: Record<string, string> = {
    main: 'Nawigacja',
    tools: 'Narzędzia',
    account: 'Konto',
};

export const DrawerMenu: React.FC = () => {
    const { progress, closeDrawer } = useDrawer();
    const { colors, fontFamily, scaleFont } = useTheme();
    const { user, walletInvitations } = useStore();
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const pendingInvitations = walletInvitations?.length || 0;

    const styles = useMemo(() => getStyles(colors, fontFamily, scaleFont, insets), [colors, fontFamily, scaleFont, insets]);

    // Backdrop animation
    const backdropStyle = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, 1], [0, 0.5], Extrapolation.CLAMP),
        pointerEvents: progress.value > 0.01 ? 'auto' as const : 'none' as const,
    }));

    // Drawer slide animation
    const drawerStyle = useAnimatedStyle(() => ({
        transform: [{
            translateX: interpolate(progress.value, [0, 1], [-DRAWER_WIDTH, 0], Extrapolation.CLAMP),
        }],
    }));

    const isActive = (route: string) => {
        if (route === '/(tabs)') return pathname === '/' || pathname === '/(tabs)' || pathname === '/index';
        return pathname.includes(route.replace('/(tabs)', ''));
    };

    const navigate = (route: string) => {
        closeDrawer();
        setTimeout(() => {
            router.push(route as any);
        }, 100);
    };

    // Group items
    const grouped = useMemo(() => {
        const groups: Record<string, NavItem[]> = {};
        for (const item of NAV_ITEMS) {
            if (!groups[item.group]) groups[item.group] = [];
            groups[item.group].push(item);
        }
        return groups;
    }, []);

    return (
        <>
            {/* Backdrop */}
            <Animated.View style={[styles.backdrop, backdropStyle]}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFillObject}
                    activeOpacity={1}
                    onPress={closeDrawer}
                />
            </Animated.View>

            {/* Drawer */}
            <Animated.View style={[styles.drawer, drawerStyle]}>
                {/* User Header */}
                <View style={styles.userSection}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName} numberOfLines={1}>
                            {user?.name || 'Użytkownik'}
                        </Text>
                        <Text style={styles.userEmail} numberOfLines={1}>
                            {user?.email || ''}
                        </Text>
                    </View>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Navigation Groups */}
                <View style={styles.navGroups}>
                    {Object.entries(grouped).map(([groupKey, items]) => (
                        <View key={groupKey} style={styles.navGroup}>
                            <Text style={styles.groupLabel}>{GROUP_LABELS[groupKey]}</Text>
                            {items.map((item) => {
                                const active = isActive(item.route);
                                return (
                                    <TouchableOpacity
                                        key={item.key}
                                        style={[styles.navItem, active && styles.navItemActive]}
                                        onPress={() => navigate(item.route)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={{ position: 'relative' }}>
                                            <Ionicons
                                                name={active ? item.iconActive : item.icon}
                                                size={20}
                                                color={active ? colors.primary : colors.textLight}
                                            />
                                            {item.key === 'wallets' && pendingInvitations > 0 && (
                                                <View style={styles.badge}>
                                                    <Text style={styles.badgeText}>{pendingInvitations > 9 ? '9+' : pendingInvitations}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                                            {item.label}
                                        </Text>
                                        {item.key === 'wallets' && pendingInvitations > 0 && (
                                            <View style={styles.badgePill}>
                                                <Text style={styles.badgePillText}>{pendingInvitations} {pendingInvitations === 1 ? 'zaproszenie' : 'zaproszeń'}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ))}
                </View>

                {/* App Footer */}
                <View style={styles.footer}>
                    <Text style={styles.appName}>Cenny Grosz</Text>
                    <Text style={styles.appVersion}>v1.0.0</Text>
                </View>
            </Animated.View>
        </>
    );
};

const getStyles = (
    colors: any,
    fontFamily: string | undefined,
    scaleFont: (size: number) => number,
    insets: { top: number; bottom: number },
) =>
    StyleSheet.create({
        backdrop: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: '#000',
            zIndex: 90,
        },
        drawer: {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: DRAWER_WIDTH,
            backgroundColor: colors.card,
            zIndex: 100,
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.lg,
            borderTopRightRadius: 24,
            borderBottomRightRadius: 24,
            shadowColor: '#000',
            shadowOffset: { width: 4, height: 0 },
            shadowOpacity: 0.08,
            shadowRadius: 24,
            elevation: 20,
        },
        userSection: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: Spacing.xl,
            paddingBottom: Spacing.lg,
        },
        avatarCircle: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
        },
        avatarText: {
            fontSize: scaleFont(20),
            fontWeight: '700',
            color: '#FFFFFF',
            fontFamily,
        },
        userInfo: {
            flex: 1,
            marginLeft: Spacing.md,
        },
        userName: {
            fontSize: scaleFont(17),
            fontWeight: '700',
            color: colors.text,
            letterSpacing: -0.3,
            fontFamily,
        },
        userEmail: {
            fontSize: scaleFont(13),
            color: colors.textLight,
            marginTop: 2,
            fontFamily,
        },
        divider: {
            height: 1,
            backgroundColor: colors.borderLight,
            marginHorizontal: Spacing.xl,
        },
        navGroups: {
            flex: 1,
            paddingTop: Spacing.md,
        },
        navGroup: {
            marginBottom: Spacing.md,
        },
        groupLabel: {
            fontSize: scaleFont(11),
            fontWeight: '600',
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            paddingHorizontal: Spacing.xl,
            paddingVertical: Spacing.sm,
            fontFamily,
        },
        navItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: Spacing.xl,
            marginHorizontal: Spacing.sm,
            borderRadius: BorderRadius.md,
        },
        navItemActive: {
            backgroundColor: `${colors.primary}10`,
        },
        navLabel: {
            fontSize: scaleFont(15),
            fontWeight: '500',
            color: colors.textLight,
            marginLeft: Spacing.md,
            fontFamily,
        },
        navLabelActive: {
            color: colors.primary,
            fontWeight: '600',
        },
        footer: {
            paddingHorizontal: Spacing.xl,
            paddingTop: Spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.borderLight,
        },
        appName: {
            fontSize: scaleFont(14),
            fontWeight: '600',
            color: colors.text,
            fontFamily,
        },
        appVersion: {
            fontSize: scaleFont(12),
            color: colors.textMuted,
            marginTop: 2,
            fontFamily,
        },
        badge: {
            position: 'absolute' as const,
            top: -4,
            right: -6,
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: Colors.expense,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
        },
        badgeText: {
            fontSize: 9,
            fontWeight: '800' as const,
            color: '#FFFFFF',
        },
        badgePill: {
            marginLeft: 'auto' as const,
            backgroundColor: Colors.expense + '18',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 10,
        },
        badgePillText: {
            fontSize: scaleFont(10),
            fontWeight: '600' as const,
            color: Colors.expense,
            fontFamily,
        },
    });
