import { Text, View, StyleSheet } from '@react-pdf/renderer';
import colors from '@rocket.chat/fuselage-tokens/colors.json';

const styles = StyleSheet.create({
	wrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		fontSize: 12,
		fontWeight: 700,
	},
	line: {
		flex: 1,
		height: 2,
		backgroundColor: colors.n200,
	},
	text: {
		paddingHorizontal: 8,
	},
});

export const Divider = ({ divider }: { divider: string }) => (
	<View style={styles.wrapper} wrap={false}>
		<View style={styles.line} />
		<Text style={styles.text}>{divider}</Text>
		<View style={styles.line} />
	</View>
);
