import { MessageAvatar } from '@rocket.chat/ui-avatar';
import { memo } from 'react';

import Emoji from '../../Emoji';
import MessageHeader from '../MessageHeader';
import ThreadMessageFrame from './thread/ThreadMessageFrame';
import type { ThreadMessageFrameProps } from './thread/ThreadMessageFrame';
import { useMessageListUserCard } from '../list/MessageListContext';

export type ThreadMessageProps = Omit<ThreadMessageFrameProps, 'leading' | 'header'> & {
	showUserAvatar: boolean;
};

/** A thread message that opens a group: the author's avatar and the author and time line above its content */
const ThreadMessage = ({ message, author, showUserAvatar, ...props }: ThreadMessageProps) => {
	const { openUserCard, triggerProps } = useMessageListUserCard();

	const avatar = message.u.username && showUserAvatar && (
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
	);

	return (
		<ThreadMessageFrame
			message={message}
			author={author}
			leading={avatar}
			header={<MessageHeader message={message} author={author} />}
			{...props}
		/>
	);
};

export default memo(ThreadMessage);
