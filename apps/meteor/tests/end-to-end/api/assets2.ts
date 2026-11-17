import { after, before, describe, it } from 'node:test';

import type { Credentials } from '@rocket.chat/api-client';
import type { IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { imgURL } from '../../data/interactions';
import { updatePermission } from '../../data/permissions.helper';
import { password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login } from '../../data/users.helper';

describe('[Assets]', () => {
	before((_t, done) => getCredentials(done));

	before(() => updatePermission('manage-assets', ['admin']));

	after(() => updatePermission('manage-assets', ['admin']));

	describe('[/assets.setAsset]', () => {
		it('should set the "logo" asset', async () => {
			const res = await request
				.post(api('assets.setAsset'))
				.set(credentials)
				.attach('asset', imgURL)
				.field({
					assetName: 'logo',
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
		});

		it('should throw an error when we try set an invalid asset', async () => {
			const res = await request
				.post(api('assets.setAsset'))
				.set(credentials)
				.attach('invalidAsset', imgURL)
				.expect('Content-Type', 'application/json')
				.expect(400);

			expect(res.body).to.have.property('success', false);
		});
	});

	describe('[/assets.unsetAsset]', () => {
		it('should unset the "logo" asset', async () => {
			const res = await request
				.post(api('assets.unsetAsset'))
				.set(credentials)
				.send({
					assetName: 'logo',
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
		});

		it('should throw an error when we try set an invalid asset', async () => {
			const res = await request
				.post(api('assets.unsetAsset'))
				.set(credentials)
				.send({
					assetName: 'invalidAsset',
				})
				.expect('Content-Type', 'application/json')
				.expect(400);

			expect(res.body).to.have.property('success', false);
		});
	});

	describe('without manage-assets', () => {
		let user: TestUser<IUser>;
		let userCredentials: Credentials;

		before(async () => {
			user = await createUser();
			userCredentials = await login(user.username, password);
		});

		after(() => deleteUser(user));

		it('should refuse assets.setAsset and keep the logo', async () => {
			const previous = await request.get(api('settings/Assets_logo')).set(credentials).expect(200);

			await request.post(api('assets.setAsset')).set(userCredentials).attach('asset', imgURL).field({ assetName: 'logo' }).expect(403);

			const current = await request.get(api('settings/Assets_logo')).set(credentials).expect(200);
			expect(current.body.value).to.deep.equal(previous.body.value);
		});

		it('should refuse assets.unsetAsset', async () => {
			await request.post(api('assets.unsetAsset')).set(userCredentials).send({ assetName: 'logo' }).expect(403);
		});
	});
});
