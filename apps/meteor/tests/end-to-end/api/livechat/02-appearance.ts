import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { sleep } from '../../../data/livechat/utils';
import { removePermissionFromAllRoles, restorePermissionToRoles, updatePermission, updateSetting } from '../../../data/permissions.helper';
import { IS_EE } from '../../../e2e/config/constants';

describe('LIVECHAT - appearance', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
	});

	describe('livechat/appearance', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-manager', []);
			await request.get(api('livechat/appearance')).set(credentials).expect('Content-Type', 'application/json').expect(403);
		});
		it('should return an array of settings', async () => {
			await updatePermission('view-livechat-manager', ['admin']);
			await request
				.get(api('livechat/appearance'))
				.set(credentials)
				.success()
				.expect((res: Response) => {
					expect(res.body.appearance).to.be.an('array');
				});
		});
	});

	describe('POST livechat/appearance', () => {
		it('should fail if user is not logged in', async () => {
			await request.post(api('livechat/appearance')).send({}).expect(401);
		});
		it('should fail if body is not an array', async () => {
			await request.post(api('livechat/appearance')).set(credentials).send({}).expect(400);
		});
		it('should fail if body is an empty array', async () => {
			await request.post(api('livechat/appearance')).set(credentials).send([]).expect(400);
		});
		it('should fail if body does not contain value', async () => {
			await request
				.post(api('livechat/appearance'))
				.set(credentials)
				.send([{ name: 'Livechat_title' }])
				.expect(400);
		});
		it('should fail if body does not contain name', async () => {
			await request
				.post(api('livechat/appearance'))
				.set(credentials)
				.send([{ value: 'test' }])
				.expect(400);
		});
		it('should fail if user does not have the necessary permission', async () => {
			await removePermissionFromAllRoles('view-livechat-manager');
			await request
				.post(api('livechat/appearance'))
				.set(credentials)
				.send([{ _id: 'invalid', value: 'test' }])
				.expect(403);
		});
		it('should fail if body contains invalid _id', async () => {
			await restorePermissionToRoles('view-livechat-manager');
			await request
				.post(api('livechat/appearance'))
				.set(credentials)
				.send([{ _id: 'invalid', value: 'test' }])
				.expect(400);
		});
		it('should update the settings', async () => {
			await request
				.post(api('livechat/appearance'))
				.set(credentials)
				.send([{ _id: 'Livechat_title', value: 'test' }])
				.success();
		});
		// Test for: https://github.com/ajv-validator/ajv/issues/1140
		it('should update a boolean setting and keep it as boolean', async () => {
			await request
				.post(api('livechat/appearance'))
				.set(credentials)
				.send([{ _id: 'Livechat_registration_form', value: true }])
				.success();

			// Just enough to get the stream to update cached settings
			await sleep(500);

			// Get data from livechat/config
			const { body } = await request.get(api('livechat/config')).set(credentials).expect(200);
			expect(body.config.settings.registrationForm).to.be.true;
		});
		it('should update a boolean setting and keep it as boolean', async () => {
			await request
				.post(api('livechat/appearance'))
				.set(credentials)
				.send([{ _id: 'Livechat_registration_form', value: false }])
				.success();

			// Just enough to get the stream to update cached settings
			await sleep(500);
			// Get data from livechat/config
			const { body } = await request.get(api('livechat/config')).set(credentials).expect(200);
			expect(body.config.settings.registrationForm).to.be.false;
		});
		it('should update a number setting and keep it as number', async () => {
			await updateSetting('Livechat_enable_message_character_limit', true);
			await request
				.post(api('livechat/appearance'))
				.set(credentials)
				.send([{ _id: 'Livechat_message_character_limit', value: 100 }])
				.success();

			// Just enough to get the stream to update cached settings
			await sleep(500);

			// Get data from livechat/config
			const { body } = await request.get(api('livechat/config')).set(credentials).expect(200);
			expect(body.config.settings.limitTextLength).to.be.equal(100);
			await updateSetting('Livechat_enable_message_character_limit', false);
		});
		it('should coerce the value of a setting based on its stored datatype (int)', async () => {
			await updateSetting('Livechat_enable_message_character_limit', true);
			await request
				.post(api('livechat/appearance'))
				.set(credentials)
				.send([{ _id: 'Livechat_message_character_limit', value: '100' }])
				.success();
			// Just enough to get the stream to update cached settings
			await sleep(500);
			// Get data from livechat/config
			const { body } = await request.get(api('livechat/config')).set(credentials).expect(200);
			expect(body.config.settings.limitTextLength).to.be.equal(100);
			await updateSetting('Livechat_enable_message_character_limit', false);
		});
		it('should coerce the value of a setting based on its stored datatype (boolean)', async () => {
			await request
				.post(api('livechat/appearance'))
				.set(credentials)
				.send([{ _id: 'Livechat_registration_form', value: 'true' }])
				.success();

			// Just enough to get the stream to update cached settings
			await sleep(500);
			// Get data from livechat/config
			const { body } = await request.get(api('livechat/config')).set(credentials).expect(200);
			expect(body.config.settings.registrationForm).to.be.true;
		});
		it('should coerce an invalid number value to zero', async () => {
			await request
				.post(api('livechat/appearance'))
				.set(credentials)
				.send([
					{ _id: 'Livechat_message_character_limit', value: 'xxxx' },
					{ _id: 'Livechat_enable_message_character_limit', value: true },
				])
				.success();

			// Just enough to get the stream to update cached settings
			await sleep(500);
			// Get data from livechat/config
			const { body } = await request.get(api('livechat/config')).set(credentials).expect(200);
			// When setting is 0, we default to Message_MaxAllowedSize value
			expect(body.config.settings.limitTextLength).to.be.equal(5000);
		});
		it('should coerce a boolean value on an int setting to 0', async () => {
			await request
				.post(api('livechat/appearance'))
				.set(credentials)
				.send([
					{ _id: 'Livechat_message_character_limit', value: true },
					{ _id: 'Livechat_enable_message_character_limit', value: true },
				])
				.success();

			// Just enough to get the stream to update cached settings
			await sleep(500);
			// Get data from livechat/config
			const { body } = await request.get(api('livechat/config')).set(credentials).expect(200);
			expect(body.config.settings.limitTextLength).to.be.equal(5000);
		});
		it('should coerce a non boolean value on a boolean setting to false', async () => {
			await request
				.post(api('livechat/appearance'))
				.set(credentials)
				.send([{ _id: 'Livechat_enable_message_character_limit', value: 'xxxx' }])
				.success();

			// Just enough to get the stream to update cached settings
			await sleep(500);
			// Get data from livechat/config
			const { body } = await request.get(api('livechat/config')).set(credentials).expect(200);
			expect(body.config.settings.limitTextLength).to.be.false;
		});
		(IS_EE ? it : it.skip)('should accept an array setting', async () => {
			await request
				.post(api('livechat/appearance'))
				.set(credentials)
				.send([{ _id: 'Livechat_hide_system_messages', value: ['uj'] }])
				.success();
			await sleep(500);

			// Get data from livechat/config
			const { body } = await request.get(api('livechat/config')).set(credentials).expect(200);
			expect(body.config.settings.hiddenSystemMessages).to.be.an('array');
			expect(body.config.settings.hiddenSystemMessages).to.include('uj');
		});
		(IS_EE ? it : it.skip)('should accept an array setting with multiple values', async () => {
			await request
				.post(api('livechat/appearance'))
				.set(credentials)
				.send([{ _id: 'Livechat_hide_system_messages', value: ['uj', 'ul'] }])
				.success();
			await sleep(500);

			// Get data from livechat/config
			const { body } = await request.get(api('livechat/config')).set(credentials).expect(200);
			expect(body.config.settings.hiddenSystemMessages).to.be.an('array');
			expect(body.config.settings.hiddenSystemMessages).to.include('uj');
			expect(body.config.settings.hiddenSystemMessages).to.include('ul');
		});
		(IS_EE ? it : it.skip)('should not update an array setting with a value other than array', async () => {
			await request
				.post(api('livechat/appearance'))
				.set(credentials)
				.send([{ _id: 'Livechat_hide_system_messages', value: 'uj' }])
				.success();

			await sleep(500);

			// Get data from livechat/config
			const { body } = await request.get(api('livechat/config')).set(credentials).expect(200);
			expect(body.config.settings.hiddenSystemMessages).to.be.an('array');
			expect(body.config.settings.hiddenSystemMessages).to.include('uj');
		});
		(IS_EE ? it : it.skip)('should not update an array setting with values that are not valid setting values', async () => {
			await request
				.post(api('livechat/appearance'))
				.set(credentials)
				.send([{ _id: 'Livechat_hide_system_messages', value: ['uj', 'invalid'] }])
				.success();

			await sleep(500);

			// Get data from livechat/config
			const { body } = await request.get(api('livechat/config')).set(credentials).expect(200);
			expect(body.config.settings.hiddenSystemMessages).to.be.an('array');
			expect(body.config.settings.hiddenSystemMessages).to.include('uj');
			expect(body.config.settings.hiddenSystemMessages).to.not.include('invalid');
		});
	});
});
