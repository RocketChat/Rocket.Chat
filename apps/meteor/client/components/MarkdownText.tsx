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

type MarkdownTextProps = Partial<MarkdownTextParams>;

const MarkdownText = ({ content, withTruncatedText = false, variant, preserveHtml, parseEmoji, ...boxProps }: MarkdownTextProps) => {
	if (content && content.length > getMarkdownParserLimit()) {
		return (
			<Box withTruncatedText={withTruncatedText} {...boxProps}>
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
