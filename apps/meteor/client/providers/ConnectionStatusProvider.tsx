import type { ConnectionStatusContextValue } from '@rocket.chat/ui-contexts';
import { ConnectionStatusContext } from '@rocket.chat/ui-contexts';
import { useMemo, useSyncExternalStore, type ReactNode } from 'react';

import { ensureConnectedAndAuthenticated, getDdpSdk } from '../lib/sdk/ddpSdk';
import { type ConnectionStatus, getConnectionStatus } from '../meteor/connection';

const disconnect = () => {
	try {
		getDdpSdk().connection.close();
	} catch {
		// no-op — DDPSDK may not be connected yet
	}
};

const reconnect = () => {
	// ensureConnectedAndAuthenticated handles both 'connect' and loginWithToken, so reconnecting also logs the
	// session in again.
	void ensureConnectedAndAuthenticated();
};

const computeStatus = getConnectionStatus;

const isStatusEqual = (a: ConnectionStatus, b: ConnectionStatus): boolean =>
	a.status === b.status && a.connected === b.connected && a.retryCount === b.retryCount && a.retryTime === b.retryTime;

let cachedStatus: ConnectionStatus = computeStatus();
const statusListeners = new Set<() => void>();
let statusBridgeStarted = false;

const ensureStatusBridge = (): void => {
	if (statusBridgeStarted) return;
	statusBridgeStarted = true;
	getDdpSdk().connection.on('connection', () => {
		const next = computeStatus();
		if (isStatusEqual(cachedStatus, next)) return;
		cachedStatus = next;
		statusListeners.forEach((cb) => cb());
	});
};

const subscribeStatus = (cb: () => void): (() => void) => {
	ensureStatusBridge();
	// Close the race between the cachedStatus computed at module load and the
	// first event delivered through the bridge: status may have changed in
	// between (e.g. the socket connected before <ServerProvider> mounted), and
	// useSyncExternalStore would otherwise surface the stale snapshot until
	// the next external transition.
	const next = computeStatus();
	if (!isStatusEqual(cachedStatus, next)) {
		cachedStatus = next;
		cb();
	}
	statusListeners.add(cb);
	return () => {
		statusListeners.delete(cb);
	};
};

const getStatusSnapshot = (): ConnectionStatus => cachedStatus;

export type ConnectionStatusProviderProps = { children?: ReactNode };

const ConnectionStatusProvider = ({ children }: ConnectionStatusProviderProps) => {
	const { connected, status, retryCount, retryTime } = useSyncExternalStore(subscribeStatus, getStatusSnapshot);

	const value = useMemo(
		(): ConnectionStatusContextValue => ({
			connected,
			status,
			retryCount,
			retryTime,
			disconnect,
			reconnect,
		}),
		[connected, retryCount, retryTime, status],
	);

	return <ConnectionStatusContext.Provider value={value}>{children}</ConnectionStatusContext.Provider>;
};

export default ConnectionStatusProvider;
