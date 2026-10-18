// Tests for symptom logging form rules, time-of-day resolution, and payload constraints

export type TimePreset = 'now' | '1h ago' | '3h ago' | 'earlier';

export function mapTimeToTimeOfDay(preset: TimePreset, referenceDate: Date = new Date()): 'morning' | 'afternoon' | 'evening' | 'night' {
  const date = new Date(referenceDate.getTime());
  if (preset === '1h ago') date.setHours(date.getHours() - 1);
  else if (preset === '3h ago') date.setHours(date.getHours() - 3);
  else if (preset === 'earlier') date.setHours(date.getHours() - 6);

  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function validateSymptomPayload(payload: {
  category: string;
  severity: number;
  body_area?: string;
  triggers?: string[];
  notes?: string;
}) {
  const validCategories = ['pain', 'fatigue', 'mood', 'digestion', 'breathing', 'skin', 'general'];
  
  if (!payload.category || !validCategories.includes(payload.category.toLowerCase())) {
    throw new Error(`Invalid category: ${payload.category}`);
  }

  if (typeof payload.severity !== 'number' || payload.severity < 1 || payload.severity > 10) {
    throw new Error(`Severity must be between 1 and 10. Received: ${payload.severity}`);
  }

  if (payload.notes && payload.notes.length > 500) {
    throw new Error('Notes must not exceed 500 characters.');
  }

  return true;
}

export function deleteCustomChoice(
  customList: string[],
  selectedList: string[],
  itemToDelete: string
): { updatedCustom: string[]; updatedSelected: string[] } {
  return {
    updatedCustom: customList.filter((item) => item !== itemToDelete),
    updatedSelected: selectedList.filter((item) => item !== itemToDelete),
  };
}

describe('Symptom Validation & Formatting Logic', () => {
  describe('mapTimeToTimeOfDay', () => {
    it('resolves 8:00 AM as morning', () => {
      const morningDate = new Date('2026-10-09T08:00:00');
      expect(mapTimeToTimeOfDay('now', morningDate)).toBe('morning');
    });

    it('resolves 14:00 (2:00 PM) as afternoon', () => {
      const afternoonDate = new Date('2026-10-09T14:00:00');
      expect(mapTimeToTimeOfDay('now', afternoonDate)).toBe('afternoon');
    });

    it('resolves 18:30 (6:30 PM) as evening', () => {
      const eveningDate = new Date('2026-10-09T18:30:00');
      expect(mapTimeToTimeOfDay('now', eveningDate)).toBe('evening');
    });

    it('resolves 23:00 (11:00 PM) as night', () => {
      const nightDate = new Date('2026-10-09T23:00:00');
      expect(mapTimeToTimeOfDay('now', nightDate)).toBe('night');
    });

    it('calculates 3h ago correctly from 14:00 to 11:00 (morning)', () => {
      const baseDate = new Date('2026-10-09T14:00:00');
      expect(mapTimeToTimeOfDay('3h ago', baseDate)).toBe('morning');
    });

    it('calculates earlier (6h ago) correctly from 14:00 to 08:00 (morning)', () => {
      const baseDate = new Date('2026-10-09T14:00:00');
      expect(mapTimeToTimeOfDay('earlier', baseDate)).toBe('morning');
    });
  });

  describe('validateSymptomPayload', () => {
    it('accepts valid symptom logging payload', () => {
      const validPayload = {
        category: 'pain',
        severity: 6,
        body_area: 'Head',
        triggers: ['poor_sleep', 'stress'],
        notes: 'Pulsing sensation behind left eye.',
      };
      expect(validateSymptomPayload(validPayload)).toBe(true);
    });

    it('rejects severity lower than 1', () => {
      expect(() =>
        validateSymptomPayload({ category: 'pain', severity: 0 })
      ).toThrow('Severity must be between 1 and 10');
    });

    it('rejects severity higher than 10', () => {
      expect(() =>
        validateSymptomPayload({ category: 'pain', severity: 11 })
      ).toThrow('Severity must be between 1 and 10');
    });

    it('rejects invalid category names', () => {
      expect(() =>
        validateSymptomPayload({ category: 'unknown_symptom', severity: 5 })
      ).toThrow('Invalid category: unknown_symptom');
    });

    it('rejects notes exceeding 500 characters', () => {
      const longNote = 'a'.repeat(501);
      expect(() =>
        validateSymptomPayload({ category: 'pain', severity: 5, notes: longNote })
      ).toThrow('Notes must not exceed 500 characters');
    });
  });

  describe('deleteCustomChoice', () => {
    it('removes custom body area from custom list and active selection', () => {
      const initialCustom = ['Head: Left Temple', 'Knee: Patella', 'Lower Back'];
      const initialSelected = ['Head', 'Head: Left Temple', 'Lower Back'];

      const result = deleteCustomChoice(initialCustom, initialSelected, 'Head: Left Temple');

      expect(result.updatedCustom).toEqual(['Knee: Patella', 'Lower Back']);
      expect(result.updatedSelected).toEqual(['Head', 'Lower Back']);
    });

    it('removes custom trigger from custom list and active selection', () => {
      const initialCustom = ['Caffeine Crash', 'Late Night Coding', 'Dairy'];
      const initialSelected = ['stress', 'Late Night Coding'];

      const result = deleteCustomChoice(initialCustom, initialSelected, 'Late Night Coding');

      expect(result.updatedCustom).toEqual(['Caffeine Crash', 'Dairy']);
      expect(result.updatedSelected).toEqual(['stress']);
    });

    it('retains selections if deleted item was not currently selected', () => {
      const initialCustom = ['Perfume Fragrance'];
      const initialSelected = ['stress', 'poor_sleep'];

      const result = deleteCustomChoice(initialCustom, initialSelected, 'Perfume Fragrance');

      expect(result.updatedCustom).toEqual([]);
      expect(result.updatedSelected).toEqual(['stress', 'poor_sleep']);
    });

    it('handles non-existent item gracefully', () => {
      const initialCustom = ['Neck: Cervical'];
      const initialSelected = ['Neck: Cervical'];

      const result = deleteCustomChoice(initialCustom, initialSelected, 'Non-existent Item');

      expect(result.updatedCustom).toEqual(['Neck: Cervical']);
      expect(result.updatedSelected).toEqual(['Neck: Cervical']);
    });
  });
});
