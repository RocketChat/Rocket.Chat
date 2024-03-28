import { ConnectionStatusContext } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { useSDK } from './SDKProvider';

const ConnectionStatusProvider = ({ children }: { children: ReactNode }) => {
	const sdk = useSDK();

	const status = useSyncExternalStore(
		(cb) => sdk.connection.on('connection', cb),
		() => {
			switch (sdk.connection.status) {
				case 'connecting':
					return 'connecting' as const;
				case 'connected':
					return 'connected' as const;
				case 'failed':
					return 'failed' as const;
				case 'idle':
					return 'waiting' as const;
				default:
					return 'offline' as const;
			}
		},
	);

	const value = useMemo(
		() =>
			({
				status,
				connected: status === 'connected',
				reconnect: () => sdk.connection.reconnect(),
			} as const),
		[status, sdk],
	);

	return <ConnectionStatusContext.Provider children={children} value={value} />;
};

export default ConnectionStatusProvider;
