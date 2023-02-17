import { parse } from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';
import React, { memo, useMemo } from 'react';

import MessageContentBody from '../../MessageContentBody';

const ParsedText = ({ text }: { text: string }): ReactElement | null => {
	const md = useMemo(() => parse(text, { emoticons: true }), [text]);

	return <MessageContentBody md={md} />;
};

export default memo(ParsedText);
