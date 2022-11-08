/* eslint-disable complexity */
import type { IMessage } from '@rocket.chat/core-typings';
import { Message as MessageContainer } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import { useCountSelected } from '../../../room/MessageList/contexts/SelectedMessagesContext';
import { MessageWithMdEnforced } from '../../../room/MessageList/lib/parseMessageTextToAstMarkdown';
import MessageContent from './MessageContent';

const Message: FC<{
	message: MessageWithMdEnforced;
	sequential: boolean;
	id: IMessage['_id'];
	unread: boolean;
	mention: boolean;
	all: boolean;
}> = ({ message }) => {
	useCountSelected();

	return (
		<>
			<MessageContainer>
				<MessageContent message={message} />
			</MessageContainer>
		</>
	);
};

export default memo(Message);
