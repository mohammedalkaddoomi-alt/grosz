import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../src/store/store';
import { useTheme } from '../src/contexts/ThemeContext';
import { Spacing, BorderRadius, Shadows } from '../src/constants/theme';
import Animated, {
  FadeInUp,
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useAnimatedRef,
  scrollTo,
  runOnJS
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Premium Slide Item with Parallax and Scale Animations
const SlideItem = ({ slide, index, scrollX, colors, fontFamily }: any) => {
  const animatedImageStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [0.6, 1, 0.6],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [50, 0, 50],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ scale }, { translateY }],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [20, 0, 20],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <View style={[s.slide, { width }]}>
      <Animated.View style={[s.illustrationContainer, animatedImageStyle]}>
        <View style={[s.iconBg, { backgroundColor: `${slide.color}15` }]}>
          <Text style={s.slideEmoji}>{slide.emoji}</Text>
        </View>
      </Animated.View>
      <Animated.View style={[s.textContainer, animatedTextStyle]}>
        <Text style={[s.slideTitle, { color: colors.text, fontFamily }]}>{slide.title}</Text>
        <Text style={[s.slideDesc, { color: colors.textMuted, fontFamily }]}>{slide.desc}</Text>
      </Animated.View>
    </View>
  );
};

// Premium Animated Dot
const PaginationDot = ({ dotIndex, scrollX, colors, totalSlides }: any) => {
  const animatedDotStyle = useAnimatedStyle(() => {
    // The actual slides are at indices 1 to totalSlides (inclusive) in extendedSlides
    // So, the dot for slide `i` corresponds to extendedSlides[i+1]
    const actualSlideIndex = dotIndex + 1;
    const mainPos = actualSlideIndex * width;

    let inputRange = [mainPos - width, mainPos, mainPos + width];
    let widthOutput = [8, 24, 8];
    let opacityOutput = [0.3, 1, 0.3];

    // Handle the "infinite" loop for the first and last dots
    if (dotIndex === 0) {
      // If the first dot is active, it should also be active when the last duplicate slide is shown
      const lastDuplicatePos = (totalSlides + 1) * width;
      inputRange = [...inputRange, lastDuplicatePos - width, lastDuplicatePos, lastDuplicatePos + width];
      widthOutput = [...widthOutput, 8, 24, 8];
      opacityOutput = [...opacityOutput, 0.3, 1, 0.3];
    } else if (dotIndex === totalSlides - 1) {
      // If the last dot is active, it should also be active when the first duplicate slide is shown
      const firstDuplicatePos = 0;
      inputRange = [firstDuplicatePos - width, firstDuplicatePos, firstDuplicatePos + width, ...inputRange];
      widthOutput = [8, 24, 8, ...widthOutput];
      opacityOutput = [0.3, 1, 0.3, ...opacityOutput];
    }

    const dotWidth = interpolate(scrollX.value, inputRange, widthOutput, Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, opacityOutput, Extrapolation.CLAMP);

    return {
      width: dotWidth,
      opacity,
      backgroundColor: colors.primary,
    };
  });

  return <Animated.View style={[s.dot, animatedDotStyle]} />;
};

