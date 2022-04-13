import { Plain as ASTPlain } from '@rocket.chat/message-parser';
import React, { FC, memo } from 'react';

import { useMessageListHighlights } from '../../../views/room/MessageList/contexts/MessageListContext';
import Highlighter from '../../Highlighter';

type PlainTextType = {
	value: ASTPlain['value'];
};

const PlainText: FC<PlainTextType> = ({ value: text }) => {
	const highlights = useMessageListHighlights();

	if (highlights) {
		return <Highlighter text={text} wordsToHighlight={highlights} />;
	}

	return <>{text}</>;
};

export default memo(PlainText);
