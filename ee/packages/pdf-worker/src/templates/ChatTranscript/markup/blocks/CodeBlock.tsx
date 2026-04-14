import { Text, View } from '@react-pdf/renderer';
import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import { codeStyles } from '../elements/CodeSpan';

type CodeBlockProps = {
	lines: MessageParser.CodeLine[];
};

const CodeBlock = ({ lines }: CodeBlockProps): ReactElement => (
	<View style={{ ...codeStyles.wrapper, padding: 8 }} wrap>
		{lines.map((line, index) => (
			<Text key={index} style={codeStyles.code}>
				{line.value?.value || ' '}
			</Text>
		))}
	</View>
);

export default CodeBlock;