export default function Welcome() {
  const router = useRouter();
  const { isLoggedIn } = useStore();
  const { colors, fontFamily, scaleFont } = useTheme();

  const scrollX = useSharedValue(width);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const [activeIndex, setActiveIndex] = useState(1);

  useEffect(() => {
    if (isLoggedIn) router.replace('/(tabs)');
  }, [isLoggedIn]);

  const slides = [
    { id: '1', title: 'Szybkie wpisy', desc: 'Dodawaj wydatki w kilka sekund. Optymalny interfejs stworzony do codziennego użytku.', icon: 'flash-outline' as const, color: '#F59E0B', emoji: '⚡' },
    { id: '2', title: 'Wspólne finanse', desc: 'Zaproś bliskich do wspólnych portfeli. Żegnajcie skomplikowane rozliczenia!', icon: 'people-outline' as const, color: '#10B981', emoji: '🤝' },
    { id: '3', title: 'Inteligentna analiza', desc: 'Zrozum, na co wydajesz. Piękne wykresy i powiadomienia oparte na Twoich nawykach.', icon: 'bar-chart-outline' as const, color: '#3B82F6', emoji: '📊' },
    { id: '4', title: 'Subskrypcje', desc: 'Śledź swoje cykliczne płatności i unikaj niepotrzebnych kosztów.', icon: 'calendar-outline' as const, color: '#EC4899', emoji: '📅' },
    { id: '5', title: 'Kalkulator Czasu', desc: 'Przeliczaj wydatki na godziny swojej pracy. Wydawaj pieniądze i czas bardziej świadomie.', icon: 'time-outline' as const, color: '#8B5CF6', emoji: '⏱️' },
    { id: '6', title: 'Asystent AI', desc: 'Twój osobisty doradca finansowy. Zadawaj pytania i otrzymuj spersonalizowane porady.', icon: 'sparkles-outline' as const, color: '#14B8A6', emoji: '🤖' },
    { id: '7', title: 'Bezpieczeństwo', desc: 'Twoje dane, Twój sejf. Szyfrowanie klasy bankowej chroni każdy grosz.', icon: 'shield-checkmark-outline' as const, color: '#6366F1', emoji: '🔒' },
  ];

  const extendedSlides = [
    { ...slides[slides.length - 1], id: 'duplicate-end' },
    ...slides,
    { ...slides[0], id: 'duplicate-start' }
  ];

  const updateScrollData = (offsetX: number) => {
    let slide = Math.round(offsetX / width);
    if (slide === slides.length + 1) { // If we scrolled to the duplicate of the first slide
      scrollRef.current?.scrollTo({ x: width, animated: false }); // Jump to the actual first slide
      setActiveIndex(1);
    } else if (slide === 0) { // If we scrolled to the duplicate of the last slide
      scrollRef.current?.scrollTo({ x: slides.length * width, animated: false }); // Jump to the actual last slide
      setActiveIndex(slides.length);
    } else {
      setActiveIndex(slide);
    }
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
    onMomentumEnd: (event) => {
      runOnJS(updateScrollData)(event.contentOffset.x);
    }
  });

  useEffect(() => {
    if (isLoggedIn) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        let next = prev + 1;
        scrollRef.current?.scrollTo({ x: next * width, animated: true });

        if (next === slides.length + 1) {
          setTimeout(() => {
            scrollRef.current?.scrollTo({ x: width, animated: false });
          }, 500);
          return 1;
        }
        return next;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [isLoggedIn, activeIndex]);

  const handleStart = () => {
    router.push({ pathname: '/(auth)/login', params: { initialIsLogin: 'false' } } as any);
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.content}>
          {/* Slider */}
          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentOffset={{ x: width, y: 0 }}
            style={{ flex: 1 }}
          >
            {extendedSlides.map((slide, index) => (
              <SlideItem
                key={`${slide.id}-${index}`}
                slide={slide}
                index={index}
                scrollX={scrollX}
                colors={colors}
                fontFamily={fontFamily}
              />
            ))}
          </Animated.ScrollView>

          {/* Dots */}
          <View style={s.dotsContainer}>
            {slides.map((_, i) => (
              <PaginationDot
                key={`dot-${i}`}
                dotIndex={i}
                scrollX={scrollX}
                colors={colors}
                totalSlides={slides.length}
              />
            ))}
          </View>
        </View>

        {/* Actions */}
        <Animated.View entering={FadeInUp.delay(500).duration(500)} style={s.actions}>
          <TouchableOpacity
            style={[s.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={handleStart}
            activeOpacity={0.85}
          >
            <Text style={[s.primaryText, { fontFamily }]}>
              Rozpocznij przygodę
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity style={s.secondaryBtn} onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
            <Text style={[s.secondaryText, { color: colors.textLight, fontFamily }]}>
              Mam już konto • <Text style={{ color: colors.primary, fontWeight: '700' }}>Zaloguj się</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingBottom: 20 },

  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  illustrationContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBg: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  slideEmoji: {
    fontSize: 70,
  },
  textContainer: {
    flex: 0.4,
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  slideDesc: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },

  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  actions: { paddingHorizontal: Spacing.xl, paddingBottom: 24 },
  primaryBtn: {
    height: 56, borderRadius: 16, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  primaryText: { fontSize: 17, fontWeight: '700', color: '#FFF' },

  secondaryBtn: { marginTop: 16, paddingVertical: 12, alignItems: 'center' },
  secondaryText: { fontSize: 15, fontWeight: '500' },
});
