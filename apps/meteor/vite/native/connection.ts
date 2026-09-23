// Vite-build implementation of client/meteor/connection.ts: DDPSDK is the only transport.
import { Random } from '@rocket.chat/random';

import { APIClient } from '../../client/lib/RestApiClient';
import { parseDDP, stringifyDDP } from '../../client/lib/sdk/ddpProtocol';
import { ensureConnectedAndAuthenticated, getDdpSdk } from '../../client/lib/sdk/ddpSdk';
import { getUserId } from '../../client/lib/user';
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

// Deployments behind ddp-streamer only answer these over the socket; every other method goes through the
// REST method bridge, which is also how the Meteor build routes them (client/meteor/overrides/ddpOverREST).
const isSocketMethod = (method: string, args: unknown[]): boolean =>
	method === 'logout' ||
	method === 'setUserStatus' ||
	method.startsWith('UserPresence:') ||
	method.startsWith('stream-') ||
	(method === 'login' && Boolean((args[0] as { resume?: string } | undefined)?.resume));

const callOverREST = async (method: string, params: unknown[]): Promise<any> => {
	const endpoint = !getUserId() || method === 'login' ? 'method.callAnon' : 'method.call';
	const { message } = (await APIClient.post(`/v1/${endpoint}/${encodeURIComponent(method.replace(/\//g, ':'))}` as any, {
		message: stringifyDDP({ msg: 'method', id: Random.id(), method, params }),
	})) as { message: string };

	const response = parseDDP(message) as { error?: unknown; result?: unknown };
	if (response.error) {
		throw response.error;
	}
	return response.result;
};

export const callMethod = (method: string, ...args: unknown[]): Promise<any> =>
	isSocketMethod(method, args) ? getDdpSdk().client.callAsync(method, ...args) : callOverREST(method, args);

export const callMethodWithoutResult = (method: string, ...args: unknown[]): void => {
	void callMethod(method, ...args).catch((error) => console.warn(`[connection] ${method} failed`, error));
};

export const hasPendingMethods = (): boolean => false;

// Frames only reach DDPSDK's own listeners; there is no second socket to tap.
export const onRawMessage = (_listener: (rawMessage: string) => void): void => undefined;

export const subscribeRaw = (name: string, ...args: unknown[]) => getDdpSdk().client.subscribe(name, ...args);
