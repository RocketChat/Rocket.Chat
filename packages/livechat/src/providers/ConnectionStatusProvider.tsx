import { ConnectionStatusContext } from '@rocket.chat/ui-contexts';
import type { ComponentChildren } from 'preact';
import { useMemo } from 'preact/hooks';
import { useSyncExternalStore } from 'react';

import { useSDK } from './SDKProvider';

const ConnectionStatusProvider = ({ children }: { children: ComponentChildren }) => {
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
			}) as const,
		[status, sdk],
	);

	return <ConnectionStatusContext.Provider children={children} value={value} />;
};

export default ConnectionStatusProvider;
