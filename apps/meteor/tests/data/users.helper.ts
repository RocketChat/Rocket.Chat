import type { Credentials } from '@rocket.chat/api-client';
import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import supertest from 'supertest';
import type { Response } from 'supertest';

import { api, credentials, methodCall, request } from './api-data';
import { password } from './user';

export type TestUser<TUser extends IUser> = TUser & { username: string; emails: string[] };

/**
 * Configuration interface for custom request handling.
 *
 * Provides a way to override the default request instance and credentials
 * for testing scenarios that require custom domains or authentication.
 */
export interface IRequestConfig {
	credentials: Credentials;
	request: ReturnType<typeof supertest>;
}

/**
 * Creates a request configuration for a specific domain.
 *
 * Sets up a new request instance and authenticates with the specified
 * domain, user, and password. This is essential for federation testing
 * where multiple Rocket.Chat instances need to be accessed.
 *
 * @param domain - The base URL of the Rocket.Chat instance
 * @param user - The username for authentication
 * @param password - The password for authentication
 * @returns Promise resolving to request configuration with credentials
 */
export async function getRequestConfig(domain: string, user: string, password: string): Promise<IRequestConfig> {
	const request = supertest(domain);
	const credentials = await login(user, password, { request, credentials: {} as Credentials });

	return {
		credentials,
		request,
	};
}

export const createUser = <TUser extends IUser>(
	userData: {
		username?: string;
		email?: string;
		roles?: string[];
		active?: boolean;
		joinDefaultChannels?: boolean;
		verified?: boolean;
		requirePasswordChange?: boolean;
		name?: string;
		password?: string;
		freeSwitchExtension?: string;
		bio?: string;
		nickname?: string;
	} = {},
	config?: IRequestConfig,
) =>
	new Promise<TestUser<TUser>>((resolve, reject) => {
		const username = userData.username || `user.test.${Date.now()}.${Math.random()}`;
		const email = userData.email || `${username}@rocket.chat`;
		const requestInstance = config?.request || request;
		const credentialsInstance = config?.credentials || credentials;

		void requestInstance
			.post(api('users.create'))
			.set(credentialsInstance)
			.send({ email, name: username, username, password, ...userData })
			.end((err: unknown, res: Response) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body.user);
			});
	});

export const login = (username: string | undefined, password: string, config?: IRequestConfig): Promise<Credentials> =>
	new Promise((resolve) => {
		const requestInstance = config?.request || request;
		void requestInstance
			.post(api('login'))
			.send({
				user: username,
				password,
			})
			.end((_err: unknown, res: Response) => {
				resolve({
					'X-Auth-Token': res.body.data.authToken,
					'X-User-Id': res.body.data.userId,
				});
			});
	});

export const deleteUser = async (user: Pick<IUser, '_id'>, extraData = {}, config?: IRequestConfig) => {
	const requestInstance = config?.request || request;
	const credentialsInstance = config?.credentials || credentials;
	return requestInstance
		.post(api('users.delete'))
		.set(credentialsInstance)
		.send({
			userId: user._id,
			...extraData,
		});
};

export const getUserByUsername = <TUser extends IUser>(username: string, config?: IRequestConfig) =>
	new Promise<TestUser<TUser>>((resolve) => {
		const requestInstance = config?.request || request;
		const credentialsInstance = config?.credentials || credentials;

		void requestInstance
			.get(api('users.info'))
			.query({ username })
			.set(credentialsInstance)
			.end((_err: unknown, res: Response) => {
				resolve(res.body.user);
			});
	});

export const getMe = <TUser extends IUser>(overrideCredential = credentials, config?: IRequestConfig) =>
	new Promise<TestUser<TUser>>((resolve) => {
		const requestInstance = config?.request || request;
		const credentialsInstance = config?.credentials || overrideCredential;
		void requestInstance
			.get(api('me'))
			.set(credentialsInstance)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.end((_end: unknown, res: Response) => {
				resolve(res.body);
			});
	});

export const setUserActiveStatus = (userId: IUser['_id'], activeStatus = true, config?: IRequestConfig) =>
	new Promise((resolve) => {
		const requestInstance = config?.request || request;
		const credentialsInstance = config?.credentials || credentials;

		void requestInstance
			.post(api('users.setActiveStatus'))
			.set(credentialsInstance)
			.send({
				userId,
				activeStatus,
			})
			.end(resolve);
	});

