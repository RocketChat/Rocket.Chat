import { Box } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';
import marked from 'marked';
import dompurify from 'dompurify';

marked.InlineLexer.rules.gfm.strong = /^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/;
marked.InlineLexer.rules.gfm.em = /^__(?=\S)([\s\S]*?\S)__(?!_)|^_(?=\S)([\s\S]*?\S)_(?!_)/;

const options = {
	gfm: true,
	headerIds: false,
};

function MarkdownText({ content, preserveHtml = false, withRichContent = true, ...props }) {
	const sanitizer = dompurify.sanitize;
	const __html = useMemo(() => {
		const html = content && marked(content, options);
		return preserveHtml ? html : html && sanitizer(html);
	}, [content, preserveHtml, sanitizer]);
	return __html ? <Box dangerouslySetInnerHTML={{ __html }} withRichContent={withRichContent} {...props} /> : null;
}

export default MarkdownText;
