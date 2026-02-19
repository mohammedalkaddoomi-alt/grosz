import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, Shadows, BorderRadius } from '../constants/theme';

export interface DonutSegment {
    value: number;
    color: string;
    label: string;
    emoji?: string;
}

interface DonutChartProps {
    data: DonutSegment[];
    size?: number;
    strokeWidth?: number;
    title?: string;
    centerLabel?: string;
    centerValue?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
    data,
    size = 200,
    strokeWidth = 24,
    title,
    centerLabel,
    centerValue,
}) => {
    const { colors, fontFamily, scaleFont } = useTheme();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const animProgress = useRef(new Animated.Value(0)).current;
    const styles = useMemo(() => getStyles(colors, fontFamily, scaleFont), [colors, fontFamily, scaleFont]);

    const totalValue = useMemo(() => data.reduce((sum, s) => sum + s.value, 0), [data]);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const centerX = size / 2;
    const centerY = size / 2;

    useEffect(() => {
        animProgress.setValue(0);
        Animated.timing(animProgress, {
            toValue: 1,
            duration: 1000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, [data]);

    // Pre-compute segments
    const segments = useMemo(() => {
        let cumulative = 0;
        return data
            .filter((s) => s.value > 0)
            .map((segment) => {
                const pct = totalValue > 0 ? (segment.value / totalValue) * 100 : 0;
                const dashArray = (pct / 100) * circumference;
                const dashOffset = -(cumulative / 100) * circumference;
                cumulative += pct;
                return { ...segment, pct, dashArray, dashOffset };
            });
    }, [data, totalValue, circumference]);

    const activeSegment = activeIndex !== null ? segments[activeIndex] : null;
    const displayValue = activeSegment
        ? activeSegment.value.toLocaleString('pl-PL')
        : centerValue || totalValue.toLocaleString('pl-PL');
    const displayLabel = activeSegment
        ? activeSegment.label
        : centerLabel || 'Razem';

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            {title && <Text style={styles.title}>{title}</Text>}

            <View style={styles.chartRow}>
                {/* SVG Donut */}
                <View style={{ width: size, height: size }}>
                    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                        {/* Background ring */}
                        <Circle
                            cx={centerX}
                            cy={centerY}
                            r={radius}
                            fill="transparent"
                            stroke={colors.borderLight || colors.border}
                            strokeWidth={strokeWidth}
                            opacity={0.3}
                        />
                        {/* Data arcs */}
                        <G rotation={-90} origin={`${centerX}, ${centerY}`}>
                            {segments.map((seg, index) => (
                                <Circle
                                    key={seg.label}
                                    cx={centerX}
                                    cy={centerY}
                                    r={radius}
                                    fill="transparent"
                                    stroke={seg.color}
                                    strokeWidth={activeIndex === index ? strokeWidth + 4 : strokeWidth}
                                    strokeDasharray={`${seg.dashArray} ${circumference}`}
                                    strokeDashoffset={seg.dashOffset}
                                    strokeLinecap="round"
                                    opacity={activeIndex !== null && activeIndex !== index ? 0.35 : 1}
                                    onPressIn={() => setActiveIndex(index)}
                                    onPressOut={() => setActiveIndex(null)}
                                />
                            ))}
                        </G>
                    </Svg>
                    {/* Center text */}
                    <View style={[styles.centerOverlay, { width: size, height: size }]}>
                        <Text style={[styles.centerValue, { color: activeSegment?.color || colors.text }]}>
                            {displayValue}
                        </Text>
                        <Text style={styles.centerLabel}>{displayLabel}</Text>
                    </View>
                </View>

                {/* Legend */}
                <View style={styles.legend}>
                    {segments.map((seg, index) => (
                        <TouchableOpacity
                            key={seg.label}
                            style={[
                                styles.legendItem,
                                activeIndex === index && { backgroundColor: colors.backgroundDark },
                            ]}
                            onPressIn={() => setActiveIndex(index)}
                            onPressOut={() => setActiveIndex(null)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.legendLabel} numberOfLines={1}>
                                    {seg.emoji ? `${seg.emoji} ` : ''}{seg.label}
                                </Text>
                            </View>
                            <Text style={styles.legendValue}>
                                {Math.round(seg.pct)}%
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
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
        title: {
            fontSize: scaleFont(13),
            fontWeight: '700',
            color: colors.text,
            marginBottom: Spacing.md,
            fontFamily,
        },
        chartRow: {
            alignItems: 'center',
            gap: Spacing.lg,
        },
        centerOverlay: {
            ...StyleSheet.absoluteFillObject,
            alignItems: 'center',
            justifyContent: 'center',
        },
        centerValue: {
            fontSize: scaleFont(22),
            fontWeight: '800',
            letterSpacing: -0.5,
            fontFamily,
        },
        centerLabel: {
            fontSize: scaleFont(11),
            fontWeight: '600',
            color: colors.textMuted,
            marginTop: 2,
            fontFamily,
        },
        legend: {
            width: '100%',
            gap: 2,
        },
        legendItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            paddingHorizontal: Spacing.sm,
            borderRadius: BorderRadius.md,
            gap: Spacing.sm,
        },
        legendDot: {
            width: 10,
            height: 10,
            borderRadius: 5,
        },
        legendLabel: {
            fontSize: scaleFont(13),
            fontWeight: '500',
            color: colors.text,
            fontFamily,
        },
        legendValue: {
            fontSize: scaleFont(13),
            fontWeight: '700',
            color: colors.textMuted,
            fontFamily,
        },
    });
