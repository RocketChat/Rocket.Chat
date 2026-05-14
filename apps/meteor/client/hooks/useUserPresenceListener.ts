import { UserStatus } from '@rocket.chat/core-typings';
import { useEffect } from 'react';

import { sdk } from '../../app/utils/client/lib/SDKClient';
import { Presence } from '../lib/presence';

const STATUS_MAP = [UserStatus.OFFLINE, UserStatus.ONLINE, UserStatus.AWAY, UserStatus.BUSY, UserStatus.DISABLED];

type Args = [username: string, statusChanged?: UserStatus, statusText?: string];

export const useUserPresenceListener = (): void => {
	useEffect(() => {
		const { stop } = sdk.onAnyStreamEvent('user-presence', (uid, args) => {
			const [username, statusChanged, statusText] = args as Args;
			Presence.notify({ _id: uid, username, status: STATUS_MAP[statusChanged as any], statusText });
		});
		return stop;
	}, []);
};
