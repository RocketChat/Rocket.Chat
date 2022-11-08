import { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useEndpoint, useMethod } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useState } from 'react';

import { useRoomList } from '../../../sidebar/hooks/useRoomList';

type IUnreadState = boolean;

type IUnreadThread = IMessage & { messages: IMessage[] };

type IUnreadRoom = ISubscription &
	IRoom & {
		messages: IMessage[];
		threads: IUnreadThread[];
	};

export const useUnreads = (): [IUnreadState, any, any[]] => {
	const [result, setResult] = useState<IUnreadRoom[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<unknown>(null);

	const getSubscriptions = useRoomList();
	const getThreads = useEndpoint('GET', '/v1/chat.getThreadsList');
	const getThreadMessages = useEndpoint('GET', '/v1/chat.getThreadMessages');
	const getMessages = useMethod('loadHistory');

	const fetchMessagesData = useCallback(
		async (room): Promise<IMessage[]> => {
			let unreadMessages: any[] = [];
			try {
				const { messages } = await getMessages(room.rid, undefined, 0, room?.ls, true, true);

				unreadMessages = messages;
			} catch (err) {
				console.error(err);
			}

			unreadMessages.forEach((message: any) => {
				message.ts = new Date(message.ts);
				message._updatedAt = new Date(message._updatedAt);
			});

			return unreadMessages;
		},
		[getMessages],
	);

	const fetchThreadsMessages = useCallback(
		async (room) => {
			try {
				const { threads }: { threads: any[] } = await getThreads({ rid: room.rid, type: 'unread', offset: 0, count: 0 });
				const messagesForAllThreads = await Promise.all(threads.map((thread: any) => getThreadMessages({ tmid: thread._id })));

				(messagesForAllThreads || []).forEach((messages, index) => {
					messages.messages.forEach((message: any) => {
						message.ts = new Date(message.ts);
						message._updatedAt = new Date(message._updatedAt);
					});
					threads[index].messages = messages.messages.filter((message: any) => !message?.t);
				});

				return threads;
			} catch (err) {
				console.error(err);
			}

			return [];
		},
		[getThreadMessages, getThreads],
	);

	const fetchRoomsData = useCallback(async () => {
		setLoading(true);
		try {
			const rooms: IUnreadRoom[] = getSubscriptions.filter((room) => typeof room !== 'string') as IUnreadRoom[];

			const messagesForAllRooms = await Promise.all(rooms.map((room) => fetchMessagesData(room)));

			messagesForAllRooms.forEach((messages, index) => {
				rooms[index].messages = messages.reverse().filter((message) => !message?.t);
			});

			const threadMessagesForAllRooms = await Promise.all(rooms.map((room) => fetchThreadsMessages(room)));

			threadMessagesForAllRooms.forEach((threads, index) => {
				rooms[index].threads = threads;
			});

			setResult(rooms.filter((room) => room?.messages?.length || room?.threads?.length));
		} catch (err) {
			setError(err);
		}

		setLoading(false);
	}, [getSubscriptions, fetchMessagesData, fetchThreadsMessages]);

	useEffect(() => {
		fetchRoomsData();
	}, [fetchRoomsData]);

	return [loading, error, loading || error ? [] : result];
};
