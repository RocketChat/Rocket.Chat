import type { IMessage } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useMemo, useState } from 'react';

import { useRoomSubscription } from '../../../contexts/RoomContext';

export const useThreadFirstUnreadMessageId = (tmid: IMessage['_id'], messages: IMessage[]): IMessage['_id'] | undefined => {
	const uid = useUserId();
	const unreadSince = useRoomSubscription()?.tunreadSince?.[tmid];

	const [onOpen, setOnOpen] = useState({ tmid, unreadSince });
	if (onOpen.tmid !== tmid) {
		setOnOpen({ tmid, unreadSince });
	}

	return useMemo(() => {
		if (!onOpen.unreadSince) {
			return undefined;
		}

		const since = new Date(onOpen.unreadSince).getTime();
		const firstUnread = messages.find((message) => message.ts.getTime() >= since && message.u._id !== uid);
		if (!firstUnread || messages.some((message) => message.u._id === uid && message.ts > firstUnread.ts)) {
			return undefined;
		}

		return firstUnread._id;
	}, [messages, onOpen.unreadSince, uid]);
};
