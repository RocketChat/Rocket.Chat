import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, describe, it, after } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { updatePermission, updateSetting } from '../../data/permissions.helper';

describe('[Settings]', () => {
	before((done) => getCredentials(done));

	describe('[/settings.public]', () => {
		it('should return public settings', (done) => {
			void request
				.get(api('settings.public'))
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('settings');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
		it('should return public settings even requested with count and offset params', (done) => {
			void request
				.get(api('settings.public'))
				.query({
					count: 5,
					offset: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success').and.to.be.true;
					expect(res.body).to.have.property('settings').and.to.be.an('array').and.to.have.lengthOf(5);
					expect(res.body).to.have.property('count').and.to.be.a('number').and.to.equal(5);
				})
				.end(done);
		});
		it('should return public settings even requested with _id param', (done) => {
			void request
				.get(api('settings.public'))
				.query({
					_id: 'Site_Url',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success').and.to.be.true;
					expect(res.body).to.have.property('settings').and.to.be.an('array').and.to.have.lengthOf(1);
					expect(res.body).to.have.property('count').and.to.be.a('number').and.to.equal(1);
				})
				.end(done);
		});
		it('should return public settings even requested with _id param as an array', (done) => {
			void request
				.get(api('settings.public'))
				.query({
					_id: 'Site_Url,LDAP_Enable',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success').and.to.be.true;
					expect(res.body).to.have.property('settings').and.to.be.an('array').and.to.have.lengthOf(2);
					expect(res.body).to.have.property('count').and.to.be.a('number').and.to.equal(2);
				})
				.end(done);
		});
		it('should return an empty response when requesting public settings with a broken _id param', (done) => {
			void request
				.get(api('settings.public'))
				.query({
					_id: 10,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success').and.to.be.true;
					expect(res.body).to.have.property('settings').and.to.be.an('array').and.to.be.empty;
					expect(res.body).to.have.property('count').and.to.be.a('number').and.to.equal(0);
					expect(res.body).to.have.property('offset').and.to.be.a('number').and.to.equal(0);
					expect(res.body).to.have.property('total').and.to.be.a('number').and.to.equal(0);
				})
				.end(done);
		});
	});

	describe('[/settings]', () => {
		it('should return private settings', (done) => {
			void request
				.get(api('settings'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('settings');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
	});

	describe('[/settings/:_id]', () => {
		before(async () => {
			await updatePermission('view-privileged-setting', ['admin']);
			await updatePermission('edit-privileged-setting', ['admin']);
		});

		after(async () => {
			await updatePermission('view-privileged-setting', ['admin']);
			await updatePermission('edit-privileged-setting', ['admin']);
		});

		it('should succesfully return one setting (GET)', async () => {
			return request
				.get(api('settings/Site_Url'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('_id', 'Site_Url');
					expect(res.body).to.have.property('value');
				});
		});

		it('should fail returning a setting if user does NOT have the view-privileged-setting permission (GET)', async () => {
			await updatePermission('view-privileged-setting', []);
			return request
				.get(api('settings/Site_Url'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
				});
		});

		it('should succesfully set the value of a setting (POST)', async () => {
			return request
				.post(api('settings/LDAP_Enable'))
				.set(credentials)
				.send({
					value: false,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should fail updating the value of a setting if user does NOT have the edit-privileged-setting permission (POST)', async () => {
			await updatePermission('edit-privileged-setting', []);
			return request
				.post(api('settings/LDAP_Enable'))
				.set(credentials)
				.send({
					value: false,
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
				});
		});
	});

	describe('[/service.configurations]', () => {
		it('should return service configurations', (done) => {
			void request
				.get(api('service.configurations'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('configurations');
				})
				.end(done);
		});

		describe('With OAuth enabled', () => {
			before(() => updateSetting('Accounts_OAuth_Google', true));

			after(() => updateSetting('Accounts_OAuth_Google', false));

			it('should include the OAuth service in the response', (done) => {
				// wait 3 seconds before getting the service list so the server has had time to update it
				setTimeout(() => {
					void request
						.get(api('service.configurations'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('configurations');

							expect((res.body.configurations as LoginServiceConfiguration[]).find(({ service }) => service === 'google')).to.exist;
						})
						.end(done);
				}, 3000);
			});
		});

		describe('With OAuth disabled', () => {
			before(() => updateSetting('Accounts_OAuth_Google', false));

			after(() => updateSetting('Accounts_OAuth_Google', false));

			it('should not include the OAuth service in the response', (done) => {
				// wait 3 seconds before getting the service list so the server has had time to update it
				setTimeout(() => {
					void request
						.get(api('service.configurations'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('configurations');

							expect((res.body.configurations as LoginServiceConfiguration[]).find(({ service }) => service === 'google')).to.not.exist;
						})
						.end(done);
				}, 3000);
			});
		});
	});

	describe('/settings.oauth', () => {
		it('should have return list of available oauth services when user is not logged', (done) => {
			void request
				.get(api('settings.oauth'))
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('services').and.to.be.an('array');
				})
				.end(done);
		});

		it('should have return list of available oauth services when user is logged', (done) => {
			void request
				.get(api('settings.oauth'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('services').and.to.be.an('array');
				})
				.end(done);
		});
	});
});
