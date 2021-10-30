import { Box } from '@rocket.chat/fuselage';
import dompurify from 'dompurify';
import marked from 'marked';
import React, { ComponentProps, FC, useMemo } from 'react';

import { renderMessageEmoji } from '../lib/utils/renderMessageEmoji';

type MarkdownTextParams = {
	content: string;
	variant: 'inline' | 'inlineWithoutBreaks' | 'document';
	preserveHtml: boolean;
	parseEmoji: boolean;
	withTruncatedText: boolean;
} & ComponentProps<typeof Box>;

// change Marked default paragraph rules in order to have line breaks (line breaks are normally considered as a new paragraph)
marked.Lexer.rules.block.paragraph = new RegExp(
	marked.Lexer.rules.block.paragraph.source.replace('[^\\n]+)*', '[^\\n|]*)*'),
	'',
);
marked.Lexer.rules.block.gfm.paragraph = new RegExp(
	marked.Lexer.rules.block.gfm.paragraph.source.replace('[^\\n]+)*', '[^\\n|]*)*'),
	'',
);

const linkMarked = (href: string | null, _title: string | null, text: string): string =>
	`<a href="${href}" target="_blank" rel="nofollow">${text}</a> `;

const defaultRenderer = new marked.Renderer();
defaultRenderer.link = linkMarked;

const defaultOptions = {
	gfm: true,
	headerIds: false,
	renderer: defaultRenderer,
};

const MarkdownText: FC<Partial<MarkdownTextParams>> = ({
	content,
	variant = 'document',
	withTruncatedText = false,
	preserveHtml = false,
	parseEmoji = false,
	...props
}) => {
	const sanitizer = dompurify.sanitize;

	const withRichContent = variant;

	marked.setOptions(defaultOptions);

	const __html = useMemo(() => {
		const html = ((): any => {
			if (content && typeof content === 'string') {
				const markedHtml =
					variant === 'document' ? marked.parse(content) : marked.parseInline(content);

				if (parseEmoji) {
					// We are using the old emoji parser here. This could come
					// with additional processing use, but is the workaround available right now.
					// Should be replaced in the future with the new parser.
					return renderMessageEmoji({ html: markedHtml });
				}

				return markedHtml;
			}
		})();

		return preserveHtml ? html : html && sanitizer(html, { ADD_ATTR: ['target'] });
	}, [content, preserveHtml, sanitizer, parseEmoji, variant]);

	return __html ? (
		<Box
			dangerouslySetInnerHTML={{ __html }}
			withTruncatedText={withTruncatedText}
			withRichContent={withRichContent}
			{...props}
		/>
	) : null;
};

export default MarkdownText;
