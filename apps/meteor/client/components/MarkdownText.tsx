import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

import MarkdownTextInner from './MarkdownTextInner';
import { getMarkdownParserLimit } from '../lib/getMarkdownParserLimit';

export { supportedURISchemes } from './MarkdownTextInner';

type MarkdownTextParams = {
	content: string;
	variant: 'inline' | 'inlineWithoutBreaks' | 'document';
	preserveHtml: boolean;
	parseEmoji: boolean;
	withTruncatedText: boolean;
} & ComponentProps<typeof Box>;

export type MarkdownTextProps = Partial<MarkdownTextParams>;

const preserveLineBreaks = css`
	white-space: pre-line;
`;

const MarkdownText = ({ content, withTruncatedText = false, variant, preserveHtml, parseEmoji, ...boxProps }: MarkdownTextProps) => {
	if (content && content.length > getMarkdownParserLimit()) {
		// `document` parses with `breaks: true`, so its line breaks have to survive the unparsed
		// fallback; the inline variants collapse them on purpose, and truncation needs a single line.
		const keepLineBreaks = (variant ?? 'document') === 'document' && !withTruncatedText;

		return (
			<Box
				withTruncatedText={withTruncatedText}
				{...boxProps}
				className={[boxProps.className, keepLineBreaks && preserveLineBreaks].flat()}
			>
				{content}
			</Box>
		);
	}
	return (
		<MarkdownTextInner
			content={content}
			withTruncatedText={withTruncatedText}
			variant={variant}
			preserveHtml={preserveHtml}
			parseEmoji={parseEmoji}
			{...boxProps}
		/>
	);
};

export default MarkdownText;
