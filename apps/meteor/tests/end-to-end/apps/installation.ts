import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, request, credentials, api } from '../../data/api-data';
import { APP_URL, apps } from '../../data/apps/apps-data';
import { cleanupApps } from '../../data/apps/helper';
import { updatePermission } from '../../data/permissions.helper';
import { getUserByUsername } from '../../data/users.helper';

const APP_USERNAME = 'appsrocketchattester.bot';

describe('Apps - Installation', () => {
	before((done) => getCredentials(done));

	before(async () => cleanupApps());

	after(() => Promise.all([cleanupApps(), updatePermission('manage-apps', ['admin'])]));

	describe('[Installation]', () => {
		it('should throw an error when trying to install an app and the apps framework is enabled but the user does not have the permission', (done) => {
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
						expect(res.body.error).to.be.equal('User does not have the permissions required for this action [error-unauthorized]');
					})
					.end(done);
			});
		});
		it('should install the app successfully from a URL', (done) => {
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
						expect(res.body.app).to.have.a.property('status').and.to.be.equal('auto_enabled');
					})
					.end(done);
			});
		});
		it('should have created the app user successfully', (done) => {
			void getUserByUsername(APP_USERNAME)
				.then((user) => {
					expect(user.username).to.be.equal(APP_USERNAME);
				})
				.then(done);
		});
		describe('Slash commands registration', () => {
			it('should have created the "test-simple" slash command successfully', (done) => {
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
			it('should have created the "test-with-arguments" slash command successfully', (done) => {
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
		describe('Video Conf Provider registration', () => {
			it('should have created two video conf provider successfully', (done) => {
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
});
