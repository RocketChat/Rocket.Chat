import {
	getCredentials,
	api,
	login,
	request,
	credentials,
} from '../data/api-data.js';

export const createUser = (done = function() {}) => {
	const username = `user.test.${Date.now()}`;
	const email = `${username}@rocket.chat`;

	request
		.post(api('users.create'))
		.set(credentials)
		.send({ email, name: username, username, password })
		.end((err, res) => {
			user = res.body.user;
			done();
		});
};
