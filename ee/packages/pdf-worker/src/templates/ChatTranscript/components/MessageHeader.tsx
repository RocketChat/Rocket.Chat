import { Text, View, StyleSheet } from '@react-pdf/renderer';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import { fontScales } from '@rocket.chat/fuselage-tokens/typography.json';

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	name: {
		fontSize: fontScales.p2b.fontSize,
		fontWeight: fontScales.p2b.fontWeight,
		color: colors.n900,
	},
	time: {
		fontSize: fontScales.c1.fontSize,
		marginLeft: 4,
	},
});

export const MessageHeader = ({ name, time, light }: { name: string; time: string; light?: boolean }) => (
	<View style={styles.header} wrap={false}>
		<Text style={styles.name}>{name}</Text>
		<Text style={{ ...styles.time, color: light ? colors.n600 : colors.n700 }}>{time}</Text>
	</View>
);
