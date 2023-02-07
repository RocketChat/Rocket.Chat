import { StyleSheet, Text, View } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

const styles = StyleSheet.create({
	italic: {
		fontStyle: 'italic',
	},
});

type CodeBlockProps = {
	lines: MessageParser.CodeLine[];
};

const CodeBlock = ({ lines }: CodeBlockProps): ReactElement => (
	<View>
		{lines.map((line, index) => (
			<Text key={index} style={styles.italic}>
				{line.value?.value}
			</Text>
		))}
	</View>
);

export default CodeBlock;
