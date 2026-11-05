import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import { MessageTypes } from '@rocket.chat/message-types';
import type { MessageListMessageRow } from '@rocket.chat/ui-message-list';
import { RoomMessage, SystemMessage, ThreadMessagePreview } from '@rocket.chat/ui-message-list';
import { memo } from 'react';

type RoomMessageRowProps = {
	row: MessageListMessageRow<IMessage>;
	subscription: ISubscription | undefined;
};

/** A message of the room, with the variant its type calls for. */
const RoomMessageRow = ({ row: { message, isSequential, startsNewDay, isFirstUnread }, subscription }: RoomMessageRowProps) => {
	if (MessageTypes.isSystemMessage(message)) {
		return <SystemMessage message={message} />;
	}

	if (isThreadMessage(message)) {
		return (
			<div role='listitem'>
				<ThreadMessagePreview
					data-mid={message._id}
					data-tmid={message.tmid}
					data-unread={isFirstUnread}
					data-sequential={isSequential}
					message={message}
					sequential={isSequential && !startsNewDay}
				/>
			</div>
		);
	}

	return (
		<RoomMessage
			message={message}
			sequential={isSequential}
			unread={!!subscription?.tunread?.includes(message._id)}
			mention={!!subscription?.tunreadUser?.includes(message._id)}
			all={!!subscription?.tunreadGroup?.includes(message._id)}
			ignoredUser={!!subscription?.ignored?.includes(message.u._id)}
		/>
	);
};

export default memo(RoomMessageRow);
