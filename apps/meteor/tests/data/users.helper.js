import { UserStatus } from '@rocket.chat/core-typings';
import { api, credentials, request } from './api-data';
import { password } from './user';

export const createUser = (userData = {}) =>
	new Promise((resolve) => {
		const username = userData.username || `user.test.${Date.now()}`;
		const email = userData.email || `${username}@rocket.chat`;
		request
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

export const login = (username, password) =>
	new Promise((resolve) => {
		request
			.post(api('login'))
			.send({
				user: username,
				password,
			})
			.end((err, res) => {
				const userCredentials = {};
				userCredentials['X-Auth-Token'] = res.body.data.authToken;
				userCredentials['X-User-Id'] = res.body.data.userId;
				resolve(userCredentials);
			});
	});

export const deleteUser = async (user, extraData = {}) =>
	request
		.post(api('users.delete'))
		.set(credentials)
		.send({
			userId: user._id,
			...extraData,
		});

export const getUserByUsername = (username) =>
	new Promise((resolve) => {
		request
			.get(api(`users.info?username=${username}`))
			.set(credentials)
			.end((err, res) => {
				resolve(res.body.user);
			});
	});

export const getUserStatus = (userId) =>
	new Promise((resolve) => {
		request
			.get(api(`users.getStatus?userId=${userId}`))
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.end((end, res) => {
				resolve(res.body);
			});
	});

export const getMe = (overrideCredential = credentials) =>
	new Promise((resolve) => {
		request
			.get(api('me'))
			.set(overrideCredential)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.end((end, res) => {
				resolve(res.body);
			});
	});

export const setUserActiveStatus = (userId, activeStatus = true) =>
	new Promise((resolve) => {
		request
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

export const registerUser = async (userData = {}, overrideCredentials = credentials) => {
	const username = userData.username || `user.test.${Date.now()}`;
	const email = userData.email || `${username}@rocket.chat`;
	const result = await request
		.post(api('users.register'))
		.set(overrideCredentials)
		.send({ email, name: username, username, pass: password, ...userData });

	return result.body.user;
};
