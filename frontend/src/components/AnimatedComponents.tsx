import React, { useCallback, useEffect, useMemo } from 'react';
import { TouchableOpacity, TouchableOpacityProps, View, ViewProps, Text, TextProps, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withDelay,
    withSequence,
    Easing,
    FadeIn,
    FadeInDown,
    FadeInUp,
    FadeOut,
    SlideInRight,
    SlideInLeft,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Shadows, Animations } from '../constants/theme';
import { haptics } from '../utils/haptics';

/**
 * Animated Button with press feedback
 */
interface AnimatedButtonProps extends TouchableOpacityProps {
    children: React.ReactNode;
    hapticFeedback?: 'light' | 'medium' | 'heavy';
}

const AnimatedButtonBase: React.FC<AnimatedButtonProps> = ({
    children,
    onPress,
    onPressIn,
    onPressOut,
    hapticFeedback = 'light',
    style,
    ...props
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = useCallback((e: any) => {
        scale.value = withSpring(0.96, Animations.springs.tight);
        onPressIn?.(e);
    }, [onPressIn, scale]);

    const handlePressOut = useCallback((e: any) => {
        scale.value = withSpring(1, Animations.springs.tight);
        onPressOut?.(e);
    }, [onPressOut, scale]);

    const handlePress = useCallback((e: any) => {
        onPress?.(e);

        // Defer haptics to next frame so UI response is instant.
        if (hapticFeedback) {
            requestAnimationFrame(() => {
                haptics[hapticFeedback]?.();
            });
        }
    }, [hapticFeedback, onPress]);

    return (
        <Animated.View style={animatedStyle}>
            <TouchableOpacity
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handlePress}
                activeOpacity={1}
                style={style}
                {...props}
            >
                {children}
            </TouchableOpacity>
        </Animated.View>
    );
};
export const AnimatedButton = React.memo(AnimatedButtonBase);

/**
 * Animated Card with entrance animation
 */
interface AnimatedCardProps extends ViewProps {
    children: React.ReactNode;
    delay?: number;
    entrance?: 'fade' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'bounce' | 'rotate';
}

const AnimatedCardBase: React.FC<AnimatedCardProps> = ({
    children,
    delay = 0,
    entrance = 'fade',
    style,
    ...props
}) => {
    const getEntranceAnimation = useCallback(() => {
        const smoothSpring = {
            damping: 20,
            stiffness: 90,
            mass: 0.5,
        };

        const bouncySpring = {
            damping: 12,
            stiffness: 100,
            mass: 0.8,
        };

        switch (entrance) {
            case 'slideUp':
                return FadeInUp.delay(delay).springify().damping(smoothSpring.damping).stiffness(smoothSpring.stiffness).mass(smoothSpring.mass);
            case 'slideDown':
                return FadeInDown.delay(delay).springify().damping(smoothSpring.damping).stiffness(smoothSpring.stiffness).mass(smoothSpring.mass);
            case 'slideLeft':
                return SlideInLeft.delay(delay).springify().damping(smoothSpring.damping).stiffness(smoothSpring.stiffness).mass(smoothSpring.mass);
            case 'slideRight':
                return SlideInRight.delay(delay).springify().damping(smoothSpring.damping).stiffness(smoothSpring.stiffness).mass(smoothSpring.mass);
            case 'scale':
                return FadeIn.delay(delay).duration(400).withInitialValues({ transform: [{ scale: 0.8 }] });
            case 'bounce':
                return FadeInUp.delay(delay).springify().damping(bouncySpring.damping).stiffness(bouncySpring.stiffness).mass(bouncySpring.mass);
            case 'rotate':
                return FadeIn.delay(delay).duration(500).withInitialValues({ transform: [{ rotate: '10deg' }, { scale: 0.9 }] });
            default:
                return FadeIn.delay(delay).duration(Animations.durations.normal);
        }
    }, [delay, entrance]);

    const enteringAnimation = useMemo(() => getEntranceAnimation(), [getEntranceAnimation]);

    return (
        <Animated.View entering={enteringAnimation} style={style} {...props}>
            {children}
        </Animated.View>
    );
};
export const AnimatedCard = React.memo(AnimatedCardBase);

/**
 * Animated Number Counter
 */
interface AnimatedNumberProps extends TextProps {
    value: number;
    duration?: number;
    formatter?: (value: number) => string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
    value,
    duration = 1000,
    formatter,
    style,
    ...props
}) => {
    const [displayValue, setDisplayValue] = React.useState(0);

    useEffect(() => {
        const startValue = displayValue;
        const endValue = value;
        const startTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
            const easedProgress = easeOutCubic(progress);

            const currentValue = startValue + (endValue - startValue) * easedProgress;
            setDisplayValue(currentValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setDisplayValue(endValue);
            }
        };

        animate();
    }, [value, duration]);

    return (
        <Text style={style} {...props}>
            {formatter ? formatter(displayValue) : Math.round(displayValue)}
        </Text>
    );
};

/**
 * Skeleton Loader
 */
interface SkeletonLoaderProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    width = '100%',
    height = 20,
    borderRadius = BorderRadius.md,
    style
}) => {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withSequence(
            withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
        );
        // Repeat
        const interval = setInterval(() => {
            opacity.value = withSequence(
                withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
            );
        }, 1600);

        return () => clearInterval(interval);
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: Colors.backgroundDark,
                },
                animatedStyle,
                style,
            ]}
        />
    );
};

/**
 * Glass Card with glassmorphism effect
 */
interface GlassCardProps extends ViewProps {
    children: React.ReactNode;
    intensity?: 'light' | 'medium' | 'dark';
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    intensity = 'light',
    style,
    ...props
}) => {
    const getGlassStyle = () => {
        switch (intensity) {
            case 'medium':
                return {
                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                };
            case 'dark':
                return {
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                };
            default:
                return {
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                };
        }
    };

    return (
        <View
            style={[
                styles.glassCard,
                getGlassStyle(),
                style,
            ]}
            {...props}
        >
            {children}
        </View>
    );
};

/**
 * Shimmer Effect Component
 */
interface ShimmerProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
}

export const Shimmer: React.FC<ShimmerProps> = ({
    width = '100%',
    height = 20,
    borderRadius = BorderRadius.md
}) => {
    const translateX = useSharedValue(-300);

    useEffect(() => {
        const animate = () => {
            translateX.value = -300;
            translateX.value = withTiming(300, { duration: 1500, easing: Easing.linear });
        };

        animate();
        const interval = setInterval(animate, 1500);
        return () => clearInterval(interval);
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    return (
        <View style={{ width: width as any, height, borderRadius, backgroundColor: Colors.backgroundDark, overflow: 'hidden' }}>
            <Animated.View
                style={[
                    {
                        width: 100,
                        height: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    animatedStyle,
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    glassCard: {
        borderWidth: 1,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        ...Shadows.medium,
    },
});

// Export all animations from reanimated for convenience
export {
    FadeIn,
    FadeInDown,
    FadeInUp,
    FadeOut,
    SlideInRight,
    SlideInLeft,
};
