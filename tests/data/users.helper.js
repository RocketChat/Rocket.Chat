import { api, credentials, request } from './api-data';
import { password } from './user';

export const createUser = () => new Promise((resolve) => {
	const username = `user.test.${ Date.now() }`;
	const email = `${ username }@rocket.chat`;
	request.post(api('users.create'))
		.set(credentials)
		.send({ email, name: username, username, password })
		.end((err, res) => resolve(res.body.user));
});

export const login = (username, password) => new Promise((resolve) => {
	request.post(api('login'))
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
