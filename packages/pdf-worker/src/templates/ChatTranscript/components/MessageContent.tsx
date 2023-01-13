import { Text, StyleSheet } from '@react-pdf/renderer';
import { fontScales } from '@rocket.chat/fuselage-tokens/typography.json';

const styles = StyleSheet.create({
	content: {
		marginTop: 1,
		fontSize: fontScales.p2.fontSize,
		textAlign: 'justify',
	},
});

export const MessageContent = ({ message }: { message: string }) => <Text style={styles.content}>{message}</Text>;
