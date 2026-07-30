import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

type ComposerCodeBlockProps = {
	language?: string;
	lines: MessageParser.CodeLine[];
};

const codeBlockStyle = {
	display: 'inline-block',
	width: '100%',
	verticalAlign: 'top',
} as const;

const ComposerCodeBlock = ({ language, lines }: ComposerCodeBlockProps): ReactElement => {
	const text = useMemo(() => {
		const code = lines.map((line) => line.value.value).join('\n');
		const fence = language && language !== 'none' ? `\`\`\`${language}` : '```';
		return `${fence}\n${code}\n\`\`\``;
	}, [language, lines]);

	return (
		<code className='code-colors' style={codeBlockStyle}>
			{text}
		</code>
	);
};

export default ComposerCodeBlock;
