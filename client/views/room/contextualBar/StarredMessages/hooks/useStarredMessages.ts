import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useCallback, useEffect, useState } from 'react';

import { useMessageList } from './useMessageList';
import { useEndpoint, useStream } from '../../../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../contexts/ToastMessagesContext';
import { IMessage } from '../../../../../../definition/IMessage';
import { FieldExpression, Query, createFilterFromQuery } from '../../../../../lib/minimongo';


const LIMIT_DEFAULT = 50;

type DeleteMessageBulkParams = {
	rid: IMessage['rid'];
	excludePinned: boolean;
	ignoreDiscussion: boolean;
	ts: FieldExpression<IMessage>;
	users: string[];
}

export const useStarredMessages = (rid: string): any => {
	// TODO: useMessageList should use `useAsyncState` internally...
	const { messages, bulkUpsertMessages, upsertMessage, deleteMessage } = useMessageList();
	// ...or we can split `useAsyncState` internals to add async state phase logic here

	const getStarredMessages = useEndpoint('GET', 'chat.getStarredMessages');
	const [offset, setOffset] = useSafely(useState(0));

	const subscribeToRoomMessages = useStream('room-messages');
	const subscribeToNotifyRoom = useStream('notify-room');

	const dispatchToastMessage = useToastMessageDispatch();

	const fetchData = useCallback(async (rid, offset) => {
		try {
			const result = await getStarredMessages({
				roomId: rid,
				count: LIMIT_DEFAULT,
				offset,
			});

			/*
				Messages coming from the REST API are just plain JSON objects i.e. all the dates are strings
				in the ISO 8601 format. We need to convert `_updatedAt` and `ts` types from string to Date.
			*/

			type RawIMessage = Omit<IMessage, '_updatedAt' | 'ts'> // we omit the fields of Date type...
			& { _updatedAt: string; ts: string }; // and re-add them as strings

			// Here, we map RawIMessage[] to IMessage[]
			const messages = result.messages.map(
				(message: RawIMessage): IMessage => ({
					...message,
					_updatedAt: new Date(message._updatedAt),
					ts: new Date(message.ts),
				}),
			);

			bulkUpsertMessages(messages);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [getStarredMessages, bulkUpsertMessages, dispatchToastMessage]);

	useEffect(() => {
		fetchData(rid, offset);
	}, [fetchData, offset, rid, setOffset]);

	const loadMore = useCallback(() => setOffset((offset) => offset + LIMIT_DEFAULT), [setOffset]);

	useEffect(() =>
		subscribeToRoomMessages<IMessage>(rid, (message) => {
			if (!Array.isArray(message.starred)) {
				return;
			}

			if (message.starred.length === 0) {
				deleteMessage(message._id);
				return;
			}

			upsertMessage(message);
		}),
	[subscribeToRoomMessages, rid, upsertMessage, deleteMessage]);

	useEffect(() =>
		subscribeToNotifyRoom<{_id: IMessage['_id']}>(`${ rid }/deleteMessage`, (message) => {
			deleteMessage(message._id);
		}),
	[subscribeToNotifyRoom, rid, deleteMessage]);

	useEffect(() =>
		subscribeToNotifyRoom<DeleteMessageBulkParams>(`${ rid }/deleteMessageBulk`, (params) => {
			if (params.rid !== rid) {
				return;
			}

			const query: Query = { rid: params.rid, ts: params.ts };

			if (params.excludePinned) {
				query.pinned = { $ne: true };
			}

			if (params.ignoreDiscussion) {
				query.drid = { $exists: false };
			}
			if (params.users && params.users.length) {
				query['u.username'] = { $in: params.users };
			}

			const filter = createFilterFromQuery<IMessage>(query);

			const deletedMessages = messages.filter(filter);

			console.log(deletedMessages);

			// TODO : Create DeleteBulk
		}),
	[subscribeToNotifyRoom, rid, deleteMessage, messages]);

	return {
		messages,
		loadMore,
	};
};
