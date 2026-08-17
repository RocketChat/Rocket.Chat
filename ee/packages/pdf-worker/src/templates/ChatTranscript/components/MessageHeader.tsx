import { Text, View, StyleSheet } from '@react-pdf/renderer';
import colors from '@rocket.chat/fuselage-tokens/dist/colors.json';
import { fontScale } from '@rocket.chat/fuselage-tokens/dist/typography.json';

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	name: {
		fontSize: fontScale.p2b.fontSize,
		fontWeight: fontScale.p2b.fontWeight,
		color: colors.n900,
	},
	time: {
		fontSize: fontScale.c1.fontSize,
		marginLeft: 4,
	},
});

export type MessageHeaderProps = { name: string; time: string; light?: boolean };

export const MessageHeader = ({ name, time, light }: MessageHeaderProps) => (
	<View style={styles.header} wrap={false}>
		<Text style={styles.name}>{name}</Text>
		<Text style={{ ...styles.time, color: light ? colors.n600 : colors.n700 }}>{time}</Text>
	</View>
);
