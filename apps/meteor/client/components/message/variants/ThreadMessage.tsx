import { type IThreadMessage, type IThreadMainMessage, isVideoConfMessage } from '@rocket.chat/core-typings';
import { Message, MessageLeftContainer, MessageContainer } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import { useUserId } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo, useRef } from 'react';

import type { MessageActionContext } from '../../../../app/ui-utils/client/lib/MessageAction';
import { useIsMessageHighlight } from '../../../views/room/MessageList/contexts/MessageHighlightContext';
import { useJumpToMessage } from '../../../views/room/MessageList/hooks/useJumpToMessage';
import { useChat } from '../../../views/room/contexts/ChatContext';
import IgnoredContent from '../IgnoredContent';
import MessageHeader from '../MessageHeader';
import MessageToolboxHolder from '../MessageToolboxHolder';
import StatusIndicators from '../StatusIndicators';
import MessageAvatar from '../header/MessageAvatar';
import ThreadMessageContent from './thread/ThreadMessageContent';

type ThreadMessageProps = {
	message: IThreadMessage | IThreadMainMessage;
	unread: boolean;
	sequential: boolean;
	showUserAvatar: boolean;
};

const ThreadMessage = ({ message, sequential, unread, showUserAvatar }: ThreadMessageProps): ReactElement => {
	const uid = useUserId();
	const editing = useIsMessageHighlight(message._id);
	const [ignored, toggleIgnoring] = useToggle((message as { ignored?: boolean }).ignored);
	const chat = useChat();

	const messageRef = useRef(null);

	// Checks if is videoconf message to limit toolbox actions
	const messageContext: MessageActionContext = isVideoConfMessage(message) ? 'videoconf-threads' : 'threads';

	useJumpToMessage(message._id, messageRef);

	return (
		<Message
			id={message._id}
			ref={messageRef}
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
				{!sequential && message.u.username && showUserAvatar && (
					<MessageAvatar
						emoji={message.emoji}
						avatarUrl={message.avatar}
						username={message.u.username}
						size='x36'
						{...(chat?.userCard && {
							onClick: chat?.userCard.open(message.u.username),
							style: { cursor: 'pointer' },
						})}
					/>
				)}
				{sequential && <StatusIndicators message={message} />}
			</MessageLeftContainer>

			<MessageContainer>
				{!sequential && <MessageHeader message={message} />}

				{ignored ? <IgnoredContent onShowMessageIgnored={toggleIgnoring} /> : <ThreadMessageContent message={message} />}
			</MessageContainer>
			{!message.private && <MessageToolboxHolder message={message} context={messageContext} />}
		</Message>
	);
};

export default memo(ThreadMessage);
