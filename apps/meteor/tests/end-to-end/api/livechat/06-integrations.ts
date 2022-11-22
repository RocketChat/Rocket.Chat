/* eslint-env mocha */

import type { ISetting } from '@rocket.chat/core-typings';
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
						const settingIds = res.body.settings.map((setting: ISetting) => setting._id);
						expect(settingIds).to.include.members([
							'Livechat_webhookUrl',
							'Livechat_secret_token',
							'Livechat_webhook_on_start',
							'Livechat_webhook_on_close',
							'Livechat_webhook_on_chat_taken',
							'Livechat_webhook_on_chat_queued',
							'Livechat_webhook_on_forward',
							'Livechat_webhook_on_offline_msg',
							'Livechat_webhook_on_visitor_message',
							'Livechat_webhook_on_agent_message',
						]);
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

	describe('Livechat - Webhooks', () => {
		describe('livechat/webhook.test', () => {
			it('should fail when user doesnt have view-livechat-webhooks permission', async () => {
				await updatePermission('view-livechat-webhooks', []);
				const response = await request.post(api('livechat/webhook.test')).set(credentials).expect(403);
				expect(response.body).to.have.property('success', false);
			});
			it('should fail if setting Livechat_webhookUrl is not set', async () => {
				await updateSetting('Livechat_webhookUrl', '');
				await updatePermission('view-livechat-webhooks', ['admin', 'livechat-manager']);
				await setTimeout(() => null, 1000);
				const response = await request.post(api('livechat/webhook.test')).set(credentials).expect(400);
				expect(response.body).to.have.property('success', false);
			});
			it('should return true if webhook test went good', async () => {
				await updateSetting('Livechat_webhookUrl', 'https://httpbin.org/status/200');
				const response = await request.post(api('livechat/webhook.test')).set(credentials).expect(200);
				expect(response.body.success).to.be.true;
			});
			it('should fail if webhook test went bad', async () => {
				await updateSetting('Livechat_webhookUrl', 'https://httpbin.org/status/400');
				await request.post(api('livechat/webhook.test')).set(credentials).expect(400);
			});
		});
	});
});
