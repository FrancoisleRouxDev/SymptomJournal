import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export interface DoctorReportData {
  patientName: string;
  dateRange: string;
  daysTracked: number;
  totalEntries: number;
  symptomTypesCount: number;
  avgSeverity: string | number;
  frequentSymptoms: Array<{ name: string; count: number; percentage: number; color?: string }>;
  patternsNotes: string[];
  questionsToDiscuss: string[];
  fullSummaryText?: string;
  generatedDate?: string;
}

const PALETTE = ['#C4714F', '#7B9E87', '#E8B87A', '#B8A0D0', '#7AAED0', '#E8A0A0'];

export function generateDoctorReportHtml(data: DoctorReportData): string {
  const generatedOn = data.generatedDate || new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const symptomRowsHtml = data.frequentSymptoms
    .map((item, index) => {
      const barColor = item.color || PALETTE[index % PALETTE.length];
      return `
        <div style="margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-weight: 600; font-size: 14px; color: #3E2D1E;">${item.name}</span>
            <span style="font-weight: 700; font-size: 13px; color: #6A5A4E;">${item.count}×</span>
          </div>
          <div style="background-color: #EDE5D8; height: 8px; border-radius: 4px; overflow: hidden; width: 100%;">
            <div style="background-color: ${barColor}; height: 100%; width: ${Math.min(item.percentage, 100)}%; border-radius: 4px;"></div>
          </div>
        </div>
      `;
    })
    .join('');

  const notesHtml = data.patternsNotes.length > 0
    ? data.patternsNotes
        .map(
          (note) => `
          <li style="margin-bottom: 8px; line-height: 1.5; color: #3E2D1E; font-size: 13.5px;">
            ${note.replace(/^[-*•]\s*/, '')}
          </li>
        `
        )
        .join('')
    : '<li style="color: #9A9088; font-size: 13.5px;">No specific patterns noted yet.</li>';

  const questionsHtml = data.questionsToDiscuss.length > 0
    ? data.questionsToDiscuss
        .map(
          (q) => `
          <li style="margin-bottom: 8px; line-height: 1.5; color: #3E2D1E; font-size: 13.5px;">
            ${q.replace(/^[-*•\d.]\s*/, '')}
          </li>
        `
        )
        .join('')
    : '<li style="color: #9A9088; font-size: 13.5px;">Speak to your doctor regarding any persistent symptoms.</li>';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Doctor Summary - ${data.patientName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Nunito:wght@400;600;700;800&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #FDFAF5;
          color: #3E2D1E;
          padding: 32px 40px;
          max-width: 800px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #EDE5D8;
          padding-bottom: 20px;
          margin-bottom: 24px;
        }

        .app-brand {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: 26px;
          color: #7B9E87;
          letter-spacing: -0.5px;
        }

        .report-badge {
          background-color: #D4E7DC;
          color: #5A7D66;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 6px;
          display: inline-block;
          margin-top: 4px;
        }

        .meta-right {
          text-align: right;
          font-size: 12px;
          color: #9A9088;
        }

        .meta-right strong {
          color: #6A5A4E;
        }

        .patient-card {
          background-color: #3E2D1E;
          color: #FFFFFF;
          border-radius: 16px;
          padding: 22px 24px;
          margin-bottom: 24px;
        }

        .patient-label {
          font-size: 11px;
          letter-spacing: 1.2px;
          font-weight: 800;
          text-transform: uppercase;
          color: #D4E7DC;
          margin-bottom: 4px;
        }

        .patient-name {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: 24px;
          margin-bottom: 4px;
        }

        .patient-range {
          font-size: 13px;
          color: #D8CFC4;
          margin-bottom: 18px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .stat-box {
          background-color: rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 12px 14px;
        }

        .stat-val {
          font-size: 22px;
          font-weight: 800;
          color: #FFFFFF;
        }

        .stat-name {
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: #D8CFC4;
          margin-top: 2px;
        }

        .section-card {
          background-color: #FFFFFF;
          border: 1px solid #EDE5D8;
          border-radius: 14px;
          padding: 20px 22px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(62, 45, 30, 0.04);
        }

        .section-title {
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #9A9088;
          margin-bottom: 16px;
        }

        ul {
          padding-left: 20px;
        }

        .disclaimer-card {
          background-color: #F6F0E8;
          border-left: 4px solid #7B9E87;
          border-radius: 6px;
          padding: 12px 16px;
          margin-top: 30px;
          font-size: 11px;
          line-height: 1.4;
          color: #6A5A4E;
        }

        @media print {
          body {
            padding: 15px 20px;
            background: #FFFFFF;
          }
          .section-card {
            box-shadow: none;
            border-color: #DDD;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="app-brand">SymptomJournal</div>
          <div class="report-badge">Clinical Appointment Summary</div>
        </div>
        <div class="meta-right">
          <div>Generated: <strong>${generatedOn}</strong></div>
          <div>Tracking Span: <strong>${data.daysTracked} days</strong></div>
        </div>
      </div>

      <div class="patient-card">
        <div class="patient-label">PATIENT REPORT</div>
        <div class="patient-name">${data.patientName}</div>
        <div class="patient-range">${data.dateRange} · ${data.daysTracked} days tracked</div>
        
        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-val">${data.totalEntries}</div>
            <div class="stat-name">Entries Logged</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">${data.symptomTypesCount}</div>
            <div class="stat-name">Symptom Types</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">${data.avgSeverity}</div>
            <div class="stat-name">Avg Severity</div>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-title">MOST FREQUENT SYMPTOMS</div>
        ${symptomRowsHtml || '<p style="color: #9A9088; font-size: 13px;">No symptoms logged in this period.</p>'}
      </div>

      <div class="section-card">
        <div class="section-title">PATTERNS &amp; CLINICAL NOTES</div>
        <ul>
          ${notesHtml}
        </ul>
      </div>

      ${
        data.questionsToDiscuss.length > 0
          ? `
      <div class="section-card">
        <div class="section-title">QUESTIONS &amp; TOPICS TO DISCUSS</div>
        <ul>
          ${questionsHtml}
        </ul>
      </div>
      `
          : ''
      }

      <div class="disclaimer-card">
        <strong>Confidential Patient Summary:</strong> This report is generated from personal symptom logs recorded in SymptomJournal to aid your healthcare provider during clinical consultations. It is not an automated medical diagnosis or prescription.
      </div>
    </body>
    </html>
  `;
}

export async function exportDoctorSummaryToPdf(data: DoctorReportData): Promise<void> {
  try {
    const html = generateDoctorReportHtml(data);

    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return;
    }

    try {
      // 1. Generate local PDF file
      const { uri } = await Print.printToFileAsync({ html });

      // 2. Attempt to open native system share dialog
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable && uri) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Doctor Summary - ${data.patientName}`,
          UTI: 'com.adobe.pdf',
        });
        return;
      }
    } catch (shareErr: any) {
      console.log('Sharing failed or restricted on device, falling back to direct system print:', shareErr?.message || shareErr);
    }

    // 3. Robust fallback: Open system print / "Save as PDF" dialog
    await Print.printAsync({ html });
  } catch (error: any) {
    console.error('Error exporting PDF:', error);
    throw new Error(error?.message || 'Could not export or print doctor report.');
  }
}

