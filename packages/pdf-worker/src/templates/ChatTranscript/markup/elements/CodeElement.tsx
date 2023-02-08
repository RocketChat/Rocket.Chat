import { StyleSheet, Text } from '@react-pdf/renderer';

const styles = StyleSheet.create({
	italic: {
		fontStyle: 'italic',
	},
});

type CodeElementProps = {
	code: string;
};

const CodeElement = ({ code }: CodeElementProps) => <Text style={styles.italic}>{code}</Text>;

export default CodeElement;
