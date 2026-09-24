import { MessageAvatar } from '@rocket.chat/ui-avatar';
import { memo } from 'react';

import { useIsSelecting } from '../../../views/room/MessageList/contexts/SelectedMessagesContext';
import Emoji from '../../Emoji';
import MessageHeader from '../MessageHeader';
import RoomMessageFrame from './room/RoomMessageFrame';
import type { RoomMessageFrameProps } from './room/RoomMessageFrame';
import { useMessageListUserCard } from '../list/MessageViewerContext';

export type RoomMessageProps = Omit<RoomMessageFrameProps, 'leading' | 'header'> & {
	showUserAvatar: boolean;
};

/** A room message that opens a group: the author's avatar and the author and time line above its content */
const RoomMessage = ({ message, author, showUserAvatar, ...props }: RoomMessageProps) => {
	const { openUserCard, triggerProps } = useMessageListUserCard();
	const selecting = useIsSelecting();

	const avatar = message.u.username && !selecting && showUserAvatar && (
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
		<RoomMessageFrame
			message={message}
			author={author}
			leading={avatar}
			header={<MessageHeader message={message} author={author} />}
			{...props}
		/>
	);
};

export default memo(RoomMessage);
