import { Box } from '@rocket.chat/fuselage';
import { isExternal, getBaseURI } from '@rocket.chat/ui-client';
import dompurify from 'dompurify';
import { marked } from 'marked';
import type { ComponentProps } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { renderMessageEmoji } from '../lib/utils/renderMessageEmoji';

type MarkdownTextParams = {
	content: string;
	variant: 'inline' | 'inlineWithoutBreaks' | 'document';
	preserveHtml: boolean;
	parseEmoji: boolean;
	withTruncatedText: boolean;
} & ComponentProps<typeof Box>;

const documentRenderer = new marked.Renderer();
const inlineRenderer = new marked.Renderer();
const inlineWithoutBreaks = new marked.Renderer();

const walkTokens = (token: marked.Token) => {
	const boldPattern = /^\*[^*]+\*$|^\*\*[^*]+\*\*$/;
	const italicPattern = /^__(?=\S)([\s\S]*?\S)__(?!_)|^_(?=\S)([\s\S]*?\S)_(?!_)/;
	if (boldPattern.test(token.raw) && token.type === 'em') {
		token.type = 'strong' as 'em';
	} else if (italicPattern.test(token.raw) && token.type === 'strong') {
		token.type = 'em' as 'strong';
	}
};

marked.use({ walkTokens });

const linkMarked = (href: string | null, _title: string | null, text: string): string =>
	`<a href="${href}" rel="nofollow noopener noreferrer">${text}</a> `;
const paragraphMarked = (text: string): string => text;
const brMarked = (): string => ' ';
const listItemMarked = (text: string): string => {
	const cleanText = text.replace(/<p.*?>|<\/p>/gi, '');
	return `<li>${cleanText}</li>`;
};
const horizontalRuleMarked = (): string => '';

documentRenderer.link = linkMarked;
documentRenderer.listitem = listItemMarked;

inlineRenderer.link = linkMarked;
inlineRenderer.paragraph = paragraphMarked;
inlineRenderer.listitem = listItemMarked;
inlineRenderer.hr = horizontalRuleMarked;

inlineWithoutBreaks.link = linkMarked;
inlineWithoutBreaks.paragraph = paragraphMarked;
inlineWithoutBreaks.br = brMarked;
inlineWithoutBreaks.image = brMarked;
inlineWithoutBreaks.code = paragraphMarked;
inlineWithoutBreaks.codespan = paragraphMarked;
inlineWithoutBreaks.listitem = listItemMarked;
inlineWithoutBreaks.hr = horizontalRuleMarked;

const defaultOptions = {
	gfm: true,
	headerIds: false,
};

const options = {
	...defaultOptions,
	renderer: documentRenderer,
};

const inlineOptions = {
	...defaultOptions,
	renderer: inlineRenderer,
};

const inlineWithoutBreaksOptions = {
	...defaultOptions,
	renderer: inlineWithoutBreaks,
};

const getRegexp = (schemeSetting: string): RegExp => {
	const schemes = schemeSetting ? schemeSetting.split(',').join('|') : '';
	return new RegExp(`^(${schemes}):`, 'gim');
};

type MarkdownTextProps = Partial<MarkdownTextParams>;

const MarkdownText = ({
	content,
	variant = 'document',
	withTruncatedText = false,
	preserveHtml = false,
	parseEmoji = false,
	...props
}: MarkdownTextProps) => {
	const sanitizer = dompurify.sanitize;
	const { t } = useTranslation();
	let markedOptions: marked.MarkedOptions;

	const schemes = 'http,https,notes,ftp,ftps,tel,mailto,sms,cid';

	switch (variant) {
		case 'inline':
			markedOptions = inlineOptions;
			break;
		case 'inlineWithoutBreaks':
			markedOptions = inlineWithoutBreaksOptions;
			break;
		case 'document':
		default:
			markedOptions = options;
	}

	const __html = useMemo(() => {
		const html = ((): any => {
			if (content && typeof content === 'string') {
				const markedHtml = /inline/.test(variant)
					? marked.parseInline(new Option(content).innerHTML, markedOptions)
					: marked.parse(new Option(content).innerHTML, markedOptions);

				if (parseEmoji) {
					// We are using the old emoji parser here. This could come
					// with additional processing use, but is the workaround available right now.
					// Should be replaced in the future with the new parser.
					return renderMessageEmoji(markedHtml);
				}

				return markedHtml;
			}
		})();

		// Add a hook to make all external links open a new window
		dompurify.addHook('afterSanitizeAttributes', (node) => {
			if (isElement(node) && 'target' in node) {
				const href = node.getAttribute('href') || '';

				node.setAttribute('title', `${t('Go_to_href', { href: href.replace(getBaseURI(), '') })}`);
				node.setAttribute('rel', 'nofollow noopener noreferrer');
				if (isExternal(node.getAttribute('href') || '')) {
					node.setAttribute('target', '_blank');
					node.setAttribute('title', href);
				}
			}
		});

		return preserveHtml ? html : html && sanitizer(html, { ADD_ATTR: ['target'], ALLOWED_URI_REGEXP: getRegexp(schemes) });
	}, [preserveHtml, sanitizer, content, variant, markedOptions, parseEmoji, t]);

	return __html ? (
		<Box
			dangerouslySetInnerHTML={{ __html }}
			withTruncatedText={withTruncatedText}
			withRichContent={variant === 'inlineWithoutBreaks' ? 'inlineWithoutBreaks' : true}
			{...props}
		/>
	) : null;
};

const isElement = (node: Node): node is Element => node.nodeType === Node.ELEMENT_NODE;

export default MarkdownText;