export const setUserStatus = (overrideCredentials = credentials, status = UserStatus.ONLINE, config?: IRequestConfig) => {
	const requestInstance = config?.request || request;
	return requestInstance.post(api('users.setStatus')).set(overrideCredentials).send({
		message: '',
		status,
	});
};

export const setUserAway = (overrideCredentials = credentials, config?: IRequestConfig) => {
	const requestInstance = config?.request || request;
	return requestInstance
		.post(methodCall('UserPresence:away'))
		.set(overrideCredentials)
		.send({
			message: JSON.stringify({
				method: 'UserPresence:away',
				params: [],
				id: 'id',
				msg: 'method',
			}),
		});
};

const connectWS = (port: string): Promise<WebSocket> =>
	new Promise((resolve, reject) => {
		const ws = new WebSocket(`ws://localhost:${port}/websocket`);

		ws.onopen = () => {
			ws.addEventListener('message', (event: MessageEvent) => {
				const data = JSON.parse(event.data);
				if (data.msg === 'ping') {
					ws.send(JSON.stringify({ msg: 'pong' }));
				}
			});
			resolve(ws);
		};
		ws.onerror = () => reject(new Error(`WS connection failed on ${port}`));
	});

const waitForDDP = (ws: WebSocket, id: string | 'handshake', stringifiedJsonPayload: string): Promise<any> => {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			cleanup();
			ws.close();
			reject(new Error(`Timeout waiting for DDP id: ${id}`));
		}, 5000);

		const cleanup = () => {
			clearTimeout(timeout);
			ws.removeEventListener('message', handler);
			ws.removeEventListener('close', onClose);
			ws.removeEventListener('error', onError);
		};

		const onClose = () => {
			cleanup();
			reject(new Error(`WS closed while waiting for id: ${id}`));
		};

		const onError = (error: any) => {
			cleanup();
			ws.close();
			reject(error || new Error(`WS error during operation id: ${id}`));
		};

		const handler = (event: MessageEvent) => {
			try {
				const data = JSON.parse(event.data);
				const isHandshake = id === 'handshake' && data.msg === 'connected';
				const isResult = data.id === id && (data.msg === 'result' || data.msg === 'error');

				if (isHandshake || isResult) {
					cleanup();
					if (data.error) {
						ws.close();
						return reject(data.error);
					}
					resolve(data);
				}
			} catch (e) {
				// Ignore no JSON message
			}
		};

		ws.addEventListener('message', handler);
		ws.addEventListener('close', onClose);
		ws.addEventListener('error', onError);

		ws.send(stringifiedJsonPayload);
	});
};

export const ddpLogin = async (resume: string): Promise<WebSocket> => {
	const ws = await connectWS(process.env.DDP_LOGIN_PORT || '3000');
	const loginId = `login-${Date.now()}`;

	await waitForDDP(ws, 'handshake', JSON.stringify({ msg: 'connect', version: '1', support: ['1'] }));

	await waitForDDP(ws, loginId, JSON.stringify({ msg: 'method', id: loginId, method: 'login', params: [{ resume }] }));

	return ws;
};

export const setUserAwayWS = async (ws: WebSocket): Promise<void> => {
	const id = `away-${Date.now()}`;

	await waitForDDP(ws, id, JSON.stringify({ msg: 'method', method: 'UserPresence:away', params: [], id }));
};

export const setUserOnline = (overrideCredentials = credentials, config?: IRequestConfig) => {
	const requestInstance = config?.request || request;
	return requestInstance
		.post(methodCall('UserPresence:online'))
		.set(overrideCredentials)
		.send({
			message: JSON.stringify({
				method: 'UserPresence:online',
				params: [],
				id: 'id',
				msg: 'method',
			}),
		});
};

export const removeRoleFromUser = (username: string, roleId: string, overrideCredentials = credentials, config?: IRequestConfig) =>
	getUserByUsername(username, config).then((user) => {
		const requestInstance = config?.request || request;
		return requestInstance
			.post(api('users.update'))
			.set(overrideCredentials)
			.send({
				userId: user._id,
				data: { roles: user.roles.filter((role) => role !== roleId) },
			})
			.expect(200);
	});
