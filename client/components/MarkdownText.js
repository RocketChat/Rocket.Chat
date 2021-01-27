import { Box } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';
import marked from 'marked';

import { escapeHTML } from '../../lib/escapeHTML';

const renderer = new marked.Renderer();

marked.InlineLexer.rules.gfm.strong = /^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/;
marked.InlineLexer.rules.gfm.em = /^__(?=\S)([\s\S]*?\S)__(?!_)|^_(?=\S)([\s\S]*?\S)_(?!_)/;

renderer.link = function(href, title, text) {
	return `<a target="_blank" href="${ href }">${ text }</a>`;
};

const options = {
	gfm: true,
	headerIds: false,
	renderer,
};

function MarkdownText({ content, preserveHtml = false, withRichContent = true, ...props }) {
	const __html = useMemo(() => content && marked(preserveHtml ? content : escapeHTML(content), options), [content, preserveHtml]);

	return __html ? <Box dangerouslySetInnerHTML={{ __html }} {...withRichContent && { withRichContent }} {...props} /> : null;
}

export default MarkdownText;
