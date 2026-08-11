import type { Credentials } from '@rocket.chat/api-client';
import type { IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, getMe, login, updateUserInDb } from '../../data/users.helper';

describe('banners', () => {
	before((done) => getCredentials(done));

	describe('[/banners.dismiss]', () => {
		it('should fail if not logged in', async () => {
			const res = await request
				.post(api('banners.dismiss'))
				.send({
					bannerId: '123',
				})
				.expect(401);

			expect(res.body).to.have.property('status', 'error');
			expect(res.body).to.have.property('message');
		});

		it('should fail if missing bannerId key', async () => {
			const res = await request.post(api('banners.dismiss')).set(credentials).send({}).expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('errorType', 'invalid-params');
		});

		it('should fail if bannerId is empty', async () => {
			const res = await request
				.post(api('banners.dismiss'))
				.set(credentials)
				.send({
					bannerId: '',
				})
				.expect(400);

			expect(res.body).to.have.property('success', false);
		});

		it('should fail if bannerId is invalid', async () => {
			const res = await request
				.post(api('banners.dismiss'))
				.set(credentials)
				.send({
					bannerId: '123',
				})
				.expect(400);

			expect(res.body).to.have.property('success', false);
		});

		describe('banners stored in the user record', () => {
			let testUser: TestUser<IUser>;
			let testUserCredentials: Credentials;

			const bannerId = 'alert-user-banner-test';

			// `GET /v1/banners` only returns the banners of the `rocketchat_banner` collection, the ones
			// stored in the user record are returned by `GET /v1/me`
			const getUserBanners = async () => (await getMe<IUser>(testUserCredentials)).banners;

			before(async () => {
				testUser = await createUser();
				testUserCredentials = await login(testUser.username, password);

				// these banners are only created by the server (`Users.addBannerById`), there is no endpoint for it
				await updateUserInDb(testUser._id, {
					banners: {
						[bannerId]: {
							id: bannerId,
							priority: 10,
							title: 'Banner_Title',
							text: 'Banner_Text',
							textArguments: [],
							modifiers: [],
							link: 'https://rocket.chat',
						},
					},
				});
			});

			after(() => deleteUser(testUser));

			it('should mark the banner as read on the user record', async () => {
				const res = await request
					.post(api('banners.dismiss'))
					.set(testUserCredentials)
					.send({
						bannerId,
					})
					.expect(200);

				expect(res.body).to.have.property('success', true);

				expect(await getUserBanners()).to.have.nested.property(`${bannerId}.read`, true);
			});

			it('should succeed if the banner was already dismissed', async () => {
				const res = await request
					.post(api('banners.dismiss'))
					.set(testUserCredentials)
					.send({
						bannerId,
					})
					.expect(200);

				expect(res.body).to.have.property('success', true);

				expect(await getUserBanners()).to.have.nested.property(`${bannerId}.read`, true);
			});

			it('should not add an unknown banner to the user record', async () => {
				const res = await request
					.post(api('banners.dismiss'))
					.set(testUserCredentials)
					.send({
						bannerId: 'an-unknown-banner-id',
					})
					.expect(400);

				expect(res.body).to.have.property('success', false);

				expect(await getUserBanners()).to.not.have.property('an-unknown-banner-id');
			});
		});
	});

	describe('[/banners]', () => {
		it('should fail if not logged in', async () => {
			return request
				.get(api('banners'))
				.query({
					platform: 'web',
				})
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				});
		});

		it('should fail if missing platform', async () => {
			return request
				.get(api('banners'))
				.set(credentials)
				.query({})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-params');
				});
		});

		it('should fail if platform is invalid', async () => {
			return request
				.get(api('banners'))
				.set(credentials)
				.query({
					platform: 'invalid-platform',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-params');
				});
		});

		it('should succesfully return web banners', async () => {
			return request
				.get(api('banners'))
				.set(credentials)
				.query({
					platform: 'web',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('banners').that.is.an('array');
				});
		});

		it('should succesfully return mobile banners', async () => {
			return request
				.get(api('banners'))
				.set(credentials)
				.query({
					platform: 'mobile',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('banners').that.is.an('array');
				});
		});
	});

	describe('[/banners/:id]', () => {
		it('should fail if not logged in', async () => {
			return request
				.get(api('banners/some-id'))
				.query({
					platform: 'web',
				})
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				});
		});

		it('should fail if missing platform', async () => {
			return request
				.get(api('banners/some-id'))
				.set(credentials)
				.query({})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-params');
				});
		});

		it('should fail if platform is invalid', async () => {
			return request
				.get(api('banners/some-id'))
				.set(credentials)
				.query({
					platform: 'invalid-platform',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-params');
				});
		});

		it('should succesfully return a web banner by id', async () => {
			return request
				.get(api('banners/some-id'))
				.set(credentials)
				.query({
					platform: 'web',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('banners').that.is.an('array');
				});
		});

		it('should succesfully return a mobile banner by id', async () => {
			return request
				.get(api('banners/some-id'))
				.set(credentials)
				.query({
					platform: 'mobile',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('banners').that.is.an('array');
				});
		});
	});
});
