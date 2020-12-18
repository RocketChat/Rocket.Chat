import { useCallback, useEffect, useRef } from 'react';

import { useMessageList } from './useMessageList';
import { useStream } from '../../../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../contexts/ToastMessagesContext';
import { IMessage } from '../../../../../../definition/IMessage';
import { FieldExpression, createFilterFromQuery } from '../../../../../lib/minimongo';
import { useGetStarredMessages } from './useGetStarredMessages';

const LIMIT_DEFAULT = 50;

type DeleteMessageBulkParams = {
	rid: IMessage['rid'];
	excludePinned: boolean;
	ignoreDiscussion: boolean;
	ts: FieldExpression<IMessage>;
	users: string[];
}

export const useStarredMessages = (rid: IMessage['rid']): any => {
	const { messages, reset, update, bulkUpsertMessages, upsertMessage, deleteMessage, reject } = useMessageList();
	const offsetRef = useRef(0);

	const getStarredMessages = useGetStarredMessages();

	const subscribeToRoomMessages = useStream('room-messages');
	const subscribeToNotifyRoom = useStream('notify-room');

	const dispatchToastMessage = useToastMessageDispatch();

	const fetchData = useCallback(async (rid, offset) => {
		try {
			const messages = await getStarredMessages({
				roomId: rid,
				count: LIMIT_DEFAULT,
				offset,
			});

			bulkUpsertMessages(messages);
		} catch (error) {
			reject(error);
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [getStarredMessages, bulkUpsertMessages, reject, dispatchToastMessage]);

	useEffect(() => {
		offsetRef.current = 0;
		reset();

		fetchData(rid, offsetRef.current);
	}, [reset, fetchData, rid]);

	const loadMore = useCallback(() => {
		offsetRef.current += LIMIT_DEFAULT;
		update();

		fetchData(rid, offsetRef.current);
	}, [update, fetchData, rid]);

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

			const query: Record<string, unknown> = {
				rid: params.rid,
				ts: params.ts,
			};

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

			const deletedMessages = (messages ?? []).filter(filter);

			console.log(deletedMessages);

			// TODO : Create DeleteBulk
		}),
	[subscribeToNotifyRoom, rid, deleteMessage, messages]);

	return {
		messages,
		loadMore,
	};
};
