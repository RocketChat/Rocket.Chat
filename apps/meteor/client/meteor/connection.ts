// The client's method and subscription transport: DDPSDK and the REST method bridge, with no Meteor connection.
import { Random } from '@rocket.chat/random';

import { process2faAsyncReturn } from '../lib/2fa/process2faReturn';
import { APIClient } from '../lib/RestApiClient';
import { parseDDP, stringifyDDP } from '../lib/sdk/ddpProtocol';
import { getDdpSdk } from '../lib/sdk/ddpSdk';
import { getUserId } from '../lib/user';

export type ConnectionStatus = {
	status: 'connected' | 'connecting' | 'failed' | 'waiting' | 'offline';
	connected: boolean;
	retryCount: number;
	retryTime?: number;
};

const toStatus = (status: string): Pick<ConnectionStatus, 'status' | 'connected'> => {
	switch (status) {
		case 'connected':
			return { status: 'connected', connected: true };
		case 'connecting':
		case 'reconnecting':
			return { status: 'connecting', connected: false };
		case 'failed':
			return { status: 'failed', connected: false };
		case 'closed':
		case 'disconnected':
			return { status: 'waiting', connected: false };
		default:
			return { status: 'offline', connected: false };
	}
};

export const getConnectionStatus = (): ConnectionStatus => {
	const { connection } = getDdpSdk();
	return { ...toStatus(connection.status), retryCount: connection.retryCount, retryTime: connection.nextRetryAt };
};

// ServerProvider closes and reconnects DDPSDK itself.
export const disconnect = (): void => undefined;

export const reconnect = (): void => undefined;

// Deployments behind ddp-streamer only answer these over the socket; every other method goes through the
// REST method bridge.
const isSocketMethod = (method: string, args: unknown[]): boolean =>
	method === 'logout' ||
	method === 'setUserStatus' ||
	method.startsWith('UserPresence:') ||
	method.startsWith('stream-') ||
	(method === 'login' && Boolean((args[0] as { resume?: string } | undefined)?.resume));

const unwrapMethodResult = (message: string): unknown => {
	const response = parseDDP(message) as { error?: unknown; result?: unknown };
	if (response.error) {
		throw response.error;
	}
	return response.result;
};

const callOverREST = async (method: string, params: unknown[]): Promise<any> => {
	const endpoint = !getUserId() || method === 'login' ? 'method.callAnon' : 'method.call';

	let body: { message?: unknown };
	try {
		body = await APIClient.post(`/v1/${endpoint}/${encodeURIComponent(method.replace(/\//g, ':'))}` as any, {
			message: stringifyDDP({ msg: 'method', id: Random.id(), method, params }),
		});
	} catch (error) {
		// Method errors (e.g. totp-required) come back as a 400 whose body still carries the DDP result frame.
		const message = (error as { message?: unknown })?.message;
		if (typeof message !== 'string' || !message.startsWith('{')) throw error;
		body = { message };
	}

	if (typeof body.message !== 'string') {
		throw body;
	}
	return unwrapMethodResult(body.message);
};

let pendingMethods = 0;

// Only the calls themselves count as pending; waiting for the user to enter a second factor does not.
const callMethodOnce = async (method: string, args: unknown[]): Promise<any> => {
	pendingMethods++;
	try {
		return await (isSocketMethod(method, args) ? getDdpSdk().client.callAsync(method, ...args) : callOverREST(method, args));
	} finally {
		pendingMethods--;
	}
};

export const callMethod = async (method: string, ...args: unknown[]): Promise<any> => {
	try {
		return await callMethodOnce(method, args);
	} catch (error) {
		// Methods guarded by a second factor retry with the code the user enters; login answers its own challenge.
		if (method === 'login') throw error;
		return process2faAsyncReturn({
			error,
			onCode: (twoFactorCode, twoFactorMethod) => callMethodOnce(method, [...args, { twoFactorCode, twoFactorMethod }]),
			emailOrUsername: undefined,
		});
	}
};

export const callMethodWithoutResult = (method: string, ...args: unknown[]): void => {
	void callMethod(method, ...args).catch((error) => console.warn(`[connection] ${method} failed`, error));
};

export const hasPendingMethods = (): boolean => pendingMethods !== 0;

// Frames only reach DDPSDK's own listeners; there is no second socket to tap.
export const onRawMessage = (_listener: (rawMessage: string) => void): void => undefined;

export const subscribeRaw = (name: string, ...args: unknown[]) => getDdpSdk().client.subscribe(name, ...args);

/** The server's id for the connection this client is logged in on, which session-targeted events name. */
export const getConnectionSessionId = (): string | undefined => getDdpSdk().connection.session;

window.__rocketChatCallMethod = callMethod;
