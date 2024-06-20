import type { Credentials } from '@rocket.chat/api-client';
import type { CallbackHandler, Response } from 'supertest';
import supertest from 'supertest';

import { privateChannelName } from './channel';
import { roleNameUsers, roleNameSubscriptions, roleScopeUsers, roleScopeSubscriptions, roleDescription } from './role';
import { username, email, adminUsername, adminPassword } from './user';

const apiUrl = process.env.TEST_API_URL || 'http://localhost:3000';

export const request = supertest(apiUrl);
const prefix = '/api/v1/';

export function wait(cb: () => void, time: number) {
	return () => setTimeout(cb, time);
}

export const apiUsername = `api${username}-${Date.now()}` as const;
export const apiEmail = `api${email}-${Date.now()}` as const;
export const apiPrivateChannelName = `api${privateChannelName}-${Date.now()}` as const;

export const apiRoleNameUsers = `api${roleNameUsers}` as const;
export const apiRoleNameSubscriptions = `api${roleNameSubscriptions}` as const;
export const apiRoleScopeUsers = `${roleScopeUsers}` as const;
export const apiRoleScopeSubscriptions = `${roleScopeSubscriptions}` as const;
export const apiRoleDescription = `api${roleDescription}` as const;
export const reservedWords = ['admin', 'administrator', 'system', 'user'] as const;

export const group = {};
export const message = {};
export const directMessage = {};
export const integration = {};

export const credentials: Credentials = {
	'X-Auth-Token': undefined as unknown as string, // FIXME
	'X-User-Id': undefined as unknown as string, // FIXME
};
export const login = {
	user: adminUsername,
	password: adminPassword,
} as const;

export function api<TPath extends string>(path: TPath) {
	return `${prefix}${path}` as const;
}

export function methodCall<TMethodName extends string>(methodName: TMethodName) {
	return api(`method.call/${methodName}`);
}

export function log(res: Response) {
	console.log((res as { req?: any }).req.path); // FIXME
	console.log({
		body: res.body,
		headers: res.headers,
	});
}

export function getCredentials(done?: CallbackHandler) {
	void request
		.post(api('login'))
		.send(login)
		.expect('Content-Type', 'application/json')
		.expect(200)
		.expect((res) => {
			credentials['X-Auth-Token'] = res.body.data.authToken;
			credentials['X-User-Id'] = res.body.data.userId;
		})
		.end(done);
}
