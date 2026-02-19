import { withTiming, withSpring, Easing } from 'react-native-reanimated';
import { Animations } from '../constants/theme';

/**
 * Animation Utilities
 * Reusable animation configurations and helpers
 */

/**
 * Fade in animation config
 */
export const fadeIn = (duration = Animations.durations.normal) => {
    return withTiming(1, {
        duration,
        easing: Easing.out(Easing.ease),
    });
};

/**
 * Fade out animation config
 */
export const fadeOut = (duration = Animations.durations.normal) => {
    return withTiming(0, {
        duration,
        easing: Easing.in(Easing.ease),
    });
};

/**
 * Scale in animation with spring
 */
export const scaleIn = () => {
    return withSpring(1, {
        damping: Animations.springs.soft.damping,
        stiffness: Animations.springs.soft.stiffness,
    });
};

/**
 * Scale out animation
 */
export const scaleOut = () => {
    return withTiming(0.95, {
        duration: Animations.durations.fast,
        easing: Easing.out(Easing.ease),
    });
};

/**
 * Spring press animation - for button feedback
 */
export const springPress = () => {
    return withSpring(0.96, {
        damping: Animations.springs.bouncy.damping,
        stiffness: Animations.springs.bouncy.stiffness,
    });
};

/**
 * Spring release animation - for button release
 */
export const springRelease = () => {
    return withSpring(1, {
        damping: Animations.springs.bouncy.damping,
        stiffness: Animations.springs.bouncy.stiffness,
    });
};

/**
 * Slide in from direction
 */
export const slideIn = (from: 'left' | 'right' | 'top' | 'bottom', duration = Animations.durations.normal) => {
    return withTiming(0, {
        duration,
        easing: Easing.out(Easing.cubic),
    });
};

/**
 * Shake animation for errors
 */
export const shakeAnimation = () => {
    return withTiming(10, {
        duration: 50,
        easing: Easing.linear,
    });
};

/**
 * Bounce animation
 */
export const bounceAnimation = () => {
    return withSpring(1, {
        damping: 8,
        stiffness: 200,
        mass: 0.5,
    });
};

/**
 * Stagger delay calculator
 * @param index - Index of the item
 * @param baseDelay - Base delay in ms
 * @returns Delay in ms
 */
export const staggerDelay = (index: number, baseDelay = 50): number => {
    return index * baseDelay;
};

/**
 * Number counter animation helper
 * @param start - Starting value
 * @param end - Ending value
 * @param duration - Animation duration
 * @returns Animation config
 */
export const counterAnimation = (start: number, end: number, duration = 1000) => {
    return withTiming(end, {
        duration,
        easing: Easing.out(Easing.cubic),
    });
};
