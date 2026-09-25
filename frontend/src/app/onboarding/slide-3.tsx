import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';

const { height } = Dimensions.get('window');

export default function OnboardingSlide3() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safe}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>🩺</Text>
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.heading}>Share Clearly{'\n'}With Your Doctor</Text>
                    <Text style={styles.subtitle}>
                        Generate a clean, professional summary to bring to every appointment.
                    </Text>
                </View>

                <View style={styles.dots}>
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={[styles.dot, styles.dotActive]} />
                </View>

                <View style={styles.buttonGroup}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push('/auth/sign-up')}
                        activeOpacity={0.8}>
                        <Text style={styles.buttonText}>Get Started</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => router.push('/auth/sign-in')}
                        activeOpacity={0.7}>
                        <Text style={styles.linkText}>I already have an account</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.card,
    },
    safe: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: height * 0.12,
        paddingBottom: Spacing.xl,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: Radius.full,
        backgroundColor: Colors.sage.tint,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: { fontSize: 36 },
    textContainer: {
        alignItems: 'center',
        gap: Spacing.md,
    },
    heading: {
        fontFamily: 'DMSerifDisplay-Regular',
        fontSize: FontSize.display,
        color: Colors.neutral.brown,
        textAlign: 'center',
        lineHeight: 40,
    },
    subtitle: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.body,
        color: Colors.neutral.brownMid,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: Spacing.md,
    },
    dots: {
        flexDirection: 'row',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: Radius.full,
        backgroundColor: Colors.sage.tint,
    },
    dotActive: {
        width: 24,
        backgroundColor: Colors.sage.base,
    },
    buttonGroup: {
        width: '100%',
        gap: Spacing.md,
        alignItems: 'center',
    },
    button: {
        backgroundColor: Colors.sage.base,
        borderRadius: Radius.lg,
        paddingVertical: 16,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        fontFamily: 'Nunito-Bold',
        fontSize: FontSize.button,
        color: Colors.background.card,
    },
    linkText: {
        fontFamily: 'Nunito-Medium',
        fontSize: FontSize.caption,
        color: Colors.neutral.muted,
    },
});