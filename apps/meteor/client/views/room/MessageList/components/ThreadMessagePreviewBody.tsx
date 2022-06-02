import { IMessage } from '@rocket.chat/core-typings';
import React, { ReactElement } from 'react';

import MessageBodyRender from '../../../../components/message/body/MessageBodyRender';
import { useMessageActions } from '../../contexts/MessageContext';
import { useParsedMessage } from '../hooks/useParsedMessage';

type ThreadMessagePreviewBodyProps = {
	message: IMessage;
};

const ThreadMessagePreviewBody = ({ message }: ThreadMessagePreviewBodyProps): ReactElement => {
	const {
		actions: { openRoom, openUserCard },
	} = useMessageActions();

	const tokens = useParsedMessage(message);

	return (
		<MessageBodyRender
			onUserMentionClick={openUserCard}
			onChannelMentionClick={openRoom}
			mentions={message?.mentions || []}
			channels={message?.channels || []}
			tokens={tokens}
			isThreadPreview
		/>
	);
};

export default ThreadMessagePreviewBody;
