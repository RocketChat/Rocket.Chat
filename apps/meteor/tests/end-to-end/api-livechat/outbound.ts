import { after, before, describe, it } from 'node:test';

import type { Credentials } from '@rocket.chat/api-client';
import type { IUser } from '@rocket.chat/core-typings';

import { getCredentials, api, request } from '../../data/api-data';
import { password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('Omnichannel - Outbound without outbound.send-messages', () => {
	let user: TestUser<IUser>;
	let userCredentials: Credentials;

	before((_t, done) => getCredentials(done));

	before(async () => {
		user = await createUser();
		userCredentials = await login(user.username, password);
	});

	after(() => deleteUser(user));

	it('should refuse omnichannel/outbound/providers', async () => {
		await request.get(api('omnichannel/outbound/providers')).set(userCredentials).expect(403);
	});

	it('should refuse omnichannel/outbound/providers/:id/metadata', async () => {
		await request.get(api('omnichannel/outbound/providers/any/metadata')).set(userCredentials).expect(403);
	});

	it('should refuse omnichannel/outbound/providers/:id/message', async () => {
		await request
			.post(api('omnichannel/outbound/providers/any/message'))
			.set(userCredentials)
			.send({ to: 'any', type: 'message', templateProviderPhoneNumber: 'any' })
			.expect(403);
	});
});
