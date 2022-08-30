import { IMessage } from '@rocket.chat/core-typings';
import React, { ReactElement } from 'react';

import { useParsedMessage } from '../hooks/useParsedMessage';
import MessageMarkup from './MessageMarkup';

type MessageContentBodyProps = {
	message: IMessage;
};

const MessageContentBody = ({ message }: MessageContentBodyProps): ReactElement => {
	const tokens = useParsedMessage(message);

	return <MessageMarkup tokens={tokens} message={message} />;
};

export default MessageContentBody;
