import type { Credentials } from '@rocket.chat/api-client';
import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';

import { api, credentials, methodCall, request, type RequestConfig } from './api-data';
import { password } from './user';

export type TestUser<TUser extends IUser> = TUser & { username: string; emails: string[] };

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
	} = {},
	config?: RequestConfig
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
			.end((err: any, res: any) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body.user);
			});
	});

export const login = (
	username: string | undefined, 
	password: string,
	config?: RequestConfig
): Promise<Credentials> =>
	new Promise((resolve) => {
		const requestInstance = config?.request || request;
		void requestInstance
			.post(api('login'))
			.send({
				user: username,
				password,
			})
			.end((_err: any, res: any) => {
				resolve({
					'X-Auth-Token': res.body.data.authToken,
					'X-User-Id': res.body.data.userId,
				});
			});
	});

export const deleteUser = async (
	user: Pick<IUser, '_id'>, 
	extraData = {},
	config?: RequestConfig
) => {
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

export const getUserByUsername = <TUser extends IUser>(
	username: string,
	config?: RequestConfig
) =>
	new Promise<TestUser<TUser>>((resolve) => {
		const requestInstance = config?.request || request;
		const credentialsInstance = config?.credentials || credentials;
		
		void requestInstance
			.get(api('users.info'))
			.query({ username })
			.set(credentialsInstance)
			.end((_err: any, res: any) => {
				resolve(res.body.user);
			});
	});

export const getMe = <TUser extends IUser>(
	overrideCredential = credentials,
	config?: RequestConfig
) =>
	new Promise<TestUser<TUser>>((resolve) => {
		const requestInstance = config?.request || request;
		void requestInstance
			.get(api('me'))
			.set(overrideCredential)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.end((_end: any, res: any) => {
				resolve(res.body);
			});
	});

export const setUserActiveStatus = (
	userId: IUser['_id'], 
	activeStatus = true,
	config?: RequestConfig
) =>
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

export const setUserStatus = (
	overrideCredentials = credentials, 
	status = UserStatus.ONLINE,
	config?: RequestConfig
) => {
	const requestInstance = config?.request || request;
	return requestInstance.post(api('users.setStatus')).set(overrideCredentials).send({
		message: '',
		status,
	});
};

export const setUserAway = (
	overrideCredentials = credentials,
	config?: RequestConfig
) => {
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

export const setUserOnline = (
	overrideCredentials = credentials,
	config?: RequestConfig
) => {
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

export const removeRoleFromUser = (
	username: string, 
	roleId: string, 
	overrideCredentials = credentials,
	config?: RequestConfig
) =>
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
