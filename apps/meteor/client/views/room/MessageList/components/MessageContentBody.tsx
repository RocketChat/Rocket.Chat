import { IMessage } from '@rocket.chat/core-typings';
import React, { ReactElement } from 'react';

import Markup from '../../../../components/gazzodown/Markup';
import { MarkupInteractionContext } from '../../../../components/gazzodown/MarkupInteractionContext';
import { useMessageActions } from '../../contexts/MessageContext';
import { useParsedMessage } from '../hooks/useParsedMessage';

type MessageContentBodyProps = {
	message: IMessage;
};

const MessageContentBody = ({ message }: MessageContentBodyProps): ReactElement => {
	const tokens = useParsedMessage(message);

	const {
		actions: { openRoom, openUserCard },
	} = useMessageActions();

	return (
		<MarkupInteractionContext.Provider
			value={{
				mentions: message?.mentions ?? [],
				channels: message?.channels ?? [],
				onUserMentionClick: openUserCard,
				onChannelMentionClick: openRoom,
			}}
		>
			<Markup tokens={tokens} />
		</MarkupInteractionContext.Provider>
	);
};

export default MessageContentBody;
