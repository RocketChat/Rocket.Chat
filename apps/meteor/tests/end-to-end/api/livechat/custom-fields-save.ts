import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createCustomField, deleteCustomField } from '../../../data/livechat/custom-fields';
import {
	getSettingValueById,
	removePermissionFromAllRoles,
	restorePermissionToRoles,
	updateSetting,
} from '../../../data/permissions.helper';

describe('LIVECHAT - custom fields', () => {
	let settingLivechatEnabled: boolean;

	before((done) => getCredentials(done));

	before(async () => {
		settingLivechatEnabled = (await getSettingValueById('Livechat_enabled')) as boolean;
		await updateSetting('Livechat_enabled', true);
	});

	after(async () => {
		await updateSetting('Livechat_enabled', settingLivechatEnabled);
	});

	describe('livechat/custom-fields.save', () => {
		let customFieldId: string;

		after(async () => {
			if (customFieldId) {
				await deleteCustomField(customFieldId);
			}
		});

		describe('Authentication/Authorization', () => {
			it('should return an "unauthenticated error" when user is not logged in', async () => {
				await request
					.post(api('livechat/custom-fields.save'))
					.send({
						customFieldId: null,
						customFieldData: {
							field: 'test_field',
							label: 'Test Field',
							scope: 'visitor',
							visibility: 'public',
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(401);
			});

			it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
				await removePermissionFromAllRoles('view-livechat-manager');

				await request
					.post(api('livechat/custom-fields.save'))
					.set(credentials)
					.send({
						customFieldId: null,
						customFieldData: {
							field: 'test_field',
							label: 'Test Field',
							scope: 'visitor',
							visibility: 'public',
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(403);

				await restorePermissionToRoles('view-livechat-manager');
			});
		});

		describe('Create custom field', () => {
			afterEach(async () => {
				if (customFieldId) {
					await deleteCustomField(customFieldId);
					customFieldId = '';
				}
			});

			it('should create a new custom field with minimal required fields', async () => {
				const fieldName = `field_${Date.now()}`;

				await request
					.post(api('livechat/custom-fields.save'))
					.set(credentials)
					.send({
						customFieldId: null,
						customFieldData: {
							field: fieldName,
							label: 'Test Field',
							scope: 'visitor',
							visibility: 'public',
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('customField');
						expect(res.body.customField).to.have.property('_id');
						expect(res.body.customField).to.have.property('label', 'Test Field');
						expect(res.body.customField).to.have.property('scope', 'visitor');
						expect(res.body.customField).to.have.property('visibility', 'public');
						customFieldId = res.body.customField._id;
					});
			});

			it('should create a new custom field with scope "room"', async () => {
				const fieldName = `room_field_${Date.now()}`;

				await request
					.post(api('livechat/custom-fields.save'))
					.set(credentials)
					.send({
						customFieldId: null,
						customFieldData: {
							field: fieldName,
							label: 'Room Test Field',
							scope: 'room',
							visibility: 'public',
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('customField');
						expect(res.body.customField).to.have.property('scope', 'room');
						customFieldId = res.body.customField._id;
					});
			});

			it('should create a new custom field with all optional fields', async () => {
				const fieldName = `full_field_${Date.now()}`;

				await request
					.post(api('livechat/custom-fields.save'))
					.set(credentials)
					.send({
						customFieldId: null,
						customFieldData: {
							field: fieldName,
							label: 'Full Test Field',
							scope: 'visitor',
							visibility: 'public',
							type: 'input',
							regexp: '^[A-Za-z]+$',
							required: true,
							defaultValue: 'default',
							options: 'option1,option2,option3',
							public: true,
							searchable: true,
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('customField');
						expect(res.body.customField).to.have.property('type', 'input');
						expect(res.body.customField).to.have.property('regexp', '^[A-Za-z]+$');
						expect(res.body.customField).to.have.property('required', true);
						expect(res.body.customField).to.have.property('defaultValue', 'default');
						expect(res.body.customField).to.have.property('options', 'option1,option2,option3');
						expect(res.body.customField).to.have.property('public', true);
						expect(res.body.customField).to.have.property('searchable', true);
						customFieldId = res.body.customField._id;
					});
			});

			it('should fail when trying to create a custom field with a field name that already exists', async () => {
				const fieldName = `duplicate_field_${Date.now()}`;

				// Create the first custom field
				const { body } = await request
					.post(api('livechat/custom-fields.save'))
					.set(credentials)
					.send({
						customFieldId: null,
						customFieldData: {
							field: fieldName,
							label: 'First Field',
							scope: 'visitor',
							visibility: 'public',
						},
					})
					.expect(200);

				customFieldId = body.customField._id;

				// Try to create another with the same field name
				await request
					.post(api('livechat/custom-fields.save'))
					.set(credentials)
					.send({
						customFieldId: null,
						customFieldData: {
							field: fieldName,
							label: 'Second Field',
							scope: 'visitor',
							visibility: 'public',
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					});
			});
		});

		describe('Update custom field', () => {
			let existingField: ILivechatCustomField;

			before(async () => {
				const fieldName = `update_test_field_${Date.now()}`;
				existingField = await createCustomField({
					searchable: true,
					field: fieldName,
					label: 'Original Label',
					defaultValue: 'original_default',
					scope: 'visitor',
					visibility: 'public',
					regexp: '',
				});
			});

			after(async () => {
				if (existingField?._id) {
					await deleteCustomField(existingField._id);
				}
			});

			it('should fail when trying to update a non-existent custom field', async () => {
				await request
					.post(api('livechat/custom-fields.save'))
					.set(credentials)
					.send({
						customFieldId: 'non-existent-id',
						customFieldData: {
							field: 'test_field',
							label: 'Updated Label',
							scope: 'visitor',
							visibility: 'public',
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					});
			});

			it('should update an existing custom field with all optional fields', async () => {
				await request
					.post(api('livechat/custom-fields.save'))
					.set(credentials)
					.send({
						customFieldId: existingField._id,
						customFieldData: {
							field: existingField._id,
							label: 'Fully Updated Field',
							scope: existingField.scope,
							visibility: 'public',
							type: 'select',
							regexp: '^[0-9]+$',
							required: true,
							defaultValue: 'new_default',
							options: 'opt1,opt2,opt3',
							public: true,
							searchable: false,
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.customField).to.have.property('label', 'Fully Updated Field');
						expect(res.body.customField).to.have.property('type', 'select');
						expect(res.body.customField).to.have.property('regexp', '^[0-9]+$');
						expect(res.body.customField).to.have.property('required', true);
						expect(res.body.customField).to.have.property('defaultValue', 'new_default');
						expect(res.body.customField).to.have.property('options', 'opt1,opt2,opt3');
						expect(res.body.customField).to.have.property('public', true);
						expect(res.body.customField).to.have.property('searchable', false);
					});
			});
		});
	});
});
