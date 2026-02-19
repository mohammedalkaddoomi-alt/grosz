import React, { createContext, useContext, useCallback } from 'react';
import { useSharedValue, withSpring } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

interface DrawerContextType {
    progress: SharedValue<number>;
    openDrawer: () => void;
    closeDrawer: () => void;
    toggleDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export const useDrawer = () => {
    const context = useContext(DrawerContext);
    if (!context) {
        throw new Error('useDrawer must be used within DrawerProvider');
    }
    return context;
};

const SPRING_CONFIG = { damping: 24, stiffness: 200, mass: 0.8 };

export const DrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // 0 = closed, 1 = open
    const progress = useSharedValue(0);

    const openDrawer = useCallback(() => {
        progress.value = withSpring(1, SPRING_CONFIG);
    }, [progress]);

    const closeDrawer = useCallback(() => {
        progress.value = withSpring(0, SPRING_CONFIG);
    }, [progress]);

    const toggleDrawer = useCallback(() => {
        progress.value = withSpring(progress.value > 0.5 ? 0 : 1, SPRING_CONFIG);
    }, [progress]);

    return (
        <DrawerContext.Provider value={{ progress, openDrawer, closeDrawer, toggleDrawer }}>
            {children}
        </DrawerContext.Provider>
    );
};
