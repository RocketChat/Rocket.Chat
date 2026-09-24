import { type IThreadMessage, type IThreadMainMessage, isVideoConfMessage } from '@rocket.chat/core-typings';
import { Message, MessageLeftContainer, MessageContainer } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';

import ThreadMessageContent from './ThreadMessageContent';
import type { MessageActionContext } from '../../../../lib/MessageAction';
import { useIsMessageHighlight } from '../../../../views/room/MessageList/contexts/MessageHighlightContext';
import IgnoredContent from '../../IgnoredContent';
import MessageToolbarHolder from '../../MessageToolbarHolder';
import { useMessageListViewer } from '../../list/MessageListContext';
import type { MessageAuthor } from '../../list/messageListContract';

export type ThreadMessageFrameProps = {
	message: IThreadMessage | IThreadMainMessage;
	unread: boolean;
	ignoredUser?: boolean;
	author?: MessageAuthor;
	/** What stands to the left of the message: the author's avatar, or the status indicators of a grouped message */
	leading: ReactNode;
	/** The author and time line; a message without one continues the group above it */
	header?: ReactNode;
};

/** The parts every thread message shares: highlighting, content and toolbar around a leading column and an optional header */
const ThreadMessageFrame = ({ message, author, unread, ignoredUser, leading, header }: ThreadMessageFrameProps) => {
	const t = useTranslation();
	const { uid } = useMessageListViewer();
	const editing = useIsMessageHighlight(message._id);
	const [displayIgnoredMessage, toggleDisplayIgnoredMessage] = useToggle(false);
	const ignored = ignoredUser && !displayIgnoredMessage;
	const grouped = !header;

	const messageContext: MessageActionContext = isVideoConfMessage(message) ? 'videoconf-threads' : 'threads';

	return (
		<Message
			role='listitem'
			aria-roledescription={t('thread_message')}
			tabIndex={0}
			id={message._id}
			isEditing={editing}
			isPending={message.temp}
			sequential={grouped}
			data-id={message._id}
			data-mid={message._id}
			data-unread={unread}
			data-sequential={grouped}
			data-own={message.u._id === uid}
		>
			<MessageLeftContainer>{leading}</MessageLeftContainer>

			<MessageContainer>
				{header}

				{ignored ? (
					<IgnoredContent messageId={message._id} onShowMessageIgnored={toggleDisplayIgnoredMessage} />
				) : (
					<ThreadMessageContent message={message} author={author} />
				)}
			</MessageContainer>
			{!message.private && message.e2e !== 'pending' && <MessageToolbarHolder message={message} context={messageContext} />}
		</Message>
	);
};

export default ThreadMessageFrame;
