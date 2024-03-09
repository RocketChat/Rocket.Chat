import type { IMessage } from '@rocket.chat/core-typings';
import { useStream } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { onMessage } from '../lib/room';

export const useRoomMessagesSubscription = (rid?: string, token?: string) => {
	const stream = useStream('room-messages');

	useEffect(() => {
		if (!rid) {
			return;
		}
		return stream(rid, (msg: IMessage) => {
			onMessage(msg);
		});
	}, [rid, stream, token]);
};
