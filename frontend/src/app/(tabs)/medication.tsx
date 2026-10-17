import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bot, Sparkles, ChevronLeft, User, Send } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import api from '@/lib/api';

interface Message {
    id: string;
    sender: 'user' | 'assistant';
    text: string;
    timestamp: string;
}

const QUICK_QUESTIONS = [
    'Common side effects of Ibuprofen?',
    'Can I take Paracetamol with food?',
    'What helps with tension headaches?',
    'Medication tracking reminder tips',
];

export default function MedicationAssistantScreen() {
    const router = useRouter();
    const { colors, isDarkMode, scaled } = useTheme();

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            sender: 'assistant',
            text: 'Hello! I am your AI Medication & Health Assistant. Ask me any questions about medication dosages, interactions, side effects, or general health guidance.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async (queryText?: string) => {
        const textToSend = queryText || inputText;
        if (!textToSend.trim() || loading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: textToSend.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, userMsg]);
        if (!queryText) setInputText('');
        setLoading(true);

        try {
            let assistantResponse = '';

            try {
                // Call real AI backend endpoint
                const res = await api.post('/analysis/chat', {
                    query: textToSend.trim(),
                    history: messages.map((m) => ({ sender: m.sender, text: m.text })),
                });

                if (res.data?.response) {
                    assistantResponse = res.data.response;
                }
            } catch (apiErr: any) {
                console.log('AI chat API error, using safe fallback:', apiErr?.message || apiErr);

                // Fallback rules if backend is unreachable or offline
                const lower = textToSend.toLowerCase();
                if (lower.includes('ibuprofen')) {
                    assistantResponse = 'Ibuprofen is an NSAID commonly used for pain and swelling. Always take with food or milk to protect your stomach. Speak to your doctor if you have kidney or ulcer issues.';
                } else if (lower.includes('paracetamol') || lower.includes('acetaminophen')) {
                    assistantResponse = 'Paracetamol is used for mild pain and fever relief. Maximum adult daily limit is strictly 4,000 mg in 24 hours. Avoid combining with other paracetamol products to protect liver health.';
                } else if (lower.includes('headache') || lower.includes('migraine')) {
                    assistantResponse = 'For headaches, rest in a dark room, hydrate well, and consider safe OTC relief. Log frequent episodes in your Symptom Timeline for clinical review.';
                } else {
                    assistantResponse = `I have received your question: "${textToSend}". Please make sure to discuss specific medication schedules and dosages directly with your prescribing physician or pharmacist.`;
                }
            }

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'assistant',
                text: assistantResponse,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            setMessages((prev) => [...prev, aiMsg]);
        } catch (error) {
            console.log('Chat error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background.canvas }]}>
            <SafeAreaView style={styles.safe} edges={['top']}>

                {/* Header with Back Button */}
                <View style={[styles.header, { borderBottomColor: colors.neutral.border }]}>
                    <TouchableOpacity
                        style={[
                            styles.backBtn,
                            {
                                backgroundColor: isDarkMode ? '#24201D' : '#F6F0E8',
                                borderColor: colors.neutral.border,
                            },
                        ]}
                        onPress={() => router.back()}
                    >
                        <ChevronLeft size={16} color={colors.neutral.brown} />
                        <Text style={[styles.backBtnText, { color: colors.neutral.brown }]}>Back</Text>
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.neutral.brown, fontSize: scaled(24) }]}>Medication Assistant</Text>
                    <Text style={[styles.subtitle, { color: colors.neutral.muted, fontSize: scaled(13) }]}>AI-powered medication info & general health guidance</Text>
                </View>

                {/* Quick Prompts */}
                <View style={[styles.quickPromptsWrapper, { borderBottomColor: colors.neutral.border }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPromptsContainer}>
                        {QUICK_QUESTIONS.map((q, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[styles.quickPromptChip, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }]}
                                onPress={() => handleSend(q)}>
                                <Sparkles size={12} color={colors.sage.dark} style={{ marginRight: 6 }} />
                                <Text style={[styles.quickPromptText, { color: colors.neutral.brown }]}>{q}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Chat Messages */}
                <ScrollView contentContainerStyle={styles.chatScroll} showsVerticalScrollIndicator={false}>
                    {messages.map((msg) => (
                        <View
                            key={msg.id}
                            style={[
                                styles.messageBubble,
                                msg.sender === 'user'
                                    ? styles.userBubble
                                    : [styles.assistantBubble, { backgroundColor: colors.background.card, borderColor: colors.neutral.border }],
                            ]}>
                            <View style={styles.senderHeaderRow}>
                                {msg.sender === 'user' ? (
                                    <User size={13} color={Colors.white} style={{ marginRight: 4 }} />
                                ) : (
                                    <Bot size={14} color={colors.sage.dark} style={{ marginRight: 4 }} />
                                )}
                                <Text style={[styles.messageSender, msg.sender === 'user' ? { color: Colors.white } : { color: colors.sage.dark }]}>
                                    {msg.sender === 'user' ? 'You' : 'AI Assistant'}
                                </Text>
                            </View>
                            <Text style={[styles.messageText, msg.sender === 'user' ? { color: Colors.white } : { color: colors.neutral.brown }]}>
                                {msg.text}
                            </Text>
                            <Text style={[styles.messageTime, msg.sender === 'user' ? { color: 'rgba(255,255,255,0.7)' } : { color: colors.neutral.muted }]}>
                                {msg.timestamp}
                            </Text>
                        </View>
                    ))}
                    {loading && (
                        <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: colors.background.card, borderColor: colors.neutral.border, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                            <Bot size={15} color={colors.sage.dark} />
                            <ActivityIndicator color={colors.sage.dark} size="small" />
                            <Text style={[styles.messageText, { color: colors.neutral.muted }]}>Thinking...</Text>
                        </View>
                    )}
                </ScrollView>

                {/* Input Bar */}
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={[styles.inputContainer, { backgroundColor: colors.background.card, borderTopColor: colors.neutral.border }]}>
                        <TextInput
                            style={[styles.textInput, { backgroundColor: colors.background.canvas, borderColor: colors.neutral.border, color: colors.neutral.brown }]}
                            placeholder="Ask about medications, side effects..."
                            placeholderTextColor={colors.neutral.muted}
                            value={inputText}
                            onChangeText={setInputText}
                            onSubmitEditing={() => handleSend()}
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnDisabled]}
                            onPress={() => handleSend()}
                            disabled={!inputText.trim() || loading}
                            activeOpacity={0.8}
                            accessibilityLabel="Send message">
                            <Send size={18} color={Colors.white} strokeWidth={2.2} />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>

            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F6F0E8' },
    safe: { flex: 1 },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: Radius.full,
        borderWidth: 1,
        marginBottom: 8,
        gap: 4,
    },
    backBtnText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.caption,
    },
    title: {
        fontFamily: 'DMSerifDisplay-Regular',
        fontSize: FontSize.display,
        color: Colors.neutral.brown,
    },
    subtitle: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.muted,
        marginTop: 2,
    },

    quickPromptsWrapper: {
        paddingVertical: Spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral.border,
    },
    quickPromptsContainer: {
        paddingHorizontal: Spacing.lg,
        gap: 8,
    },
    quickPromptChip: {
        backgroundColor: Colors.sage.tint,
        borderColor: Colors.sage.light,
        borderWidth: 1,
        borderRadius: Radius.full,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    quickPromptText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.micro,
        color: Colors.sage.dark,
    },

    chatScroll: {
        padding: Spacing.lg,
        gap: Spacing.md,
    },

    messageBubble: {
        borderRadius: Radius.lg,
        padding: Spacing.md,
        maxWidth: '85%',
        borderWidth: 1,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: Colors.terracotta.base,
        borderColor: Colors.terracotta.dark,
    },
    assistantBubble: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.background.card,
        borderColor: Colors.neutral.border,
    },

    senderHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    messageSender: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.micro,
        color: Colors.neutral.brownMid,
    },
    messageText: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.body,
        color: Colors.neutral.brown,
        lineHeight: 20,
    },
    messageTime: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.micro,
        color: Colors.neutral.muted,
        marginTop: 6,
        alignSelf: 'flex-end',
    },

    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 8 : 4,
        borderTopWidth: 1,
        gap: 8,
    },
    textInput: {
        flex: 1,
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.body,
        color: Colors.neutral.brown,
        backgroundColor: Colors.background.canvas,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: Colors.neutral.border,
    },
    sendBtn: {
        height: 40,
        width: 40,
        backgroundColor: Colors.sage.dark,
        paddingHorizontal: 25,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: {
        opacity: 0.5,
    },
    sendBtnText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.bodyBold,
        color: Colors.white,
    },
});
