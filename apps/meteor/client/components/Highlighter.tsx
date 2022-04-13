import React, { FC, memo } from 'react';

import { highlightWords } from '../../app/highlight-words/client/helper';

type HighlighterType = {
	text: string;
	wordsToHighlight: {
		highlight: string;
		regex: RegExp;
		urlRegex: RegExp;
	}[];
};

const Highlighter: FC<HighlighterType> = ({ text, wordsToHighlight }) => (
	<span dangerouslySetInnerHTML={{ __html: highlightWords(text, wordsToHighlight) }} />
);

export default memo(Highlighter);
