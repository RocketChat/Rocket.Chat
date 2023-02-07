import type { IThreadMessage, IThreadMainMessage } from '@rocket.chat/core-typings';
import { Message, MessageLeftContainer, MessageContainer } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import { useUserId } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import { useUserCard } from '../../../hooks/useUserCard';
import { useIsMessageHighlight } from '../../../views/room/MessageList/contexts/MessageHighlightContext';
import UserAvatar from '../../avatar/UserAvatar';
import IgnoredContent from '../IgnoredContent';
import MessageHeader from '../MessageHeader';
import StatusIndicators from '../StatusIndicators';
import ToolboxHolder from '../ToolboxHolder';
import ThreadMessageContent from './thread/ThreadMessageContent';

type ThreadMessageProps = {
	message: IThreadMessage | IThreadMainMessage;
	unread: boolean;
	sequential: boolean;
};

const ThreadMessage = ({ message, sequential, unread }: ThreadMessageProps): ReactElement => {
	const uid = useUserId();
	const editing = useIsMessageHighlight(message._id);
	const [ignored, toggleIgnoring] = useToggle((message as { ignored?: boolean }).ignored);
	const { open: openUserCard } = useUserCard();

	return (
		<Message
			id={message._id}
			isEditing={editing}
			isPending={message.temp}
			sequential={sequential}
			data-qa-editing={editing}
			data-id={message._id}
			data-mid={message._id}
			data-unread={unread}
			data-sequential={sequential}
			data-own={message.u._id === uid}
			data-qa-type='message'
		>
			<MessageLeftContainer>
				{!sequential && message.u.username && (
					<UserAvatar
						url={message.avatar}
						username={message.u.username}
						size='x36'
						style={{ cursor: 'pointer' }}
						onClick={openUserCard(message.u.username)}
					/>
				)}
				{sequential && <StatusIndicators message={message} />}
			</MessageLeftContainer>

			<MessageContainer>
				{!sequential && <MessageHeader message={message} />}

				{ignored ? <IgnoredContent onShowMessageIgnored={toggleIgnoring} /> : <ThreadMessageContent message={message} />}
			</MessageContainer>
			{!message.private && <ToolboxHolder message={message} context='threads' />}
		</Message>
	);
};

export default memo(ThreadMessage);
