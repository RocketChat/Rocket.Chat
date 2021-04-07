import { Box } from '@rocket.chat/fuselage';
import React, { FC, useMemo } from 'react';
import marked from 'marked';
import dompurify from 'dompurify';

type MarkdownTextParams = {
	content: string;
	variant: 'inline' | 'inlineWithoutBreaks' | 'document';
	preserveHtml: boolean;
	withTruncatedText: boolean;
};

const documentRenderer = new marked.Renderer();
const inlineRenderer = new marked.Renderer();
const inlineWithoutBreaks = new marked.Renderer();

marked.InlineLexer.rules.gfm = {
	...marked.InlineLexer.rules.gfm,
	strong: /^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/,
	em: /^__(?=\S)([\s\S]*?\S)__(?!_)|^_(?=\S)([\s\S]*?\S)_(?!_)/,
};

const linkMarked = (href: string | null, _title: string | null, text: string): string =>
	`<a href="${ href }" target="_blank" rel="nofollow">${ text }</a> `;
const paragraphMarked = (text: string): string => text;
const brMarked = (): string => ' ';
const listItemMarked = (text: string): string => {
	const cleanText = text.replace(/<p.*?>|<\/p>/ig, '');
	return `<li>${ cleanText }</li>`;
};

documentRenderer.link = linkMarked;
documentRenderer.listitem = listItemMarked;

inlineRenderer.link = linkMarked;
inlineRenderer.paragraph = paragraphMarked;
inlineRenderer.listitem = listItemMarked;

inlineWithoutBreaks.link = linkMarked;
inlineWithoutBreaks.paragraph = paragraphMarked;
inlineWithoutBreaks.br = brMarked;
inlineWithoutBreaks.listitem = listItemMarked;

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

const MarkdownText: FC<Partial<MarkdownTextParams>> = ({
	content,
	variant = 'document',
	withTruncatedText = false,
	preserveHtml = false,
	...props
}) => {
	const sanitizer = dompurify.sanitize;

	let markedOptions: {};

	const withRichContent = variant;
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
		const html = content && typeof content === 'string' && marked(content, markedOptions);
		return preserveHtml ? html : html && sanitizer(html, { ADD_ATTR: ['target'] });
	}, [content, preserveHtml, sanitizer, markedOptions]);

	return __html ? <Box dangerouslySetInnerHTML={{ __html }} withTruncatedText={withTruncatedText} withRichContent={withRichContent} {...props} /> : null;
};

export default MarkdownText;
