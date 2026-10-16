import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

export type TextSize = 'small' | 'medium' | 'large';

export interface ThemePalette {
  background: {
    canvas: string;
    card: string;
    cream: string;
    dark: string;
  };
  neutral: {
    brown: string;
    brownMid: string;
    muted: string;
    border: string;
  };
  sage: { dark: string; base: string; light: string; tint: string };
  terracotta: { dark: string; base: string; light: string; tint: string };
  semantic: typeof Colors.semantic;
  white: string;
  black: string;
  // Compatibility with Colors.light & Colors.dark keys for ThemedText / ThemedView
  text: string;
  textSecondary: string;
  backgroundElement: string;
  backgroundSelected: string;
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  border: string;
}

export interface PreferencesContextValue {
  isDarkMode: boolean;
  toggleDarkMode: (enabled?: boolean) => Promise<void>;
  textSize: TextSize;
  setTextSize: (size: TextSize) => Promise<void>;
  textScale: number;
  scaled: (baseSize: number) => number;
  colors: ThemePalette;
}

const STORAGE_KEY_DARK_MODE = '@symptomjournal_dark_mode';
const STORAGE_KEY_TEXT_SIZE = '@symptomjournal_text_size';

const TEXT_SCALES: Record<TextSize, number> = {
  small: 0.9,
  medium: 1.0,
  large: 1.15,
};

export const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [textSize, setTextSizeState] = useState<TextSize>('medium');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const storedDark = await AsyncStorage.getItem(STORAGE_KEY_DARK_MODE);
        if (storedDark !== null) {
          setIsDarkMode(storedDark === 'true');
        } else if (systemScheme === 'dark') {
          setIsDarkMode(true);
        }

        const storedSize = await AsyncStorage.getItem(STORAGE_KEY_TEXT_SIZE);
        if (storedSize === 'small' || storedSize === 'medium' || storedSize === 'large') {
          setTextSizeState(storedSize);
        }
      } catch (err) {
        console.log('Error loading preferences from AsyncStorage:', err);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, [systemScheme]);

  const toggleDarkMode = async (enabled?: boolean) => {
    const nextVal = enabled !== undefined ? enabled : !isDarkMode;
    setIsDarkMode(nextVal);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_DARK_MODE, String(nextVal));
    } catch (err) {
      console.log('Error saving dark mode to AsyncStorage:', err);
    }
  };

  const setTextSize = async (size: TextSize) => {
    setTextSizeState(size);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_TEXT_SIZE, size);
    } catch (err) {
      console.log('Error saving text size to AsyncStorage:', err);
    }
  };

  const textScale = TEXT_SCALES[textSize];
  const scaled = (baseSize: number) => Math.round(baseSize * textScale);

  const colors = useMemo<ThemePalette>(() => {
    if (isDarkMode) {
      return {
        background: {
          canvas: '#161412',
          card: '#24201D',
          cream: '#302B27',
          dark: '#0E0C0B',
        },
        neutral: {
          brown: '#F6F0E8',
          brownMid: '#D6CBC2',
          muted: '#A59A8E',
          border: '#3F3933',
        },
        sage: {
          dark: '#87AB94',
          base: '#7B9E87',
          light: '#5A7D66',
          tint: '#223328',
        },
        terracotta: {
          dark: '#E28E6E',
          base: '#C4714F',
          light: '#A85A38',
          tint: '#3A241C',
        },
        semantic: Colors.semantic,
        white: '#FFFFFF',
        black: '#000000',
        text: '#F6F0E8',
        textSecondary: '#D6CBC2',
        backgroundElement: '#24201D',
        backgroundSelected: '#302B27',
        tint: '#7B9E87',
        icon: '#D6CBC2',
        tabIconDefault: '#7A7066',
        tabIconSelected: '#A8C4B0',
        border: '#3F3933',
      };
    }

    return {
      background: Colors.background,
      neutral: Colors.neutral,
      sage: Colors.sage,
      terracotta: Colors.terracotta,
      semantic: Colors.semantic,
      white: Colors.white,
      black: Colors.black,
      text: Colors.light.text,
      textSecondary: Colors.light.textSecondary,
      backgroundElement: Colors.light.backgroundElement,
      backgroundSelected: Colors.light.backgroundSelected,
      tint: Colors.light.tint,
      icon: Colors.light.icon,
      tabIconDefault: Colors.light.tabIconDefault,
      tabIconSelected: Colors.light.tabIconSelected,
      border: Colors.light.border,
    };
  }, [isDarkMode]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      isDarkMode,
      toggleDarkMode,
      textSize,
      setTextSize,
      textScale,
      scaled,
      colors,
    }),
    [isDarkMode, textSize, textScale, colors]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    // Graceful fallback for components or tests rendered outside PreferencesProvider
    return {
      isDarkMode: false,
      toggleDarkMode: async () => {},
      textSize: 'medium',
      setTextSize: async () => {},
      textScale: 1.0,
      scaled: (s) => s,
      colors: {
        background: Colors.background,
        neutral: Colors.neutral,
        sage: Colors.sage,
        terracotta: Colors.terracotta,
        semantic: Colors.semantic,
        white: Colors.white,
        black: Colors.black,
        text: Colors.light.text,
        textSecondary: Colors.light.textSecondary,
        backgroundElement: Colors.light.backgroundElement,
        backgroundSelected: Colors.light.backgroundSelected,
        tint: Colors.light.tint,
        icon: Colors.light.icon,
        tabIconDefault: Colors.light.tabIconDefault,
        tabIconSelected: Colors.light.tabIconSelected,
        border: Colors.light.border,
      },
    };
  }
  return ctx;
}
