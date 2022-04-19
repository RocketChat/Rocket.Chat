import React, { FC, memo } from 'react';

import { highlightWords as getHighlightHtml } from '../../app/highlight-words/client/helper';
import { getKatexHtml } from '../../app/katex/client';

type CustomTextType = {
	text: string;
	wordsToHighlight?: {
		highlight: string;
		regex: RegExp;
		urlRegex: RegExp;
	}[];
	katex?: {
		enabled: boolean;
		dollarSyntaxEnabled: boolean;
		parenthesisSyntaxEnabled: boolean;
	};
};

const CustomText: FC<CustomTextType> = ({ text, wordsToHighlight, katex }) => {
	let html = text;

	if (wordsToHighlight?.length) {
		html = getHighlightHtml(html, wordsToHighlight);
	}

	if (katex?.enabled) {
		html = getKatexHtml(html, katex);
	}

	return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

export default memo(CustomText);
