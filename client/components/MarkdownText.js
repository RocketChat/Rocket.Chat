import { Box } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';
import marked from 'marked';
import dompurify from 'dompurify';

const renderer = new marked.Renderer();

marked.InlineLexer.rules.gfm.strong = /^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/;
marked.InlineLexer.rules.gfm.em = /^__(?=\S)([\s\S]*?\S)__(?!_)|^_(?=\S)([\s\S]*?\S)_(?!_)/;

const linkRenderer = renderer.link;
renderer.link = function(href, title, text) {
	const html = linkRenderer.call(renderer, href, title, text);
	return html.replace(/^<a /, '<a target="_blank" rel="nofollow" ');
};

const options = {
	gfm: true,
	headerIds: false,
	renderer,
};

function MarkdownText({ content, variant = 'document', preserveHtml = false, withRichContent = true, ...props }) {
	const sanitizer = dompurify.sanitize;

	if (variant === 'inline') {
		options.renderer.paragraph = (text) => text;
	}

	const __html = useMemo(() => {
		const html = content && typeof content === 'string' && marked(content, options);
		return preserveHtml ? html : html && sanitizer(html, { ADD_ATTR: ['target'] });
	}, [content, preserveHtml, sanitizer]);

	return __html ? <Box dangerouslySetInnerHTML={{ __html }} withRichContent={withRichContent} {...props} /> : null;
}

export default MarkdownText;
