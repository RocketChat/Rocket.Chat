import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createCustomField } from '../../../data/livechat/custom-fields';
import { createVisitor } from '../../../data/livechat/rooms';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';

describe('LIVECHAT - custom fields', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
	});

	describe('livechat/custom-fields', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-l-room', []);
			await request.get(api('livechat/custom-fields')).set(credentials).expect('Content-Type', 'application/json').expect(403);
		});
		it('should return an array of custom fields', async () => {
			await updatePermission('view-l-room', ['admin']);
			await request
				.get(api('livechat/custom-fields'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.customFields).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				});
		});
		it('should return an array of custom fields even requested with count and offset params', async () => {
			await updatePermission('view-l-room', ['admin']);
			await request
				.get(api('livechat/custom-fields'))
				.set(credentials)
				.query({
					count: 5,
					offset: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.customFields).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				});
		});
	});

	describe('livechat/custom-fields/id', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-l-room', []);
			await request.get(api('livechat/custom-fields/invalid-id')).set(credentials).expect('Content-Type', 'application/json').expect(403);
			await updatePermission('view-l-room', ['admin']);
		});
	});

	describe('livechat/custom.field', () => {
		it('should fail when token is not on body params', async () => {
			await request.post(api('livechat/custom.field')).expect(400);
		});
		it('should fail when key is not on body params', async () => {
			await request.post(api('livechat/custom.field')).send({ token: 'invalid-token' }).expect(400);
		});
		it('should fail when value is not on body params', async () => {
			await request.post(api('livechat/custom.field')).send({ token: 'invalid-token', key: 'invalid-key' }).expect(400);
		});
		it('should fail when overwrite is not on body params', async () => {
			await request
				.post(api('livechat/custom.field'))
				.send({ token: 'invalid-token', key: 'invalid-key', value: 'invalid-value' })
				.expect(400);
		});
		it('should fail when token is invalid', async () => {
			await request
				.post(api('livechat/custom.field'))
				.send({ token: 'invalid-token', key: 'invalid-key', value: 'invalid-value', overwrite: true })
				.expect(400);
		});
		it('should fail when key is invalid', async () => {
			const visitor = await createVisitor();
			await request
				.post(api('livechat/custom.field'))
				.send({ token: visitor.token, key: 'invalid-key', value: 'invalid-value', overwrite: true })
				.expect(400);
		});
		it('should save a custom field on visitor', async () => {
			const visitor = await createVisitor();
			const customFieldName = `new_custom_field_${Date.now()}`;
			await createCustomField({
				searchable: true,
				field: customFieldName,
				label: customFieldName,
				defaultValue: 'test_default_address',
				scope: 'visitor',
				visibility: 'public',
				regexp: '',
			});

			const { body } = await request
				.post(api('livechat/custom.field'))
				.send({ token: visitor.token, key: customFieldName, value: 'test_address', overwrite: true })
				.expect(200);

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('field');
			expect(body.field).to.have.property('value', 'test_address');
		});
	});

	describe('livechat/custom.fields', () => {
		it('should fail when token is not on body params', async () => {
			await request.post(api('livechat/custom.fields')).expect(400);
		});
		it('should fail if customFields is not on body params', async () => {
			await request.post(api('livechat/custom.fields')).send({ token: 'invalid-token' }).expect(400);
		});
		it('should fail if customFields is not an array', async () => {
			await request.post(api('livechat/custom.fields')).send({ token: 'invalid-token', customFields: 'invalid-custom-fields' }).expect(400);
		});
		it('should fail if customFields is an empty array', async () => {
			await request.post(api('livechat/custom.fields')).send({ token: 'invalid-token', customFields: [] }).expect(400);
		});
		it('should fail if customFields is an array with invalid objects', async () => {
			await request
				.post(api('livechat/custom.fields'))
				.send({ token: 'invalid-token', customFields: [{}] })
				.expect(400);
		});
		it('should fail if token is not a valid token', async () => {
			await request
				.post(api('livechat/custom.fields'))
				.send({ token: 'invalid-token', customFields: [{ key: 'invalid-key', value: 'invalid-value', overwrite: true }] })
				.expect(400);
		});
		it('should fail when customFields.key is invalid', async () => {
			const visitor = await createVisitor();
			await request
				.post(api('livechat/custom.fields'))
				.send({
					token: visitor.token,
					customFields: [{ key: 'invalid-key', value: 'invalid-value', overwrite: true }],
				})
				.expect(400);
		});
		it('should save a custom field on visitor', async () => {
			const visitor = await createVisitor();
			const customFieldName = `new_custom_field_${Date.now()}`;
			await createCustomField({
				searchable: true,
				field: customFieldName,
				label: customFieldName,
				defaultValue: 'test_default_address',
				scope: 'visitor',
				visibility: 'public',
				regexp: '',
			});

			const { body } = await request
				.post(api('livechat/custom.fields'))
				.send({ token: visitor.token, customFields: [{ key: customFieldName, value: 'test_address', overwrite: true }] })
				.expect(200);

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('fields');
			expect(body.fields).to.be.an('array');
			expect(body.fields).to.have.lengthOf(1);
			expect(body.fields[0]).to.have.property('value', 'test_address');
		});
	});
});
