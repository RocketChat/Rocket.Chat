import { faker } from '@faker-js/faker';
import type { ILivechatVisitor } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, describe, it, after } from 'mocha';
import { type Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createCustomField, deleteCustomField } from '../../../data/livechat/custom-fields';
import {
	makeAgentAvailable,
	createAgent,
	createLivechatRoom,
	createVisitor,
	startANewLivechatRoomAndTakeIt,
	closeOmnichannelRoom,
} from '../../../data/livechat/rooms';
import { getRandomVisitorToken } from '../../../data/livechat/users';
import { getLivechatVisitorByToken } from '../../../data/livechat/visitor';
import {
	updatePermission,
	updateSetting,
	removePermissionFromAllRoles,
	restorePermissionToRoles,
	updateEESetting,
} from '../../../data/permissions.helper';
import { adminUsername } from '../../../data/user';
import { IS_EE } from '../../../e2e/config/constants';

const getLicenseInfo = (loadValues = false) => {
	return request.get(api('licenses.info')).set(credentials).query({ loadValues }).expect(200);
};

describe('LIVECHAT - visitors', () => {
	let visitor: ILivechatVisitor;

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
		await updatePermission('view-livechat-manager', ['admin']);
		await updateEESetting('Livechat_Require_Contact_Verification', 'never');
		await createAgent();
		await makeAgentAvailable();
		visitor = await createVisitor();
	});

	describe('livechat/visitor', () => {
		it('should fail if no "visitor" key is passed as body parameter', async () => {
			const { body } = await request.post(api('livechat/visitor')).send({});
			expect(body).to.have.property('success', false);
		});
		it('should fail if visitor.token is not present', async () => {
			const { body } = await request.post(api('livechat/visitor')).send({ visitor: {} });
			expect(body).to.have.property('success', false);
		});
		it('should fail when token is an empty string', async () => {
			const { body } = await request.post(api('livechat/visitor')).send({ visitor: { token: '' } });
			expect(body).to.have.property('success', false);
		});
		it('should create a visitor', async () => {
			const { body } = await request.post(api('livechat/visitor')).send({ visitor: { token: 'test' } });
			expect(body).to.have.property('success', true);
			expect(body).to.have.property('visitor');
			expect(body.visitor).to.have.property('token', 'test');

			// Ensure all new visitors are created as online :)
			expect(body.visitor).to.have.property('status', 'online');
		});
		it('should create a visitor with provided extra information', async () => {
			const token = `${new Date().getTime()}-test`;
			const phone = new Date().getTime().toString();
			const { body } = await request.post(api('livechat/visitor')).send({ visitor: { token, phone } });
			expect(body).to.have.property('success', true);
			expect(body).to.have.property('visitor');
			expect(body.visitor).to.have.property('token', token);
			expect(body.visitor).to.have.property('phone');
			expect(body.visitor.phone[0].phoneNumber).to.equal(phone);
		});
		it('should save customFields when passed', async () => {
			const customFieldName = `new_custom_field_${Date.now()}`;
			const token = `${new Date().getTime()}-test`;
			await createCustomField({
				searchable: true,
				field: customFieldName,
				label: customFieldName,
				defaultValue: 'test_default_address',
				scope: 'visitor',
				visibility: 'public',
				regexp: '',
			});
			const { body } = await request.post(api('livechat/visitor')).send({
				visitor: {
					token,
					customFields: [{ key: customFieldName, value: 'Not a real address :)', overwrite: true }],
				},
			});

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('visitor');
			expect(body.visitor).to.have.property('token', token);
			expect(body.visitor).to.have.property('livechatData');
			expect(body.visitor.livechatData).to.have.property(customFieldName, 'Not a real address :)');
		});
		it('should update a current visitor when phone is same', async () => {
			const token = `${new Date().getTime()}-test`;
			const token2 = `${new Date().getTime()}-test2`;
			const phone = new Date().getTime().toString();
			const { body } = await request.post(api('livechat/visitor')).send({ visitor: { token, phone } });
			expect(body).to.have.property('success', true);

			const { body: body2 } = await request.post(api('livechat/visitor')).send({
				visitor: {
					token: token2,
					phone,
				},
			});

			expect(body2).to.have.property('success', true);
			expect(body2).to.have.property('visitor');

			// Same visitor won't update the token
			expect(body2.visitor).to.have.property('token', token);
			expect(body2.visitor).to.have.property('phone');
			expect(body2.visitor.phone[0].phoneNumber).to.equal(phone);
		});
		it('should update a visitor custom fields when customFields key is provided', async () => {
			const token = `${new Date().getTime()}-test`;
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
			const { body } = await request.post(api('livechat/visitor')).send({
				visitor: {
					token,
					customFields: [{ key: customFieldName, value: 'Not a real address :)', overwrite: true }],
				},
			});

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('visitor');
			expect(body.visitor).to.have.property('token', token);
			expect(body.visitor).to.have.property('livechatData');
			expect(body.visitor.livechatData).to.have.property(customFieldName, 'Not a real address :)');
		});

		it('should not update a custom field when it does not exists', async () => {
			const token = `${new Date().getTime()}-test`;
			const customFieldName = `new_custom_field_${Date.now()}`;
			const { body } = await request.post(api('livechat/visitor')).send({
				visitor: {
					token,
					customFields: [{ key: customFieldName, value: 'Not a real address :)', overwrite: true }],
				},
			});

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('visitor');
			expect(body.visitor).to.have.property('token', token);
			expect(body.visitor).to.not.have.property('livechatData');
		});

		it('should not update a custom field when the scope of it is not visitor', async () => {
			const token = `${new Date().getTime()}-test`;
			const customFieldName = `new_custom_field_${Date.now()}`;
			await createCustomField({
				searchable: true,
				field: customFieldName,
				label: customFieldName,
				defaultValue: 'test_default_address',
				scope: 'room',
				visibility: 'public',
				regexp: '',
			});
			const { body } = await request.post(api('livechat/visitor')).send({
				visitor: {
					token,
					customFields: [{ key: customFieldName, value: 'Not a real address :)', overwrite: true }],
				},
			});

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('visitor');
			expect(body.visitor).to.have.property('token', token);
			expect(body.visitor).to.not.have.property('livechatData');
		});

		it('should not update a custom field when the overwrite flag is false', async () => {
			const token = `${new Date().getTime()}-test`;
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
			await request.post(api('livechat/visitor')).send({
				visitor: {
					token,
					customFields: [{ key: customFieldName, value: 'Not a real address :)', overwrite: true }],
				},
			});

			const { body } = await request.post(api('livechat/visitor')).send({
				visitor: {
					token,
					customFields: [{ key: customFieldName, value: 'This should not change!', overwrite: false }],
				},
			});

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('visitor');
			expect(body.visitor).to.have.property('token', token);
			expect(body.visitor).to.have.property('livechatData');
			expect(body.visitor.livechatData).to.have.property(customFieldName, 'Not a real address :)');
		});

		it('should not validate required custom fields if no custom fields are provided', async () => {
			const token = `${new Date().getTime()}-test`;
			const customFieldName = `required_custom_field`;
			await createCustomField({
				searchable: true,
				field: customFieldName,
				label: customFieldName,
				defaultValue: 'default_value',
				scope: 'visitor',
				visibility: 'public',
				regexp: '',
				required: true,
			});
			const { body } = await request.post(api('livechat/visitor')).send({ visitor: { token } });
			expect(body).to.have.property('success', true);
			expect(body).to.have.property('visitor');
			expect(body.visitor).to.have.property('token', token);
			await deleteCustomField(customFieldName);
		});

		it('should fail if provided custom fields but are missing required ones', async () => {
			const token = `${new Date().getTime()}-test`;
			const optionalCustomFieldName = `optional_custom_field`;
			await createCustomField({
				searchable: true,
				field: optionalCustomFieldName,
				label: optionalCustomFieldName,
				defaultValue: 'default_value',
				scope: 'visitor',
				visibility: 'public',
				regexp: '',
				required: false,
			});
			const requiredCustomFieldName = `required_custom_field`;
			await createCustomField({
				searchable: true,
				field: requiredCustomFieldName,
				label: requiredCustomFieldName,
				defaultValue: 'default_value',
				scope: 'visitor',
				visibility: 'public',
				regexp: '',
				required: true,
			});
			const { body } = await request
				.post(api('livechat/visitor'))
				.send({ visitor: { token, customFields: [{ key: optionalCustomFieldName, value: 'test', overwrite: true }] } });
			expect(body).to.have.property('success', false);
			expect(body).to.have.property('error');
			expect(body.error).to.be.equal(`Missing required custom fields: required_custom_field`);
			await Promise.all([deleteCustomField(optionalCustomFieldName), deleteCustomField(requiredCustomFieldName)]);
		});

		describe('special cases', () => {
			before(async () => {
				await updateSetting('Livechat_Allow_collect_and_store_HTTP_header_informations', true);
			});
			after(async () => {
				await updateSetting('Livechat_Allow_collect_and_store_HTTP_header_informations', false);
			});

			it('should allow to create a visitor without passing connectionData when GDPR setting is enabled', async () => {
				const token = `${new Date().getTime()}-test`;

				const { body } = await request.post(api('livechat/visitor')).send({ visitor: { token } });

				expect(body).to.have.property('success', true);
				expect(body).to.have.property('visitor');
				expect(body.visitor).to.have.property('token', token);
			});
		});
	});

	describe('livechat/visitors.info', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-l-room', []);

			await request
				.get(api('livechat/visitors.info'))
				.query({ visitorId: 'invalid' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('User does not have the permissions required for this action [error-unauthorized]');
				});
		});
		it('should return an "visitor not found error" when the visitor doe snot exists', async () => {
			await updatePermission('view-l-room', ['admin']);

			await request
				.get(api('livechat/visitors.info'))
				.query({ visitorId: 'invalid' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('visitor-not-found');
				});
		});
		it('should return the visitor info', async () => {
			await request
				.get(api('livechat/visitors.info'))
				.query({ visitorId: visitor._id })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.visitor._id).to.be.equal(visitor._id);
				});
		});
	});

	describe('livechat/visitors.pagesVisited', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-l-room', []);

			await request
				.get(api('livechat/visitors.pagesVisited/room-id'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('User does not have the permissions required for this action [error-unauthorized]');
				});
		});
		it('should return an "error" when the roomId param is not provided', async () => {
			await updatePermission('view-l-room', ['admin']);

			await request
				.get(api('livechat/visitors.pagesVisited/room-id'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
		it('should return an array of pages', async () => {
			await updatePermission('view-l-room', ['admin']);
			const createdVisitor = await createVisitor();
			const createdRoom = await createLivechatRoom(createdVisitor.token);

			await request
				.get(api(`livechat/visitors.pagesVisited/${createdRoom._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.pages).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				});
		});
	});

	describe('livechat/visitors.chatHistory/room/room-id/visitor/visitor-id', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-l-room', []);

			await request
				.get(api('livechat/visitors.chatHistory/room/room-id/visitor/visitor-id'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('User does not have the permissions required for this action [error-unauthorized]');
				});
		});
		it('should return an "error" when the roomId param is invalid', async () => {
			await updatePermission('view-l-room', ['admin']);

			await request
				.get(api('livechat/visitors.chatHistory/room/room-id/visitor/visitor-id'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
		it('should return an array of chat history', async () => {
			await updatePermission('view-l-room', ['admin']);
			const createdVisitor = await createVisitor();

			const createdRoom = await createLivechatRoom(createdVisitor.token);
			await request
				.get(api(`livechat/visitors.chatHistory/room/${createdRoom._id}/visitor/${createdVisitor._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.history).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				});
		});
	});

	describe('livechat/visitor/:token', () => {
		// get
		it("should return a 'invalid token' error when visitor with given token does not exist ", async () => {
			await request
				.get(api('livechat/visitor/invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('[invalid-token]');
				});
		});

		it('should return an error when the "token" query parameter is not valid', async () => {
			await request
				.get(api('livechat/visitor/invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('should return a visitor when the query params is all valid', async () => {
			await request
				.get(api(`livechat/visitor/${visitor.token}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('visitor');
				});
		});

		// delete
		it("should return a 'invalid token' error when visitor with given token does not exist ", async () => {
			await request
				.delete(api('livechat/visitor/invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('[invalid-token]');
				});
		});

		it('should return an error when the "token" query parameter is not valid', async () => {
			await request
				.delete(api('livechat/visitor/invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it("should return a 'visitor-has-open-rooms' error when there are open rooms", async () => {
			await updateSetting('Livechat_Allow_collect_and_store_HTTP_header_informations', false);
			const createdVisitor = await createVisitor();
			await createLivechatRoom(createdVisitor.token);

			await request
				.delete(api(`livechat/visitor/${createdVisitor.token}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('Cannot remove visitors with opened rooms [visitor-has-open-rooms]');
				});
		});

		it("should not return a 'visitor-has-open-rooms' when visitor has open rooms but GDPR is enabled", async () => {
			await updateSetting('Livechat_Allow_collect_and_store_HTTP_header_informations', true);
			const createdVisitor = await createVisitor();
			await createLivechatRoom(createdVisitor.token);

			await request
				.delete(api(`livechat/visitor/${createdVisitor.token}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
		});

		it('should return a visitor when the query params is all valid', async () => {
			const createdVisitor = await createVisitor();
			await request
				.delete(api(`livechat/visitor/${createdVisitor.token}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('visitor');
					expect(res.body.visitor).to.have.property('_id');
					expect(res.body.visitor).to.have.property('ts');
					expect(res.body.visitor._id).to.be.equal(createdVisitor._id);
				});
		});

		it('should not affect MAC count when a visitor is removed via GDPR', async () => {
			const { visitor, room } = await startANewLivechatRoomAndTakeIt();
			// agent should send a message on the room
			await request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						rid: room._id,
						msg: 'test',
					},
				});
			const { body: currentLicense } = await getLicenseInfo(true);

			await request
				.delete(api(`livechat/visitor/${visitor.token}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			const { body: licenseAfterGdpr } = await getLicenseInfo(true);

			expect(currentLicense.license).to.have.property('limits');
			expect(currentLicense.license.limits).to.have.property('monthlyActiveContacts');
			expect(currentLicense.license.limits.monthlyActiveContacts).to.have.property('value');
			const currentLimit = currentLicense.license.limits.monthlyActiveContacts.value;

			expect(licenseAfterGdpr.license).to.have.property('limits');
			expect(licenseAfterGdpr.license.limits).to.have.property('monthlyActiveContacts');
			expect(licenseAfterGdpr.license.limits.monthlyActiveContacts).to.have.property('value');
			const limitAfterGdpr = licenseAfterGdpr.license.limits.monthlyActiveContacts.value;

			expect(limitAfterGdpr).to.be.equal(currentLimit);
		});

		it("should return a 'error-removing-visitor' error when removeGuest's result is false", async () => {
			await request
				.delete(api('livechat/visitor/123'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
	});

	describe('livechat/visitors.autocomplete', () => {
		it('should return an error when the user doesnt have the right permissions', async () => {
			await updatePermission('view-l-room', []);
			await request
				.get(api('livechat/visitors.autocomplete'))
				.set(credentials)
				.query({ selector: 'invalid' })
				.query({ selector: 'xxx' })
				.expect('Content-Type', 'application/json')
				.expect(403);
		});

		it('should return an error when the "selector" query parameter is not valid', async () => {
			await updatePermission('view-l-room', ['admin', 'livechat-agent']);
			await request
				.get(api('livechat/visitors.autocomplete'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal("must have required property 'selector' [invalid-params]");
				});
		});

		it('should return an error if "selector" param is not JSON serializable', async () => {
			await updatePermission('view-l-room', ['admin', 'livechat-agent']);
			await request
				.get(api('livechat/visitors.autocomplete'))
				.query({ selector: '{invalid' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('should return a list of visitors when the query params is all valid', async () => {
			await updatePermission('view-l-room', ['admin', 'livechat-agent']);
			const createdVisitor = await createVisitor();

			await request
				.get(api('livechat/visitors.autocomplete'))
				.query({ selector: JSON.stringify({ term: createdVisitor.name }) })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items');
					expect(res.body.items).to.be.an('array');
					expect(res.body.items).to.have.length.of.at.least(1);
					expect(res.body.items[0]).to.have.property('_id');
					expect(res.body.items[0]).to.have.property('name');

					const visitor = res.body.items.find((item: any) => item._id === createdVisitor._id);
					expect(visitor).to.have.property('_id');
					expect(visitor).to.have.property('name');
					expect(visitor._id).to.be.equal(createdVisitor._id);
				});
		});
	});

	describe('livechat/visitors.searchChats/room/:roomId/visitor/:visitorId', () => {
		it('should return an error when the user doesnt have the right permissions', async () => {
			await updatePermission('view-l-room', []);
			await request
				.get(api('livechat/visitors.searchChats/room/123/visitor/123'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
		});

		it('should throw an error when the roomId is not valid', async () => {
			await updatePermission('view-l-room', ['admin', 'livechat-agent']);

			await request
				.get(api('livechat/visitors.searchChats/room/invalid/visitor/123'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('should return an empty array if the user is not the one serving the chat', async () => {
			await updatePermission('view-l-room', ['admin', 'livechat-agent']);
			await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
			const createdVisitor = await createVisitor();
			const room = await createLivechatRoom(createdVisitor.token);
			await request
				.get(api(`livechat/visitors.searchChats/room/${room._id}/visitor/123`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('history');
					expect(res.body.history).to.be.an('array');
					expect(res.body.history).to.have.lengthOf(0);
				});
		});

		it('should return an empty array if the visitorId doesnt correlate to room', async () => {
			await updatePermission('view-l-room', ['admin', 'livechat-agent']);
			await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
			const createdVisitor = await createVisitor();
			const room = await createLivechatRoom(createdVisitor.token);
			await request
				.get(api(`livechat/visitors.searchChats/room/${room._id}/visitor/123`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('history');
					expect(res.body.history).to.be.an('array');
					expect(res.body.history).to.have.lengthOf(0);
				});
		});

		it('should return a list of chats when the query params is all valid', async () => {
			await updatePermission('view-l-room', ['admin', 'livechat-agent', 'livechat-manager']);
			await createAgent();

			const {
				room: { _id: roomId },
				visitor: { _id: visitorId },
			} = await startANewLivechatRoomAndTakeIt();

			await request
				.get(api(`livechat/visitors.searchChats/room/${roomId}/visitor/${visitorId}?closedChatsOnly=false&servedChatsOnly=true`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('history');
					expect(res.body.history).to.be.an('array');
					expect(res.body.history).to.have.length.of.at.least(1);
					expect(res.body.history[0]).to.have.property('_id');
					expect(res.body.history[0]).to.have.property('fname');
					expect(res.body.history[0]).to.have.property('v');
				});
		});

		it('should return a list of chats when filtered by ', async () => {
			const {
				room: { _id: roomId },
				visitor: { _id: visitorId },
			} = await startANewLivechatRoomAndTakeIt();

			await request
				.get(api(`livechat/visitors.searchChats/room/${roomId}/visitor/${visitorId}?source=api&servedChatsOnly=true`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('history');
					expect(res.body.history).to.be.an('array');
					expect(res.body.history).to.have.length.of.at.least(1);
					expect(res.body.history[0]).to.have.property('_id');
					expect(res.body.history[0]).to.have.property('fname');
					expect(res.body.history[0]).to.have.property('v');
				});
		});

		it('should return only closed chats when closedChatsOnly is true', async () => {
			const {
				room: { _id: roomId },
				visitor: { _id: visitorId },
			} = await startANewLivechatRoomAndTakeIt();

			await closeOmnichannelRoom(roomId);

			await request
				.get(api(`livechat/visitors.searchChats/room/${roomId}/visitor/${visitorId}?closedChatsOnly=true&servedChatsOnly=false`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('history');
					expect(res.body.history).to.be.an('array');
					expect(res.body.history.find((chat: any) => chat._id === roomId)).to.be.an('object');
				});
		});

		it('should return only served chats when servedChatsOnly is true', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);

			await request
				.get(api(`livechat/visitors.searchChats/room/${room._id}/visitor/${visitor._id}?closedChatsOnly=false&servedChatsOnly=true`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('history');
					expect(res.body.history).to.be.an('array');
					expect(res.body.history.find((chat: any) => chat._id === room._id)).to.be.undefined;
				});
		});

		it('should return closed rooms (served & unserved) when `closedChatsOnly` is true & `servedChatsOnly` is false', async () => {
			const {
				room: { _id: roomId },
				visitor: { _id: visitorId, token },
			} = await startANewLivechatRoomAndTakeIt();
			await closeOmnichannelRoom(roomId);
			const room2 = await createLivechatRoom(token);
			await closeOmnichannelRoom(room2._id);

			await request
				.get(api(`livechat/visitors.searchChats/room/${roomId}/visitor/${visitorId}?closedChatsOnly=true&servedChatsOnly=false`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('history');
					expect(res.body.history).to.be.an('array');
					expect(res.body.history.find((chat: any) => chat._id === roomId)).to.be.an('object');
					expect(res.body.history.find((chat: any) => chat._id === room2._id)).to.be.an('object');
				});
		});

		it('should return all chats when both closed & served flags are false', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await closeOmnichannelRoom(room._id);
			const room2 = await createLivechatRoom(visitor.token);
			await closeOmnichannelRoom(room2._id);
			await createLivechatRoom(visitor.token);

			const { body } = await request
				.get(api(`livechat/visitors.searchChats/room/${room._id}/visitor/${visitor._id}?closedChatsOnly=false&servedChatsOnly=false`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('success', true);
			expect(body.count).to.be.equal(3);
			expect(body.history.filter((chat: any) => !!chat.closedAt).length === 2).to.be.true;
			expect(body.history.filter((chat: any) => !chat.closedAt).length === 1).to.be.true;
			expect(body.total).to.be.equal(3);
		});
	});

	describe('livechat/visitor.status', () => {
		it('should return an error if token is not present as body param', async () => {
			const res = await request.post(api('livechat/visitor.status')).set(credentials).expect(400);
			expect(res.body).to.have.property('success', false);
		});
		it('should return an error if status is not present as body param', async () => {
			const res = await request.post(api('livechat/visitor.status')).set(credentials).send({ token: '123' }).expect(400);
			expect(res.body).to.have.property('success', false);
		});
		it('should return an error if token is not a valid guest token', async () => {
			const res = await request.post(api('livechat/visitor.status')).set(credentials).send({ token: '123', status: 'online' }).expect(400);
			expect(res.body).to.have.property('success', false);
		});
		it('should update visitor status if all things are valid', async () => {
			const visitor = await createVisitor();
			const res = await request
				.post(api('livechat/visitor.status'))
				.set(credentials)
				.send({ token: visitor.token, status: 'online' })
				.expect(200);
			expect(res.body).to.have.property('success', true);
		});
	});

	describe('GET [omnichannel/contact.search]', () => {
		it('should fail if no email|phone|custom params are passed as query', async () => {
			await request.get(api('omnichannel/contact.search')).set(credentials).expect('Content-Type', 'application/json').expect(400);
		});
		it('should fail if its trying to find by an empty string', async () => {
			await request
				.get(api('omnichannel/contact.search'))
				.query({ email: '' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
		it('should fail if custom is passed but is not JSON serializable', async () => {
			await request
				.get(api('omnichannel/contact.search'))
				.query({ custom: '{a":1}' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
		it('should fail if custom is an empty object and no email|phone are provided', async () => {
			await request
				.get(api('omnichannel/contact.search'))
				.query({ custom: '{}' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
		it('should find a contact by email', async () => {
			const visitor = await createVisitor();
			await request
				.get(api('omnichannel/contact.search'))
				.query({ email: visitor.visitorEmails?.[0].address })
				.set(credentials)
				.send()
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('contact');
					expect(res.body.contact).to.have.property('_id');
					expect(res.body.contact).to.have.property('name');
					expect(res.body.contact).to.have.property('username');
					expect(res.body.contact).to.have.property('phone');
					expect(res.body.contact).to.have.property('visitorEmails');
					expect(res.body.contact._id).to.be.equal(visitor._id);
					expect(res.body.contact.phone[0].phoneNumber).to.be.equal(visitor.phone?.[0].phoneNumber);
					// done();
				});
		});
		it('should find a contact by phone', async () => {
			const visitor = await createVisitor();
			await request
				.get(api('omnichannel/contact.search'))
				.query({ phone: visitor.phone?.[0].phoneNumber })
				.set(credentials)
				.send()
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('contact');
					expect(res.body.contact).to.have.property('_id');
					expect(res.body.contact).to.have.property('name');
					expect(res.body.contact).to.have.property('username');
					expect(res.body.contact).to.have.property('phone');
					expect(res.body.contact).to.have.property('visitorEmails');
					expect(res.body.contact._id).to.be.equal(visitor._id);
					expect(res.body.contact.phone[0].phoneNumber).to.be.equal(visitor.phone?.[0].phoneNumber);
				});
		});
		it('should find a contact by custom field', async () => {
			const cfID = 'address';
			const cf = await createCustomField({
				searchable: true,
				field: 'address',
				label: 'address',
				defaultValue: 'test_default_address',
				scope: 'visitor',
				visibility: 'public',
				regexp: '',
			});

			if (!cf) {
				throw new Error('Custom field not created');
			}

			await createVisitor();

			await request
				.get(api('omnichannel/contact.search'))
				.query({ custom: JSON.stringify({ address: 'Rocket.Chat' }) })
				.set(credentials)
				.send()
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.contact).to.have.property('name');
					expect(res.body.contact).to.have.property('username');
					expect(res.body.contact).to.have.property('phone');
					expect(res.body.contact).to.have.property('visitorEmails');
					expect(res.body.contact.livechatData).to.have.property('address', 'Rocket.Chat street');
				});

			await deleteCustomField(cfID);
		});

		it('should return null if an invalid set of custom fields is passed and no other params are sent', async () => {
			const res = await request
				.get(api('omnichannel/contact.search'))
				.query({ custom: JSON.stringify({ nope: 'nel' }) })
				.set(credentials)
				.send();
			expect(res.body).to.have.property('success', true);
			expect(res.body.contact).to.be.null;
		});

		it('should not break if more than 1 custom field are passed', async () => {
			const res = await request
				.get(api('omnichannel/contact.search'))
				.query({ custom: JSON.stringify({ nope: 'nel', another: 'field' }) })
				.set(credentials)
				.send();
			expect(res.body).to.have.property('success', true);
			expect(res.body.contact).to.be.null;
		});

		it('should not break if bad things are passed as custom field keys', async () => {
			const res = await request
				.get(api('omnichannel/contact.search'))
				.query({ custom: JSON.stringify({ $regex: 'nel' }) })
				.set(credentials)
				.send();
			expect(res.body).to.have.property('success', true);
			expect(res.body.contact).to.be.null;
		});

		it('should not break if bad things are passed as custom field keys 2', async () => {
			const res = await request
				.get(api('omnichannel/contact.search'))
				.query({ custom: JSON.stringify({ '$regex: { very-bad }': 'nel' }) })
				.set(credentials)
				.send();
			expect(res.body).to.have.property('success', true);
			expect(res.body.contact).to.be.null;
		});

		it('should not break if bad things are passed as custom field values', async () => {
			const res = await request
				.get(api('omnichannel/contact.search'))
				.query({ custom: JSON.stringify({ nope: '^((ab)*)+$' }) })
				.set(credentials)
				.send();
			expect(res.body).to.have.property('success', true);
			expect(res.body.contact).to.be.null;
		});
	});

	describe('livechat/visitors.search', () => {
		it('should fail if user doesnt have view-l-room permission', async () => {
			await updatePermission('view-l-room', []);
			const res = await request.get(api('livechat/visitors.search')).query({ text: 'nel' }).set(credentials).send();
			expect(res.body).to.have.property('success', false);
		});
		it('should fail if term is not on query params', async () => {
			await updatePermission('view-l-room', ['admin', 'livechat-agent']);
			const res = await request.get(api(`livechat/visitors.search`)).set(credentials).send();
			expect(res.body).to.have.property('success', false);
		});
		it('should not fail when term is an evil regex string', async () => {
			const res = await request.get(api('livechat/visitors.search')).query({ term: '^((ab)*)+$' }).set(credentials).send();
			expect(res.body).to.have.property('success', true);
		});
		it('should return a list of visitors when term is a valid string', async () => {
			const visitor = await createVisitor();

			const res = await request.get(api('livechat/visitors.search')).query({ term: visitor.name }).set(credentials).send();
			expect(res.body).to.have.property('success', true);
			expect(res.body.visitors).to.be.an('array');
			expect(res.body.visitors).to.have.lengthOf.greaterThan(0);
			expect(res.body.visitors[0]).to.have.property('_id', visitor._id);
			expect(res.body.visitors[0]).to.have.property('name', visitor.name);
			expect(res.body.visitors[0]).to.have.property('username', visitor.username);
			expect(res.body.visitors[0]).to.have.property('visitorEmails');
			expect(res.body.visitors[0]).to.have.property('phone');
		});
		it('should return a list of visitors when term is an empty string', async () => {
			const res = await request.get(api('livechat/visitors.search')).query({ term: '' }).set(credentials).send();
			expect(res.body).to.have.property('success', true);
			expect(res.body.visitors).to.be.an('array');
			expect(res.body.visitors).to.have.lengthOf.greaterThan(0);
			expect(res.body.visitors[0]).to.have.property('_id');
			expect(res.body.visitors[0]).to.have.property('username');
			expect(res.body.visitors[0]).to.have.property('name');
			expect(res.body.visitors[0]).to.have.property('phone');
			expect(res.body.visitors[0]).to.have.property('visitorEmails');
		});
	});
	describe('omnichannel/contact', () => {
		let contact: ILivechatVisitor;
		it('should fail if user doesnt have view-l-room permission', async () => {
			await removePermissionFromAllRoles('view-l-room');
			const res = await request.get(api('omnichannel/contact')).query({ text: 'nel' }).set(credentials).send();
			expect(res.body).to.have.property('success', false);

			await restorePermissionToRoles('view-l-room');
		});
		it('should create a new contact', async () => {
			const token = getRandomVisitorToken();
			const res = await request.post(api('omnichannel/contact')).set(credentials).send({
				name: faker.person.fullName(),
				token,
			});
			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('contact');
			expect(res.body.contact).to.be.an('string');
			const contactId: string = res.body.contact;

			contact = await getLivechatVisitorByToken(token);
			expect(contact._id).to.equal(contactId);
		});
		it('should update an existing contact', async () => {
			const name = faker.person.fullName();
			const res = await request.post(api('omnichannel/contact')).set(credentials).send({
				name,
				token: contact.token,
			});
			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('contact');
			expect(res.body.contact).to.be.an('string');
			expect(res.body.contact).to.equal(contact._id);

			contact = await getLivechatVisitorByToken(contact.token);
			expect(contact.name).to.equal(name);
		});
		it('should change the contact name, email and phone', async () => {
			const name = faker.person.fullName();
			const email = faker.internet.email().toLowerCase();
			const phone = faker.phone.number();
			const res = await request.post(api('omnichannel/contact')).set(credentials).send({
				name,
				email,
				phone,
				token: contact.token,
			});

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('contact');
			expect(res.body.contact).to.be.an('string');
			expect(res.body.contact).to.equal(contact._id);

			contact = await getLivechatVisitorByToken(contact.token);
			expect(contact.name).to.equal(name);
			expect(contact.visitorEmails).to.be.an('array');
			expect(contact.visitorEmails).to.have.lengthOf(1);
			if (contact.visitorEmails?.[0]) {
				expect(contact.visitorEmails[0].address).to.equal(email);
			}
			expect(contact.phone).to.be.an('array');
			expect(contact.phone).to.have.lengthOf(1);
			if (contact.phone?.[0]) {
				expect(contact.phone[0].phoneNumber).to.equal(phone);
			}
		});
		(IS_EE ? it : it.skip)('should change the contact manager', async () => {
			const managerUsername = adminUsername;

			const res = await request
				.post(api('omnichannel/contact'))
				.set(credentials)
				.send({
					contactManager: {
						username: managerUsername,
					},
					token: contact.token,
					name: contact.name,
				});

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('contact');
			expect(res.body.contact).to.be.an('string');
			expect(res.body.contact).to.equal(contact._id);

			contact = await getLivechatVisitorByToken(contact.token);
			expect(contact.contactManager).to.be.an('object');
			expect(contact.contactManager).to.have.property('username', managerUsername);
		});
		it('should change custom fields', async () => {
			const cfName = faker.lorem.word();
			await createCustomField({
				searchable: true,
				field: cfName,
				label: cfName,
				scope: 'visitor',
				visibility: 'visible',
				regexp: '',
			});

			const res = await request
				.post(api('omnichannel/contact'))
				.set(credentials)
				.send({
					token: contact.token,
					name: contact.name,
					customFields: {
						[cfName]: 'test',
					},
				});

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('contact');
			expect(res.body.contact).to.be.an('string');
			expect(res.body.contact).to.equal(contact._id);

			contact = await getLivechatVisitorByToken(contact.token);
			expect(contact).to.have.property('livechatData');
			expect(contact.livechatData).to.have.property(cfName, 'test');
		});
	});
});
