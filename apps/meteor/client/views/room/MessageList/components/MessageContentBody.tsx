import { IMessage } from '@rocket.chat/core-typings';
import React, { ReactElement } from 'react';

import MessageBodyRender from '../../../../components/Message/MessageBodyRender';
import { useMessageActions } from '../../contexts/MessageContext';
import PlainMessageRender from './PlainMessageRender';

const MessageContentBody = ({ message, isThreadPreview }: { message: IMessage; isThreadPreview?: boolean }): ReactElement => {
	const {
		actions: { openRoom, openUserCard },
	} = useMessageActions();

	if (!message.md) {
		return <PlainMessageRender message={message} isThreadPreview={isThreadPreview} />;
	}

	return (
		<MessageBodyRender
			onUserMentionClick={openUserCard}
			onChannelMentionClick={openRoom}
			mentions={message?.mentions || []}
			channels={message?.channels || []}
			tokens={message.md}
			isThreadPreview={isThreadPreview}
		/>
	);
};

export default MessageContentBody;
