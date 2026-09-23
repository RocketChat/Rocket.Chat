// Vite-build implementation of client/meteor/connection.ts: DDPSDK is the only transport.
import { ensureConnectedAndAuthenticated, getDdpSdk } from '../../client/lib/sdk/ddpSdk';
import type { ConnectionStatus } from '../../client/meteor/connection';

export type { ConnectionStatus };

const toConnectionStatus = (status: string): ConnectionStatus => {
	switch (status) {
		case 'connected':
			return { status: 'connected', connected: true, retryCount: 0 };
		case 'connecting':
		case 'reconnecting':
			return { status: 'connecting', connected: false, retryCount: 0 };
		case 'failed':
			return { status: 'failed', connected: false, retryCount: 0 };
		case 'closed':
		case 'disconnected':
			return { status: 'waiting', connected: false, retryCount: 0 };
		default:
			return { status: 'offline', connected: false, retryCount: 0 };
	}
};

export const getConnectionStatus = (): ConnectionStatus => toConnectionStatus(getDdpSdk().connection.status);

export const disconnect = (): void => getDdpSdk().connection.close();

export const reconnect = (): void => {
	void ensureConnectedAndAuthenticated();
};

export const callMethod = (method: string, ...args: unknown[]): Promise<any> => getDdpSdk().client.callAsync(method, ...args);

export const callMethodWithoutResult = (method: string, ...args: unknown[]): void => {
	void getDdpSdk().client.callAsync(method, ...args);
};

export const hasPendingMethods = (): boolean => false;

// Frames only reach DDPSDK's own listeners; there is no second socket to tap.
export const onRawMessage = (_listener: (rawMessage: string) => void): void => undefined;

export const subscribeRaw = (name: string, ...args: unknown[]) => getDdpSdk().client.subscribe(name, ...args);
