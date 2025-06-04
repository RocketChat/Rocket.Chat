import { faker } from '@faker-js/faker';
import type { APIResponse } from '@playwright/test';
import type { IUser } from '@rocket.chat/core-typings';

import type { BaseTest } from './test';
import { DEFAULT_USER_CREDENTIALS } from '../config/constants';

export interface ICreateUserOptions {
	username?: string;
	email?: string;
	name?: string;
	password?: string;
	roles?: string[];
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
