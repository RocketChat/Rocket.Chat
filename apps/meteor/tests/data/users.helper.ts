import type { Credentials } from '@rocket.chat/api-client';
import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';

import { api, credentials, methodCall, request } from './api-data';
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
	} = {},
) =>
	new Promise<TestUser<TUser>>((resolve, reject) => {
		const username = userData.username || `user.test.${Date.now()}.${Math.random()}`;
		const email = userData.email || `${username}@rocket.chat`;
		void request
			.post(api('users.create'))
			.set(credentials)
			.send({ email, name: username, username, password, ...userData })
			.end((err, res) => {
				if (err) {
					return reject(err);
				}
				resolve(res.body.user);
			});
	});

export const login = (username: string | undefined, password: string): Promise<Credentials> =>
	new Promise((resolve) => {
		void request
			.post(api('login'))
			.send({
				user: username,
				password,
			})
			.end((_err, res) => {
				resolve({
					'X-Auth-Token': res.body.data.authToken,
					'X-User-Id': res.body.data.userId,
				});
			});
	});

export const deleteUser = async (user: Pick<IUser, '_id'>, extraData = {}) =>
	request
		.post(api('users.delete'))
		.set(credentials)
		.send({
			userId: user._id,
			...extraData,
		});

export const getUserByUsername = <TUser extends IUser>(username: string) =>
	new Promise<TestUser<TUser>>((resolve) => {
		void request
			.get(api('users.info'))
			.query({ username })
			.set(credentials)
			.end((_err, res) => {
				resolve(res.body.user);
			});
	});

export const getMe = <TUser extends IUser>(overrideCredential = credentials) =>
	new Promise<TestUser<TUser>>((resolve) => {
		void request
			.get(api('me'))
			.set(overrideCredential)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.end((_end, res) => {
				resolve(res.body);
			});
	});

export const setUserActiveStatus = (userId: IUser['_id'], activeStatus = true) =>
	new Promise((resolve) => {
		void request
			.post(api('users.setActiveStatus'))
			.set(credentials)
			.send({
				userId,
				activeStatus,
			})
			.end(resolve);
	});

export const setUserStatus = (overrideCredentials = credentials, status = UserStatus.ONLINE) =>
	request.post(api('users.setStatus')).set(overrideCredentials).send({
		message: '',
		status,
	});

export const setUserAway = (overrideCredentials = credentials) =>
	request
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

export const setUserOnline = (overrideCredentials = credentials) =>
	request
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
