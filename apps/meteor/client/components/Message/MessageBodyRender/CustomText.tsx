import { escapeHTML } from '@rocket.chat/string-helpers';
import React, { memo, useMemo, ReactElement } from 'react';

import { highlightWords as getHighlightHtml } from '../../../../app/highlight-words/client/helper';
import Katex from '../../Katex';

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
	const escapedText = useMemo(() => escapeHTML(text), [text]);
	// TODO: chapter day frontend: remove dangerouslySetInnerHTML, convert to tokens and do not mix with katex
	const html = wordsToHighlight?.length ? getHighlightHtml(escapedText, wordsToHighlight) : escapedText;

	if (katex) {
		return <Katex text={html} options={{ dollarSyntax: katex.dollarSyntaxEnabled, parenthesisSyntax: katex.parenthesisSyntaxEnabled }} />;
	}

	return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

export default memo(CustomText);
