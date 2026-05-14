import { UserStatus } from '@rocket.chat/core-typings';
import { useStreamAll } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { Presence } from '../lib/presence';

const STATUS_MAP = [UserStatus.OFFLINE, UserStatus.ONLINE, UserStatus.AWAY, UserStatus.BUSY, UserStatus.DISABLED];

export const useUserPresenceListener = (): void => {
	const subscribe = useStreamAll('user-presence');

	useEffect(
		() =>
			subscribe((uid, [[username, statusChanged, statusText]]) => {
				Presence.notify({ _id: uid, username, status: STATUS_MAP[statusChanged as any], statusText });
			}),
		[subscribe],
	);
};
