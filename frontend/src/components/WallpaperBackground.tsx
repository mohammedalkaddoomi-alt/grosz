import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface WallpaperBackgroundProps {
    wallpaper: {
        uri: string;
        opacity: number;
        blur: number;
    };
}

/**
 * Renders a wallpaper background. Handles both regular image URIs
 * and gradient URIs (format: "gradient:#color1,#color2,#color3").
 */
export const WallpaperBackground: React.FC<WallpaperBackgroundProps> = ({ wallpaper }) => {
    if (wallpaper.uri.startsWith('gradient:')) {
        const colorString = wallpaper.uri.replace('gradient:', '');
        const gradientColors = colorString.split(',') as [string, string, ...string[]];

        return (
            <LinearGradient
                colors={gradientColors}
                style={[styles.fill, { opacity: wallpaper.opacity }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
        );
    }

    return (
        <Image
            source={{ uri: wallpaper.uri }}
            style={[styles.fill, { opacity: wallpaper.opacity }]}
            blurRadius={wallpaper.blur}
        />
    );
};

const styles = StyleSheet.create({
    fill: {
        ...StyleSheet.absoluteFillObject,
    },
});
