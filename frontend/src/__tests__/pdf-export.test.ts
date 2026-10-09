import {
  generateDoctorReportHtml,
  exportDoctorSummaryToPdf,
  DoctorReportData,
} from '@/lib/pdf-export';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

// Mock expo-print & expo-sharing
jest.mock('expo-print', () => ({
  printAsync: jest.fn(),
  printToFileAsync: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

describe('PDF Export Utility (src/lib/pdf-export.ts)', () => {
  const sampleReportData: DoctorReportData = {
    patientName: 'Jane Doe',
    dateRange: 'Oct 1, 2026 – Oct 8, 2026',
    daysTracked: 7,
    totalEntries: 14,
    symptomTypesCount: 3,
    avgSeverity: '5.2',
    frequentSymptoms: [
      { name: 'Headache', count: 6, percentage: 43 },
      { name: 'Fatigue', count: 5, percentage: 36 },
      { name: 'Nausea', count: 3, percentage: 21 },
    ],
    patternsNotes: [
      '- Headaches frequently cluster in the morning hours.',
      '- Trigger "Poor Sleep" correlated with higher severity.',
    ],
    questionsToDiscuss: [
      '1. Should I adjust my sleep schedule or try magnesium?',
      '2. Are there preventive options for morning tension headaches?',
    ],
    generatedDate: 'Oct 9, 2026',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateDoctorReportHtml', () => {
    it('should generate complete HTML document with patient header, stats, and symptom breakdown', () => {
      const html = generateDoctorReportHtml(sampleReportData);

      expect(html).toContain('Doctor Summary - Jane Doe');
      expect(html).toContain('Jane Doe');
      expect(html).toContain('Oct 1, 2026 – Oct 8, 2026');
      expect(html).toContain('5.2');
      expect(html).toContain('14');
      expect(html).toContain('Headache');
      expect(html).toContain('6×');
      expect(html).toContain('Fatigue');
      expect(html).toContain('Nausea');
    });

    it('should include pattern notes and questions to discuss', () => {
      const html = generateDoctorReportHtml(sampleReportData);

      expect(html).toContain('Headaches frequently cluster in the morning hours.');
      expect(html).toContain('Should I adjust my sleep schedule or try magnesium?');
      expect(html).toContain('Confidential Patient Summary:');
    });

    it('should handle empty pattern notes and questions gracefully with placeholders', () => {
      const emptyData: DoctorReportData = {
        ...sampleReportData,
        patternsNotes: [],
        questionsToDiscuss: [],
      };

      const html = generateDoctorReportHtml(emptyData);

      expect(html).toContain('No specific patterns noted yet.');
    });
  });

  describe('exportDoctorSummaryToPdf', () => {
    it('should directly call Print.printAsync when running on Web platform', async () => {
      const originalOS = Platform.OS;
      (Platform as any).OS = 'web';

      (Print.printAsync as jest.Mock).mockResolvedValueOnce(undefined);

      await exportDoctorSummaryToPdf(sampleReportData);

      expect(Print.printAsync).toHaveBeenCalledWith({
        html: expect.stringContaining('Jane Doe'),
      });
      expect(Print.printToFileAsync).not.toHaveBeenCalled();

      (Platform as any).OS = originalOS;
    });

    it('should generate file and share via Sharing.shareAsync on native when sharing is available', async () => {
      const originalOS = Platform.OS;
      (Platform as any).OS = 'android';

      (Print.printToFileAsync as jest.Mock).mockResolvedValueOnce({ uri: 'file:///cache/report.pdf' });
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(true);
      (Sharing.shareAsync as jest.Mock).mockResolvedValueOnce(undefined);

      await exportDoctorSummaryToPdf(sampleReportData);

      expect(Print.printToFileAsync).toHaveBeenCalled();
      expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///cache/report.pdf', {
        mimeType: 'application/pdf',
        dialogTitle: 'Doctor Summary - Jane Doe',
        UTI: 'com.adobe.pdf',
      });

      (Platform as any).OS = originalOS;
    });

    it('should fall back to Print.printAsync when sharing fails or is restricted', async () => {
      const originalOS = Platform.OS;
      (Platform as any).OS = 'android';

      (Print.printToFileAsync as jest.Mock).mockResolvedValueOnce({ uri: 'file:///cache/report.pdf' });
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(true);
      (Sharing.shareAsync as jest.Mock).mockRejectedValueOnce(new Error('Permission denied'));
      (Print.printAsync as jest.Mock).mockResolvedValueOnce(undefined);

      await exportDoctorSummaryToPdf(sampleReportData);

      expect(Print.printAsync).toHaveBeenCalledWith({
        html: expect.stringContaining('Jane Doe'),
      });

      (Platform as any).OS = originalOS;
    });
  });
});
