/* eslint-disable complexity */
import React, { FC, memo } from 'react';

import MessageContentBody from '../../../room/MessageList/components/MessageContentBody';
import { MessageWithMdEnforced } from '../../../room/MessageList/lib/parseMessageTextToAstMarkdown';

const MessageContent: FC<{
	message: MessageWithMdEnforced;
}> = ({ message }) => {
	console.log('MessageContent');

	return <MessageContentBody md={message.md} mentions={message.mentions} channels={message.channels} />;
};

export default memo(MessageContent);
