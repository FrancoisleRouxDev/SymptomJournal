import { View, Text } from 'react-native';
import { Colors } from '@/constants/theme';

export default function Insights() {
    return (
        <View style={{ flex: 1, backgroundColor: Colors.background.canvas, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'DMSerifDisplay-Regular', fontSize: 22, color: Colors.neutral.brown }}>AI Insights</Text>
            <Text style={{ fontFamily: 'Nunito-Medium', color: Colors.neutral.muted, marginTop: 8 }}>Coming next</Text>
        </View>
    );
}