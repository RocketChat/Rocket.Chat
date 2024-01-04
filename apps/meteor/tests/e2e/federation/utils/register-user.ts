import { faker } from '@faker-js/faker';

import * as constants from '../config/constants';
import type { API } from './test';

export async function registerUser(api: API): Promise<string> {
	const username = faker.string.uuid();

	await api.post('/users.register', {
		username,
		email: `${username}@test-rc.com`,
		pass: constants.RC_SERVER_2.password,
		name: username,
	});

	return username;
}
