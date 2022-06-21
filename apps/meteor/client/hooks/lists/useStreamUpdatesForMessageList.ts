import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { useStream } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { MessageList } from '../../lib/lists/MessageList';
import { createFilterFromQuery, FieldExpression, Query } from '../../lib/minimongo';

type RoomMessagesRidEvent = IMessage;

type NotifyRoomRidDeleteMessageEvent = { _id: IMessage['_id'] };

type NotifyRoomRidDeleteMessageBulkEvent = {
	rid: IMessage['rid'];
	excludePinned: boolean;
	ignoreDiscussion: boolean;
	ts: FieldExpression<Date>;
	users: string[];
};

const createDeleteCriteria = (params: NotifyRoomRidDeleteMessageBulkEvent): ((message: IMessage) => boolean) => {
	const query: Query<IMessage> = { ts: params.ts };

	if (params.excludePinned) {
		query.pinned = { $ne: true };
	}

	if (params.ignoreDiscussion) {
		query.drid = { $exists: false };
	}
	if (params.users && params.users.length) {
		query['u.username'] = { $in: params.users };
	}

	return createFilterFromQuery<IMessage>(query);
};

export const useStreamUpdatesForMessageList = (messageList: MessageList, uid: IUser['_id'] | null, rid: IRoom['_id'] | null): void => {
	const subscribeToRoomMessages = useStream('room-messages');
	const subscribeToNotifyRoom = useStream('notify-room');

	useEffect(() => {
		if (!uid || !rid) {
			messageList.clear();
			return;
		}

		const unsubscribeFromRoomMessages = subscribeToRoomMessages<RoomMessagesRidEvent>(rid, (message) => {
			messageList.handle(message);
		});

		const unsubscribeFromDeleteMessage = subscribeToNotifyRoom<NotifyRoomRidDeleteMessageEvent>(`${rid}/deleteMessage`, ({ _id: mid }) => {
			messageList.remove(mid);
		});

		const unsubscribeFromDeleteMessageBulk = subscribeToNotifyRoom<NotifyRoomRidDeleteMessageBulkEvent>(
			`${rid}/deleteMessageBulk`,
			(params) => {
				const matchDeleteCriteria = createDeleteCriteria(params);
				messageList.prune(matchDeleteCriteria);
			},
		);

		return (): void => {
			unsubscribeFromRoomMessages();
			unsubscribeFromDeleteMessage();
			unsubscribeFromDeleteMessageBulk();
		};
	}, [subscribeToRoomMessages, subscribeToNotifyRoom, uid, rid, messageList]);
};
