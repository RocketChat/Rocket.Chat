import React, { memo, ReactElement } from 'react';

import { highlightWords as getHighlightHtml } from '../../app/highlight-words/client/helper';
import Katex from './Katex';

type CustomTextProps = {
	text: string;
	wordsToHighlight?: {
		highlight: string;
		regex: RegExp;
		urlRegex: RegExp;
	}[];
	katex?: {
		dollarSyntaxEnabled: boolean;
		parenthesisSyntaxEnabled: boolean;
	};
};

const CustomText = ({ text, wordsToHighlight, katex }: CustomTextProps): ReactElement => {
	// TODO: chapter day frontend: remove dangerouslySetInnerHTML, convert to tokens and do not mix with katex
	const html = wordsToHighlight?.length ? getHighlightHtml(text, wordsToHighlight) : text;
	if (katex) {
		return <Katex text={html} options={{ dollarSyntax: katex.dollarSyntaxEnabled, parenthesisSyntax: katex.parenthesisSyntaxEnabled }} />;
	}

	return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

export default memo(CustomText);
