import type { IUser } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useConnectionStatus, useSetting } from '@rocket.chat/ui-contexts';

import { useIdleActiveEvents } from './useIdleActiveEvents';

export const useIdleConnection = (uid: IUser['_id'] | undefined) => {
	const { status } = useConnectionStatus();
	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead');
	const { disconnect: disconnectServer, reconnect: reconnectServer } = useConnectionStatus();

	const disconnect = useEffectEvent(() => {
		if (status !== 'offline') {
			if (!uid && allowAnonymousRead !== true) {
				disconnectServer();
			}
		}
	});

	const reconnect = useEffectEvent(() => {
		if (status === 'offline') {
			reconnectServer();
		}
	});

	useIdleActiveEvents({ id: 'useLoginPresence', time: 60 * 1000 }, disconnect, reconnect);
};
