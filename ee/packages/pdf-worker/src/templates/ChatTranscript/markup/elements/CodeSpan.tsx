import { StyleSheet, Text } from '@react-pdf/renderer';
import colors from '@rocket.chat/fuselage-tokens/colors.json';

export const codeStyles = StyleSheet.create({
	wrapper: {
		backgroundColor: colors.n100,
		borderColor: colors.n250,
		borderWidth: 1,
		borderRadius: 4,
		paddingHorizontal: 3,
		paddingVertical: 1,
	},
	space: {
		backgroundColor: colors.n100,
	},
	code: {
		backgroundColor: colors.n100,
		color: colors.n800,
		fontSize: 13,
		fontWeight: 700,
		fontFamily: 'FiraCode',
	},
});

type CodeSpanProps = {
	code: string;
};

const CodeSpan = ({ code }: CodeSpanProps) => (
	<Text style={codeStyles.wrapper}>
		<Text style={codeStyles.space}> </Text>
		<Text style={codeStyles.code}>{code}</Text>
		<Text style={codeStyles.space}> </Text>
	</Text>
);

export default CodeSpan;
