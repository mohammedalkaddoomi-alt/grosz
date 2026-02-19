import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useDrawer } from '../../src/contexts/DrawerContext';
import { useStore } from '../../src/store/store';
import { MiniChart, ChartDataPoint } from '../../src/components/MiniChart';
import { DonutChart, DonutSegment } from '../../src/components/DonutChart';
import { AreaChartCard, AreaDataPoint } from '../../src/components/AreaChartCard';
import { WallpaperBackground } from '../../src/components/WallpaperBackground';
import { AnimatedCard } from '../../src/components/AnimatedComponents';
import { Spacing, Shadows, BorderRadius } from '../../src/constants/theme';
import { Transaction } from '../../src/types';

const DAY_NAMES_PL = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'];
const MONTH_NAMES_PL = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];

// Palette for donut segments
const DONUT_COLORS = [
    '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6',
    '#8B5CF6', '#EF4444', '#14B8A6', '#F97316', '#06B6D4',
];

type Period = 'week' | 'month' | 'year';

function getWeeklyData(transactions: Transaction[], type: 'income' | 'expense'): ChartDataPoint[] {
    const now = new Date();
    const result: ChartDataPoint[] = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 86400000);

        const total = transactions
            .filter((t) => {
                const txDate = new Date(t.created_at);
                return t.type === type && txDate >= dayStart && txDate < dayEnd;
            })
            .reduce((acc, t) => acc + t.amount, 0);

        result.push({ label: DAY_NAMES_PL[dayStart.getDay()], value: total });
    }
    return result;
}

function getMonthlyData(transactions: Transaction[], type: 'income' | 'expense'): ChartDataPoint[] {
    const now = new Date();
    const result: ChartDataPoint[] = [];
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const weeksCount = Math.ceil(daysInMonth / 7);

    for (let w = 0; w < weeksCount; w++) {
        const weekStart = new Date(now.getFullYear(), now.getMonth(), w * 7 + 1);
        const weekEnd = new Date(now.getFullYear(), now.getMonth(), Math.min((w + 1) * 7 + 1, daysInMonth + 1));

        const total = transactions
            .filter((t) => {
                const txDate = new Date(t.created_at);
                return t.type === type && txDate >= weekStart && txDate < weekEnd;
            })
            .reduce((acc, t) => acc + t.amount, 0);

        result.push({ label: `T${w + 1}`, value: total });
    }
    return result;
}

function getYearlyData(transactions: Transaction[], type: 'income' | 'expense'): ChartDataPoint[] {
    const now = new Date();
    const result: ChartDataPoint[] = [];

    for (let m = 0; m < 12; m++) {
        const monthStart = new Date(now.getFullYear(), m, 1);
        const monthEnd = new Date(now.getFullYear(), m + 1, 1);

        const total = transactions
            .filter((t) => {
                const txDate = new Date(t.created_at);
                return t.type === type && txDate >= monthStart && txDate < monthEnd;
            })
            .reduce((acc, t) => acc + t.amount, 0);

        result.push({ label: MONTH_NAMES_PL[m], value: total });
    }
    return result;
}

function getCategoryBreakdown(transactions: Transaction[]): ChartDataPoint[] {
    const now = new Date();
    const thisMonthExpenses = transactions.filter((t) => {
        const txDate = new Date(t.created_at);
        return t.type === 'expense' && txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    });

    const categoryMap: Record<string, number> = {};
    thisMonthExpenses.forEach((t) => {
        const cat = t.categories?.name || t.category || 'Inne';
        categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
    });

    return Object.entries(categoryMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(([label, value]) => ({ label: label.slice(0, 5), value }));
}

function getDonutSegments(transactions: Transaction[]): DonutSegment[] {
    const now = new Date();
    const thisMonthExpenses = transactions.filter((t) => {
        const txDate = new Date(t.created_at);
        return t.type === 'expense' && txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    });

    const categoryMap: Record<string, { total: number; emoji: string }> = {};
    thisMonthExpenses.forEach((t) => {
        const cat = t.categories?.name || t.category || 'Inne';
        const emoji = t.categories?.emoji || t.emoji || '📦';
        if (!categoryMap[cat]) categoryMap[cat] = { total: 0, emoji };
        categoryMap[cat].total += t.amount;
    });

    return Object.entries(categoryMap)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 8)
        .map(([label, data], index) => ({
            label,
            value: data.total,
            emoji: data.emoji,
            color: DONUT_COLORS[index % DONUT_COLORS.length],
        }));
}

