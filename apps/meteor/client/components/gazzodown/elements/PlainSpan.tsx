import React, { memo, ReactElement } from 'react';

import { useMessageListHighlights, useMessageListKatex } from '../../../views/room/MessageList/contexts/MessageListContext';
import CustomText from '../../CustomText';

type PlainSpanProps = {
	text: string;
};

const PlainSpan = ({ text }: PlainSpanProps): ReactElement => {
	const highlights = useMessageListHighlights();
	const katex = useMessageListKatex();

	if (highlights || katex) {
		return <CustomText text={text} wordsToHighlight={highlights} katex={katex} />;
	}

	return <>{text}</>;
};

export default memo(PlainSpan);
