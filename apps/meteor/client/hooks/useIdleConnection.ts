import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { ServerContext, useConnectionStatus, useSetting } from '@rocket.chat/ui-contexts';
import { useContext } from 'react';

import { useIdleActiveEvents } from './useIdleActiveEvents';

export const useIdleConnection = (uid: string | null) => {
	const { status } = useConnectionStatus();
	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead');
	const { disconnect: disconnectServer, reconnect: reconnectServer } = useContext(ServerContext);

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
