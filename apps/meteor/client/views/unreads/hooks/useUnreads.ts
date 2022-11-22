import { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useEndpoint, useMethod } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useState } from 'react';

import { MessageWithMdEnforced } from '../../room/MessageList/lib/parseMessageTextToAstMarkdown';
import { useUnreadRoomList } from './useUnreadRoomList';

export type IUnreadState = boolean;

export type IUnreadRoom = ISubscription & IRoom & { firstMessage?: IMessage };
export type IUnreadHistoryRoom = IUnreadRoom & { undo?: boolean };

const retryDelay = 1000;
const maxTries = 5;

export const useUnreads = (): [IUnreadState, any, IUnreadHistoryRoom[] | null, (room: any) => Promise<MessageWithMdEnforced[]>, any] => {
	const [result, setResult] = useState<IUnreadHistoryRoom[] | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<unknown>(null);
	const [undoHistory, setUndoHistory] = useState<string[]>([]);

	const subscriptions = useUnreadRoomList(undoHistory);
	const getMessages = useMethod('loadHistory');
	const getThreadMessages = useEndpoint('GET', '/v1/chat.getThreadMessages');

	const fetchThreadsMessages = useCallback(
		async (threads): Promise<MessageWithMdEnforced[]> => {
			let messagesForAllThreads = await Promise.all(threads.map((thread: string) => getThreadMessages({ tmid: thread })));

			messagesForAllThreads = messagesForAllThreads.flatMap((threads) => threads.messages[0]);

			(messagesForAllThreads || []).forEach((message) => {
				message.ts = new Date(message.ts);
				message._updatedAt = new Date(message._updatedAt);
			});

			return messagesForAllThreads;
		},
		[getThreadMessages],
	);

	const fetchMessagesData = useCallback(
		async (room: any, retried = 0): Promise<MessageWithMdEnforced[]> => {
			let unreadMessages: any[] = [];
			try {
				const { messages } = await getMessages(room.rid, undefined, 0, new Date(Date.parse(room?.ls || room?.ts)), true, true);

				unreadMessages = messages;

				unreadMessages.forEach((message: any) => {
					message.ts = new Date(message.ts);
					message._updatedAt = new Date(message._updatedAt);
				});

				if (room?.tunread?.length) {
					const notFound = room.tunread.filter((thread: string) => !unreadMessages.filter((message) => thread === message?.tmid)?.length);

					if (notFound.length) {
						const threadMessages = await fetchThreadsMessages(notFound);

						unreadMessages = [...unreadMessages, ...threadMessages];
					}
				}

				return unreadMessages;
			} catch (err) {
				console.error(err);

				if (retried > maxTries) return [];

				return new Promise((resolve) => {
					setTimeout(() => {
						resolve(fetchMessagesData(room, retried + 1));
					}, retryDelay);
				});
			}
		},
		[getMessages, fetchThreadsMessages],
	);

	const fetchRoomsData = useCallback(async () => {
		setLoading(true);
		try {
			const rooms: IUnreadHistoryRoom[] = subscriptions
				.map((room: IUnreadHistoryRoom) => {
					if (undoHistory.includes(room.rid)) room.undo = true;
					return room;
				})
				.filter((room) => room?.unread || room?.tunread?.length || room.undo) as IUnreadHistoryRoom[];

			setResult(rooms);
			setLoading(false);
		} catch (err) {
			setError(err);
		}
	}, [subscriptions, undoHistory]);

	useEffect(() => {
		fetchRoomsData();
	}, [fetchRoomsData]);

	return [loading, error, loading || error ? null : result, fetchMessagesData, { undoHistory, setUndoHistory }];
};
