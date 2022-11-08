import { useEndpoint, useMethod } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useState } from 'react';

type IUnreadState = boolean;

export const useUnreads = (): [IUnreadState, any, any[]] => {
	const [result, setResult] = useState<any[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<unknown>(null);

	const getSubscriptions = useEndpoint('GET', '/v1/subscriptions.get');
	const getChannelHistory = useEndpoint('GET', '/v1/channels.history');
	const getDMHistory = useEndpoint('GET', '/v1/im.history');
	// const getThreads = useEndpoint('GET', '/v1/chat.getThreadsList');
	const getThreadMessages = useEndpoint('GET', '/v1/chat.getThreadMessages');
	const getTest = useMethod('loadHistory');

	// const threads = await getThreads({ rid: room.rid, type: 'unread', offset: 0, count: 0 });

	const fetchMessagesData = useCallback(
		async (room): Promise<any[]> => {
			let unreadMessages: any[] = [];
			if (room?.unread > 0) {
				if (room?.t === 'c') {
					const { messages } = await getChannelHistory({ roomId: room.rid, oldest: room.ls, unreads: 'true' });

					unreadMessages = messages;
				}
				if (room?.t === 'd') {
					const { messages } = await getDMHistory({ roomId: room.rid, oldest: room.ls, unreads: 'true' });

					unreadMessages = messages;
				}
			}

			unreadMessages.forEach((message: any) => {
				message.ts = new Date(message.ts);
				message._updatedAt = new Date(message._updatedAt);
			});

			return unreadMessages;
		},
		[getChannelHistory, getDMHistory],
	);

	const fetchThreadsMessages = useCallback(
		async (room) => {
			const threads: any[] = [];
			if (room?.tunread?.length) {
				const history = await getTest(room.rid, room.ls, undefined, undefined, true);
				room.history = history;
				const messagesForAllThreads = await Promise.all(room.tunread.map((thread: string) => getThreadMessages({ tmid: thread })));

				messagesForAllThreads.forEach((messages, index) => {
					messages.messages.forEach((message: any) => {
						message.ts = new Date(message.ts);
						message._updatedAt = new Date(message._updatedAt);
					});
					threads.push({
						tmid: room.tunread[index],
						messages: messages.messages.filter((message: any) => !message?.t),
					});
				});
			}

			return threads;
		},
		[getThreadMessages, getTest],
	);

	const fetchRoomsData = useCallback(async () => {
		setLoading(true);
		try {
			const { update: rooms }: { update: any[] } = await getSubscriptions({});

			const messagesForAllRooms = await Promise.all(rooms.map((room) => fetchMessagesData(room)));

			messagesForAllRooms.forEach((messages, index) => {
				rooms[index].messages = messages.reverse().filter((message) => !message?.t);
			});

			const threadMessagesForAllRooms = await Promise.all(rooms.map((room) => fetchThreadsMessages(room)));

			threadMessagesForAllRooms.forEach((threads, index) => {
				rooms[index].threads = threads;
			});

			rooms.forEach((room: any) => {
				room.lr = new Date(room.lr);
				room.ls = new Date(room.ls);
				room.ts = new Date(room.ts);
				room._updatedAt = new Date(room._updatedAt);
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
