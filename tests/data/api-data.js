import {publicChannelName, privateChannelName} from '../data/channel.js';
import {username, email, adminUsername, adminPassword} from '../data/user.js';
import supertest from 'supertest';
export const request = supertest('http://localhost:3000');
const prefix = '/api/v1/';

export const apiUsername = `api${ username }`;
export const apiEmail = `api${ email }`;
export const apiPublicChannelName= `api${ publicChannelName }`;
export const apiPrivateChannelName = `api${ privateChannelName }`;

export const targetUser = {};
export const channel = {};
export const group = {};
export const message = {};
export const directMessage = {};
export const integration = {};
export const credentials = {
	['X-Auth-Token']: undefined,
	['X-User-Id']: undefined
};
export const login = {
	user: adminUsername,
	password: adminPassword
};

export function api(path) {
	return prefix + path;
}

export function log(res) {
	console.log(res.req.path);
	console.log({
		body: res.body,
		headers: res.headers
	});
}

export function getCredentials(done = function() {}) {
	request.post(api('login'))
		.send(login)
		.expect('Content-Type', 'application/json')
		.expect(200)
		.expect((res) => {
			credentials['X-Auth-Token'] = res.body.data.authToken;
			credentials['X-User-Id'] = res.body.data.userId;
		})
		.end(done);
}

