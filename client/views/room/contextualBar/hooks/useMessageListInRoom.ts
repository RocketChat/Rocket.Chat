import { useCallback, useEffect } from 'react';

import { useStream } from '../../../../contexts/ServerContext';
import { IMessage } from '../../../../../definition/IMessage';
import { useUserId } from '../../../../contexts/UserContext';
import {
	createFilterFromQuery,
	FieldExpression,
	Query,
} from '../../../../lib/minimongo';
import { MessageList } from '../../../../lib/lists/MessageList';
import { IRoom } from '../../../../../definition/IRoom';

const INITIAL_ITEM_COUNT = 50;

type RawIMessage = {
	[K in keyof IMessage]: IMessage[K] extends Date ? string : IMessage[K];
};

const convertRawMessage = (rawMessage: RawIMessage): IMessage => ({
	...rawMessage,
	ts: new Date(rawMessage.ts),
	_updatedAt: new Date(rawMessage._updatedAt),
});

type RoomMessagesRidEvent = IMessage;

type NotifyRoomRidDeleteMessageEvent = { _id: IMessage['_id'] };

type NotifyRoomRidDeleteMessageBulkEvent = {
	rid: IMessage['rid'];
	excludePinned: boolean;
	ignoreDiscussion: boolean;
	ts: FieldExpression<Date>;
	users: string[];
};

const createDeleteCriteria = (
	params: NotifyRoomRidDeleteMessageBulkEvent,
): ((message: IMessage) => boolean) => {
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

export const useMessageListInRoom = (
	messageList: MessageList,
	rid: IRoom['_id'],
	fetch: (start: number, end: number) => Promise<RawIMessage[]>,
): ((start: number, end: number) => void) => {
	const loadMessages = useCallback((start: number, end: number) => {
		messageList.pushMany(
			() => fetch(start, end)
				.then((rawMessages) => rawMessages.map(convertRawMessage)),
		);
	}, [messageList, fetch]);

	useEffect(() => {
		loadMessages(0, INITIAL_ITEM_COUNT);
	}, [loadMessages]);

	const uid = useUserId();

	const subscribeToRoomMessages = useStream('room-messages');
	const subscribeToNotifyRoom = useStream('notify-room');

	useEffect(() => {
		if (!uid) {
			messageList.clear();
			return;
		}

		return subscribeToRoomMessages<RoomMessagesRidEvent>(rid, (message) => {
			messageList.pushOne(message);
		});
	}, [subscribeToRoomMessages, uid, rid, messageList]);

	useEffect(() => {
		if (!uid) {
			messageList.clear();
			return;
		}

		return subscribeToNotifyRoom<NotifyRoomRidDeleteMessageEvent>(
			`${ rid }/deleteMessage`,
			({ _id: mid }) => {
				messageList.deleteOne(mid);
			},
		);
	}, [subscribeToNotifyRoom, uid, rid, messageList]);

	useEffect(() => {
		if (!uid) {
			messageList.clear();
			return;
		}

		return subscribeToNotifyRoom<NotifyRoomRidDeleteMessageBulkEvent>(
			`${ rid }/deleteMessageBulk`,
			(params) => {
				const matchDeleteCriteria = createDeleteCriteria(params);
				messageList.deleteMany(matchDeleteCriteria);
			},
		);
	}, [subscribeToNotifyRoom, uid, rid, messageList]);

	return loadMessages;
};
