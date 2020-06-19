import { Box } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';
import marked from 'marked';

marked.InlineLexer.rules.gfm.strong = /^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/;
marked.InlineLexer.rules.gfm.em = /^__(?=\S)([\s\S]*?\S)__(?!_)|^_(?=\S)([\s\S]*?\S)_(?!_)/;

function MarkdownText({ content, ...props }) {
	const options = useMemo(() => ({
		gfm: true,
		headerIds: false,
	}), []);

	const __html = useMemo(() => marked(content, options), [content, options]);

	return <Box dangerouslySetInnerHTML={{ __html }} withRichContent {...props} />;
}

export default MarkdownText;
