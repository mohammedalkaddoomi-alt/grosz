import * as Haptics from 'expo-haptics';

/**
 * Haptic Feedback Utilities
 * Provides consistent haptic feedback across the app
 */

export const haptics = {
    /**
     * Light impact - for subtle interactions
     * Use for: button taps, toggle switches
     */
    light: () => {
        try {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {
            // Haptics not supported on this device
        }
    },

    /**
     * Medium impact - for standard interactions
     * Use for: list item selection, modal open/close
     */
    medium: () => {
        try {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) {
            // Haptics not supported
        }
    },

    /**
     * Heavy impact - for significant interactions
     * Use for: important confirmations, errors
     */
    heavy: () => {
        try {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } catch (e) {
            // Haptics not supported
        }
    },

    /**
     * Success pattern - for successful actions
     * Use for: transaction added, goal completed
     */
    success: () => {
        try {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
            // Haptics not supported
        }
    },

    /**
     * Warning pattern - for warnings
     * Use for: validation errors, warnings
     */
    warning: () => {
        try {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch (e) {
            // Haptics not supported
        }
    },

    /**
     * Error pattern - for errors
     * Use for: failed actions, critical errors
     */
    error: () => {
        try {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (e) {
            // Haptics not supported
        }
    },

    /**
     * Selection feedback - for picker/selector changes
     * Use for: scrolling through options, tab changes
     */
    selection: () => {
        try {
            void Haptics.selectionAsync();
        } catch (e) {
            // Haptics not supported
        }
    },
};
