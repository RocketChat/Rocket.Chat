import type { ISetting } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';

describe('LIVECHAT - Integrations', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
	});

	describe('livechat/integrations.settings', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-manager', []);
			await request.get(api('livechat/integrations.settings')).set(credentials).expect('Content-Type', 'application/json').expect(403);
		});
		it('should return an array of settings', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(async () => {
					const res = await request
						.get(api('livechat/integrations.settings'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200);
					expect(res.body).to.have.property('success', true);
					expect(res.body.settings).to.be.an('array');
					const settingIds = res.body.settings.map((setting: ISetting) => setting._id);
					expect(settingIds).to.include.members([
						'Livechat_webhookUrl',
						'Livechat_secret_token',
						'Livechat_http_timeout',
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
				.then(done)
				.catch(done);
		});
	});

	describe('Incoming SMS', () => {
		before(async () => {
			await updateSetting('SMS_Enabled', true);
			await updateSetting('SMS_Service', '');
		});

		describe('POST livechat/sms-incoming/:service', () => {
			it('should throw an error if SMS is disabled', async () => {
				await updateSetting('SMS_Enabled', false);
				await request
					.post(api('livechat/sms-incoming/twilio'))
					.set(credentials)
					.send({
						from: '+123456789',
						body: 'Hello',
					})
					.expect('Content-Type', 'application/json')
					.expect(400);
			});

			it('should return an error when SMS service is not configured', async () => {
				await updateSetting('SMS_Enabled', true);
				await request
					.post(api('livechat/sms-incoming/twilio'))
					.set(credentials)
					.send({
						From: '+123456789',
						To: '+123456789',
						Body: 'Hello',
					})
					.expect('Content-Type', 'application/json')
					.expect(400);
			});

			it('should throw an error if SMS_Default_Omnichannel_Department does not exists', async () => {
				await updateSetting('SMS_Default_Omnichannel_Department', '123');

				await request
					.post(api('livechat/sms-incoming/twilio'))
					.set(credentials)
					.send({
						From: '+123456789',
						To: '+123456789',
						Body: 'Hello',
					})
					.expect('Content-Type', 'application/json')
					.expect(400);
			});

			it('should return headers and <Response> as body on success', async () => {
				await updateSetting('SMS_Default_Omnichannel_Department', '');
				await updateSetting('SMS_Service', 'twilio');

				await request
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
						expect(res).to.have.property('text', '<Response></Response>');
					});
			});
		});
	});

	describe('Livechat - Webhooks', () => {
		const webhookUrl = process.env.WEBHOOK_TEST_URL || 'https://httpbin.org';

		describe('livechat/webhook.test', () => {
			it('should fail when user doesnt have view-livechat-webhooks permission', async () => {
				await updatePermission('view-livechat-webhooks', []);
				const response = await request.post(api('livechat/webhook.test')).set(credentials).expect(403);
				expect(response.body).to.have.property('success', false);
			});
			it('should fail if setting Livechat_webhookUrl is not set', async () => {
				await updateSetting('Livechat_webhookUrl', '');
				await updatePermission('view-livechat-webhooks', ['admin', 'livechat-manager']);
				const response = await request.post(api('livechat/webhook.test')).set(credentials).expect(400);
				expect(response.body).to.have.property('success', false);
			});
			it('should return true if webhook test went good', async () => {
				await updateSetting('Livechat_webhookUrl', `${webhookUrl}/status/200`);
				const response = await request.post(api('livechat/webhook.test')).set(credentials).expect(200);
				expect(response.body.success).to.be.true;
			});
			it('should fail if webhook test went bad', async () => {
				await updateSetting('Livechat_webhookUrl', `${webhookUrl}/status/400`);
				await request.post(api('livechat/webhook.test')).set(credentials).expect(400);
			});
		});
	});
	describe('omnichannel/integrations', () => {
		describe('POST', () => {
			it('should update the integration settings if the required parameters are provided', async () => {
				const response = await request
					.post(api('omnichannel/integrations'))
					.set(credentials)
					.send({
						LivechatWebhookUrl: 'http://localhost:8080',
						LivechatSecretToken: 'asdfasdf',
						LivechatHttpTimeout: 3000,
						LivechatWebhookOnStart: false,
						LivechatWebhookOnClose: false,
						LivechatWebhookOnChatTaken: false,
						LivechatWebhookOnChatQueued: false,
						LivechatWebhookOnForward: false,
						LivechatWebhookOnOfflineMsg: false,
						LivechatWebhookOnVisitorMessage: false,
						LivechatWebhookOnAgentMessage: false,
					})
					.expect(200);
				expect(response.body).to.have.property('success', true);
			});
			it('should fail if a wrong type is provided', async () => {
				const response = await request
					.post(api('omnichannel/integrations'))
					.set(credentials)
					.send({
						LivechatWebhookUrl: 8000,
					})
					.expect(200);
				expect(response.body).to.have.property('success', true);
			});
			it('should fail if a wrong setting is provided', async () => {
				const response = await request
					.post(api('omnichannel/integrations'))
					.set(credentials)
					.send({
						LivechatWebhook_url: 'http://localhost:8000',
					})
					.expect(400);
				expect(response.body).to.have.property('success', false);
			});
		});
	});
});
