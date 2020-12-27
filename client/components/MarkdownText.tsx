import { Box, BoxProps } from '@rocket.chat/fuselage';
import React, { FC, useMemo } from 'react';
import marked from 'marked';

import { escapeHTML } from '../../lib/escapeHTML';

Object.assign(marked.InlineLexer.rules.gfm, {
	strong: /^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/,
	em: /^__(?=\S)([\s\S]*?\S)__(?!_)|^_(?=\S)([\s\S]*?\S)_(?!_)/,
});

const options = {
	gfm: true,
	headerIds: false,
};

type MarkdownTextProps = {
	content: string;
	preserveHtml?: boolean;
} & BoxProps;

const MarkdownText: FC<MarkdownTextProps> = ({ content, preserveHtml = false, ...props }) => {
	const __html = useMemo(() => content && marked(preserveHtml ? content : escapeHTML(content), options), [content, preserveHtml]);

	return __html ? <Box dangerouslySetInnerHTML={{ __html }} withRichContent {...props} /> : null;
};

export default MarkdownText;
