import React, { useState, useEffect, useRef } from 'react';
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
    Modal,
    Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bot, Sparkles, ChevronLeft, User, Send, Wifi, WifiOff, X, Info } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import api from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const STORAGE_SEEN_NETWORK_WARNING = 'has_seen_ai_rx_network_notice';

// Extra breathing room (in pixels) to keep the input bar comfortably above the keyboard
const KEYBOARD_EXTRA_OFFSET = 24;

export default function MedicationAssistantScreen() {
    const router = useRouter();
    const { colors, isDarkMode, scaled } = useTheme();
    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef<ScrollView>(null);

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
    const [androidKeyboardHeight, setAndroidKeyboardHeight] = useState(0);

    // Online / Offline and Network Modal states
    const [showNetworkModal, setShowNetworkModal] = useState(false);
    const [isOnline, setIsOnline] = useState<boolean>(true);
    const [isChecking, setIsChecking] = useState<boolean>(false);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, (e) => {
            if (Platform.OS === 'android') {
                setAndroidKeyboardHeight(e.endCoordinates.height);
            }
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 60);
        });

        const hideSub = Keyboard.addListener(hideEvent, () => {
            if (Platform.OS === 'android') {
                setAndroidKeyboardHeight(0);
            }
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    useEffect(() => {
        checkStatus();

        AsyncStorage.getItem(STORAGE_SEEN_NETWORK_WARNING).then((seen) => {
            if (!seen) {
                setShowNetworkModal(true);
            }
        });
    }, []);

    const checkStatus = async () => {
        setIsChecking(true);
        try {
            const res = await api.get('/', { timeout: 5000 });
            setIsOnline(res.status === 200);
        } catch {
            setIsOnline(false);
        } finally {
            setIsChecking(false);
        }
    };

    const handleDismissModal = async () => {
        setShowNetworkModal(false);
        try {
            await AsyncStorage.setItem(STORAGE_SEEN_NETWORK_WARNING, 'true');
        } catch { }
    };

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
                    setIsOnline(true);
                }
            } catch (apiErr: any) {
                console.log('AI chat API error, using safe fallback:', apiErr?.message || apiErr);
                setIsOnline(false);

                // Safe medical fallback rules if backend is unreachable or offline
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
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background.canvas }]} edges={['top']}>
            <KeyboardAvoidingView
                style={[
                    styles.keyboardAvoid,
                    Platform.OS === 'android' && {
                        paddingBottom: androidKeyboardHeight > 0 
                            ? androidKeyboardHeight + KEYBOARD_EXTRA_OFFSET 
                            : Math.max(insets.bottom, 8),
                    },
                ]}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
                {/* Header with Back Button and Online/Offline Indicator */}
                <View style={[styles.header, { borderBottomColor: colors.neutral.border }]}>
                    <View style={styles.headerTopRow}>
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

                        {/* Online / Offline AI Status Indicator Pill */}
                        <TouchableOpacity
                            style={[
                                styles.statusPill,
                                {
                                    backgroundColor: isOnline
                                        ? (isDarkMode ? '#1E2B22' : '#EAF4EE')
                                        : (isDarkMode ? '#2E1E1A' : '#FAECE8'),
                                    borderColor: isOnline ? colors.sage.base : colors.terracotta.light,
                                },
                            ]}
                            onPress={() => setShowNetworkModal(true)}
                            activeOpacity={0.7}
                            accessibilityLabel="AI Network Status"
                        >
                            <View
                                style={[
                                    styles.statusDot,
                                    { backgroundColor: isOnline ? '#38A169' : colors.terracotta.base },
                                ]}
                            />
                            <Text
                                style={[
                                    styles.statusText,
                                    {
                                        color: isOnline ? colors.sage.dark : colors.terracotta.dark,
                                        fontSize: scaled(11.5),
                                    },
                                ]}
                            >
                                {isChecking ? 'Checking...' : isOnline ? 'AI Online' : 'AI Offline'}
                            </Text>
                            <Info size={scaled(13)} color={isOnline ? colors.sage.dark : colors.terracotta.dark} style={{ marginLeft: 2 }} />
                        </TouchableOpacity>
                    </View>

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
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.chatList}
                    contentContainerStyle={styles.chatScroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
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
                <View
                    style={[
                        styles.inputContainer,
                        {
                            backgroundColor: colors.background.card,
                            borderTopColor: colors.neutral.border,
                            paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 8) : 8,
                        },
                    ]}
                >
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

                {/* NETWORK STABILITY & AI NOTICE MODAL */}
                <Modal
                    visible={showNetworkModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={handleDismissModal}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={handleDismissModal}
                    >
                        <View
                            style={[
                                styles.modalCard,
                                {
                                    backgroundColor: colors.background.card,
                                    borderColor: colors.neutral.border,
                                },
                            ]}
                            onStartShouldSetResponder={() => true}
                        >
                            <View style={styles.modalHeaderRow}>
                                <View style={[styles.modalIconWrap, { backgroundColor: isOnline ? (isDarkMode ? '#222F26' : '#EBF4EF') : (isDarkMode ? '#32201B' : '#FDECE8') }]}>
                                    {isOnline ? (
                                        <Wifi size={scaled(22)} color={colors.sage.dark} />
                                    ) : (
                                        <WifiOff size={scaled(22)} color={colors.terracotta.base} />
                                    )}
                                </View>
                                <TouchableOpacity onPress={handleDismissModal} style={styles.modalCloseBtn}>
                                    <X size={scaled(20)} color={colors.neutral.muted} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.modalTitle, { color: colors.neutral.brown, fontSize: scaled(20) }]}>
                                Stable Connection Recommended
                            </Text>

                            <Text style={[styles.modalBody, { color: colors.neutral.brown, fontSize: scaled(13.5) }]}>
                                The AI Medication Assistant connects to cloud NVIDIA NIM intelligence to answer queries about drug interactions, dosage precautions, and home relief tips.
                            </Text>

                            <View style={[styles.modalNoticeBox, { backgroundColor: isDarkMode ? '#1E1A18' : '#FAF6F0', borderColor: colors.neutral.border }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <Sparkles size={scaled(14)} color={colors.sage.dark} />
                                    <Text style={[styles.modalNoticeHeading, { color: colors.sage.dark, fontSize: scaled(11.5) }]}>
                                        Optimal Performance Tip
                                    </Text>
                                </View>
                                <Text style={[styles.modalNoticeText, { color: colors.neutral.muted, fontSize: scaled(12) }]}>
                                    A stable Wi-Fi or mobile data connection provides the quickest and most complete guidance. If offline, safe essential rules for common OTC medications (like Ibuprofen and Paracetamol) remain active.
                                </Text>
                            </View>

                            <View style={styles.modalStatusRow}>
                                <View
                                    style={[
                                        styles.statusDot,
                                        { backgroundColor: isOnline ? '#38A169' : colors.terracotta.base },
                                    ]}
                                />
                                <Text style={[styles.modalStatusText, { color: colors.neutral.brown, fontSize: scaled(12.5) }]}>
                                    Current AI Status:{' '}
                                    <Text style={{ fontFamily: 'Nunito-Bold', color: isOnline ? colors.sage.dark : colors.terracotta.dark }}>
                                        {isOnline ? 'Online & Connected' : 'Offline Mode (Basic OTC Guidance Active)'}
                                    </Text>
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.modalActionBtn, { backgroundColor: colors.sage.dark, marginTop: 4 }]}
                                onPress={handleDismissModal}
                                activeOpacity={0.85}
                            >
                                <Text style={[styles.modalActionBtnText, { fontSize: scaled(14) }]}>
                                    Got It, Continue
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>

            </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F6F0E8' },
    safe: { flex: 1 },
    keyboardAvoid: { flex: 1 },
    chatList: { flex: 1 },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: Radius.full,
        borderWidth: 1,
        gap: 4,
    },
    backBtnText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.caption,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radius.full,
        borderWidth: 1,
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontFamily: 'Nunito-Bold',
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

    /* Pop up Modal Styles */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(28, 24, 22, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    modalCard: {
        width: '100%',
        maxWidth: 380,
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    modalIconWrap: {
        width: 44,
        height: 44,
        borderRadius: Radius.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseBtn: {
        padding: 6,
    },
    modalTitle: {
        fontFamily: 'DMSerifDisplay-Regular',
        marginBottom: 8,
    },
    modalBody: {
        fontFamily: 'Nunito-Medium',
        lineHeight: 20,
        marginBottom: Spacing.md,
    },
    modalNoticeBox: {
        borderRadius: Radius.md,
        borderWidth: 1,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    modalNoticeHeading: {
        fontFamily: 'Nunito-Bold',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    modalNoticeText: {
        fontFamily: 'Nunito-Medium',
        lineHeight: 18,
    },
    modalStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: Spacing.md,
        paddingHorizontal: 4,
    },
    modalStatusText: {
        fontFamily: 'Nunito-Medium',
    },
    modalActionBtn: {
        paddingVertical: 12,
        borderRadius: Radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalActionBtnText: {
        fontFamily: 'Nunito-Bold',
        color: Colors.white,
    },
});
