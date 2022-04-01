import { Plain as ASTPlain } from '@rocket.chat/message-parser';
import React, { FC, memo } from 'react';

import Highlighter from '../../Highlighter';
import { useMessageBodyHighlights } from './contexts/MessageBodyContext';

type PlainTextType = {
	value: ASTPlain['value'];
};

const PlainText: FC<PlainTextType> = ({ value: text }) => {
	const highlights = useMessageBodyHighlights();

	if (highlights) {
		return <Highlighter text={text} wordsToHighlight={highlights} />;
	}

	return <>{text}</>;
};

export default memo(PlainText);
