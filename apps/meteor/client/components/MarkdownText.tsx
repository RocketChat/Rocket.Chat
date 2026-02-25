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

const linkMarked = (href: string | null, _title: string | null, text: string): string => {
	return `<a href="${href || ''}">${text}</a>`;
};
const paragraphMarked = (text: string): string => text;
const brMarked = (): string => ' ';
const listItemMarked = (text: string): string => {
	const cleanText = text.replace(/<p.*?>|<\/p>/gi, '');
	return `<li>${cleanText}</li>`;
};
const horizontalRuleMarked = (): string => '';
const codeMarked = (code: string, language: string | undefined, _isEscaped: boolean): string => {
	if (language) {
		return `<pre><code class="language-${language}">${code} </code></pre>`;
	}
	return `<pre><code>${code} </code></pre>`;
};
const codespanMarked = (code: string): string => {
	return `<code>${code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')}</code>`;
};

documentRenderer.link = linkMarked;
documentRenderer.listitem = listItemMarked;
documentRenderer.code = codeMarked;
documentRenderer.codespan = codespanMarked;

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
	breaks: true,
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

const getRegexp = (supportedURISchemes: string[]): RegExp => {
	const schemes = supportedURISchemes.join('|');

	return new RegExp(`^(${schemes}):`, 'im');
};

type MarkdownTextProps = Partial<MarkdownTextParams>;

export const supportedURISchemes = ['http', 'https', 'notes', 'ftp', 'ftps', 'tel', 'mailto', 'sms', 'cid'];

const isElement = (node: Node): node is Element => node.nodeType === Node.ELEMENT_NODE;
const isLinkElement = (node: Node): node is HTMLAnchorElement => isElement(node) && node.tagName.toLowerCase() === 'a';

// Generate a unique token at runtime to prevent enumeration attacks
// This token marks internal links that need translation
const INTERNAL_LINK_TOKEN = `__INTERNAL_LINK_TITLE_${Math.random().toString(36).substring(2, 15)}__`;

// Register the DOMPurify hook once at module level to prevent memory leaks
// This hook will be shared by all MarkdownText component instances
dompurify.addHook('afterSanitizeAttributes', (node) => {
	if (!isLinkElement(node)) {
		return;
	}

	const href = node.getAttribute('href') || '';
	const isExternalLink = isExternal(href);
	const isMailto = href.startsWith('mailto:');

	// Set appropriate attributes based on link type
	if (isExternalLink || isMailto) {
		node.setAttribute('rel', 'nofollow noopener noreferrer');
		// Enforcing external links to open in new tabs is critical to assure users never navigate away from the chat
		// This attribute must be preserved to guarantee users maintain their chat context
		node.setAttribute('target', '_blank');
	}

	// Set appropriate title based on link type
	if (isMailto) {
		// For mailto links, use the email address as the title for better user experience
		// Example: for href "mailto:user@example.com" the title would be "mailto:user@example.com"
		node.setAttribute('title', href);
	} else if (isExternalLink) {
		// For external links, set an empty title to prevent tooltips
		// This reduces visual clutter and lets users see the URL in the browser's status bar instead
		node.setAttribute('title', '');
	} else {
		// For internal links, use a token that will be replaced with translated text in the component
		// This allows us to use the contextualized translation function
		const relativePath = href.replace(getBaseURI(), '');
		node.setAttribute('title', `${INTERNAL_LINK_TOKEN}${relativePath}`);
	}
});

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

		const sanitizedHtml = preserveHtml
			? html
			: html && sanitizer(html, { ADD_ATTR: ['target'], ALLOWED_URI_REGEXP: getRegexp(supportedURISchemes) });

		// Replace internal link tokens with contextualized translations
		if (sanitizedHtml && typeof sanitizedHtml === 'string') {
			return sanitizedHtml.replace(new RegExp(`${INTERNAL_LINK_TOKEN}([^"]*)`, 'g'), (_, href) => t('Go_to_href', { href }));
		}

		return sanitizedHtml;
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

export default MarkdownText;
