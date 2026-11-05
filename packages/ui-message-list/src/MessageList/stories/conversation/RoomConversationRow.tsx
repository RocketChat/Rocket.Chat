import type { IMessage } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import { MessageTypes } from '@rocket.chat/message-types';

import RoomMessage from '../../../Message/variants/RoomMessage';
import SystemMessage from '../../../Message/variants/SystemMessage';
import ThreadMessagePreview from '../../../Message/variants/ThreadMessagePreview';
import type { MessageListMessageRow } from '../../lib/buildMessageListRows';

export type RoomConversationRowProps = {
	row: MessageListMessageRow<IMessage>;
	ignoredUserIds: string[];
	unreadThreadIds: string[];
};

/** Renders a room's message row with the variant its message calls for, as a room list does. */
const RoomConversationRow = ({ row, ignoredUserIds, unreadThreadIds }: RoomConversationRowProps) => {
	const { message, isSequential, startsNewDay } = row;

	if (MessageTypes.isSystemMessage(message)) {
		return <SystemMessage message={message} />;
	}

	if (isThreadMessage(message)) {
		return (
			<div role='listitem'>
				<ThreadMessagePreview message={message} sequential={isSequential && !startsNewDay} />
			</div>
		);
	}

	return (
		<RoomMessage
			message={message}
			sequential={isSequential}
			unread={unreadThreadIds.includes(message._id)}
			mention={false}
			all={false}
			ignoredUser={ignoredUserIds.includes(message.u._id)}
		/>
	);
};

export default RoomConversationRow;
