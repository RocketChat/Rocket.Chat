import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

type ComposerCodeBlockProps = {
	language?: string;
	lines: MessageParser.CodeLine[];
	fence: string;
};

const codeBlockStyle = {
	display: 'inline-block',
	width: '100%',
	verticalAlign: 'top',
} as const;

const ComposerCodeBlock = ({ language, lines, fence }: ComposerCodeBlockProps): ReactElement => {
	const text = useMemo(() => {
		const code = lines.map((line) => line.value.value).join('\n');
		const opening = language && language !== 'none' ? `${fence}${language}` : fence;
		return `${opening}\n${code}\n${fence}`;
	}, [language, lines, fence]);

	return (
		<code className='code-colors' style={codeBlockStyle}>
			{text}
		</code>
	);
};

export default ComposerCodeBlock;
