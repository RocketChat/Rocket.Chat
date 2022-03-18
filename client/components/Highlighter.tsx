import React, { FC, memo } from 'react';

import { getRegexHighlight, getRegexHighlightUrl, highlightWords } from '../../app/highlight-words/client/helper';

type HighlighterType = {
	text: string;
	wordsToHighlight: string[];
};

const Highlighter: FC<HighlighterType> = ({ text, wordsToHighlight }) => {
	const highlights =
		wordsToHighlight?.map((highlight) => ({
			highlight,
			regex: getRegexHighlight(highlight),
			urlRegex: getRegexHighlightUrl(highlight),
		})) || [];

	return <span dangerouslySetInnerHTML={{ __html: highlightWords(text, highlights) }} />;
};

export default memo(Highlighter);
