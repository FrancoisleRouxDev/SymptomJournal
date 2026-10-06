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
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
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
        <View style={styles.container}>
            <SafeAreaView style={styles.safe}>
                
                {/* Header with Back Button */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Text style={styles.backBtnText}>‹ Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Medication Assistant</Text>
                    <Text style={styles.subtitle}>AI-powered medication info & general health guidance</Text>
                </View>

                {/* Quick Prompts */}
                <View style={styles.quickPromptsWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPromptsContainer}>
                        {QUICK_QUESTIONS.map((q, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={styles.quickPromptChip}
                                onPress={() => handleSend(q)}>
                                <Text style={styles.quickPromptText}>💡 {q}</Text>
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
                                msg.sender === 'user' ? styles.userBubble : styles.assistantBubble,
                            ]}>
                            <Text style={[styles.messageSender, msg.sender === 'user' && { color: Colors.white }]}>
                                {msg.sender === 'user' ? 'You' : '🤖 AI Assistant'}
                            </Text>
                            <Text style={[styles.messageText, msg.sender === 'user' && { color: Colors.white }]}>
                                {msg.text}
                            </Text>
                            <Text style={[styles.messageTime, msg.sender === 'user' && { color: 'rgba(255,255,255,0.7)' }]}>
                                {msg.timestamp}
                            </Text>
                        </View>
                    ))}
                    {loading && (
                        <View style={[styles.messageBubble, styles.assistantBubble, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                            <ActivityIndicator color={Colors.sage.dark} size="small" />
                            <Text style={styles.messageText}>Thinking...</Text>
                        </View>
                    )}
                </ScrollView>

                {/* Input Bar */}
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Ask about medications, side effects..."
                            placeholderTextColor={Colors.neutral.muted}
                            value={inputText}
                            onChangeText={setInputText}
                            onSubmitEditing={() => handleSend()}
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnDisabled]}
                            onPress={() => handleSend()}
                            disabled={!inputText.trim() || loading}>
                            <Text style={styles.sendBtnText}>Send</Text>
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
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral.border,
    },
    backBtn: {
        marginBottom: 6,
    },
    backBtnText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.body,
        color: Colors.sage.dark,
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

    messageSender: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.micro,
        color: Colors.neutral.brownMid,
        marginBottom: 4,
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
        padding: Spacing.md,
        backgroundColor: Colors.background.card,
        borderTopWidth: 1,
        borderTopColor: Colors.neutral.border,
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
        backgroundColor: Colors.sage.dark,
        paddingHorizontal: 18,
        borderRadius: Radius.md,
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
