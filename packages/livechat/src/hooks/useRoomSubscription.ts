import { useStream } from '@rocket.chat/ui-contexts';
// import { useQuery } from '@tanstack/react-query';
import { useState } from 'preact/hooks';
import { useEffect } from 'react';

export const useRoomSubscription = (rid: string) => {
	const [roomData, setRoomData] = useState();

	// userActivity: StreamerCallbackArgs<'notify-room', `${string}/user-activity`>;
	// 	message: StreamerCallbackArgs<'room-messages', string>;
	// 	delete: StreamerCallbackArgs<'notify-room', `${string}/deleteMessage`>;

	// const subscriptionsEndpoint = useEndpoint('GET', '/v1/subscriptions.get');
	const notifyUserStream = useStream('room-messages');

	useEffect(() => {
		if (!rid) {
			return;
		}
		const unsub = notifyUserStream(rid, (msg) => {
			setRoomData(msg);
			console.log('ding', msg);
		});

		console.log('rid', rid)

		return () => {
			unsub();
		};
	}, [rid, notifyUserStream]);

	console.log('roomData', roomData);

	// useEffect(() => notifyUserStream(`${rid}/user-activity`, ()), [notifyUserStream, uid, refetch]);

	return roomData;
};
