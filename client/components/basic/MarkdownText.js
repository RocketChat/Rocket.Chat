import s from 'underscore.string';
import { Box } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';
import marked from 'marked';

marked.InlineLexer.rules.gfm.strong = /^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/;
marked.InlineLexer.rules.gfm.em = /^__(?=\S)([\s\S]*?\S)__(?!_)|^_(?=\S)([\s\S]*?\S)_(?!_)/;

const options = {
	gfm: true,
	headerIds: false,
};

function MarkdownText({ content, preserveHtml = false, ...props }) {
	const __html = useMemo(() => content && marked(preserveHtml ? content : s.escapeHTML(content), options), [content, preserveHtml]);

	return <Box dangerouslySetInnerHTML={{ __html }} withRichContent {...props} />;
}

export default MarkdownText;
