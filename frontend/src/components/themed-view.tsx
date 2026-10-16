import { View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();
  const bgColor = type
    ? typeof (theme as any)[type] === 'string'
      ? ((theme as any)[type] as string)
      : theme.background.canvas
    : theme.background.canvas;

  return <View style={[{ backgroundColor: bgColor }, style]} {...otherProps} />;
}
