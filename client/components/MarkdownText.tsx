import { Box } from '@rocket.chat/fuselage';
import React, { FC, useMemo } from 'react';
import marked from 'marked';
import dompurify from 'dompurify';

type MarkdownTextParams = {
	content: string;
	variant: string;
	preserveHtml: boolean;
	withRichContent: boolean;
};

const documentRenderer = new marked.Renderer();
const inlineRenderer = new marked.Renderer();
const inlineWithoutBreaks = new marked.Renderer();

marked.InlineLexer.rules.gfm = {
	...marked.InlineLexer.rules.gfm,
	strong: /^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/,
	em: /^__(?=\S)([\s\S]*?\S)__(?!_)|^_(?=\S)([\s\S]*?\S)_(?!_)/,
};

const linkDocumentRenderer = documentRenderer.link;
documentRenderer.link = (href, title, text): string => {
	const html = linkDocumentRenderer.call(documentRenderer, href, title, text);
	return html.replace(/^<a /, '<a target="_blank" rel="nofollow" ');
};

const linkInlineRenderer = inlineRenderer.link;
inlineRenderer.link = (href, title, text): string => {
	const html = linkInlineRenderer.call(inlineRenderer, href, title, text);
	return html.replace(/^<a /, '<a target="_blank" rel="nofollow" ');
};
inlineRenderer.paragraph = (text): string => text;

const linkInlineWithoutBreaksRenderer = inlineWithoutBreaks.link;
inlineWithoutBreaks.link = (href, title, text): string => {
	const html = linkInlineWithoutBreaksRenderer.call(inlineRenderer, href, title, text);
	return html.replace(/^<a /, '<a target="_blank" rel="nofollow" ');
};
inlineWithoutBreaks.paragraph = (text): string => text;
inlineWithoutBreaks.br = (): string => '';

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

const MarkdownText: FC<MarkdownTextParams> = ({
	content,
	variant = 'document',
	preserveHtml = false,
	withRichContent = true,
	...props
}) => {
	const sanitizer = dompurify.sanitize;

	let markedOptions: {};
	switch (variant) {
		case 'inline':
			markedOptions = inlineOptions;
			break;
		case 'inlineWithoutBreaks':
			markedOptions = inlineWithoutBreaksOptions;
			break;
		default:
			markedOptions = options;
	}

	const __html = useMemo(() => {
		const html = content && typeof content === 'string' && marked(content, markedOptions);
		return preserveHtml ? html : html && sanitizer(html, { ADD_ATTR: ['target'] });
	}, [content, preserveHtml, sanitizer, markedOptions]);

	return __html ? <Box dangerouslySetInnerHTML={{ __html }} withRichContent={withRichContent} {...props} /> : null;
};

export default MarkdownText;
