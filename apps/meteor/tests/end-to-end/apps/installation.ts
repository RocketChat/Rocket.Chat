import { after, before, describe, it } from 'node:test';

import type { Credentials } from '@rocket.chat/api-client';
import type { IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { getCredentials, request, credentials, api } from '../../data/api-data';
import { APP_URL, APP_NAME, apps } from '../../data/apps/apps-data';
import { cleanupApps } from '../../data/apps/helper';
import { updatePermission } from '../../data/permissions.helper';
import { password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, getUserByUsername, login } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

const APP_USERNAME = 'appsrocketchattester.bot';

describe('Apps - Installation', () => {
	before((_t, done) => getCredentials(done));

	before(async () => cleanupApps());

	after(() => Promise.all([cleanupApps(), updatePermission('manage-apps', ['admin'])]));

	let app: any;

	describe('[Installation]', () => {
		it('should throw an error when trying to install an app and the apps framework is enabled but the user does not have the permission', (_t, done) => {
			void updatePermission('manage-apps', []).then(() => {
				void request
					.post(apps())
					.set(credentials)
					.send({
						url: APP_URL,
					})
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
						expect(res.body.errorType).to.be.equal('error-forbidden');
					})
					.end(done);
			});
		});
		(IS_EE ? it : it.skip)('should succesfully install an app from a URL in EE, which should be auto-enabled', (_t, done) => {
			void updatePermission('manage-apps', ['admin']).then(() => {
				void request
					.post(apps())
					.set(credentials)
					.send({
						url: APP_URL,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', true);
						expect(res.body).to.have.a.property('app');
						expect(res.body.app).to.have.a.property('id');
						expect(res.body.app).to.have.a.property('version');
						expect(res.body.app).to.have.a.property('status').and.to.be.equal('manually_enabled');

						app = res.body.app;
					})
					.end(done);
			});
		});
		(!IS_EE ? it : it.skip)('should succesfully install an app from a URL in CE, which should not be enabled', (_t, done) => {
			void updatePermission('manage-apps', ['admin']).then(() => {
				void request
					.post(apps())
					.set(credentials)
					.send({
						url: APP_URL,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', true);
						expect(res.body).to.have.a.property('app');
						expect(res.body.app).to.have.a.property('id');
						expect(res.body.app).to.have.a.property('version');
						expect(res.body.app).to.have.a.property('status').and.to.be.equal('initialized');

						app = res.body.app;
					})
					.end(done);
			});
		});
		it('should have created the app user successfully', (_t, done) => {
			void getUserByUsername(APP_USERNAME)
				.then((user) => {
					expect(user.username).to.be.equal(APP_USERNAME);
				})
				.then(done, done);
		});
		it('should successfully get app details by id', (_t, done) => {
			void request
				.get(apps(`/${app.id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('app');
					expect(res.body.app).to.have.a.property('name', APP_NAME);
					expect(res.body.app).to.have.a.property('version');
					expect(res.body.app).to.have.a.property('status');
				})
				.end(done);
		});
		it('should successfully get app status by id', (_t, done) => {
			void request
				.get(apps(`/${app.id}/status`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('status');
					expect(res.body.status).to.not.be.empty;
				})
				.end(done);
		});
		(IS_EE ? describe : describe.skip)('Slash commands registration', () => {
			it('should have created the "test-simple" slash command successfully', (_t, done) => {
				void request
					.get(api('commands.get'))
					.query({ command: 'test-simple' })
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', true);
						expect(res.body).to.have.a.property('command');
						expect(res.body.command.command).to.be.equal('test-simple');
					})
					.end(done);
			});
			it('should have created the "test-with-arguments" slash command successfully', (_t, done) => {
				void request
					.get(api('commands.get'))
					.query({ command: 'test-with-arguments' })
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', true);
						expect(res.body).to.have.a.property('command');
						expect(res.body.command.command).to.be.equal('test-with-arguments');
					})
					.end(done);
			});
		});
		(IS_EE ? describe : describe.skip)('Video Conf Provider registration', () => {
			it('should have created two video conf provider successfully', (_t, done) => {
				void request
					.get(api('video-conference.providers'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', true);
						expect(res.body).to.have.a.property('data').that.is.an('array').with.lengthOf(3);
						expect(res.body.data[0]).to.be.an('object').with.a.property('key').equal('test');
						expect(res.body.data[1]).to.be.an('object').with.a.property('key').equal('persistentchat');
						expect(res.body.data[2]).to.be.an('object').with.a.property('key').equal('unconfigured');
					})
					.end(done);
			});
		});
	});

	(IS_EE ? describe : describe.skip)('without manage-apps', () => {
		let user: TestUser<IUser>;
		let userCredentials: Credentials;

		before(async () => {
			user = await createUser();
			userCredentials = await login(user.username, password);
		});

		after(() => deleteUser(user));

		const readPaths = ['/settings', '/settings/any', '/apis', '/status'] as const;

		readPaths.forEach((path) => {
			it(`should refuse GET /api/apps/:id${path}`, async () => {
				await request
					.get(apps(`/${app.id}${path}`))
					.set(userCredentials)
					.expect(403);
			});
		});

		it('should refuse GET /api/apps/bundles/:id/apps', async () => {
			await request.get(apps('/bundles/any/apps')).set(userCredentials).expect(403);
		});

		it('should refuse POST /api/apps/:id/sync', async () => {
			await request
				.post(apps(`/${app.id}/sync`))
				.set(userCredentials)
				.expect(403);
		});

		it('should refuse POST /api/apps/:id/settings', async () => {
			await request
				.post(apps(`/${app.id}/settings`))
				.set(userCredentials)
				.send({ settings: [] })
				.expect(403);
		});

		it('should refuse POST /api/apps/:id/status and keep the app status', async () => {
			const previous = await request
				.get(apps(`/${app.id}/status`))
				.set(credentials)
				.expect(200);

			await request
				.post(apps(`/${app.id}/status`))
				.set(userCredentials)
				.send({ status: 'manually_disabled' })
				.expect(403);

			const current = await request
				.get(apps(`/${app.id}/status`))
				.set(credentials)
				.expect(200);
			expect(current.body.status).to.equal(previous.body.status);
		});
	});
});
