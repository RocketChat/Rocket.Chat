import { api, credentials, request } from './api-data';
import { password } from './user';

export const createUser = (userData = {}) =>
	new Promise((resolve) => {
		const username = `user.test.${Date.now()}`;
		const email = `${username}@rocket.chat`;
		request
			.post(api('users.create'))
			.set(credentials)
			.send({ email, name: username, username, password, ...userData })
			.end((err, res) => resolve(res.body.user));
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

export const deleteUser = (user) =>
	new Promise((resolve) => {
		request
			.post(api('users.delete'))
			.set(credentials)
			.send({
				userId: user._id,
			})
			.end(resolve);
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
