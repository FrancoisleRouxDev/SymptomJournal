import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, FileText, ShieldAlert, ShieldCheck, Mail, AlertTriangle } from 'lucide-react-native';
import { Spacing, Radius, FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const LAST_UPDATED = 'October 2026';
const APP_NAME = 'SymptomJournal';
const CONTACT_EMAIL = 'support@symptomjournal.app';

interface LegalSection {
  title: string;
  body: string;
  highlight?: boolean;
}

const TERMS_SECTIONS: LegalSection[] = [
  {
    title: '1. Acceptance of Terms & Eligibility',
    body: `By downloading, installing, accessing, or using ${APP_NAME} ("the App"), you acknowledge that you have read, understood, and agreed to be legally bound by these Terms and Conditions. If you do not agree to every provision of these terms, you must not use or access the App.\n\nYou must be at least 18 years of age, or have the legal consent of a parent or guardian, to create an account and use this App. By using the App, you represent and warrant that you possess the legal authority to enter into these Terms.`,
  },
  {
    title: '2. Critical Medical Disclaimer — Not a Medical Device',
    body: `${APP_NAME} is strictly a personal health journaling and symptom logging tool. The App and its creators do NOT provide medical care, clinical diagnoses, medical treatment, triage, or healthcare services.\n\n• The App is NOT a licensed medical device or Software as a Medical Device (SaMD).\n• Nothing contained in the App, including symptom analyses, trend summaries, trigger reports, or AI suggestions, constitutes professional medical advice, clinical diagnosis, or prescriptive guidance.\n• Always consult a qualified, licensed healthcare professional (such as a medical doctor or specialist) before making any healthcare decisions, starting or stopping any medication, or interpreting your symptoms.\n• Never disregard or delay seeking professional medical advice because of information provided by or stored in this App.`,
    highlight: true,
  },
  {
    title: '3. Medical Emergency Protocol',
    body: `NEVER use ${APP_NAME} during a medical emergency.\n\nIf you believe you or another person is experiencing an acute medical emergency (such as severe chest pain, shortness of breath, unexplained fainting, allergic reactions, sudden numbness, or severe trauma), immediately call your local emergency services (e.g., 112 / 10177 in South Africa, 911 in the USA, or your regional equivalent) or proceed immediately to the nearest hospital emergency room.`,
    highlight: true,
  },
  {
    title: '4. No Doctor-Patient or Fiduciary Relationship',
    body: `Your access to or use of ${APP_NAME}, and any communication resulting from the App or its AI features, does NOT establish a doctor-patient, physician-patient, therapist-client, or any other confidential or healthcare fiduciary relationship between you, the App developer, or any third-party AI provider.`,
  },
  {
    title: '5. AI Medication Assistant & Machine Learning Disclaimers',
    body: `The App incorporates artificial intelligence (AI Rx) and automated pattern recognition powered by third-party large language models:\n\n• General Information Only: AI responses provide generalized educational and over-the-counter (OTC) background information. The AI cannot diagnose conditions or prescribe pharmaceuticals.\n• Probabilistic Nature & Errors: AI models generate responses probabilistically and may occasionally produce inaccurate, incomplete, hallucinated, or outdated information.\n• Verification Mandatory: You must independently verify any medication dosage, active ingredient, interaction, or contraindication with a licensed pharmacist or physician before taking any action.\n• The developer assumes zero responsibility for actions taken based on AI-generated suggestions.`,
  },
  {
    title: '6. User Responsibilities & Acceptable Use',
    body: `As a user of the App, you agree to:\n\n• Provide accurate and truthful information during registration and health logging.\n• Maintain the confidentiality of your login credentials and accept responsibility for all activities occurring under your account.\n• Refrain from reverse engineering, decompiling, scraping, or attempting to compromise the security, integrity, or availability of the App or its underlying API.\n• Not use the App for any unlawful, fraudulent, defamatory, or abusive purposes.\n\nWe reserve the right to suspend or terminate accounts that violate these terms without prior notice.`,
  },
  {
    title: '7. Limitation of Liability & Damages Waiver',
    body: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE APP DEVELOPER, CONTRIBUTORS, AFFILIATES, OR HOSTING PARTNERS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, PUNITIVE, OR EXEMPLARY DAMAGES WHATSOEVER (INCLUDING, WITHOUT LIMITATION, DAMAGES FOR PERSONAL INJURY, MEDICAL COMPLICATIONS, WRONGFUL DEATH, LOSS OF HEALTH DATA, LOSS OF PROFITS, OR SERVICE INTERRUPTION) ARISING OUT OF OR IN CONNECTION WITH:\n\n• Your use of, or inability to use, the App or its features;\n• Any reliance placed on AI insights, doctor summaries, or symptom analytics;\n• Any errors, inaccuracies, delays, or omissions in the App's content;\n• Unauthorized access to or alteration of your transmissions or data.\n\nThe App is provided on an "AS IS" and "AS AVAILABLE" basis, without warranties of any kind, whether express, implied, statutory, or otherwise.`,
  },
  {
    title: '8. Indemnification',
    body: `You agree to defend, indemnify, and hold harmless the developer, contributors, and operators of ${APP_NAME} from and against any and all claims, liabilities, damages, losses, expenses, and reasonable legal fees arising out of or in any way connected with:\n\n• Your access to or misuse of the App;\n• Your violation of any provision of these Terms;\n• Your reliance on any content or AI output generated by the App;\n• Any infringement of third-party rights caused by your account.`,
  },
  {
    title: '9. Intellectual Property',
    body: `All source code, software architecture, UI designs, brand assets, logos, and documentation associated with ${APP_NAME} are the exclusive intellectual property of the developer. You are granted a limited, personal, revocable, non-exclusive, non-transferable license to use the App solely for personal, non-commercial health tracking purposes.`,
  },
  {
    title: '10. Third-Party Services & Infrastructure',
    body: `${APP_NAME} relies on infrastructure provided by third-party vendors, including Supabase (authentication and database), Render (backend hosting), and NVIDIA NIM (AI processing). We do not warrant the continuous, uninterrupted, or error-free availability of these external platforms and are not liable for any downtime, outages, or service disruptions.`,
  },
  {
    title: '11. Governing Law & Jurisdiction',
    body: `These Terms and Conditions shall be governed by, construed, and enforced in accordance with the laws of the Republic of South Africa, without giving effect to any principles of conflicts of law. You agree to submit to the exclusive jurisdiction of the competent courts of South Africa for the resolution of any dispute arising hereunder.`,
  },
  {
    title: '12. Modifications to Terms',
    body: `We reserve the right to amend or revise these Terms at our sole discretion. Any changes will be posted within the App with an updated "Last Updated" timestamp. Your continued use of the App following the posting of revised Terms constitutes your unconditional acceptance of the changes.`,
  },
];

const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: '1. Privacy Commitment & Scope',
    body: `${APP_NAME} respects your fundamental right to privacy. This Privacy Policy details how we collect, process, store, and protect your personal and health-related data in accordance with applicable data protection principles, including South Africa's Protection of Personal Information Act (POPIA) and general international privacy standards.`,
  },
  {
    title: '2. Data We Collect',
    body: `We only collect data that you voluntarily provide to facilitate personal health tracking:\n\n• Account Information: Name, email address, password hash, and authenticated user ID.\n• Health Profile Data: Date of birth and biological sex (used strictly to contextualize health logs and symptom insights).\n• Symptom & Clinical Entries: Symptom descriptions, severity ratings, triggers, start/end dates, and medication notes.\n• App Preferences: Theme settings (dark/light mode), reminder schedules, and font size choices stored on your device.`,
  },
  {
    title: '3. Purpose of Processing',
    body: `Your information is processed exclusively for:\n\n• Maintaining your personal symptom journal and historical logs;\n• Calculating symptom frequency, average severity, and trigger correlations;\n• Generating user-requested Doctor Visit Summaries;\n• Providing contextual guidance in the AI Medication Assistant;\n• Sending local scheduled reminder notifications on your device.`,
  },
  {
    title: '4. Zero Sale of Personal Data',
    body: `We do NOT sell, rent, monetize, or trade your personal health data to third-party data brokers, advertisers, or marketing agencies under any circumstances. Your health logs are yours alone.`,
    highlight: true,
  },
  {
    title: '5. Storage & Security Architecture',
    body: `• Encryption: Data in transit is protected using industry-standard Transport Layer Security (TLS 1.2+ / HTTPS).\n• Database Security: Your health records are stored in Supabase with Row-Level Security (RLS) policies enabled, ensuring that only your authenticated account can read or write your logs.\n• Passwords: User passwords are cryptographically hashed by Supabase Auth and are never visible in plaintext.`,
  },
  {
    title: '6. Third-Party Service Providers',
    body: `To deliver app functionality, data is processed by trusted cloud vendors:\n\n• Supabase: Managed authentication and encrypted relational database hosting.\n• Render: Cloud backend API host for analytical summaries.\n• NVIDIA NIM / AI Inference: Processes isolated health queries and prompts for AI guidance without persistent training on your individual medical identity.\n• Expo (React Native): Platform tooling and local push notification delivery.`,
  },
  {
    title: '7. Your Rights & Data Deletion',
    body: `You retain complete control over your personal data:\n\n• Access & Export: You can export your full symptom history directly in JSON format via the Settings menu at any time.\n• Rectification: You can edit or delete individual symptom entries from your journal.\n• Account Deletion: You have the right to request permanent deletion of your account and all associated health records from our database by emailing ${CONTACT_EMAIL}.`,
  },
  {
    title: '8. Contact Information',
    body: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data handling practices, please contact us at:\n\n${CONTACT_EMAIL}`,
  },
];

export default function TermsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string }>();
  const { colors, isDarkMode, scaled } = useTheme();

  // Tab state: 'terms' | 'privacy'
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(
    params.section === 'privacy' ? 'privacy' : 'terms'
  );

  const sections = activeTab === 'terms' ? TERMS_SECTIONS : PRIVACY_SECTIONS;

  const handleOpenEmail = () => {
    Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      activeTab === 'terms' ? 'Terms & Conditions Query' : 'Privacy Policy Inquiry'
    )}`).catch(() => {});
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background.canvas }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDarkMode ? '#2D2825' : '#EAE1D5' }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDarkMode ? '#342F2C' : '#EAE1D5' }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={22} color={colors.neutral.brown} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {activeTab === 'terms' ? (
            <FileText size={18} color={colors.sage.dark} />
          ) : (
            <ShieldCheck size={18} color={colors.sage.dark} />
          )}
          <Text style={[styles.headerTitle, { color: colors.neutral.brown, fontSize: scaled(15) }]}>
            {activeTab === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
          </Text>
        </View>

        <View style={styles.backBtnPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Tab Toggle Switch */}
        <View
          style={[
            styles.tabContainer,
            {
              backgroundColor: isDarkMode ? '#2D2825' : '#EFE7DC',
              borderColor: isDarkMode ? '#3A332F' : '#E0D6C8',
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'terms' && [
                styles.tabBtnActive,
                { backgroundColor: colors.sage.dark },
              ],
            ]}
            onPress={() => setActiveTab('terms')}
            activeOpacity={0.8}
          >
            <FileText
              size={15}
              color={activeTab === 'terms' ? '#FFFFFF' : colors.neutral.muted}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabText,
                {
                  fontSize: scaled(13),
                  color: activeTab === 'terms' ? '#FFFFFF' : colors.neutral.muted,
                  fontFamily: activeTab === 'terms' ? 'Nunito-Bold' : 'Nunito-Medium',
                },
              ]}
            >
              Terms of Service
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'privacy' && [
                styles.tabBtnActive,
                { backgroundColor: colors.sage.dark },
              ],
            ]}
            onPress={() => setActiveTab('privacy')}
            activeOpacity={0.8}
          >
            <ShieldCheck
              size={15}
              color={activeTab === 'privacy' ? '#FFFFFF' : colors.neutral.muted}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabText,
                {
                  fontSize: scaled(13),
                  color: activeTab === 'privacy' ? '#FFFFFF' : colors.neutral.muted,
                  fontFamily: activeTab === 'privacy' ? 'Nunito-Bold' : 'Nunito-Medium',
                },
              ]}
            >
              Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: colors.neutral.brown, fontSize: scaled(26) }]}>
            {activeTab === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
          </Text>
          <Text style={[styles.heroSub, { color: colors.neutral.muted, fontSize: scaled(12.5) }]}>
            {APP_NAME} • Last updated: {LAST_UPDATED}
          </Text>
        </View>

        {/* Intro */}
        <Text style={[styles.intro, { color: colors.neutral.brown, fontSize: scaled(14) }]}>
          {activeTab === 'terms'
            ? `Please read these Terms carefully before using ${APP_NAME}. These terms protect both your rights and the developers, establishing rules and critical medical disclaimers governing your use of the application.`
            : `Your privacy is our priority. This policy outlines how ${APP_NAME} safeguards your sensitive symptom logs, your personal data rights, and our strict zero-data-selling guarantee.`}
        </Text>

        {/* Medical disclaimer callout banner (Always prominent for legal protection) */}
        <View
          style={[
            styles.disclaimerBanner,
            {
              backgroundColor: isDarkMode ? 'rgba(217, 107, 79, 0.12)' : '#FFF4ED',
              borderColor: colors.terracotta.base,
            },
          ]}
        >
          <View style={styles.disclaimerIconWrap}>
            <AlertTriangle size={scaled(20)} color={colors.terracotta.dark} />
          </View>
          <View style={styles.disclaimerContent}>
            <Text
              style={[
                styles.disclaimerTitle,
                { color: colors.terracotta.dark, fontSize: scaled(13.5) },
              ]}
            >
              Critical Medical Notice
            </Text>
            <Text
              style={[
                styles.disclaimerText,
                { color: colors.neutral.brown, fontSize: scaled(12) },
              ]}
            >
              {APP_NAME} is an informational tracking tool, NOT a diagnostic medical device. It does not replace the diagnosis or treatment of a licensed doctor. In an emergency, call emergency services immediately.
            </Text>
          </View>
        </View>

        {/* Legal Sections */}
        {sections.map((section, index) => {
          const isHighlighted = section.highlight;
          return (
            <View
              key={index}
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isHighlighted
                    ? isDarkMode
                      ? 'rgba(123, 158, 135, 0.08)'
                      : '#F4F8F5'
                    : colors.background.card,
                  borderColor: isHighlighted
                    ? colors.sage.base
                    : isDarkMode
                    ? '#342F2C'
                    : '#EAE1D5',
                },
              ]}
            >
              <View style={styles.sectionHeaderRow}>
                {isHighlighted && (
                  <ShieldAlert
                    size={scaled(16)}
                    color={colors.sage.dark}
                    style={{ marginRight: 6 }}
                  />
                )}
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: isHighlighted ? colors.sage.dark : colors.neutral.brown,
                      fontSize: scaled(14.5),
                    },
                  ]}
                >
                  {section.title}
                </Text>
              </View>
              <Text
                style={[
                  styles.sectionBody,
                  { color: colors.neutral.brown, fontSize: scaled(13) },
                ]}
              >
                {section.body}
              </Text>
            </View>
          );
        })}

        {/* Contact & Support Card */}
        <View
          style={[
            styles.contactCard,
            {
              backgroundColor: isDarkMode ? '#2D2825' : '#EFE7DC',
              borderColor: isDarkMode ? '#3A332F' : '#E0D6C8',
            },
          ]}
        >
          <Mail size={scaled(22)} color={colors.sage.dark} style={{ marginBottom: 8 }} />
          <Text
            style={[
              styles.contactTitle,
              { color: colors.neutral.brown, fontSize: scaled(15) },
            ]}
          >
            Questions or Legal Inquiries?
          </Text>
          <Text
            style={[
              styles.contactSub,
              { color: colors.neutral.muted, fontSize: scaled(12.5) },
            ]}
          >
            Contact the development and support team directly regarding your rights, data privacy, or terms of service.
          </Text>

          <TouchableOpacity
            style={[styles.contactBtn, { backgroundColor: colors.sage.dark }]}
            onPress={handleOpenEmail}
            activeOpacity={0.85}
          >
            <Text style={[styles.contactBtnText, { fontSize: scaled(13.5) }]}>
              Email Support ({CONTACT_EMAIL})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Legal Acknowledgement */}
        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              { color: colors.neutral.muted, fontSize: scaled(11.5) },
            ]}
          >
            By continuing to access or use {APP_NAME}, you formally acknowledge that you have read, understood, and agreed to be bound by these {activeTab === 'terms' ? 'Terms & Conditions' : 'Privacy Policies'}.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnPlaceholder: {
    width: 38,
    height: 38,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: 'Nunito-Bold',
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 60,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    padding: 4,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  tabBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    textAlign: 'center',
  },
  hero: {
    marginBottom: Spacing.sm,
  },
  heroTitle: {
    fontFamily: 'DMSerifDisplay-Regular',
    lineHeight: 34,
  },
  heroSub: {
    fontFamily: 'Nunito-Medium',
    marginTop: 4,
  },
  intro: {
    fontFamily: 'Nunito-Regular',
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1.5,
    borderLeftWidth: 4.5,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  disclaimerIconWrap: {
    marginTop: 2,
  },
  disclaimerContent: {
    flex: 1,
  },
  disclaimerTitle: {
    fontFamily: 'Nunito-Bold',
    marginBottom: 3,
  },
  disclaimerText: {
    fontFamily: 'Nunito-Medium',
    lineHeight: 18,
  },
  sectionCard: {
    borderRadius: Radius.lg,
    padding: Spacing.md + 2,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs + 2,
  },
  sectionTitle: {
    fontFamily: 'Nunito-Bold',
    flex: 1,
  },
  sectionBody: {
    fontFamily: 'Nunito-Regular',
    lineHeight: 21,
  },
  contactCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  contactTitle: {
    fontFamily: 'Nunito-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  contactSub: {
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  contactBtn: {
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactBtnText: {
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
  footer: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  footerText: {
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
});
