import { expect } from 'chai';
import { before, describe, it, after } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createTrigger, fetchTriggers } from '../../../data/livechat/triggers';
import { removePermissionFromAllRoles, restorePermissionToRoles, updatePermission, updateSetting } from '../../../data/permissions.helper';
import { IS_EE } from '../../../e2e/config/constants';

describe('LIVECHAT - triggers', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
	});

	describe('livechat/triggers', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await removePermissionFromAllRoles('view-livechat-manager');
			await request.get(api('livechat/triggers')).set(credentials).expect('Content-Type', 'application/json').expect(403);
		});

		it('should return an array of triggers', async () => {
			await restorePermissionToRoles('view-livechat-manager');
			await createTrigger(`test${Date.now()}`);
			await request
				.get(api('livechat/triggers'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.triggers).to.be.an('array');
					expect(res.body).to.have.property('count').to.be.greaterThan(0);
					expect(res.body.triggers[0]).to.have.property('_id');
					expect(res.body.triggers[0]).to.have.property('name');
					expect(res.body.triggers[0]).to.have.property('description');
					expect(res.body.triggers[0]).to.have.property('enabled', true);
					expect(res.body.triggers[0]).to.have.property('runOnce').that.is.a('boolean');
					expect(res.body.triggers[0]).to.have.property('conditions').that.is.an('array').with.lengthOf.greaterThan(0);
					expect(res.body.triggers[0]).to.have.property('actions').that.is.an('array').with.lengthOf.greaterThan(0);
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
				});
		});
	});

	describe('POST livechat/triggers', () => {
		it('should fail if user is not logged in', async () => {
			await request.post(api('livechat/triggers')).send({}).expect(401);
		});
		it('should fail if no data is sent', async () => {
			await request.post(api('livechat/triggers')).set(credentials).send({}).expect(400);
		});
		it('should fail if invalid data is sent', async () => {
			await request.post(api('livechat/triggers')).set(credentials).send({ name: 'test' }).expect(400);
		});
		it('should fail if name is not an string', async () => {
			await request
				.post(api('livechat/triggers'))
				.set(credentials)
				.send({ name: 1, description: 'test', enabled: true, runOnce: true, conditions: [], actions: [] })
				.expect(400);
		});
		it('should fail if description is not an string', async () => {
			await request
				.post(api('livechat/triggers'))
				.set(credentials)
				.send({ name: 'test', description: 1, enabled: true, runOnce: true, conditions: [], actions: [] })
				.expect(400);
		});
		it('should fail if enabled is not an boolean', async () => {
			await request
				.post(api('livechat/triggers'))
				.set(credentials)
				.send({ name: 'test', description: 'test', enabled: 1, runOnce: true, conditions: [], actions: [] })
				.expect(400);
		});
		it('should fail if runOnce is not an boolean', async () => {
			await request
				.post(api('livechat/triggers'))
				.set(credentials)
				.send({ name: 'test', description: 'test', enabled: true, runOnce: 1, conditions: [], actions: [] })
				.expect(400);
		});
		it('should fail if conditions is not an array', async () => {
			await request
				.post(api('livechat/triggers'))
				.set(credentials)
				.send({ name: 'test', description: 'test', enabled: true, runOnce: true, conditions: 1, actions: [] })
				.expect(400);
		});
		it('should fail if actions is not an array', async () => {
			await request
				.post(api('livechat/triggers'))
				.set(credentials)
				.send({ name: 'test', description: 'test', enabled: true, runOnce: true, conditions: [], actions: 1 })
				.expect(400);
		});
		it('should fail if conditions is an array with invalid data', async () => {
			await request
				.post(api('livechat/triggers'))
				.set(credentials)
				.send({ name: 'test', description: 'test', enabled: true, runOnce: true, conditions: [1], actions: [] })
				.expect(400);
		});
		it('should fail if conditions is an array of objects, but name is not a valid value', async () => {
			await request
				.post(api('livechat/triggers'))
				.set(credentials)
				.send({ name: 'test', description: 'test', enabled: true, runOnce: true, conditions: [{ name: 'invalid' }], actions: [] })
				.expect(400);
		});
		it('should fail if actions is an array of invalid values', async () => {
			await request
				.post(api('livechat/triggers'))
				.set(credentials)
				.send({ name: 'test', description: 'test', enabled: true, runOnce: true, conditions: [{ name: 'page-url' }], actions: [1] })
				.expect(400);
		});
		it('should fail if actions is an array of objects, but name is not a valid value', async () => {
			await request
				.post(api('livechat/triggers'))
				.set(credentials)
				.send({
					name: 'test',
					description: 'test',
					enabled: true,
					runOnce: true,
					conditions: [{ name: 'page-url', value: 'http://localhost:3000' }],
					actions: [{ name: 'invalid' }],
				})
				.expect(400);
		});
		it('should fail if actions is an array of objects, but sender is not a valid value', async () => {
			await request
				.post(api('livechat/triggers'))
				.set(credentials)
				.send({
					name: 'test',
					description: 'test',
					enabled: true,
					runOnce: true,
					conditions: [{ name: 'page-url' }],
					actions: [{ name: 'send-message', params: { sender: 'invalid' } }],
				})
				.expect(400);
		});
		it('should fail if actions is an array of objects, but msg is not a valid value', async () => {
			await request
				.post(api('livechat/triggers'))
				.set(credentials)
				.send({
					name: 'test',
					description: 'test',
					enabled: true,
					runOnce: true,
					conditions: [{ name: 'page-url', value: 'http://localhost:3000' }],
					actions: [{ name: 'send-message', params: { sender: 'custom' } }],
				})
				.expect(400);
		});
		it('should fail if actions is an array of objects, but name is not a valid value', async () => {
			await request
				.post(api('livechat/triggers'))
				.set(credentials)
				.send({
					name: 'test',
					description: 'test',
					enabled: true,
					runOnce: true,
					conditions: [{ name: 'page-url', value: 'http://localhost:3000' }],
					actions: [{ name: 'send-message', params: { sender: 'custom', msg: 'test', name: {} } }],
				})
				.expect(400);
		});
		it('should fail if user doesnt have view-livechat-manager permission', async () => {
			await removePermissionFromAllRoles('view-livechat-manager');
			await request
				.post(api('livechat/triggers'))
				.set(credentials)
				.send({
					name: 'test',
					description: 'test',
					enabled: true,
					runOnce: true,
					conditions: [{ name: 'page-url', value: 'http://localhost:3000' }],
					actions: [{ name: 'send-message', params: { sender: 'custom', msg: 'test', name: 'test' } }],
				})
				.expect(403);
		});
		it('should save a new trigger of type send-message', async () => {
			await restorePermissionToRoles('view-livechat-manager');
			await request
				.post(api('livechat/triggers'))
				.set(credentials)
				.send({
					name: 'test',
					description: 'test',
					enabled: true,
					runOnce: true,
					conditions: [{ name: 'page-url', value: 'http://localhost:3000' }],
					actions: [{ name: 'send-message', params: { sender: 'custom', msg: 'test', name: 'test' } }],
				})
				.expect(200);
		});
		it('should fail if type is use-external-service but serviceUrl is not a present', async () => {
			await request
				.post(api('livechat/triggers'))
				.set(credentials)
				.send({
					name: 'test2',
					description: 'test2',
					enabled: true,
					runOnce: true,
					conditions: [{ name: 'page-url', value: 'http://localhost:3000' }],
					actions: [
						{
							name: 'use-external-service',
							params: {
								serviceTimeout: 5000,
								serviceFallbackMessage: 'Were sorry, we cannot complete your request',
							},
						},
					],
				})
				.expect(400);
		});
		it('should fail if type is use-external-service but serviceTimeout is not a present', async () => {
			await request
				.post(api('livechat/triggers'))
				.set(credentials)
				.send({
					name: 'test2',
					description: 'test2',
					enabled: true,
					runOnce: true,
					conditions: [{ name: 'page-url', value: 'http://localhost:3000' }],
					actions: [
						{
							name: 'use-external-service',
							params: {
								serviceUrl: 'http://localhost:3000/api/vX',
								serviceFallbackMessage: 'Were sorry, we cannot complete your request',
							},
						},
					],
				})
				.expect(400);
		});
		it('should fail if type is use-external-service but serviceFallbackMessage is not a present', async () => {
			await request
				.post(api('livechat/triggers'))
				.set(credentials)
				.send({
					name: 'test2',
					description: 'test2',
					enabled: true,
					runOnce: true,
					conditions: [{ name: 'page-url', value: 'http://localhost:3000' }],
					actions: [
						{
							name: 'use-external-service',
							params: {
								serviceUrl: 'http://localhost:3000/api/vX',
								serviceTimeout: 5000,
							},
						},
					],
				})
				.expect(400);
		});
		it('should save a new trigger of type use-external-service', async () => {
			await request
				.post(api('livechat/triggers'))
				.set(credentials)
				.send({
					name: 'test3',
					description: 'test3',
					enabled: true,
					runOnce: true,
					conditions: [{ name: 'page-url', value: 'http://localhost:3000' }],
					actions: [
						{
							name: 'use-external-service',
							params: {
								serviceUrl: 'http://localhost:3000/api/vX',
								serviceTimeout: 5000,
								serviceFallbackMessage: 'Were sorry, we cannot complete your request',
							},
						},
					],
				})
				.expect(200);
		});
	});

	(IS_EE ? describe : describe.skip)('POST livechat/triggers/external-service/test', () => {
		const webhookUrl = process.env.WEBHOOK_TEST_URL || 'https://httpbin.org';

		after(() => Promise.all([updateSetting('Livechat_secret_token', ''), restorePermissionToRoles('view-livechat-manager')]));

		it('should fail if user is not logged in', async () => {
			await request.post(api('livechat/triggers/external-service/test')).send({}).expect(401);
		});
		it('should fail if no data is sent', async () => {
			await request.post(api('livechat/triggers/external-service/test')).set(credentials).send({}).expect(400);
		});
		it('should fail if invalid data is sent', async () => {
			await request.post(api('livechat/triggers/external-service/test')).set(credentials).send({ webhookUrl: 'test' }).expect(400);
		});
		it('should fail if webhookUrl is not an string', async () => {
			await request
				.post(api('livechat/triggers/external-service/test'))
				.set(credentials)
				.send({ webhookUrl: 1, timeout: 1000, fallbackMessage: 'test', extraData: [] })
				.expect(400);
		});
		it('should fail if timeout is not an number', async () => {
			await request
				.post(api('livechat/triggers/external-service/test'))
				.set(credentials)
				.send({ webhookUrl: 'test', timeout: '1000', fallbackMessage: 'test', extraData: [] })
				.expect(400);
		});
		it('should fail if fallbackMessage is not an string', async () => {
			await request
				.post(api('livechat/triggers/external-service/test'))
				.set(credentials)
				.send({ webhookUrl: 'test', timeout: 1000, fallbackMessage: 1, extraData: [] })
				.expect(400);
		});
		it('should fail if params is not an array', async () => {
			await request
				.post(api('livechat/triggers/external-service/test'))
				.set(credentials)
				.send({ webhookUrl: 'test', timeout: 1000, fallbackMessage: 'test', extraData: 1 })
				.expect(400);
		});
		it('should fail if user doesnt have view-livechat-webhooks permission', async () => {
			await removePermissionFromAllRoles('view-livechat-manager');
			await request
				.post(api('livechat/triggers/external-service/test'))
				.set(credentials)
				.send({ webhookUrl: 'test', timeout: 1000, fallbackMessage: 'test', extraData: [] })
				.expect(403);
		});
		it('should fail if Livechat_secret_token setting is empty', async () => {
			await restorePermissionToRoles('view-livechat-manager');
			await updateSetting('Livechat_secret_token', '');
			await request
				.post(api('livechat/triggers/external-service/test'))
				.set(credentials)
				.send({ webhookUrl: 'test', timeout: 1000, fallbackMessage: 'test', extraData: [] })
				.expect(400);
		});
		it('should return error when webhook returns error', async () => {
			await updateSetting('Livechat_secret_token', 'test');

			await request
				.post(api('livechat/triggers/external-service/test'))
				.set(credentials)
				.send({ webhookUrl: `${webhookUrl}/status/500`, timeout: 5000, fallbackMessage: 'test', extraData: [] })
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'error-invalid-external-service-response');
					expect(res.body).to.have.property('response').to.be.a('string');
				});
		});
		it('should return error when webhook times out', async () => {
			await request
				.post(api('livechat/triggers/external-service/test'))
				.set(credentials)
				.send({ webhookUrl: `${webhookUrl}/delay/2`, timeout: 1000, fallbackMessage: 'test', extraData: [] })
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'error-timeout');
					expect(res.body).to.have.property('response').to.be.a('string');
				});
		});
		it('should fail when webhook returns an answer that doesnt match the format', async () => {
			await request
				.post(api('livechat/triggers/external-service/test'))
				.set(credentials)
				.send({ webhookUrl: `${webhookUrl}/anything`, timeout: 5000, fallbackMessage: 'test', extraData: [] })
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'error-invalid-external-service-response');
				});
		});
	});

	describe('livechat/triggers/:id', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-manager', []);
			await request.get(api('livechat/triggers/invalid-id')).set(credentials).expect('Content-Type', 'application/json').expect(403);
			await updatePermission('view-livechat-manager', ['admin']);
		});
		it('should return null when trigger does not exist', async () => {
			await updatePermission('view-livechat-manager', ['admin']);
			const response = await request
				.get(api('livechat/triggers/invalid-id'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body.trigger).to.be.null;
		});
		it('should return the trigger', async () => {
			const triggerName = `test${Date.now()}`;
			await createTrigger(triggerName);
			const trigger = (await fetchTriggers()).find((t) => t.name === triggerName);
			const response = await request
				.get(api(`livechat/triggers/${trigger?._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body.trigger).to.be.an('object');
			expect(response.body.trigger).to.have.property('_id', trigger?._id);
		});
	});
});
