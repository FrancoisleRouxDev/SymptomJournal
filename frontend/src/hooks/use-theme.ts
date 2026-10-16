import { usePreferences } from '@/context/PreferencesContext';

export function useTheme() {
  const prefs = usePreferences();

  return {
    ...prefs.colors,
    isDarkMode: prefs.isDarkMode,
    toggleDarkMode: prefs.toggleDarkMode,
    textSize: prefs.textSize,
    setTextSize: prefs.setTextSize,
    textScale: prefs.textScale,
    scaled: prefs.scaled,
    colors: prefs.colors,
  };
}

