import type { IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import { MongoClient } from 'mongodb';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { getMe } from '../../data/users.helper';
import { URL_MONGODB } from '../../e2e/config/constants';

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
			let connection: MongoClient;

			const bannerId = 'alert-user-banner-test';

			const getUserBanners = async () => (await getMe<IUser>(credentials)).banners;

			before(async () => {
				connection = await MongoClient.connect(URL_MONGODB);

				await connection
					.db()
					.collection<IUser>('users')
					.updateOne(
						{ _id: 'rocketchat.internal.admin.test' },
						{
							$set: {
								[`banners.${bannerId}`]: {
									id: bannerId,
									priority: 10,
									title: 'Banner_Title',
									text: 'Banner_Text',
									textArguments: [],
									modifiers: [],
									link: 'https://rocket.chat',
								},
							},
						},
					);
			});

			after(async () => {
				await connection
					.db()
					.collection<IUser>('users')
					.updateOne(
						{ _id: 'rocketchat.internal.admin.test' },
						{
							$unset: { [`banners.${bannerId}`]: 1 },
						},
					);
				await connection.close();
			});

			it('should mark the banner as read on the user record', async () => {
				const res = await request
					.post(api('banners.dismiss'))
					.set(credentials)
					.send({
						bannerId,
					})
					.expect(200);

				expect(res.body).to.have.property('success', true);

				const banners = await getUserBanners();

				expect(banners).to.have.nested.property(`${bannerId}.read`, true);
			});

			it('should succeed if the banner was already dismissed', async () => {
				const res = await request
					.post(api('banners.dismiss'))
					.set(credentials)
					.send({
						bannerId,
					})
					.expect(200);

				expect(res.body).to.have.property('success', true);

				const banners = await getUserBanners();

				expect(banners).to.have.nested.property(`${bannerId}.read`, true);
			});

			it('should not add an unknown banner to the user record', async () => {
				const res = await request
					.post(api('banners.dismiss'))
					.set(credentials)
					.send({
						bannerId: 'an-unknown-banner-id',
					})
					.expect(400);

				expect(res.body).to.have.property('success', false);

				const banners = await getUserBanners();

				expect(banners).to.not.have.property('an-unknown-banner-id');
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
