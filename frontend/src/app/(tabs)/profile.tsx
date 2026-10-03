import { View, Text, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { signOut } from '@/lib/auth';
import { useRouter } from 'expo-router';

export default function Profile() {
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.replace('/onboarding/slide-1');
    };

    return (
        <View style={{ flex: 1, backgroundColor: Colors.background.canvas, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg }}>
            <Text style={{ fontFamily: 'DMSerifDisplay-Regular', fontSize: 22, color: Colors.neutral.brown, marginBottom: Spacing.xl }}>Profile</Text>
            <TouchableOpacity
                onPress={handleSignOut}
                style={{ backgroundColor: Colors.terracotta.base, borderRadius: Radius.lg, paddingVertical: 14, paddingHorizontal: Spacing.xl }}>
                <Text style={{ fontFamily: 'Nunito-Bold', fontSize: FontSize.button, color: Colors.background.card }}>Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
}