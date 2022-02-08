import { expect } from 'chai';

import { getCredentials, request, credentials, api } from '../../data/api-data.js';
import { updatePermission, updateSetting } from '../../data/permissions.helper';
import { APP_URL, apps, APP_USERNAME } from '../../data/apps/apps-data.js';
import { cleanupApps } from '../../data/apps/helper.js';
import { getUserByUsername } from '../../data/users.helper.js';

describe('Apps - Installation', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before(async () => cleanupApps());

	describe('[Installation]', () => {
		it('should throw an error when trying to install an app and the apps framework is enabled but the user does not have the permission', (done) => {
			updateSetting('Apps_Framework_Development_Mode', true)
				.then(() => updatePermission('manage-apps', []))
				.then(() => {
					request
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
		it('should throw an error when trying to install an app and the apps framework is disabled', (done) => {
			updateSetting('Apps_Framework_Development_Mode', false)
				.then(() => updatePermission('manage-apps', ['admin']))
				.then(() => {
					request
						.post(apps())
						.set(credentials)
						.send({
							url: APP_URL,
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', false);
							expect(res.body.error).to.be.equal('Installation from url is disabled.');
						})
						.end(done);
				});
		});
		it('should install the app successfully from a URL', (done) => {
			updateSetting('Apps_Framework_Development_Mode', true).then(() => {
				request
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
			getUserByUsername(APP_USERNAME)
				.then((user) => {
					expect(user.username).to.be.equal(APP_USERNAME);
				})
				.then(done);
		});
		describe('Slash commands registration', () => {
			it('should have created the "test-simple" slash command successfully', (done) => {
				request
					.get(api('commands.get?command=test-simple'))
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
				request
					.get(api('commands.get?command=test-with-arguments'))
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
	});
});
