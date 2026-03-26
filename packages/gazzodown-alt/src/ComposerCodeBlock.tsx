import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

type ComposerCodeBlockProps = {
	language?: string;
	lines: MessageParser.CodeLine[];
};

const codeBlockStyle = {
	fontFamily: 'var(--rcx-font-family-mono, monospace)',
	backgroundColor: 'var(--rcx-color-surface-tint, rgba(0, 0, 0, 0.05))',
	borderRadius: '4px',
	padding: '4px 8px',
	display: 'inline-block',
	verticalAlign: 'top',
	maxWidth: '100%',
	whiteSpace: 'pre-wrap' as const,
} as const;

const ComposerCodeBlock = ({ language, lines }: ComposerCodeBlockProps): ReactElement => {
	const text = useMemo(() => {
		const code = lines.map((line) => line.value.value).join('\n');
		const fence = language && language !== 'none' ? `\`\`\`${language}` : '```';
		return `${fence}\n${code}\n\`\`\``;
	}, [language, lines]);

	return <code style={codeBlockStyle}>{text}</code>;
};

export default ComposerCodeBlock;
