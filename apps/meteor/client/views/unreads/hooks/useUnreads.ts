import { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useMethod } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useState } from 'react';

import { useRoomList } from '../../../sidebar/hooks/useRoomList';

type IUnreadState = boolean;

type IUnreadRoom = ISubscription &
	IRoom & {
		messages: IMessage[];
	};

export const useUnreads = (): [IUnreadState, any, any[]] => {
	const [result, setResult] = useState<IUnreadRoom[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<unknown>(null);

	const getSubscriptions = useRoomList();
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

	const fetchRoomsData = useCallback(async () => {
		setLoading(true);
		try {
			const rooms: IUnreadRoom[] = getSubscriptions.filter((room) => typeof room !== 'string') as IUnreadRoom[];

			const messagesForAllRooms = await Promise.all(rooms.map((room) => fetchMessagesData(room)));

			messagesForAllRooms.forEach((messages, index) => {
				rooms[index].messages = messages.reverse().filter((message) => !message?.t);
			});

			setResult(rooms.filter((room) => room?.messages?.length));
		} catch (err) {
			setError(err);
		}

		setLoading(false);
	}, [getSubscriptions, fetchMessagesData]);

	useEffect(() => {
		fetchRoomsData();
	}, [fetchRoomsData]);

	return [loading, error, loading || error ? [] : result];
};
