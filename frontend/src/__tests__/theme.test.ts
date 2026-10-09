import { Colors, Spacing, Radius, FontSize, MaxContentWidth } from '@/constants/theme';

describe('Theme & Design Tokens (src/constants/theme.ts)', () => {
  describe('Color Palette Tokens', () => {
    it('defines light mode color tokens', () => {
      expect(Colors.light).toBeDefined();
      expect(Colors.light.background).toBe('#F6F0E8');
      expect(Colors.light.text).toBe('#3E2D1E');
      expect(Colors.light.tint).toBe('#7B9E87');
    });

    it('defines dark mode color tokens', () => {
      expect(Colors.dark).toBeDefined();
      expect(Colors.dark.background).toBe('#1C1917');
      expect(Colors.dark.text).toBe('#F6F0E8');
    });

    it('defines brand primary (sage) and accent (terracotta) palettes', () => {
      expect(Colors.sage.base).toBe('#7B9E87');
      expect(Colors.sage.tint).toBe('#D4E7DC');
      expect(Colors.terracotta.base).toBe('#C4714F');
      expect(Colors.terracotta.tint).toBe('#F5D8CC');
    });

    it('defines semantic category colors', () => {
      expect(Colors.semantic.pain).toBe('#C4714F');
      expect(Colors.semantic.fatigue).toBe('#A8C4B0');
      expect(Colors.semantic.mood).toBe('#B8A0D0');
      expect(Colors.semantic.digestion).toBe('#E8B87A');
      expect(Colors.semantic.breathing).toBe('#7AAED0');
      expect(Colors.semantic.skin).toBe('#E8A0A0');
    });
  });

  describe('Spacing & Typography Constants', () => {
    it('provides standardized spacing scale', () => {
      expect(Spacing.half).toBe(2);
      expect(Spacing.one).toBe(4);
      expect(Spacing.two).toBe(8);
      expect(Spacing.three).toBe(12);
      expect(Spacing.four).toBe(16);
      expect(Spacing.sm).toBe(8);
      expect(Spacing.md).toBe(16);
      expect(Spacing.lg).toBe(24);
      expect(Spacing.xl).toBe(32);
    });

    it('provides standardized border radius scale', () => {
      expect(Radius.sm).toBe(8);
      expect(Radius.md).toBe(12);
      expect(Radius.lg).toBe(16);
      expect(Radius.xl).toBe(24);
      expect(Radius.full).toBe(999);
    });

    it('provides font size tokens', () => {
      expect(FontSize.display).toBe(32);
      expect(FontSize.h1).toBe(26);
      expect(FontSize.h2).toBe(22);
      expect(FontSize.body).toBe(14);
      expect(FontSize.caption).toBe(12);
      expect(FontSize.button).toBe(16);
    });

    it('defines layout constraints', () => {
      expect(MaxContentWidth).toBe(800);
    });
  });
});
