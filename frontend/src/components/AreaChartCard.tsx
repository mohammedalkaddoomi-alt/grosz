import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Line, Circle } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, Shadows, BorderRadius } from '../constants/theme';

export interface AreaDataPoint {
    label: string;
    value: number;
}

interface AreaChartCardProps {
    data: AreaDataPoint[];
    title?: string;
    subtitle?: string;
    accentColor?: string;
    height?: number;
    unit?: string;
}

function buildPath(
    points: AreaDataPoint[],
    width: number,
    height: number,
    padding: number
): { linePath: string; areaPath: string; coords: { x: number; y: number }[] } {
    if (points.length === 0) return { linePath: '', areaPath: '', coords: [] };

    const maxVal = Math.max(...points.map((p) => p.value), 1);
    const usableW = width - padding * 2;
    const usableH = height - padding * 2;
    const stepX = points.length > 1 ? usableW / (points.length - 1) : 0;

    const coords = points.map((p, i) => ({
        x: padding + i * stepX,
        y: padding + usableH - (p.value / maxVal) * usableH,
    }));

    // Smooth curve using cubic bezier
    let linePath = `M${coords[0].x},${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
        const prev = coords[i - 1];
        const curr = coords[i];
        const cpx = (prev.x + curr.x) / 2;
        linePath += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
    }

    // Area path: line path + close bottom
    const areaPath =
        linePath +
        ` L${coords[coords.length - 1].x},${height - padding} L${coords[0].x},${height - padding} Z`;

    return { linePath, areaPath, coords };
}

export const AreaChartCard: React.FC<AreaChartCardProps> = ({
    data,
    title = 'Trend',
    subtitle,
    accentColor,
    height = 120,
    unit = 'zł',
}) => {
    const { colors, fontFamily, scaleFont } = useTheme();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const styles = useMemo(() => getStyles(colors, fontFamily, scaleFont), [colors, fontFamily, scaleFont]);

    const accent = accentColor || colors.primary;
    const chartWidth = 300; // will be scaled by viewBox
    const padding = 8;

    const { linePath, areaPath, coords } = useMemo(
        () => buildPath(data, chartWidth, height, padding),
        [data, chartWidth, height]
    );

    const totalValue = data.reduce((acc, d) => acc + d.value, 0);
    const avgValue = data.length > 0 ? totalValue / data.length : 0;
    const displayVal = activeIndex !== null ? data[activeIndex].value : totalValue;
    const displayLabel = activeIndex !== null ? data[activeIndex].label : subtitle || title;

    // Determine trend
    const firstHalf = data.slice(0, Math.ceil(data.length / 2));
    const secondHalf = data.slice(Math.ceil(data.length / 2));
    const firstAvg = firstHalf.reduce((a, d) => a + d.value, 0) / (firstHalf.length || 1);
    const secondAvg = secondHalf.reduce((a, d) => a + d.value, 0) / (secondHalf.length || 1);
    const trendPct = firstAvg > 0 ? Math.round(((secondAvg - firstAvg) / firstAvg) * 100) : 0;

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={[styles.value, { color: accent }]}>
                        {displayVal.toLocaleString('pl-PL')} {unit}
                    </Text>
                </View>
                <View style={[styles.trendBadge, { backgroundColor: trendPct >= 0 ? colors.incomeLight : colors.expenseLight }]}>
                    <Text style={[styles.trendText, { color: trendPct >= 0 ? colors.income : colors.expense }]}>
                        {trendPct >= 0 ? '↑' : '↓'} {Math.abs(trendPct)}%
                    </Text>
                </View>
            </View>

            {/* Chart SVG */}
            <View style={{ height, marginTop: Spacing.sm }}>
                <Svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`} preserveAspectRatio="none">
                    <Defs>
                        <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0%" stopColor={accent} stopOpacity={0.3} />
                            <Stop offset="100%" stopColor={accent} stopOpacity={0} />
                        </SvgGradient>
                    </Defs>

                    {/* Area fill */}
                    {areaPath ? <Path d={areaPath} fill="url(#areaGrad)" /> : null}

                    {/* Line */}
                    {linePath ? (
                        <Path d={linePath} fill="none" stroke={accent} strokeWidth={2.5} strokeLinecap="round" />
                    ) : null}

                    {/* Active dot */}
                    {activeIndex !== null && coords[activeIndex] && (
                        <>
                            <Line
                                x1={coords[activeIndex].x}
                                y1={padding}
                                x2={coords[activeIndex].x}
                                y2={height - padding}
                                stroke={colors.border}
                                strokeWidth={1}
                                strokeDasharray="4,4"
                            />
                            <Circle
                                cx={coords[activeIndex].x}
                                cy={coords[activeIndex].y}
                                r={5}
                                fill={accent}
                                stroke="#FFF"
                                strokeWidth={2}
                            />
                        </>
                    )}
                </Svg>

                {/* Touch zones */}
                <View style={styles.touchLayer}>
                    {data.map((_, i) => (
                        <TouchableOpacity
                            key={i}
                            style={{ flex: 1 }}
                            onPressIn={() => setActiveIndex(i)}
                            onPressOut={() => setActiveIndex(null)}
                            activeOpacity={1}
                        />
                    ))}
                </View>
            </View>

            {/* Footer label */}
            <View style={styles.footer}>
                <Text style={styles.footerLabel}>{displayLabel}</Text>
                <Text style={styles.footerAvg}>
                    Średnia: {avgValue.toLocaleString('pl-PL', { maximumFractionDigits: 0 })} {unit}
                </Text>
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
            alignItems: 'flex-start',
        },
        title: {
            fontSize: scaleFont(12),
            fontWeight: '600',
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontFamily,
        },
        value: {
            fontSize: scaleFont(22),
            fontWeight: '800',
            letterSpacing: -0.5,
            marginTop: 4,
            fontFamily,
        },
        trendBadge: {
            paddingHorizontal: Spacing.sm + 2,
            paddingVertical: 4,
            borderRadius: BorderRadius.full,
        },
        trendText: {
            fontSize: scaleFont(12),
            fontWeight: '700',
            fontFamily,
        },
        touchLayer: {
            ...StyleSheet.absoluteFillObject,
            flexDirection: 'row',
        },
        footer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: Spacing.sm,
            paddingTop: Spacing.sm,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
        },
        footerLabel: {
            fontSize: scaleFont(12),
            fontWeight: '600',
            color: colors.textMuted,
            fontFamily,
        },
        footerAvg: {
            fontSize: scaleFont(11),
            fontWeight: '500',
            color: colors.textLight,
            fontFamily,
        },
    });
