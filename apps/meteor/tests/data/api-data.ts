import type { Credentials } from '@rocket.chat/api-client';
import type { Path } from '@rocket.chat/rest-typings';
import type { CallbackHandler, Response } from 'supertest';
import supertest from 'supertest';

import { adminUsername, adminPassword } from './user';

const apiUrl = process.env.TEST_API_URL || 'http://localhost:3000';

export const request = supertest(apiUrl);
const prefix = '/api/v1/';

export function wait(cb: () => void, time: number) {
	return () => setTimeout(cb, time);
}

const privateChannelName = `private-channel-test-${Date.now()}` as const;

const username = 'user.test';
const email = `${username}@rocket.chat`;

export const apiUsername = `api${username}-${Date.now()}` as const;
export const apiEmail = `api${email}-${Date.now()}` as const;
export const apiPrivateChannelName = `api${privateChannelName}-${Date.now()}` as const;

const roleNameUsers = `role-name-test-users-${Date.now()}` as const;
const roleNameSubscriptions = `role-name-test-subscriptions-${Date.now()}` as const;
const roleScopeUsers = 'Users' as const;
const roleScopeSubscriptions = 'Subscriptions' as const;
const roleDescription = `role-description-test-${Date.now()}` as const;

export const apiRoleNameUsers = `api${roleNameUsers}` as const;
export const apiRoleNameSubscriptions = `api${roleNameSubscriptions}` as const;
export const apiRoleScopeUsers = `${roleScopeUsers}` as const;
export const apiRoleScopeSubscriptions = `${roleScopeSubscriptions}` as const;
export const apiRoleDescription = `api${roleDescription}` as const;
export const reservedWords = ['admin', 'administrator', 'system', 'user'] as const;

export const credentials: Credentials = {
	'X-Auth-Token': undefined,
	'X-User-Id': undefined,
} as unknown as Credentials; // FIXME

type PathWithoutPrefix<TPath> = TPath extends `/v1/${infer U}` ? U : never;

export function api<TPath extends PathWithoutPrefix<Path>>(path: TPath) {
	return `${prefix}${path}` as const;
}

export function methodCall<TMethodName extends string>(methodName: TMethodName) {
	return api(`method.call/${methodName}`);
}

export function methodCallAnon<TMethodName extends string>(methodName: TMethodName) {
	return api(`method.callAnon/${methodName}`);
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
		.send({
			user: adminUsername,
			password: adminPassword,
		})
		.expect('Content-Type', 'application/json')
		.expect(200)
		.expect((res) => {
			credentials['X-Auth-Token'] = res.body.data.authToken;
			credentials['X-User-Id'] = res.body.data.userId;
		})
		.end(done);
}
