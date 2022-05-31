import { Plain as ASTPlain } from '@rocket.chat/message-parser';
import React, { FC, memo } from 'react';

import { useMessageListHighlights, useMessageListKatex } from '../../../views/room/MessageList/contexts/MessageListContext';
import CustomText from '../../CustomText';

type PlainTextType = {
	value: ASTPlain['value'];
};

const PlainText: FC<PlainTextType> = ({ value: text }) => {
	const highlights = useMessageListHighlights();
	const katex = useMessageListKatex();

	if (highlights || katex) {
		return <CustomText text={text} wordsToHighlight={highlights} katex={katex} />;
	}

	return <>{text}</>;
};

export default memo(PlainText);
