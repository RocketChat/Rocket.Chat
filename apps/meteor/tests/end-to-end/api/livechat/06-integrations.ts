/* eslint-env mocha */

import { expect } from 'chai';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';

describe('LIVECHAT - Integrations', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true).then(done);
	});

	describe('livechat/integrations.settings', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-manager', []).then(() => {
				request
					.get(api('livechat/integrations.settings'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.end(done);
			});
		});
		it('should return an array of settings', (done) => {
			updatePermission('view-livechat-manager', ['admin']).then(() => {
				request
					.get(api('livechat/integrations.settings'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.settings).to.be.an('array');
					})
					.end(done);
			});
		});
	});

	describe('Incoming SMS', () => {
		before((done) => {
			updateSetting('SMS_Enabled', true)
				.then(() => updateSetting('SMS_Service', ''))
				.then(() => done());
		});

		describe('POST livechat/sms-incoming/:service', () => {
			it('should throw an error if SMS is disabled', (done) => {
				updateSetting('SMS_Enabled', false)
					.then(() => {
						request
							.post(api('livechat/sms-incoming/twilio'))
							.set(credentials)
							.send({
								from: '+123456789',
								body: 'Hello',
							})
							.expect('Content-Type', 'application/json')
							.expect(400);
					})
					.then(() => done());
			});

			it('should return an error when SMS service is not configured', (done) => {
				updateSetting('SMS_Enabled', true)
					.then(() => {
						request
							.post(api('livechat/sms-incoming/twilio'))
							.set(credentials)
							.send({
								From: '+123456789',
								To: '+123456789',
								Body: 'Hello',
							})
							.expect('Content-Type', 'application/json')
							.expect(400)
							.expect((res: Response) => {
								expect(res.body).to.have.property('success', false);
							});
					})
					.then(() => done());
			});

			it('should throw an error if SMS_Default_Omnichannel_Department does not exists', (done) => {
				updateSetting('SMS_Default_Omnichannel_Department', '123')
					.then(() => {
						request
							.post(api('livechat/sms-incoming/twilio'))
							.set(credentials)
							.send({
								From: '+123456789',
								To: '+123456789',
								Body: 'Hello',
							})
							.expect('Content-Type', 'application/json')
							.expect(400)
							.expect((res: Response) => {
								expect(res.body).to.have.property('success', false);
							});
					})
					.then(() => done());
			});

			it('should return headers and <Response> as body on success', (done) => {
				updateSetting('SMS_Default_Omnichannel_Department', '')
					.then(() => updateSetting('SMS_Service', 'twilio'))
					.then(() => {
						request
							.post(api('livechat/sms-incoming/twilio'))
							.set(credentials)
							.send({
								From: '+123456789',
								To: '+123456789',
								Body: 'Hello',
							})
							.expect('Content-Type', 'text/xml')
							.expect(200)
							.expect((res: Response) => {
								expect(res.body).to.have.property('success', true);
								expect(res.body).to.have.property('headers');
								expect(res.body).to.have.property('body');
							});
					})
					.then(() => done());
			});
		});
	});
});
