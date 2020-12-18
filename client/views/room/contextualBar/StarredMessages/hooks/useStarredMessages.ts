import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useCallback, useEffect, useState } from 'react';

import { useMessageList } from './useMessageList';
import { useEndpoint, useStream } from '../../../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../contexts/ToastMessagesContext';
import { IMessage } from '../../../../../../definition/IMessage';
// import { createFilterFromQuery } from '../../../../../lib/minimongo';

const LIMIT_DEFAULT = 50;

export const useStarredMessages = (rid: string): any => {
	// TODO: useMessageList should use `useAsyncState` internally...
	const { messages, bulkUpsertMessages, upsertMessage } = useMessageList();
	// ...or we can split `useAsyncState` internals to add async state phase logic here

	const getStarredMessages = useEndpoint('GET', 'chat.getStarredMessages');
	const [offset, setOffset] = useSafely(useState(0));

	const subscribeToRoomMessages = useStream<IMessage>('room-messages');
	// const filter = createFilterFromQuery({ starred: { $exists: true } });

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
		subscribeToRoomMessages(rid, (_message) => {
			// TODO: this event is triggered wheneven a message is sent to the room.
			// Not all message is a starred message, so we need to filter it.
			// upsertMessage(message);
		}),
	[subscribeToRoomMessages, rid, upsertMessage]);

	return {
		messages,
		loadMore,
	};
};
