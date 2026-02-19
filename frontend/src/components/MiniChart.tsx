import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, BorderRadius, Shadows } from '../constants/theme';

export interface ChartDataPoint {
    label: string;
    value: number;
    color?: string;
}

interface MiniChartProps {
    data: ChartDataPoint[];
    title?: string;
    unit?: string;
    accentColor?: string;
    height?: number;
}

const AnimatedBar: React.FC<{
    heightPx: number;
    isActive: boolean;
    isNeighbor: boolean;
    isAnyActive: boolean;
    accentColor: string;
    foreground: string;
}> = ({ heightPx, isActive, isNeighbor, isAnyActive, accentColor, foreground }) => {
    const barStyle = useAnimatedStyle(() => ({
        height: withSpring(heightPx, { damping: 18, stiffness: 160 }),
        transform: [
            { scaleX: withSpring(isActive ? 1.15 : isNeighbor ? 1.05 : 1, { damping: 16, stiffness: 200 }) },
        ],
    }));

    const opacity = isActive ? 1 : isNeighbor ? 0.5 : isAnyActive ? 0.15 : 0.5;
    const bgColor = accentColor;

    return (
        <Animated.View
            style={[
                barStyle,
                {
                    width: '100%',
                    minHeight: 6,
                    borderRadius: 100,
                    backgroundColor: bgColor,
                    opacity,
                },
            ]}
        />
    );
};

export const MiniChart: React.FC<MiniChartProps> = ({
    data,
    title = 'Aktywność',
    unit = 'zł',
    accentColor,
    height = 96,
}) => {
    const { colors, fontFamily, scaleFont } = useTheme();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const styles = useMemo(() => getStyles(colors, fontFamily, scaleFont), [colors, fontFamily, scaleFont]);

    const maxValue = Math.max(...data.map((d) => d.value), 1);
    const totalValue = data.reduce((acc, d) => acc + d.value, 0);
    const accent = accentColor || colors.primary;

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={[styles.dot, { backgroundColor: accent }]} />
                    <Text style={styles.headerLabel}>{title}</Text>
                </View>
                <Text style={[styles.headerValue, activeIndex !== null && { opacity: 1, color: colors.text }]}>
                    {activeIndex !== null
                        ? data[activeIndex].value.toLocaleString('pl-PL')
                        : totalValue.toLocaleString('pl-PL')}
                    <Text style={styles.headerUnit}> {unit}</Text>
                </Text>
            </View>

            {/* Chart bars */}
            <View style={[styles.chartArea, { height }]}>
                {data.map((item, index) => {
                    const heightPx = (item.value / maxValue) * height;
                    const isActive = activeIndex === index;
                    const isAnyActive = activeIndex !== null;
                    const isNeighbor = activeIndex !== null && (index === activeIndex - 1 || index === activeIndex + 1);

                    return (
                        <TouchableOpacity
                            key={index}
                            style={styles.barColumn}
                            onPressIn={() => setActiveIndex(index)}
                            onPressOut={() => setActiveIndex(null)}
                            activeOpacity={1}
                        >
                            <View style={styles.barWrapper}>
                                <AnimatedBar
                                    heightPx={heightPx}
                                    isActive={isActive}
                                    isNeighbor={isNeighbor}
                                    isAnyActive={isAnyActive}
                                    accentColor={item.color || accent}
                                    foreground={colors.text}
                                />
                            </View>
                            <Text style={[styles.barLabel, isActive && { color: colors.text, fontWeight: '700' }]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const getStyles = (colors: any, fontFamily: string | undefined, scaleFont: (s: number) => number) =>
    StyleSheet.create({
        container: {
            borderRadius: 20,
            padding: Spacing.lg + 2,
            ...Shadows.small,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: Spacing.lg,
        },
        headerLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
        },
        dot: {
            width: 8,
            height: 8,
            borderRadius: 4,
        },
        headerLabel: {
            fontSize: scaleFont(11),
            fontWeight: '600',
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            fontFamily,
        },
        headerValue: {
            fontSize: scaleFont(18),
            fontWeight: '700',
            color: colors.textMuted,
            opacity: 0.5,
            fontFamily,
        },
        headerUnit: {
            fontSize: scaleFont(12),
            fontWeight: '500',
            color: colors.textMuted,
        },
        chartArea: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: Spacing.sm,
        },
        barColumn: {
            flex: 1,
            maxWidth: 48,
            alignItems: 'center',
        },
        barWrapper: {
            width: '100%',
            justifyContent: 'flex-end',
            flex: 1,
        },
        barLabel: {
            fontSize: scaleFont(10),
            fontWeight: '500',
            color: colors.textMuted,
            marginTop: 6,
            fontFamily,
        },
    });
