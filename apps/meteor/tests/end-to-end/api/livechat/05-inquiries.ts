import type { Credentials } from '@rocket.chat/api-client';
import type { ILivechatInquiryRecord, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, describe, it, after } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials, methodCall } from '../../../data/api-data';
import {
	closeOmnichannelRoom,
	createAgent,
	createDepartment,
	createLivechatRoom,
	createVisitor,
	deleteVisitor,
	fetchInquiry,
	getLivechatRoomInfo,
	makeAgentAvailable,
	takeInquiry,
} from '../../../data/livechat/rooms';
import { parseMethodResponse } from '../../../data/livechat/utils';
import {
	removePermissionFromAllRoles,
	restorePermissionToRoles,
	updateEESetting,
	updatePermission,
	updateSetting,
} from '../../../data/permissions.helper';
import { password } from '../../../data/user';
import { createUser, login, deleteUser } from '../../../data/users.helper';
import { IS_EE } from '../../../e2e/config/constants';

describe('LIVECHAT - inquiries', () => {
	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
		await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
		await updateEESetting('Livechat_Require_Contact_Verification', 'never');
	});

	describe('livechat/inquiries.list', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-manager', []);
			await request.get(api('livechat/inquiries.list')).set(credentials).expect('Content-Type', 'application/json').expect(403);
		});
		it('should return an array of inquiries', async () => {
			await updatePermission('view-livechat-manager', ['admin']);
			await request
				.get(api('livechat/inquiries.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.inquiries).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				});
		});
	});

	describe('livechat/inquiries.getOne', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-l-room', []);
			await request
				.get(api('livechat/inquiries.getOne'))
				.query({ roomId: 'room-id' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should return a inquiry', async () => {
			await updatePermission('view-l-room', ['admin']);
			await request
				.get(api('livechat/inquiries.getOne'))
				.query({ roomId: 'room-id' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('inquiry');
				});
		});

		it('should get an inquiry by room id', async () => {
			await createAgent();
			const visitor = await createVisitor();
			await makeAgentAvailable();
			const room = await createLivechatRoom(visitor.token);
			const inquiry = await fetchInquiry(room._id);
			await request
				.get(api(`livechat/inquiries.getOne`))
				.query({ roomId: room._id })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('inquiry');
					expect(res.body.inquiry).to.have.property('_id', inquiry._id);
					expect(res.body.inquiry).to.have.property('rid', room._id);
					expect(res.body.inquiry).to.have.property('ts');
					expect(res.body.inquiry.ts).to.be.a('string');
					expect(res.body.inquiry).to.have.property('status', 'queued');
					expect(res.body.inquiry).to.have.property('name', visitor.name);
					expect(res.body.inquiry).to.have.property('t', 'l');
					expect(res.body.inquiry).to.have.property('priorityWeight');
					expect(res.body.inquiry).to.have.property('estimatedWaitingTimeQueue');
					expect(res.body.inquiry.source).to.have.property('type', 'api');
					expect(res.body.inquiry).to.have.property('_updatedAt');
					expect(res.body.inquiry).to.have.property('v').and.be.an('object');
					expect(res.body.inquiry.v).to.have.property('_id', visitor._id);
				});
		});
	});

	describe('POST livechat/inquiries.take', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-l-room', []);
			await request
				.post(api('livechat/inquiries.take'))
				.set(credentials)
				.send({ inquiryId: 'room-id' })
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should throw an error when userId is provided but is invalid', async () => {
			await updatePermission('view-l-room', ['admin', 'livechat-agent']);
			await request
				.post(api('livechat/inquiries.take'))
				.set(credentials)
				.send({ inquiryId: 'room-id', userId: 'invalid-user-id' })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
		it('should throw an error if inquiryId is not an string', async () => {
			await updatePermission('view-l-room', ['admin', 'livechat-agent']);
			await request
				.post(api('livechat/inquiries.take'))
				.set(credentials)
				.send({ inquiryId: { regexxxx: 'bla' }, userId: 'user-id' })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
		it('should take an inquiry if all params are good', async () => {
			await updatePermission('view-l-room', ['admin', 'livechat-agent']);
			const agent = await createAgent();
			const visitor = await createVisitor();
			await makeAgentAvailable();
			const room = await createLivechatRoom(visitor.token);
			const inquiry = await fetchInquiry(room._id);

			await request
				.post(api('livechat/inquiries.take'))
				.set(credentials)
				.send({
					inquiryId: inquiry._id,
					userId: agent._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});
			const inquiry2 = (await fetchInquiry(room._id)) as ILivechatInquiryRecord;
			expect(inquiry2.source?.type).to.equal('api');
			expect(inquiry2.status).to.equal('taken');
		});
		it('should mark a taken room as servedBy me', async () => {
			const agent = await createAgent();
			const visitor = await createVisitor();
			await makeAgentAvailable();
			const room = await createLivechatRoom(visitor.token);
			const inquiry = await fetchInquiry(room._id);

			await request
				.post(api('livechat/inquiries.take'))
				.set(credentials)
				.send({
					inquiryId: inquiry._id,
					userId: agent._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});

			const roomInfo = await getLivechatRoomInfo(room._id);

			expect(roomInfo).to.have.property('servedBy').that.is.an('object');
			expect(roomInfo.servedBy).to.have.property('_id', 'rocketchat.internal.admin.test');
		});
	});

	describe('livechat/inquiries.queuedForUser', () => {
		let testUser: { user: IUser; credentials: { [key: string]: string } };
		before(async () => {
			await updateSetting('Livechat_accept_chats_with_no_agents', true);
			const user = await createUser();
			await createAgent(user.username);
			const credentials2 = await login(user.username, password);
			await makeAgentAvailable(credentials2);

			testUser = {
				user,
				credentials: credentials2,
			};
		});
		after(async () => {
			await updateSetting('Livechat_accept_chats_with_no_agents', false);
			await deleteUser(testUser.user);
		});
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-l-room', []);
			await request.get(api('livechat/inquiries.queuedForUser')).set(credentials).expect('Content-Type', 'application/json').expect(403);
		});
		it('should return an array of inquiries', async () => {
			await restorePermissionToRoles('view-l-room');
			await request
				.get(api('livechat/inquiries.queuedForUser'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.inquiries).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				});
		});
		it('should validate all returned inquiries are queued', async () => {
			await request
				.get(api('livechat/inquiries.queuedForUser'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect(async (res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.inquiries).to.be.an('array');
					for (const inquiry of res.body.inquiries) {
						expect(inquiry).to.have.property('status', 'queued');
					}
				});
		});
		it('should return only public inquiries for a user with no departments', async () => {
			const { body } = await request
				.get(api('livechat/inquiries.queuedForUser'))
				.set(testUser.credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(body).to.have.property('success', true);
			expect(body.inquiries).to.be.an('array');
			for (const inq of body.inquiries) {
				expect(inq).to.not.have.property('department');
				expect(inq).to.have.property('status', 'queued');
			}
		});
		(IS_EE ? it : it.skip)('should return inquiries of the same department as the user', async () => {
			const dep = await createDepartment([{ agentId: testUser.user._id }]);
			const visitor = await createVisitor(dep._id);
			await createLivechatRoom(visitor.token);

			const { body } = await request
				.get(api('livechat/inquiries.queuedForUser'))
				.set(testUser.credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('success', true);
			expect(body.inquiries).to.be.an('array');
			const depInq = body.inquiries.filter((inq: { department: string }) => inq.department === dep._id);

			expect(depInq.length).to.be.equal(1);
		});
		(IS_EE ? it : it.skip)('should not return an inquiry of a department the user is not part of', async () => {
			const dep = await createDepartment();
			const visitor = await createVisitor(dep._id);
			await createLivechatRoom(visitor.token);

			const { body } = await request
				.get(api('livechat/inquiries.queuedForUser'))
				.set(testUser.credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('success', true);
			expect(body.inquiries).to.be.an('array');
			const depInq = body.inquiries.filter((inq: { department: string }) => inq.department === dep._id);

			expect(depInq.length).to.be.equal(0);
		});
	});

	describe('livechat:returnAsInquiry', () => {
		let testUser: { user: IUser; credentials: Credentials };
		before(async () => {
			const user = await createUser();
			await createAgent(user.username);
			const credentials2 = await login(user.username, password);
			await makeAgentAvailable(credentials2);

			testUser = {
				user,
				credentials: credentials2,
			};
		});
		after(async () => {
			await deleteUser(testUser.user);
		});

		it('should throw an error if user doesnt have view-l-room permission', async () => {
			await removePermissionFromAllRoles('view-l-room');
			const { body } = await request
				.post(methodCall('livechat:returnAsInquiry'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'livechat:returnAsInquiry',
						params: ['test'],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			const response = parseMethodResponse(body);

			expect(response.error.error).to.be.equal('error-not-allowed');
		});
		it('should fail if provided room doesnt exists', async () => {
			await restorePermissionToRoles('view-l-room');
			const { body } = await request
				.post(methodCall('livechat:returnAsInquiry'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'livechat:returnAsInquiry',
						params: ['test'],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			const response = parseMethodResponse(body);
			expect(response.error.error).to.be.equal('error-invalid-room');
		});
		it('should fail if room is not a livechat room', async () => {
			const { body } = await request
				.post(methodCall('livechat:returnAsInquiry'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'livechat:returnAsInquiry',
						params: ['GENERAL'],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			const response = parseMethodResponse(body);
			expect(response.error.error).to.be.equal('error-invalid-room');
		});
		it('should fail if room is closed', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await closeOmnichannelRoom(room._id);

			const { body } = await request
				.post(methodCall('livechat:returnAsInquiry'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'livechat:returnAsInquiry',
						params: [room._id],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			const response = parseMethodResponse(body);
			expect(response.error.error).to.be.equal('room-closed');
		});
		it('should fail if no one is serving the room', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const { body } = await request
				.post(methodCall('livechat:returnAsInquiry'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'livechat:returnAsInquiry',
						params: [room._id],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			const response = parseMethodResponse(body);
			expect(response.result).to.be.false;
		});

		let inquiry: ILivechatInquiryRecord;
		(IS_EE ? it : it.skip)('should move a room back to queue', async () => {
			const dep = await createDepartment([{ agentId: testUser.user._id }]);
			const visitor = await createVisitor(dep._id);
			const room = await createLivechatRoom(visitor.token);
			const inq = await fetchInquiry(room._id);
			inquiry = inq;
			await takeInquiry(inq._id, testUser.credentials);

			const { body } = await request
				.post(methodCall('livechat:returnAsInquiry'))
				.set(testUser.credentials)
				.send({
					message: JSON.stringify({
						method: 'livechat:returnAsInquiry',
						params: [room._id],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			const response = parseMethodResponse(body);
			expect(response.result).to.be.true;
		});
		(IS_EE ? it : it.skip)('should appear on users queued elements', async () => {
			const { body } = await request
				.get(api('livechat/inquiries.queuedForUser'))
				.set(testUser.credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body.inquiries).to.be.an('array');
			const depInq = body.inquiries.filter((inq: { _id: string }) => inq._id === inquiry._id);

			expect(depInq.length).to.be.equal(1);
		});
	});

	describe('keep inquiry last message updated', () => {
		let room: any;
		let visitor: any;
		let agent: any;

		before(async () => {
			agent = await createAgent();
			visitor = await createVisitor();

			await makeAgentAvailable();
			room = await createLivechatRoom(visitor.token);
		});

		after(async () => {
			await deleteVisitor(visitor.token);
		});

		it('should update inquiry last message', async () => {
			const msgText = `update inquiry ${Date.now()}`;

			await request.post(api('livechat/message')).send({ token: visitor.token, rid: room._id, msg: msgText }).expect(200);

			const inquiry = await fetchInquiry(room._id);

			expect(inquiry).to.have.property('_id', inquiry._id);
			expect(inquiry).to.have.property('rid', room._id);
			expect(inquiry).to.have.property('lastMessage');
			expect(inquiry.lastMessage).to.have.property('msg', msgText);
		});

		it('should update room last message after inquiry is taken', async () => {
			const msgText = `update room ${Date.now()}`;

			const inquiry = await fetchInquiry(room._id);

			await request
				.post(api('livechat/inquiries.take'))
				.set(credentials)
				.send({
					inquiryId: inquiry._id,
					userId: agent._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});

			await request.post(api('livechat/message')).send({ token: visitor.token, rid: room._id, msg: msgText }).expect(200);

			// check room
			const roomInfo = await getLivechatRoomInfo(room._id);
			expect(roomInfo).to.have.property('lastMessage');
			expect(roomInfo.lastMessage).to.have.property('msg', msgText);
		});

		it('should have the correct last message when room is returned to queue', async () => {
			const msgText = `return to queue ${Date.now()}`;

			await request.post(api('livechat/message')).send({ token: visitor.token, rid: room._id, msg: msgText }).expect(200);

			await request
				.post(methodCall('livechat:returnAsInquiry'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'livechat:returnAsInquiry',
						params: [room._id],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			const inquiry = await fetchInquiry(room._id);

			expect(inquiry).to.have.property('_id', inquiry._id);
			expect(inquiry).to.have.property('rid', room._id);
			expect(inquiry).to.have.property('lastMessage');
			expect(inquiry.lastMessage).to.have.property('msg', msgText);
		});
	});
});
