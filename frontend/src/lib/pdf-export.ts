import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export interface DoctorReportData {
  patientName: string;
  doctorName?: string;
  conditions?: string;
  dateRange: string;
  daysTracked: number;
  totalEntries: number;
  symptomTypesCount: number;
  avgSeverity: string | number;
  frequentSymptoms: Array<{ name: string; count: number; percentage: number; color?: string }>;
  patternsNotes: string[];
  questionsToDiscuss: string[];
  fullSummaryText?: string;
  recentLogs?: Array<{
    date: string;
    description: string;
    severity: number | string;
    timeOfDay?: string;
    triggers?: string;
    notes?: string;
  }>;
  generatedDate?: string;
}

const PALETTE = ['#C4714F', '#5A7D66', '#D4A437', '#7B5E99', '#3D7EAA', '#B85D5D'];

export function generateDoctorReportHtml(data: DoctorReportData): string {
  const generatedOn =
    data.generatedDate ||
    new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const symptomRowsHtml =
    data.frequentSymptoms.length > 0
      ? data.frequentSymptoms
          .map((item, index) => {
            const barColor = item.color || PALETTE[index % PALETTE.length];
            return `
            <tr>
              <td style="padding: 10px 14px; font-weight: 700; color: #1E293B; font-size: 14px; border-bottom: 1px solid #E2E8F0;">
                ${item.name}
              </td>
              <td style="padding: 10px 14px; font-weight: 700; color: #475569; font-size: 14px; text-align: center; border-bottom: 1px solid #E2E8F0;">
                ${item.count}×
              </td>
              <td style="padding: 10px 14px; width: 45%; border-bottom: 1px solid #E2E8F0;">
                <div style="background-color: #F1F5F9; height: 10px; border-radius: 5px; overflow: hidden; width: 100%;">
                  <div style="background-color: ${barColor}; height: 100%; width: ${Math.min(
              item.percentage,
              100
            )}%; border-radius: 5px;"></div>
                </div>
              </td>
            </tr>
          `;
          })
          .join('')
      : `<tr><td colspan="3" style="padding: 14px; color: #64748B; text-align: center; font-size: 14px;">No symptom frequency records found.</td></tr>`;

  const notesHtml =
    data.patternsNotes.length > 0
      ? data.patternsNotes
          .map(
            (note) => `
            <li style="margin-bottom: 10px; line-height: 1.6; color: #1E293B; font-size: 14px;">
              ${note.replace(/^[-*•]\s*/, '')}
            </li>
          `
          )
          .join('')
      : '<li style="color: #64748B; font-size: 14px;">No significant clinical patterns noted yet.</li>';

  const questionsHtml =
    data.questionsToDiscuss.length > 0
      ? data.questionsToDiscuss
          .map(
            (q) => `
            <li style="margin-bottom: 10px; line-height: 1.6; color: #1E293B; font-size: 14px;">
              ${q.replace(/^[-*•\d.]\s*/, '')}
            </li>
          `
          )
          .join('')
      : '<li style="color: #64748B; font-size: 14px;">Review any recurring discomfort, sleep disruptions, or medication timings.</li>';

  const recentLogsHtml =
    data.recentLogs && data.recentLogs.length > 0
      ? `
      <div class="section-card">
        <div class="section-title">RECENT LOG HISTORY (LAST ${data.recentLogs.length} ENTRIES)</div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
          <thead>
            <tr style="background-color: #F8FAFC; text-align: left;">
              <th style="padding: 9px 12px; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; border-bottom: 2px solid #CBD5E1;">Date & Time</th>
              <th style="padding: 9px 12px; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; border-bottom: 2px solid #CBD5E1;">Symptom</th>
              <th style="padding: 9px 12px; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; border-bottom: 2px solid #CBD5E1; text-align: center;">Severity</th>
              <th style="padding: 9px 12px; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; border-bottom: 2px solid #CBD5E1;">Triggers / Notes</th>
            </tr>
          </thead>
          <tbody>
            ${data.recentLogs
              .map((log) => {
                const sevNum = Number(log.severity) || 0;
                const badgeBg = sevNum >= 7 ? '#FEE2E2' : sevNum >= 4 ? '#FEF3C7' : '#DCFCE7';
                const badgeColor = sevNum >= 7 ? '#991B1B' : sevNum >= 4 ? '#92400E' : '#166534';
                return `
                <tr>
                  <td style="padding: 10px 12px; font-size: 13px; color: #334155; border-bottom: 1px solid #E2E8F0; white-space: nowrap;">
                    <strong>${log.date}</strong><br/>
                    <span style="font-size: 11px; color: #64748B;">${log.timeOfDay || ''}</span>
                  </td>
                  <td style="padding: 10px 12px; font-size: 13.5px; font-weight: 700; color: #0F172A; border-bottom: 1px solid #E2E8F0;">
                    ${log.description}
                  </td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: center;">
                    <span style="display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: 800; background-color: ${badgeBg}; color: ${badgeColor};">
                      ${log.severity}/10
                    </span>
                  </td>
                  <td style="padding: 10px 12px; font-size: 12.5px; color: #475569; border-bottom: 1px solid #E2E8F0; line-height: 1.4;">
                    ${log.triggers ? `<strong>Triggers:</strong> ${log.triggers}<br/>` : ''}
                    ${log.notes ? `<span>${log.notes}</span>` : '—'}
                  </td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `
      : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Clinical Health Summary - ${data.patientName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Nunito:wght@400;600;700;800;900&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #F8FAFC;
          color: #0F172A;
          padding: 28px 36px;
          max-width: 820px;
          margin: 0 auto;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #0F172A;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }

        .brand-title {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: 28px;
          color: #0F172A;
          line-height: 1.1;
        }

        .brand-subtitle {
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          margin-top: 3px;
        }

        .badge-clinical {
          display: inline-block;
          background-color: #E2E8F0;
          color: #1E293B;
          font-size: 11px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          margin-top: 6px;
          letter-spacing: 0.8px;
        }

        .meta-box {
          text-align: right;
          font-size: 12.5px;
          color: #475569;
          line-height: 1.6;
        }

        .meta-box strong {
          color: #0F172A;
          font-weight: 800;
        }

        /* Patient Banner */
        .patient-banner {
          background-color: #1E293B;
          color: #FFFFFF;
          border-radius: 12px;
          padding: 20px 24px;
          margin-bottom: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .patient-banner-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .patient-name {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: 26px;
          color: #FFFFFF;
          line-height: 1.1;
        }

        .patient-sub {
          font-size: 13px;
          color: #94A3B8;
          font-weight: 600;
          margin-top: 4px;
        }

        .physician-tag {
          text-align: right;
          font-size: 12px;
          color: #CBD5E1;
          line-height: 1.4;
        }

        .physician-tag strong {
          color: #38BDF8;
          font-size: 13px;
        }

        /* 4 Key Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .metric-card {
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          padding: 10px 12px;
          text-align: center;
        }

        .metric-value {
          font-size: 22px;
          font-weight: 900;
          color: #FFFFFF;
          line-height: 1.1;
        }

        .metric-label {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #CBD5E1;
          margin-top: 4px;
        }

        /* Section Cards */
        .section-card {
          background-color: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          padding: 18px 20px;
          margin-bottom: 18px;
          page-break-inside: avoid;
        }

        .section-title {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.9px;
          text-transform: uppercase;
          color: #334155;
          border-bottom: 2px solid #F1F5F9;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }

        ul {
          padding-left: 22px;
        }

        .disclaimer-box {
          background-color: #F8FAFC;
          border-left: 4px solid #64748B;
          border-radius: 4px;
          padding: 12px 16px;
          margin-top: 24px;
          font-size: 11.5px;
          line-height: 1.5;
          color: #475569;
          page-break-inside: avoid;
        }

        .sign-off-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 28px;
          padding-top: 14px;
          border-top: 1px dashed #CBD5E1;
          font-size: 12px;
          color: #475569;
          page-break-inside: avoid;
        }

        .signature-line {
          width: 220px;
          border-bottom: 1px solid #334155;
          margin-top: 36px;
        }

        @media print {
          body {
            background-color: #FFFFFF;
            padding: 12px 16px;
          }
          .patient-banner {
            box-shadow: none;
            border: 1px solid #0F172A;
          }
          .section-card {
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <!-- Document Header -->
      <div class="header-container">
        <div>
          <div class="brand-title">SymptomJournal</div>
          <div class="brand-subtitle">Clinical Health Summary &amp; Appointment Prep</div>
          <div class="badge-clinical">Confidential Medical Review</div>
        </div>
        <div class="meta-box">
          <div>Report Date: <strong>${generatedOn}</strong></div>
          <div>Period: <strong>${data.dateRange}</strong></div>
          <div>Tracking Span: <strong>${data.daysTracked} days</strong></div>
        </div>
      </div>

      <!-- Patient & Clinical Details -->
      <div class="patient-banner">
        <div class="patient-banner-header">
          <div>
            <div class="patient-name">${data.patientName}</div>
            <div class="patient-sub">
              ${data.conditions ? `Conditions: <strong style="color: #E2E8F0;">${data.conditions}</strong>` : 'General Patient Log'}
            </div>
          </div>
          <div class="physician-tag">
            Physician / Clinic:<br/>
            <strong>${data.doctorName || 'Attending Physician'}</strong>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${data.totalEntries}</div>
            <div class="metric-label">Total Entries</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${data.symptomTypesCount}</div>
            <div class="metric-label">Symptom Types</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${data.avgSeverity}/10</div>
            <div class="metric-label">Avg Severity</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${data.daysTracked}d</div>
            <div class="metric-label">Days Tracked</div>
          </div>
        </div>
      </div>

      <!-- Frequency Breakdown -->
      <div class="section-card">
        <div class="section-title">MOST FREQUENT SYMPTOMS</div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="text-align: left; font-size: 11px; text-transform: uppercase; color: #64748B;">
              <th style="padding: 6px 14px; font-weight: 800;">Symptom</th>
              <th style="padding: 6px 14px; font-weight: 800; text-align: center;">Frequency</th>
              <th style="padding: 6px 14px; font-weight: 800;">Relative Distribution</th>
            </tr>
          </thead>
          <tbody>
            ${symptomRowsHtml}
          </tbody>
        </table>
      </div>

      <!-- Clinical Patterns -->
      <div class="section-card">
        <div class="section-title">CLINICAL PATTERNS &amp; CORRELATIONS</div>
        <ul>
          ${notesHtml}
        </ul>
      </div>

      <!-- Questions to Discuss -->
      ${
        data.questionsToDiscuss.length > 0
          ? `
      <div class="section-card">
        <div class="section-title">QUESTIONS &amp; TOPICS FOR CLINICAL CONSULTATION</div>
        <ol style="padding-left: 20px;">
          ${questionsHtml}
        </ol>
      </div>
      `
          : ''
      }

      <!-- Detailed Recent History Table -->
      ${recentLogsHtml}

      <!-- Medical Disclaimer & Sign-off -->
      <div class="disclaimer-box">
        <strong>Notice for Healthcare Professionals:</strong> This document compiles patient-recorded symptom logs, intensity ratings, and self-reported triggers captured via the SymptomJournal mobile platform. It is prepared specifically to assist clinical interviews and should be interpreted alongside formal diagnostic evaluations.
      </div>

      <div class="sign-off-row">
        <div>
          <span>Physician Reviewer: _________________________</span><br/>
          <span style="font-size: 10.5px; color: #64748B; margin-top: 4px; display: inline-block;">Date: ________________</span>
        </div>
        <div>
          <span>Patient Signature: _________________________</span>
        </div>
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
      const { uri } = await Print.printToFileAsync({ html });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable && uri) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Clinical Summary - ${data.patientName}`,
          UTI: 'com.adobe.pdf',
        });
        return;
      }
    } catch (shareErr: any) {
      console.log(
        'Sharing failed or restricted on device, falling back to direct system print:',
        shareErr?.message || shareErr
      );
    }

    await Print.printAsync({ html });
  } catch (error: any) {
    console.error('Error exporting PDF:', error);
    throw new Error(error?.message || 'Could not export or print doctor report.');
  }
}
