import type { ConnectionStatusContextValue } from '@rocket.chat/ui-contexts';
import { ConnectionStatusContext } from '@rocket.chat/ui-contexts';
import { useMemo, useSyncExternalStore, type ReactNode } from 'react';

import { ensureConnectedAndAuthenticated, getDdpSdk } from '../lib/sdk/ddpSdk';
import { isSdkTransportEnabled } from '../lib/sdk/sdkTransportEnabled';
import {
	type ConnectionStatus,
	disconnect as disconnectMeteor,
	getConnectionStatus,
	reconnect as reconnectMeteor,
} from '../meteor/connection';

const sdkTransportEnabled = isSdkTransportEnabled();

const disconnect = sdkTransportEnabled
	? () => {
			disconnectMeteor();
			try {
				getDdpSdk().connection.close();
			} catch {
				// no-op — DDPSDK may not be connected yet
			}
		}
	: () => disconnectMeteor();

const reconnect = sdkTransportEnabled
	? () => {
			reconnectMeteor();
			// ensureConnectedAndAuthenticated handles both 'connect' and loginWithToken,
			// so reconnecting here also re-establishes the DDPSDK session with the
			// same token Meteor resumes with.
			void ensureConnectedAndAuthenticated();
		}
	: () => reconnectMeteor();

type CombinedStatus = ConnectionStatus;

const sdkStatusToMeteor = (sdkStatus: string, meteor: CombinedStatus): CombinedStatus => {
	const retry = { retryCount: meteor.retryCount, retryTime: meteor.retryTime };

	switch (sdkStatus) {
		case 'connected':
			return { status: 'connected', connected: true, ...retry };
		case 'connecting':
			return { status: 'connecting', connected: false, ...retry };
		case 'reconnecting':
			return { status: 'connecting', connected: false, ...retry };
		case 'failed':
			return { status: 'failed', connected: false, ...retry };
		case 'closed':
		case 'disconnected':
			return { status: 'waiting', connected: false, ...retry };
		case 'idle':
		default:
			return { status: 'offline', connected: false, ...retry };
	}
};

// With SDK transport on, combine Meteor's DDP status with DDPSDK's so the
// ConnectionStatusBar / idle-connection hooks reflect the worst-case of both
// transports. With the flag off, route status straight through Meteor —
// `meteorBackedSdk` already bridges Meteor's `_stream` events into
// `sdk.connection.on('connection')`, so the same subscription works in both
// modes.
const computeStatus: () => CombinedStatus = sdkTransportEnabled
	? () => sdkStatusToMeteor(getDdpSdk().connection.status, getConnectionStatus())
	: () => getConnectionStatus();

const isStatusEqual = (a: CombinedStatus, b: CombinedStatus): boolean =>
	a.status === b.status && a.connected === b.connected && a.retryCount === b.retryCount && a.retryTime === b.retryTime;

let cachedStatus: CombinedStatus = computeStatus();
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

const getStatusSnapshot = (): CombinedStatus => cachedStatus;

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
