import type { ConnectionStatusContextValue } from '@rocket.chat/ui-contexts';
import { ConnectionStatusContext } from '@rocket.chat/ui-contexts';
import { useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';

import { ensureConnectedAndAuthenticated, getDdpSdk } from '../lib/sdk/ddpSdk';
import { type ConnectionStatus, getConnectionSessionId, getConnectionStatus } from '../meteor/connection';

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

type ConnectionSnapshot = ConnectionStatus & { sessionId: string | undefined };

const computeStatus = (): ConnectionSnapshot => ({ ...getConnectionStatus(), sessionId: getConnectionSessionId() });

const isStatusEqual = (a: ConnectionSnapshot, b: ConnectionSnapshot): boolean =>
	a.status === b.status &&
	a.connected === b.connected &&
	a.retryCount === b.retryCount &&
	a.retryTime === b.retryTime &&
	a.sessionId === b.sessionId;

let cachedStatus: ConnectionSnapshot = computeStatus();
const statusListeners = new Set<() => void>();
let statusBridgeStarted = false;

const ensureStatusBridge = (): void => {
	if (statusBridgeStarted) return;
	statusBridgeStarted = true;
	const refreshStatus = () => {
		const next = computeStatus();
		if (isStatusEqual(cachedStatus, next)) return;
		cachedStatus = next;
		statusListeners.forEach((cb) => cb());
	};
	const { connection } = getDdpSdk();
	connection.on('connection', refreshStatus);
	connection.on('connected', refreshStatus);
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

const getStatusSnapshot = (): ConnectionSnapshot => cachedStatus;

export type ConnectionStatusProviderProps = { children?: ReactNode };

const ConnectionStatusProvider = ({ children }: ConnectionStatusProviderProps) => {
	const { connected, status, retryCount, retryTime, sessionId } = useSyncExternalStore(subscribeStatus, getStatusSnapshot);

	useEffect(() => {
		const checkAndReload = () => {
			if (retryCount && retryCount >= 30 && navigator.onLine) {
				window.location.reload();
			}
		};

		checkAndReload();

		window.addEventListener('online', checkAndReload);
		return () => {
			window.removeEventListener('online', checkAndReload);
		};
	}, [retryCount]);

	const value = useMemo(
		(): ConnectionStatusContextValue => ({
			connected,
			status,
			retryCount,
			retryTime,
			sessionId,
			disconnect,
			reconnect,
		}),
		[connected, retryCount, retryTime, sessionId, status],
	);

	return <ConnectionStatusContext.Provider value={value}>{children}</ConnectionStatusContext.Provider>;
};

export default ConnectionStatusProvider;
