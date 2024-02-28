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
					console.log('connecting');
					return 'connecting' as const;
				case 'connected':
					console.log('connected');
					return 'connected' as const;
				case 'failed':
					console.log('failed');
					return 'failed' as const;
				case 'idle':
					console.log('idle');
					return 'waiting' as const;
				default:
					console.log('offline');
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
