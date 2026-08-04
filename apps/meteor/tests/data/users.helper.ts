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
