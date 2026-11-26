import { after, before, describe, it } from 'node:test';

import type { Credentials } from '@rocket.chat/api-client';
import type { IUser } from '@rocket.chat/core-typings';

import { getCredentials, api, request } from '../../data/api-data';
import { password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('[Sessions] without device management permissions', () => {
	let user: TestUser<IUser>;
	let userCredentials: Credentials;

	before((_t, done) => getCredentials(done));

	before(async () => {
		user = await createUser();
		userCredentials = await login(user.username, password);
	});

	after(() => deleteUser(user));

	it('should refuse sessions/list.all', async () => {
		await request.get(api('sessions/list.all')).set(userCredentials).expect(403);
	});

	it('should refuse sessions/info.admin', async () => {
		await request.get(api('sessions/info.admin')).set(userCredentials).query({ sessionId: 'any' }).expect(403);
	});

	it('should refuse sessions/logout', async () => {
		await request.post(api('sessions/logout')).set(userCredentials).send({ sessionId: 'any' }).expect(403);
	});
});
