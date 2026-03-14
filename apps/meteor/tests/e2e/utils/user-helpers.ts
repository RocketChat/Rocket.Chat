import { faker } from '@faker-js/faker';
import type { APIResponse } from '@playwright/test';
import type { IUser } from '@rocket.chat/core-typings';

import type { BaseTest } from './test';
import { BASE_URL, DEFAULT_USER_CREDENTIALS } from '../config/constants';
import type { IUserState } from '../fixtures/userStates';

export interface ICreateUserOptions {
	username?: string;
	email?: string;
	name?: string;
	password?: string;
	roles?: string[];
	data?: Record<string, any>;
}

export interface ITestUser {
	response: APIResponse;
	data: IUser & { username: string };
	deleted: boolean;
	delete: () => Promise<APIResponse | undefined>;
	markAsDeleted: () => void;
}

/**
 * Creates a test user with optional customizations
 */
export async function createTestUser(api: BaseTest['api'], options: ICreateUserOptions = {}): Promise<ITestUser> {
	const userData = {
		email: options.email || faker.internet.email(),
		name: options.name || faker.person.fullName(),
		password: options.password || DEFAULT_USER_CREDENTIALS.password,
		username: options.username || `test-user-${faker.string.uuid()}`,
		roles: options.roles || ['user'],
		...options.data,
	};

	const response = await api.post('/users.create', userData);

	if (response.status() !== 200) {
		throw new Error(`Failed to create user: ${response.status()}, response: ${await response.text()}`);
	}

	const { user } = await response.json();

	return {
		response,
		data: user,
		deleted: false,
		markAsDeleted(this: ITestUser) {
			this.deleted = true;
		},
		async delete(this: ITestUser) {
			if (this.deleted) {
				return;
			}

			const response = await api.post('/users.delete', { userId: user._id });
			this.markAsDeleted();
			return response;
		},
	};
}

/**
 * Logs in a test user via the REST API and returns an IUserState
 * suitable for use with createAuxContext.
 *
 * Use this instead of the pre-baked Users.userN fixtures whenever the test
 * will deactivate (or otherwise invalidate the session of) the user, so that
 * shared fixture tokens are never corrupted.
 */
export async function loginTestUser(api: BaseTest['api'], user: ITestUser): Promise<IUserState> {
	const response = await api.post('/login', {
		username: user.data.username,
		password: DEFAULT_USER_CREDENTIALS.password,
	});
	const {
		data: { userId, authToken },
	} = await response.json();

	const expires = new Date();
	expires.setFullYear(expires.getFullYear() + 1);

	return {
		data: {
			_id: userId,
			username: user.data.username,
			loginToken: authToken,
			loginExpire: expires,
			hashedToken: '',
		},
		state: {
			cookies: [
				{ sameSite: 'Lax', name: 'rc_uid', value: userId, domain: 'localhost', path: '/', expires: -1, httpOnly: false, secure: false },
				{
					sameSite: 'Lax',
					name: 'rc_token',
					value: authToken,
					domain: 'localhost',
					path: '/',
					expires: -1,
					httpOnly: false,
					secure: false,
				},
			],
			origins: [
				{
					origin: BASE_URL,
					localStorage: [
						{ name: 'userLanguage', value: 'en-US' },
						{ name: 'Meteor.loginToken', value: authToken },
						{ name: 'Meteor.loginTokenExpires', value: expires.toISOString() },
						{ name: 'Meteor.userId', value: userId },
					],
				},
			],
		},
	};
}

/**
 * Creates multiple test users at once
 */
export async function createTestUsers(api: BaseTest['api'], count: number, options: ICreateUserOptions = {}): Promise<ITestUser[]> {
	const promises = Array.from({ length: count }, (_, i) =>
		createTestUser(api, {
			...options,
			username: options.username ? `${options.username}-${i + 1}` : undefined,
		}),
	);

	return Promise.all(promises);
}
