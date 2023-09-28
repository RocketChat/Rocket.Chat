import { faker } from '@faker-js/faker';
import type { ILivechatVisitor } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createCustomField, deleteCustomField } from '../../../data/livechat/custom-fields';
import {
	makeAgentAvailable,
	createAgent,
	createLivechatRoom,
	createVisitor,
	startANewLivechatRoomAndTakeIt,
} from '../../../data/livechat/rooms';
import { getRandomVisitorToken } from '../../../data/livechat/users';
import { getLivechatVisitorByToken } from '../../../data/livechat/visitor';
import { updatePermission, updateSetting, removePermissionFromAllRoles, restorePermissionToRoles } from '../../../data/permissions.helper';
import { adminUsername } from '../../../data/user';
import { IS_EE } from '../../../e2e/config/constants';

describe('LIVECHAT - visitors', function () {
	this.retries(0);
	let visitor: ILivechatVisitor;

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
		await updatePermission('view-livechat-manager', ['admin']);
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
	});

	describe('livechat/visitors.info', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-l-room', []);

			await request
				.get(api('livechat/visitors.info?visitorId=invalid'))
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
				.get(api('livechat/visitors.info?visitorId=invalid'))
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
				.get(api(`livechat/visitors.info?visitorId=${visitor._id}`))
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
			await request.get(api('omnichannel/contact.search?email=')).set(credentials).expect('Content-Type', 'application/json').expect(400);
		});
		it('should fail if custom is passed but is not JSON serializable', async () => {
			await request
				.get(api('omnichannel/contact.search?custom={a":1}'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
		it('should fail if custom is an empty object and no email|phone are provided', async () => {
			await request
				.get(api('omnichannel/contact.search?custom={}'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
		it('should find a contact by email', async () => {
			const visitor = await createVisitor();
			await request
				.get(api(`omnichannel/contact.search?email=${visitor.visitorEmails?.[0].address}`))
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
				.get(api(`omnichannel/contact.search?phone=${visitor.phone?.[0].phoneNumber}`))
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
				.get(api(`omnichannel/contact.search?custom=${JSON.stringify({ address: 'Rocket.Chat' })}`))
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
				.get(api(`omnichannel/contact.search?custom=${JSON.stringify({ nope: 'nel' })}`))
				.set(credentials)
				.send();
			expect(res.body).to.have.property('success', true);
			expect(res.body.contact).to.be.null;
		});

		it('should not break if more than 1 custom field are passed', async () => {
			const res = await request
				.get(api(`omnichannel/contact.search?custom=${JSON.stringify({ nope: 'nel', another: 'field' })}`))
				.set(credentials)
				.send();
			expect(res.body).to.have.property('success', true);
			expect(res.body.contact).to.be.null;
		});

		it('should not break if bad things are passed as custom field keys', async () => {
			const res = await request
				.get(api(`omnichannel/contact.search?custom=${JSON.stringify({ $regex: 'nel' })}`))
				.set(credentials)
				.send();
			expect(res.body).to.have.property('success', true);
			expect(res.body.contact).to.be.null;
		});

		it('should not break if bad things are passed as custom field keys 2', async () => {
			const res = await request
				.get(api(`omnichannel/contact.search?custom=${JSON.stringify({ '$regex: { very-bad }': 'nel' })}`))
				.set(credentials)
				.send();
			expect(res.body).to.have.property('success', true);
			expect(res.body.contact).to.be.null;
		});

		it('should not break if bad things are passed as custom field values', async () => {
			const res = await request
				.get(api(`omnichannel/contact.search?custom=${JSON.stringify({ nope: '^((ab)*)+$' })}`))
				.set(credentials)
				.send();
			expect(res.body).to.have.property('success', true);
			expect(res.body.contact).to.be.null;
		});
	});
	// Check if this endpoint is still being used
	describe('livechat/room.visitor', () => {
		it('should fail if user doesnt have view-l-room permission', async () => {
			await updatePermission('view-l-room', []);
			const res = await request.put(api(`livechat/room.visitor`)).set(credentials).send();
			expect(res.body).to.have.property('success', false);
		});
		it('should fail if rid is not on body params', async () => {
			await updatePermission('view-l-room', ['admin', 'livechat-agent']);
			const res = await request.put(api(`livechat/room.visitor`)).set(credentials).send();
			expect(res.body).to.have.property('success', false);
		});
		it('should fail if oldVisitorId is not on body params', async () => {
			const res = await request.put(api(`livechat/room.visitor`)).set(credentials).send({ rid: 'GENERAL' });
			expect(res.body).to.have.property('success', false);
		});
		it('should fail if newVisitorId is not on body params', async () => {
			const res = await request.put(api(`livechat/room.visitor`)).set(credentials).send({ rid: 'GENERAL', oldVisitorId: 'GENERAL' });
			expect(res.body).to.have.property('success', false);
		});
		it('should fail if oldVisitorId doesnt point to a valid visitor', async () => {
			const res = await request
				.put(api(`livechat/room.visitor`))
				.set(credentials)
				.send({ rid: 'GENERAL', oldVisitorId: 'GENERAL', newVisitorId: 'GENERAL' });
			expect(res.body).to.have.property('success', false);
		});
		it('should fail if rid doesnt point to a valid room', async () => {
			const visitor = await createVisitor();
			const res = await request
				.put(api(`livechat/room.visitor`))
				.set(credentials)
				.send({ rid: 'GENERAL', oldVisitorId: visitor._id, newVisitorId: visitor._id });
			expect(res.body).to.have.property('success', false);
		});
		it('should fail if oldVisitorId is trying to change a room is not theirs', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const visitor2 = await createVisitor();

			const res = await request
				.put(api(`livechat/room.visitor`))
				.set(credentials)
				.send({ rid: room._id, oldVisitorId: visitor2._id, newVisitorId: visitor._id });
			expect(res.body).to.have.property('success', false);
		});
		it('should successfully change a room visitor with a new one', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const visitor2 = await createVisitor();

			const res = await request
				.put(api(`livechat/room.visitor`))
				.set(credentials)
				.send({ rid: room._id, oldVisitorId: visitor._id, newVisitorId: visitor2._id });
			expect(res.body).to.have.property('success', true);
			expect(res.body.room).to.have.property('v');
			expect(res.body.room.v._id).to.equal(visitor2._id);
		});
	});
	describe('livechat/visitors.search', () => {
		it('should fail if user doesnt have view-l-room permission', async () => {
			await updatePermission('view-l-room', []);
			const res = await request.get(api(`livechat/visitors.search?text=nel`)).set(credentials).send();
			expect(res.body).to.have.property('success', false);
		});
		it('should fail if term is not on query params', async () => {
			await updatePermission('view-l-room', ['admin', 'livechat-agent']);
			const res = await request.get(api(`livechat/visitors.search`)).set(credentials).send();
			expect(res.body).to.have.property('success', false);
		});
		it('should not fail when term is an evil regex string', async () => {
			const res = await request.get(api(`livechat/visitors.search?term=^((ab)*)+$`)).set(credentials).send();
			expect(res.body).to.have.property('success', true);
		});
		it('should return a list of visitors when term is a valid string', async () => {
			const visitor = await createVisitor();

			const res = await request
				.get(api(`livechat/visitors.search?term=${visitor.name}`))
				.set(credentials)
				.send();
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
			const res = await request.get(api(`livechat/visitors.search?term=`)).set(credentials).send();
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
			const res = await request.get(api(`omnichannel/contact?text=nel`)).set(credentials).send();
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