function getAreaData(transactions: Transaction[], type: 'income' | 'expense'): AreaDataPoint[] {
    const now = new Date();
    const result: AreaDataPoint[] = [];
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
        const dayStart = new Date(now.getFullYear(), now.getMonth(), d);
        const dayEnd = new Date(now.getFullYear(), now.getMonth(), d + 1);

        const total = transactions
            .filter((t) => {
                const txDate = new Date(t.created_at);
                return t.type === type && txDate >= dayStart && txDate < dayEnd;
            })
            .reduce((acc, t) => acc + t.amount, 0);

        result.push({ label: `${d}`, value: total });
    }
    return result;
}

const formatMoney = (n: number) =>
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0 }).format(n);

export default function Analytics() {
    const { colors, fontFamily, scaleFont, settings } = useTheme();
    const { openDrawer } = useDrawer();
    const { transactions, stats } = useStore();
    const [period, setPeriod] = useState<Period>('week');
    const styles = useMemo(() => getStyles(colors, fontFamily, scaleFont), [colors, fontFamily, scaleFont]);

    const periods: { key: Period; label: string }[] = [
        { key: 'week', label: 'Tydzień' },
        { key: 'month', label: 'Miesiąc' },
        { key: 'year', label: 'Rok' },
    ];

    const getChartData = (type: 'income' | 'expense') => {
        switch (period) {
            case 'week': return getWeeklyData(transactions, type);
            case 'month': return getMonthlyData(transactions, type);
            case 'year': return getYearlyData(transactions, type);
        }
    };

    const expenseData = getChartData('expense');
    const incomeData = getChartData('income');
    const categoryData = getCategoryBreakdown(transactions);
    const donutSegments = getDonutSegments(transactions);
    const expenseAreaData = getAreaData(transactions, 'expense');

    // Summary stats
    const totalExpenses = expenseData.reduce((acc, d) => acc + d.value, 0);
    const totalIncome = incomeData.reduce((acc, d) => acc + d.value, 0);
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {settings.wallpaper && <WallpaperBackground wallpaper={settings.wallpaper} />}

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={openDrawer} style={styles.hamburger} activeOpacity={0.7}>
                    <Ionicons name="menu-outline" size={26} color={colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Analiza</Text>
                    <Text style={styles.subtitle}>Przegląd Twoich finansów</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
                {/* Period selector */}
                <View style={styles.periodRow}>
                    {periods.map((p) => (
                        <TouchableOpacity
                            key={p.key}
                            style={[styles.periodChip, period === p.key && { backgroundColor: colors.primary }]}
                            onPress={() => setPeriod(p.key)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.periodText, period === p.key && { color: '#FFF' }]}>{p.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Summary cards */}
                <AnimatedCard entrance="slideUp" delay={100}>
                    <View style={styles.summaryRow}>
                        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                            <View style={[styles.summaryDot, { backgroundColor: colors.income }]} />
                            <Text style={styles.summaryLabel}>Przychody</Text>
                            <Text style={[styles.summaryValue, { color: colors.income }]}>{formatMoney(totalIncome)}</Text>
                        </View>
                        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                            <View style={[styles.summaryDot, { backgroundColor: colors.expense }]} />
                            <Text style={styles.summaryLabel}>Wydatki</Text>
                            <Text style={[styles.summaryValue, { color: colors.expense }]}>{formatMoney(totalExpenses)}</Text>
                        </View>
                    </View>
                </AnimatedCard>

                {/* Savings rate */}
                <AnimatedCard entrance="slideUp" delay={150}>
                    <View style={[styles.savingsCard, { backgroundColor: colors.card }]}>
                        <View style={styles.savingsHeader}>
                            <Text style={styles.savingsLabel}>Wskaźnik oszczędności</Text>
                            <Text style={[styles.savingsValue, { color: savingsRate >= 0 ? colors.income : colors.expense }]}>
                                {savingsRate}%
                            </Text>
                        </View>
                        <View style={styles.savingsBarBg}>
                            <View
                                style={[
                                    styles.savingsBarFill,
                                    {
                                        width: `${Math.max(0, Math.min(100, savingsRate))}%`,
                                        backgroundColor: savingsRate >= 20 ? colors.income : savingsRate >= 0 ? '#F59E0B' : colors.expense,
                                    },
                                ]}
                            />
                        </View>
                    </View>
                </AnimatedCard>

                {/* Area chart — monthly spending trend */}
                <AnimatedCard entrance="slideUp" delay={200}>
                    <AreaChartCard
                        data={expenseAreaData}
                        title="Wydatki — trend"
                        subtitle="Ten miesiąc"
                        accentColor={colors.expense}
                        unit="zł"
                        height={110}
                    />
                </AnimatedCard>

                {/* Donut chart — expense categories */}
                {donutSegments.length > 0 && (
                    <AnimatedCard entrance="slideUp" delay={250}>
                        <DonutChart
                            data={donutSegments}
                            title="Struktura wydatków"
                            centerLabel="Razem"
                            size={180}
                            strokeWidth={22}
                        />
                    </AnimatedCard>
                )}

                {/* Expense bar chart */}
                <AnimatedCard entrance="slideUp" delay={300}>
                    <MiniChart
                        data={expenseData}
                        title="Wydatki"
                        unit="zł"
                        accentColor={colors.expense}
                        height={100}
                    />
                </AnimatedCard>

                {/* Income bar chart */}
                <AnimatedCard entrance="slideUp" delay={350}>
                    <MiniChart
                        data={incomeData}
                        title="Przychody"
                        unit="zł"
                        accentColor={colors.income}
                        height={100}
                    />
                </AnimatedCard>

                {/* Category breakdown bars */}
                {categoryData.length > 0 && (
                    <AnimatedCard entrance="slideUp" delay={400}>
                        <MiniChart
                            data={categoryData}
                            title="Wydatki wg kategorii"
                            unit="zł"
                            accentColor={colors.primary}
                            height={80}
                        />
                    </AnimatedCard>
                )}

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (colors: any, fontFamily: string | undefined, scaleFont: (s: number) => number) =>
    StyleSheet.create({
        container: { flex: 1 },
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
        title: { fontSize: scaleFont(24), fontWeight: '800', color: colors.text, letterSpacing: -0.8, fontFamily },
        subtitle: { fontSize: scaleFont(14), color: colors.textLight, marginTop: 4, fontWeight: '500', fontFamily },
        scrollContent: { flex: 1, paddingHorizontal: Spacing.xl },

        periodRow: {
            flexDirection: 'row',
            gap: Spacing.sm,
            marginBottom: Spacing.lg,
        },
        periodChip: {
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.sm + 2,
            borderRadius: BorderRadius.full,
            backgroundColor: colors.backgroundDark,
        },
        periodText: {
            fontSize: scaleFont(13),
            fontWeight: '600',
            color: colors.text,
            fontFamily,
        },

        summaryRow: {
            flexDirection: 'row',
            gap: Spacing.md,
            marginBottom: Spacing.md,
        },
        summaryCard: {
            flex: 1,
            borderRadius: 16,
            padding: Spacing.lg,
            ...Shadows.small,
        },
        summaryDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            marginBottom: Spacing.sm,
        },
        summaryLabel: {
            fontSize: scaleFont(12),
            fontWeight: '600',
            color: colors.textMuted,
            marginBottom: 4,
            fontFamily,
        },
        summaryValue: {
            fontSize: scaleFont(18),
            fontWeight: '800',
            letterSpacing: -0.5,
            fontFamily,
        },

        savingsCard: {
            borderRadius: 16,
            padding: Spacing.lg,
            marginBottom: Spacing.md,
            ...Shadows.small,
        },
        savingsHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: Spacing.md,
        },
        savingsLabel: {
            fontSize: scaleFont(13),
            fontWeight: '600',
            color: colors.textMuted,
            fontFamily,
        },
        savingsValue: {
            fontSize: scaleFont(20),
            fontWeight: '800',
            fontFamily,
        },
        savingsBarBg: {
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.backgroundDark,
            overflow: 'hidden',
        },
        savingsBarFill: {
            height: '100%',
            borderRadius: 4,
        },
    });
