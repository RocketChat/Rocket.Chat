import { type IThreadMessage, type IThreadMainMessage, isVideoConfMessage } from '@rocket.chat/core-typings';
import { Message, MessageLeftContainer, MessageContainer } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import { MessageAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation, useUserId } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { memo } from 'react';

import type { MessageActionContext } from '../../../../app/ui-utils/client/lib/MessageAction';
import { useIsMessageHighlight } from '../../../views/room/MessageList/contexts/MessageHighlightContext';
import { useJumpToMessage } from '../../../views/room/MessageList/hooks/useJumpToMessage';
import { useUserCard } from '../../../views/room/contexts/UserCardContext';
import Emoji from '../../Emoji';
import IgnoredContent from '../IgnoredContent';
import MessageHeader from '../MessageHeader';
import MessageToolbarHolder from '../MessageToolbarHolder';
import StatusIndicators from '../StatusIndicators';
import ThreadMessageContent from './thread/ThreadMessageContent';

type ThreadMessageProps = {
	message: IThreadMessage | IThreadMainMessage;
	unread: boolean;
	sequential: boolean;
	showUserAvatar: boolean;
};

const ThreadMessage = ({ message, sequential, unread, showUserAvatar }: ThreadMessageProps): ReactElement => {
	const t = useTranslation();
	const uid = useUserId();
	const editing = useIsMessageHighlight(message._id);
	const [ignored, toggleIgnoring] = useToggle((message as { ignored?: boolean }).ignored);
	const { openUserCard, triggerProps } = useUserCard();

	// Checks if is videoconf message to limit toolbox actions
	const messageContext: MessageActionContext = isVideoConfMessage(message) ? 'videoconf-threads' : 'threads';

	const messageRef = useJumpToMessage(message._id);

	return (
		<Message
			role='listitem'
			aria-roledescription={t('thread_message')}
			tabIndex={0}
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
						emoji={message.emoji ? <Emoji emojiHandle={message.emoji} fillContainer /> : undefined}
						avatarUrl={message.avatar}
						username={message.u.username}
						size='x36'
						onClick={(e) => openUserCard(e, message.u.username)}
						style={{ cursor: 'pointer' }}
						role='button'
						{...triggerProps}
					/>
				)}
				{sequential && <StatusIndicators message={message} />}
			</MessageLeftContainer>

			<MessageContainer>
				{!sequential && <MessageHeader message={message} />}

				{ignored ? <IgnoredContent onShowMessageIgnored={toggleIgnoring} /> : <ThreadMessageContent message={message} />}
			</MessageContainer>
			{!message.private && <MessageToolbarHolder message={message} context={messageContext} />}
		</Message>
	);
};

export default memo(ThreadMessage);
