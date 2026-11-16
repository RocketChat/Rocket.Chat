import type { IMessage } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import { MessageTypes } from '@rocket.chat/message-types';
import { RoomMessage, SystemMessage, ThreadMessagePreview } from '@rocket.chat/ui-message-list';
import { memo } from 'react';

import { useMessageMarkers } from './MessageMarkers';
import { useRegisterRenderedMessage } from './useRegisterRenderedMessage';

type RoomMessageRowProps = {
	message: IMessage;
	isSequential: boolean;
	startsNewDay: boolean;
	isFirstUnread: boolean;
};

/** A message of the room, with the variant its type calls for. It counts in "Select all" while it is rendered. */
const RoomMessageRow = ({ message, isSequential, startsNewDay, isFirstUnread }: RoomMessageRowProps) => {
	const markers = useMessageMarkers(message);
	useRegisterRenderedMessage(message._id);

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

	return <RoomMessage message={message} sequential={isSequential} {...markers} />;
};

export default memo(RoomMessageRow);
