import { StyleSheet, View, Text } from '@react-pdf/renderer';
import colors from '@rocket.chat/fuselage-tokens/colors.json';

export const codeStyles = StyleSheet.create({
	wrapper: {
		backgroundColor: colors.n250,
		borderColor: colors.n100,
		borderWidth: 1,
		borderRadius: 4,
		paddingHorizontal: 3,
		paddingVertical: 1,
	},
	code: {
		fontSize: 13,
		color: colors.n800,
		fontWeight: 700,
		fontFamily: 'FiraCode',
	},
});

type CodeSpanProps = {
	code: string;
};

const CodeSpan = ({ code }: CodeSpanProps) => (
	<View style={codeStyles.wrapper}>
		<Text style={codeStyles.code}>{code}</Text>
	</View>
);

export default CodeSpan;
