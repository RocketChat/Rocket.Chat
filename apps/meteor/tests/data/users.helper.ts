import type { Credentials } from '@rocket.chat/api-client';
import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { MongoClient } from 'mongodb';

import { URL_MONGODB } from '../e2e/config/constants';
import { api, credentials, request } from './api-data';
import { password } from './user';

export type TestUser<TUser extends IUser> = TUser & { username: string; emails: string[] };

export const createUser = <TUser extends IUser>(
	userData: {
		username?: string;
		email?: string;
		roles?: string[];
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

export const deleteUser = async (user: IUser, extraData = {}) =>
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
			.get(api(`users.info?username=${username}`))
			.set(credentials)
			.end((_err, res) => {
				resolve(res.body.user);
			});
	});

export const getUserStatus = (userId: IUser['_id']) =>
	new Promise((resolve) => {
		void request
			.get(api(`users.getStatus?userId=${userId}`))
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.end((_end, res) => {
				resolve(res.body);
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

export const registerUser = async (
	userData: {
		username?: string;
		email?: string;
	} = {},
	overrideCredentials = credentials,
) => {
	const username = userData.username || `user.test.${Date.now()}`;
	const email = userData.email || `${username}@rocket.chat`;
	const result = await request
		.post(api('users.register'))
		.set(overrideCredentials)
		.send({ email, name: username, username, pass: password, ...userData });

	return result.body.user;
};

// For changing user data when it's not possible to do so via API
export const updateUserInDb = async (userId: IUser['_id'], userData: Partial<IUser>) => {
	const connection = await MongoClient.connect(URL_MONGODB);

	await connection
		.db()
		.collection('users')
		.updateOne({ _id: userId }, { $set: { ...userData } });

	await connection.close();
};
