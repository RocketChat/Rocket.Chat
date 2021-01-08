import { useCallback, useEffect, useState } from 'react';

import { ThreadsList, ThreadsListOptions } from '../../../../lib/lists/ThreadsList';
import { useEndpoint, useStream } from '../../../../contexts/ServerContext';
import { IMessage } from '../../../../../definition/IMessage';
import { useUserId } from '../../../../contexts/UserContext';
import { createFilterFromQuery, FieldExpression, Query } from '../../../../lib/minimongo';

type RawIMessage = {
	[K in keyof IMessage]: IMessage[K] extends Date ? string : IMessage[K];
};

type RoomMessagesRidEvent = IMessage;
type NotifyRoomRidDeleteMessageEvent = { _id: IMessage['_id'] };
type NotifyRoomRidDeleteMessageBulkEvent = {
	rid: IMessage['rid'];
	excludePinned: boolean;
	ignoreDiscussion: boolean;
	ts: FieldExpression<Date>;
	users: string[];
};

const convertRawMessage = (rawMessage: RawIMessage): IMessage => ({
	...rawMessage,
	ts: new Date(rawMessage.ts),
	_updatedAt: new Date(rawMessage._updatedAt),
});

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

const INITIAL_ITEM_COUNT = 50;

export const useThreadsList = (options: ThreadsListOptions): [ThreadsList, number, (start: number, end: number) => void] => {
	const [threadsList] = useState(() => new ThreadsList(options));
	const [total, setTotal] = useState(0);

	useEffect(() => {
		if (threadsList.options !== options) {
			threadsList.updateFilters(options);
		}
	}, [threadsList, options]);

	const getThreadsList = useEndpoint('GET', 'chat.getThreadsList');

	const fetch = useCallback(async (start, end) => {
		const { threads, total } = await getThreadsList({
			rid: options.rid,
			type: options.type,
			text: options.text,
			offset: start,
			count: end - start,
		});

		setTotal(total);

		return threads.map(convertRawMessage);
	}, [getThreadsList, options.rid, options.text, options.type]);

	useEffect(() => {
		threadsList.pushMany(() => fetch(0, INITIAL_ITEM_COUNT));
	}, [threadsList, fetch]);

	const subscribeToRoomMessages = useStream('room-messages');
	const subscribeToNotifyRoom = useStream('notify-room');
	const uid = useUserId();

	useEffect(() => {
		if (!uid) {
			return;
		}

		return subscribeToRoomMessages<RoomMessagesRidEvent>(options.rid, (message) => {
			threadsList.pushOne(message);
		});
	}, [subscribeToRoomMessages, uid, options.rid, threadsList]);

	useEffect(() => {
		if (!uid) {
			return;
		}

		return subscribeToNotifyRoom<NotifyRoomRidDeleteMessageEvent>(`${ options.rid }/deleteMessage`, ({ _id: mid }) => {
			threadsList.deleteOne(mid);
		});
	}, [subscribeToNotifyRoom, uid, options.rid, threadsList]);

	useEffect(() => {
		if (!uid) {
			return;
		}

		return subscribeToNotifyRoom<NotifyRoomRidDeleteMessageBulkEvent>(`${ options.rid }/deleteMessageBulk`, (params) => {
			const matchDeleteCriteria = createDeleteCriteria(params);
			threadsList.deleteMany(matchDeleteCriteria);
		});
	}, [subscribeToNotifyRoom, uid, options.rid, threadsList]);

	return [threadsList, total, fetch];
};
