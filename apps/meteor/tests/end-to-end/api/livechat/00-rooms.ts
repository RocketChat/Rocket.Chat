/* eslint-env mocha */

import fs from 'fs';
import path from 'path';

import { expect } from 'chai';
import type { IOmnichannelRoom, ILivechatVisitor, IUser, IOmnichannelSystemMessage, ILivechatCustomField } from '@rocket.chat/core-typings';
import type { Response } from 'supertest';
import faker from '@faker-js/faker';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import {
	createVisitor,
	createLivechatRoom,
	createAgent,
	makeAgentAvailable,
	getLivechatRoomInfo,
	sendMessage,
	closeRoom,
} from '../../../data/livechat/rooms';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { createUser, login } from '../../../data/users.helper.js';
import { adminUsername, password } from '../../../data/user.js';
import { createDepartmentWithAnOnlineAgent } from '../../../data/livechat/department';
import { sleep } from '../../../data/livechat/utils';
import { IS_EE } from '../../../e2e/config/constants';
import { createCustomField } from '../../../data/livechat/custom-fields';

describe('LIVECHAT - rooms', function () {
	this.retries(0);
	let visitor: ILivechatVisitor;
	let room: IOmnichannelRoom;

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true).then(() => {
			createAgent()
				.then(() => makeAgentAvailable())
				.then(() => createVisitor())
				.then((createdVisitor) => {
					visitor = createdVisitor;
					return createLivechatRoom(createdVisitor.token);
				})
				.then((createdRoom) => {
					room = createdRoom;
					done();
				});
		});
	});

	describe('livechat/room', () => {
		it('should fail when token is not passed as query parameter', async () => {
			await request.get(api('livechat/room')).expect(400);
		});
		it('should fail when token is not a valid guest token', async () => {
			await request.get(api('livechat/room')).query({ token: 'invalid-token' }).expect(400);
		});
		it('should fail if rid is passed but doesnt point to a valid room', async () => {
			const visitor = await createVisitor();
			await request.get(api('livechat/room')).query({ token: visitor.token, rid: 'invalid-rid' }).expect(400);
		});
		it('should create a room for visitor', async () => {
			const visitor = await createVisitor();
			const { body } = await request.get(api('livechat/room')).query({ token: visitor.token });

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('room');
			expect(body.room).to.have.property('v');
			expect(body.room.v).to.have.property('token', visitor.token);
			expect(body.room.source.type).to.be.equal('api');
		});
		it('should return an existing open room when visitor has one available', async () => {
			const visitor = await createVisitor();
			const { body } = await request.get(api('livechat/room')).query({ token: visitor.token });

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('room');
			expect(body.room).to.have.property('v');
			expect(body.room.v).to.have.property('token', visitor.token);

			const { body: body2 } = await request.get(api('livechat/room')).query({ token: visitor.token });

			expect(body2).to.have.property('success', true);
			expect(body2).to.have.property('room');
			expect(body2.room).to.have.property('_id', body.room._id);
			expect(body2.newRoom).to.be.false;
		});
		it('should return a room for the visitor when rid points to a valid open room', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const { body } = await request.get(api('livechat/room')).query({ token: visitor.token, rid: room._id });

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('room');
			expect(body.room.v).to.have.property('token', visitor.token);
			expect(body.newRoom).to.be.false;
		});
		it('should properly read widget cookies', async () => {
			const visitor = await createVisitor();
			const { body } = await request
				.get(api('livechat/room'))
				.set('Cookie', [`rc_room_type=l`, `rc_is_widget=t`])
				.query({ token: visitor.token });

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('room');
			expect(body.room.v).to.have.property('token', visitor.token);
			expect(body.room.source.type).to.be.equal('widget');
		});
	});

	describe('livechat/rooms', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-rooms', []).then(() => {
				request
					.get(api('livechat/rooms'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.be.equal('unauthorized');
					})
					.end(done);
			});
		});
		it('should return an error when the "agents" query parameter is not valid', (done) => {
			updatePermission('view-livechat-rooms', ['admin']).then(() => {
				request
					.get(api('livechat/rooms?agents=invalid'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', false);
					})
					.end(done);
			});
		});
		it('should return an error when the "roomName" query parameter is not valid', (done) => {
			request
				.get(api('livechat/rooms?roomName[]=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
		it('should return an error when the "departmentId" query parameter is not valid', (done) => {
			request
				.get(api('livechat/rooms?departmentId[]=marcos'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
		it('should return an error when the "open" query parameter is not valid', (done) => {
			request
				.get(api('livechat/rooms?open[]=true'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
		it('should return an error when the "tags" query parameter is not valid', (done) => {
			request
				.get(api('livechat/rooms?tags=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
		it('should return an error when the "createdAt" query parameter is not valid', (done) => {
			request
				.get(api('livechat/rooms?createdAt=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
		it('should return an error when the "closedAt" query parameter is not valid', (done) => {
			request
				.get(api('livechat/rooms?closedAt=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
		it('should return an error when the "customFields" query parameter is not valid', (done) => {
			request
				.get(api('livechat/rooms?customFields=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
		it('should return an array of rooms when has no parameters', (done) => {
			request
				.get(api('livechat/rooms'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.rooms).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
		it('should return an array of rooms when the query params is all valid', (done) => {
			request
				.get(api(`livechat/rooms`))
				.set(credentials)
				.query({
					'agents[]': 'teste',
					'departmentId': '123',
					'open': true,
					'createdAt': '{"start":"2018-01-26T00:11:22.345Z","end":"2018-01-26T00:11:22.345Z"}',
					'closedAt': '{"start":"2018-01-26T00:11:22.345Z","end":"2018-01-26T00:11:22.345Z"}',
					'tags[]': 'rocket',
					'customFields': '{ "docId": "031041" }',
					'count': 3,
					'offset': 1,
					'sort': '{ "_updatedAt": 1 }',
					'fields': '{ "msgs": 0 }',
					'roomName': 'test',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.rooms).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
		it('should not cause issues when the customFields is empty', (done) => {
			request
				.get(api(`livechat/rooms`))
				.set(credentials)
				.query({ customFields: {}, roomName: 'test' })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.rooms).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
		it('should throw an error if customFields param is not a object', (done) => {
			request
				.get(api(`livechat/rooms`))
				.set(credentials)
				.query({ customFields: 'string' })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
		it('should only return closed rooms when "open" is set to false', async () => {
			// Create and close a room
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await closeRoom(room._id);

			const { body } = await request.get(api('livechat/rooms')).query({ open: false, roomName: room.fname }).set(credentials).expect(200);
			expect(body.rooms.every((room: IOmnichannelRoom) => !!room.closedAt)).to.be.true;
			expect(body.rooms.find((froom: IOmnichannelRoom) => froom._id === room._id)).to.be.not.undefined;
		});
		it('should only return open rooms when "open" is set to true', async () => {
			// Create and close a room
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await closeRoom(room._id);

			const { body } = await request.get(api('livechat/rooms')).query({ open: true, roomName: room.fname }).set(credentials).expect(200);
			expect(body.rooms.every((room: IOmnichannelRoom) => room.open)).to.be.true;
			expect(body.rooms.find((froom: IOmnichannelRoom) => froom._id === room._id)).to.be.undefined;
		});
		it('should return both closed/open when open param is not passed', async () => {
			// Create and close a room
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await closeRoom(room._id);

			const { body } = await request.get(api('livechat/rooms')).set(credentials).expect(200);
			expect(body.rooms.some((room: IOmnichannelRoom) => !!room.closedAt)).to.be.true;
			expect(body.rooms.some((room: IOmnichannelRoom) => room.open)).to.be.true;
		});
	});

	describe('livechat/room.join', () => {
		it('should fail if user doesnt have view-l-room permission', async () => {
			await updatePermission('view-l-room', []);
			await request.get(api('livechat/room.join')).set(credentials).query({ roomId: '123' }).send().expect(403);
		});
		it('should fail if no roomId is present on query params', async () => {
			await updatePermission('view-l-room', ['admin', 'livechat-agent']);
			await request.get(api('livechat/room.join')).set(credentials).expect(400);
		});
		it('should fail if room is present but invalid', async () => {
			await request.get(api('livechat/room.join')).set(credentials).query({ roomId: 'invalid' }).send().expect(400);
		});
		it('should allow user to join room', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);

			await request.get(api('livechat/room.join')).set(credentials).query({ roomId: room._id }).send().expect(200);
		});
	});

	describe('livechat/room.join', () => {
		it('should fail if user doesnt have view-l-room permission', async () => {
			await updatePermission('view-l-room', []);
			await request.get(api('livechat/room.join')).set(credentials).query({ roomId: '123' }).send().expect(403);
		});
		it('should fail if no roomId is present on query params', async () => {
			await updatePermission('view-l-room', ['admin', 'livechat-agent']);
			await request.get(api('livechat/room.join')).set(credentials).expect(400);
		});
		it('should fail if room is present but invalid', async () => {
			await request.get(api('livechat/room.join')).set(credentials).query({ roomId: 'invalid' }).send().expect(400);
		});
		it('should allow user to join room', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);

			await request.get(api('livechat/room.join')).set(credentials).query({ roomId: room._id }).send().expect(200);
		});
	});

	describe('livechat/room.close', () => {
		it('should return an "invalid-token" error when the visitor is not found due to an invalid token', (done) => {
			request
				.post(api('livechat/room.close'))
				.set(credentials)
				.send({
					token: 'invalid-token',
					rid: room._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.end(done);
		});

		it('should return an "invalid-room" error when the room is not found due to invalid token and/or rid', (done) => {
			request
				.post(api('livechat/room.close'))
				.set(credentials)
				.send({
					token: visitor.token,
					rid: 'invalid-rid',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.end(done);
		});

		it('should return both the rid and the comment of the room when the query params is all valid', (done) => {
			request
				.post(api(`livechat/room.close`))
				.set(credentials)
				.send({
					token: visitor.token,
					rid: room._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('rid');
					expect(res.body).to.have.property('comment');
				})
				.end(done);
		});

		it('should return an "room-closed" error when the room is already closed', (done) => {
			request
				.post(api('livechat/room.close'))
				.set(credentials)
				.send({
					token: visitor.token,
					rid: room._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.end(done);
		});
	});

	describe('livechat/room.forward', () => {
		it('should return an "unauthorized error" when the user does not have "view-l-room" permission', async () => {
			await updatePermission('transfer-livechat-guest', ['admin']);
			await updatePermission('view-l-room', []);

			await request
				.post(api('livechat/room.forward'))
				.set(credentials)
				.send({
					roomId: 'invalid-room-id',
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.have.string('unauthorized');
				});
		});

		it('should return an "unauthorized error" when the user does not have "transfer-livechat-guest" permission', async () => {
			await updatePermission('transfer-livechat-guest', []);
			await updatePermission('view-l-room', ['admin']);

			await request
				.post(api('livechat/room.forward'))
				.set(credentials)
				.send({
					roomId: 'invalid-room-id',
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.have.string('unauthorized');
				});
		});

		it('should not be successful when no target (userId or departmentId) was specified', async () => {
			await updatePermission('transfer-livechat-guest', ['admin']);
			await updatePermission('view-l-room', ['admin']);

			await request
				.post(api('livechat/room.forward'))
				.set(credentials)
				.send({
					roomId: room._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('should return a success message when transferred successfully to agent', async () => {
			const initialAgentAssignedToChat: IUser = await createUser();
			const initialAgentCredentials = await login(initialAgentAssignedToChat.username, password);
			await createAgent(initialAgentAssignedToChat.username);
			await makeAgentAvailable(initialAgentCredentials);

			const newVisitor = await createVisitor();
			// at this point, the chat will get transferred to agent "user"
			const newRoom = await createLivechatRoom(newVisitor.token);

			const forwardChatToUser: IUser = await createUser();
			const forwardChatToUserCredentials = await login(forwardChatToUser.username, password);
			await createAgent(forwardChatToUser.username);
			await makeAgentAvailable(forwardChatToUserCredentials);

			await request
				.post(api('livechat/room.forward'))
				.set(credentials)
				.send({
					roomId: newRoom._id,
					userId: forwardChatToUser._id,
					clientAction: true,
					comment: 'test comment',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});

			const latestRoom = await getLivechatRoomInfo(newRoom._id);

			expect(latestRoom).to.have.property('lastMessage');
			expect(latestRoom.lastMessage?.t).to.be.equal('livechat_transfer_history');
			expect(latestRoom.lastMessage?.u?.username).to.be.equal(adminUsername);
			const { lastMessage } = latestRoom as { lastMessage: IOmnichannelSystemMessage };
			expect(lastMessage?.transferData?.comment).to.be.equal('test comment');
			expect(lastMessage?.transferData?.scope).to.be.equal('agent');
			expect(lastMessage?.transferData?.transferredTo?.username).to.be.equal(forwardChatToUser.username);
		});

		it('should return a success message when transferred successfully to a department', async () => {
			const { department: initialDepartment } = await createDepartmentWithAnOnlineAgent();
			const { department: forwardToDepartment } = await createDepartmentWithAnOnlineAgent();

			const newVisitor = await createVisitor(initialDepartment._id);
			const newRoom = await createLivechatRoom(newVisitor.token);

			await request
				.post(api('livechat/room.forward'))
				.set(credentials)
				.send({
					roomId: newRoom._id,
					departmentId: forwardToDepartment._id,
					clientAction: true,
					comment: 'test comment',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});

			const latestRoom = await getLivechatRoomInfo(newRoom._id);

			expect(latestRoom).to.have.property('departmentId');
			expect(latestRoom.departmentId).to.be.equal(forwardToDepartment._id);

			expect(latestRoom).to.have.property('lastMessage');
			expect(latestRoom.lastMessage?.t).to.be.equal('livechat_transfer_history');
			expect(latestRoom.lastMessage?.u?.username).to.be.equal(adminUsername);
			expect((latestRoom.lastMessage as any)?.transferData?.comment).to.be.equal('test comment');
			expect((latestRoom.lastMessage as any)?.transferData?.scope).to.be.equal('department');
			expect((latestRoom.lastMessage as any)?.transferData?.nextDepartment?._id).to.be.equal(forwardToDepartment._id);
		});
	});

	describe('livechat/room.survey', () => {
		it('should return an "invalid-token" error when the visitor is not found due to an invalid token', (done) => {
			request
				.post(api('livechat/room.survey'))
				.set(credentials)
				.send({
					token: 'invalid-token',
					rid: room._id,
					data: [{ name: 'question', value: 'answer' }],
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should return an "invalid-room" error when the room is not found due to invalid token and/or rid', (done) => {
			request
				.post(api('livechat/room.survey'))
				.set(credentials)
				.send({
					token: visitor.token,
					rid: 'invalid-rid',
					data: [{ name: 'question', value: 'answer' }],
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should return "invalid-data" when the items answered are not part of config.survey.items', (done) => {
			request
				.post(api('livechat/room.survey'))
				.set(credentials)
				.send({
					token: visitor.token,
					rid: room._id,
					data: [{ name: 'question', value: 'answer' }],
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should return the room id and the answers when the query params is all valid', (done) => {
			request
				.post(api('livechat/room.survey'))
				.set(credentials)
				.send({
					token: visitor.token,
					rid: room._id,
					data: [
						{ name: 'satisfaction', value: '5' },
						{ name: 'agentKnowledge', value: '3' },
					],
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('rid');
					expect(res.body).to.have.property('data');
					expect(res.body.data.satisfaction).to.be.equal('5');
					expect(res.body.data.agentKnowledge).to.be.equal('3');
				})
				.end(done);
		});
	});

	describe('livechat/upload/:rid', () => {
		it('should throw an error if x-visitor-token header is not present', (done) => {
			request
				.post(api('livechat/upload/test'))
				.set(credentials)
				.attach('file', fs.createReadStream(path.join(__dirname, '../../../data/livechat/sample.png')))
				.expect('Content-Type', 'application/json')
				.expect(403)
				.end(done);
		});

		it('should throw an error if x-visitor-token is present but with an invalid value', (done) => {
			request
				.post(api('livechat/upload/test'))
				.set(credentials)
				.set('x-visitor-token', 'invalid-token')
				.attach('file', fs.createReadStream(path.join(__dirname, '../../../data/livechat/sample.png')))
				.expect('Content-Type', 'application/json')
				.expect(403)
				.end(done);
		});

		it('should throw unauthorized if visitor with token exists but room is invalid', (done) => {
			createVisitor()
				.then((visitor) => {
					request
						.post(api('livechat/upload/test'))
						.set(credentials)
						.set('x-visitor-token', visitor.token)
						.attach('file', fs.createReadStream(path.join(__dirname, '../../../data/livechat/sample.png')))
						.expect('Content-Type', 'application/json')
						.expect(403);
				})
				.then(() => done());
		});

		it('should throw an error if the file is not attached', (done) => {
			createVisitor()
				.then((visitor) => {
					request
						.post(api('livechat/upload/test'))
						.set(credentials)
						.set('x-visitor-token', visitor.token)
						.expect('Content-Type', 'application/json')
						.expect(400);
				})
				.then(() => done());
		});

		it('should upload an image on the room if all params are valid', (done) => {
			createVisitor()
				.then((visitor) => Promise.all([visitor, createLivechatRoom(visitor.token)]))
				.then(([visitor, room]) => {
					request
						.post(api(`livechat/upload/${room._id}`))
						.set(credentials)
						.set('x-visitor-token', visitor.token)
						.attach('file', fs.createReadStream(path.join(__dirname, '../../../data/livechat/sample.png')))
						.expect('Content-Type', 'application/json')
						.expect(200);
				})
				.then(() => done());
		});
	});

	describe('livechat/:rid/messages', () => {
		it('should fail if room provided is invalid', (done) => {
			request.get(api('livechat/test/messages')).set(credentials).expect('Content-Type', 'application/json').expect(400).end(done);
		});
		it('should throw an error if user doesnt have permission view-l-room', async () => {
			await updatePermission('view-l-room', []);

			await request.get(api('livechat/test/messages')).set(credentials).expect('Content-Type', 'application/json').expect(403);
		});
		it('should return the messages of the room', async () => {
			await updatePermission('view-l-room', ['admin']);
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await sendMessage(room._id, 'Hello', visitor.token);

			const { body } = await request
				.get(api(`livechat/${room._id}/messages`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('messages');
			expect(body.messages).to.be.an('array');
			expect(body.total).to.be.an('number').equal(1);
			expect(body.messages[0]).to.have.property('msg', 'Hello');
		});
		it('should return the messages of the room matching by searchTerm', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await sendMessage(room._id, 'Hello', visitor.token);
			await sendMessage(room._id, 'Random', visitor.token);

			const { body } = await request
				.get(api(`livechat/${room._id}/messages`))
				.query({ searchTerm: 'Ran' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('messages');
			expect(body.messages).to.be.an('array');
			expect(body.total).to.be.an('number').equal(1);
			expect(body.messages[0]).to.have.property('msg', 'Random');
		});
		it('should return the messages of the room matching by partial searchTerm', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await sendMessage(room._id, 'Hello', visitor.token);
			await sendMessage(room._id, 'Random', visitor.token);

			const { body } = await request
				.get(api(`livechat/${room._id}/messages`))
				.query({ searchTerm: 'ndo' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('messages');
			expect(body.messages).to.be.an('array');
			expect(body.total).to.be.an('number').equal(1);
			expect(body.messages[0]).to.have.property('msg', 'Random');
		});
		it('should return everything when searchTerm is ""', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await sendMessage(room._id, 'Hello', visitor.token);
			await sendMessage(room._id, 'Random', visitor.token);

			const { body } = await request
				.get(api(`livechat/${room._id}/messages`))
				.query({ searchTerm: '' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('messages');
			expect(body.messages).to.be.an('array');
			expect(body.messages).to.be.an('array').with.lengthOf.greaterThan(1);
			expect(body.messages[0]).to.have.property('msg');
		});
	});

	describe('[GET] livechat/message/:_id', () => {
		it('should fail if message provided is invalid', async () => {
			await request.get(api('livechat/message/test')).set(credentials).expect('Content-Type', 'application/json').expect(400);
		});
		it('shoudl fail if token is not sent as query param', async () => {
			await request.get(api('livechat/message/test')).set(credentials).expect('Content-Type', 'application/json').expect(400);
		});
		it('should fail if rid is not sent as query param', async () => {
			await request
				.get(api('livechat/message/test'))
				.set(credentials)
				.query({ token: 'test' })
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
		it('should return the message', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const message = await sendMessage(room._id, 'Hello', visitor.token);

			const { body } = await request
				.get(api(`livechat/message/${message._id}`))
				.query({
					token: visitor.token,
					rid: room._id,
				})
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('message');
			expect(body.message).to.have.property('msg', 'Hello');
		});
	});

	describe('[PUT] livechat/message/:_id', () => {
		it('should fail if room provided is invalid', async () => {
			await request
				.put(api('livechat/message/test'))
				.set(credentials)
				.send({ token: 'test', rid: 'fadsfdsafads', msg: 'fasfasdfdsf' })
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
		it('should fail if token is not sent as body param', async () => {
			await request
				.put(api('livechat/message/test'))
				.set(credentials)
				.send({ msg: 'fasfadsf', rid: 'afdsfdsfads' })
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
		it('should fail if rid is not sent as body param', async () => {
			await request
				.put(api('livechat/message/test'))
				.set(credentials)
				.send({ token: 'test', msg: 'fasfasdfdsf' })
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
		it('should fail if msg is not sent as body param', async () => {
			await request
				.put(api(`livechat/message/test`))
				.set(credentials)
				.send({ token: 'fasdfdsf', rid: 'fadsfdsafads' })
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
		it('should fail if token is not a valid token', async () => {
			await request
				.put(api(`livechat/message/test`))
				.set(credentials)
				.send({ token: 'test', rid: 'fadsfdsafads', msg: 'fasfasdfdsf' })
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
		it('should fail if room is not a valid room', async () => {
			const visitor = await createVisitor();
			await request
				.put(api(`livechat/message/test`))
				.set(credentials)
				.send({ token: visitor.token, rid: 'fadsfdsafads', msg: 'fasfasdfdsf' })
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
		it('should fail if _id is not a valid message id', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);

			await request
				.put(api(`livechat/message/test`))
				.set(credentials)
				.send({ token: visitor.token, rid: room._id, msg: 'fasfasdfdsf' })
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
		it('should update a message if everything is valid', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const message = await sendMessage(room._id, 'Hello', visitor.token);

			const { body } = await request
				.put(api(`livechat/message/${message._id}`))
				.set(credentials)
				.send({ token: visitor.token, rid: room._id, msg: 'Hello World' })
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('message');
			expect(body.message).to.have.property('msg', 'Hello World');
			expect(body.message).to.have.property('editedAt');
			expect(body.message).to.have.property('editedBy');
			expect(body.message.editedBy).to.have.property('username', visitor.username);
		});
	});

	describe('[DELETE] livechat/message/_id', () => {
		it('should fail if token is not sent as body param', async () => {
			await request
				.delete(api('livechat/message/test'))
				.set(credentials)
				.send({ rid: 'afdsfdsfads' })
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
		it('should fail if room provided is invalid', async () => {
			await request
				.delete(api('livechat/message/test'))
				.set(credentials)
				.send({ token: 'test', rid: 'fadsfdsafads' })
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
		it('should fail if rid is not sent as body param', async () => {
			await request
				.delete(api('livechat/message/test'))
				.set(credentials)
				.send({ token: 'test' })
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
		it('should fail if _id is not a valid message id', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);

			await request
				.delete(api(`livechat/message/test`))
				.set(credentials)
				.send({ token: visitor.token, rid: room._id })
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
		it('should delete a message if everything is valid', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const message = await sendMessage(room._id, 'Hello', visitor.token);

			const { body } = await request
				.delete(api(`livechat/message/${message._id}`))
				.set(credentials)
				.send({ token: visitor.token, rid: room._id })
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('message');
			expect(body.message).to.have.property('_id', message._id);
			expect(body.message).to.have.property('ts');
		});
	});

	describe('livechat/messages.history/rid', () => {
		it('should fail if token is not sent as query param', async () => {
			await request.get(api('livechat/messages.history/test')).set(credentials).expect('Content-Type', 'application/json').expect(400);
		});
		it('should fail if token is not a valid guest token', async () => {
			await request
				.get(api('livechat/messages.history/test'))
				.set(credentials)
				.query({ token: 'test' })
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
		it('should fail if token is good, but rid is not valid', async () => {
			const visitor = await createVisitor();
			await request
				.get(api('livechat/messages.history/fadsfdsafads'))
				.set(credentials)
				.query({ token: visitor.token })
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
		it('should return message history for a valid room', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await sendMessage(room._id, 'Hello', visitor.token);

			const { body } = await request
				.get(api(`livechat/messages.history/${room._id}`))
				.set(credentials)
				.query({ token: visitor.token })
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('messages');
			expect(body.messages).to.be.an('array');
			expect(body.messages.length <= 3).to.be.true;
			expect(body.messages[0]).to.have.property('msg', 'Hello');
			expect(body.messages[1]).to.have.property('t');
		});
		it('should return message history for a valid room with pagination', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await sendMessage(room._id, 'Hello', visitor.token);

			const { body } = await request
				.get(api(`livechat/messages.history/${room._id}`))
				.set(credentials)
				.query({ token: visitor.token, limit: 1 })
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('messages').of.length(1);
			expect(body.messages[0]).to.have.property('msg', 'Hello');
		});
		it('should return message history for a valid room with pagination and offset', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await sendMessage(room._id, 'Hello', visitor.token);

			const { body } = await request
				.get(api(`livechat/messages.history/${room._id}`))
				.set(credentials)
				.query({ token: visitor.token, limit: 1, offset: 1 })
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('messages').of.length(1);
			expect(body.messages[0]).to.have.property('t');
		});
		it('should return message history for a valid date filtering (max date)', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await sendMessage(room._id, 'Hello', visitor.token);
			const sendMessageTs = new Date();
			await sendMessage(room._id, 'Hello2', visitor.token);

			const { body } = await request
				.get(api(`livechat/messages.history/${room._id}`))
				.set(credentials)
				.query({ token: visitor.token, end: sendMessageTs.toISOString() })
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('messages').that.is.an('array');
			expect(body.messages.length <= 3).to.be.true;
			expect(body.messages[0]).to.have.property('msg', 'Hello');
			expect(body.messages[1]).to.have.property('t');
		});
	});

	describe('livechat/messages', () => {
		it('should fail if visitor is not sent as body param', async () => {
			await request.post(api('livechat/messages')).set(credentials).expect('Content-Type', 'application/json').expect(400);
		});

		it('should fail if visitor.token is not sent as body param', async () => {
			await request
				.post(api('livechat/messages'))
				.set(credentials)
				.send({ visitor: {} })
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should fail if messages is not sent as body param', async () => {
			await request
				.post(api('livechat/messages'))
				.set(credentials)
				.send({ visitor: { token: 'test' } })
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should fail if messages is not an array', async () => {
			await request
				.post(api('livechat/messages'))
				.set(credentials)
				.send({ visitor: { token: 'test' }, messages: {} })
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should fail if messages is an empty array', async () => {
			await request
				.post(api('livechat/messages'))
				.set(credentials)
				.send({ visitor: { token: 'test' }, messages: [] })
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should be able to create messages on a room', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await sendMessage(room._id, 'Hello', visitor.token);

			const { body } = await request
				.post(api('livechat/messages'))
				.set(credentials)
				.send({ visitor: { token: visitor.token }, messages: [{ msg: 'Hello' }, { msg: 'Hello 2' }] })
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('messages').of.length(2);
			expect(body.messages[0]).to.have.property('msg', 'Hello');
			expect(body.messages[0]).to.have.property('ts');
			expect(body.messages[0]).to.have.property('username', visitor.username);
			expect(body.messages[1]).to.have.property('msg', 'Hello 2');
			expect(body.messages[1]).to.have.property('ts');
			expect(body.messages[1]).to.have.property('username', visitor.username);
		});
	});

	describe('livechat/transfer.history/:rid', () => {
		it('should fail if user doesnt have "view-livechat-rooms" permission', async () => {
			await updatePermission('view-livechat-rooms', []);
			const { body } = await request
				.get(api(`livechat/transfer.history/test`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
			expect(body).to.have.property('success', false);
		});
		it('should fail if room is not a valid room id', async () => {
			await updatePermission('view-livechat-rooms', ['admin', 'livechat-manager']);
			const { body } = await request
				.get(api(`livechat/transfer.history/test`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(body).to.have.property('success', false);
		});
		it('should return empty for a room without transfer history', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const { body } = await request
				.get(api(`livechat/transfer.history/${room._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(body).to.have.property('success', true);
			expect(body).to.have.property('history').that.is.an('array');
			expect(body.history.length).to.equal(0);
		});
		it('should return the transfer history for a room', async () => {
			const initialAgentAssignedToChat: IUser = await createUser();
			const initialAgentCredentials = await login(initialAgentAssignedToChat.username, password);
			await createAgent(initialAgentAssignedToChat.username);
			await makeAgentAvailable(initialAgentCredentials);

			const newVisitor = await createVisitor();
			// at this point, the chat will get transferred to agent "user"
			const newRoom = await createLivechatRoom(newVisitor.token);

			const forwardChatToUser: IUser = await createUser();
			const forwardChatToUserCredentials = await login(forwardChatToUser.username, password);
			await createAgent(forwardChatToUser.username);
			await makeAgentAvailable(forwardChatToUserCredentials);

			await request
				.post(api('livechat/room.forward'))
				.set(credentials)
				.send({
					roomId: newRoom._id,
					userId: forwardChatToUser._id,
					clientAction: true,
					comment: 'test comment',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});

			const { body } = await request
				.get(api(`livechat/transfer.history/${newRoom._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('success', true);
			expect(body).to.have.property('history').that.is.an('array');
			expect(body.history.length).to.equal(1);
			expect(body.history[0]).to.have.property('scope', 'agent');
			expect(body.history[0]).to.have.property('comment', 'test comment');
			expect(body.history[0]).to.have.property('transferredBy').that.is.an('object');
		});
	});

	describe('livechat/room.saveInfo', () => {
		it('should fail if no data is sent as body param', async () => {
			await request.post(api('livechat/room.saveInfo')).set(credentials).expect('Content-Type', 'application/json').expect(400);
		});

		it('should return an "unauthorized error" when the user does not have "view-l-room" permission', async () => {
			await updatePermission('view-l-room', []);

			await request
				.post(api('livechat/room.saveInfo'))
				.set(credentials)
				.send({
					roomData: {
						_id: 'invalid-room-id',
					},
					guestData: {
						_id: 'invalid-guest-id',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.have.string('unauthorized');
				});
		});

		it('should not allow users to update room info without serving the chat or having "save-others-livechat-room-info" permission', async () => {
			await updatePermission('view-l-room', ['admin']);
			await updatePermission('save-others-livechat-room-info', []);

			await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
			// delay for 1 second to make sure the routing queue gets stopped
			await sleep(1000);

			const newVisitor = await createVisitor();
			// at this point, the chat will get transferred to agent "user"
			const newRoom = await createLivechatRoom(newVisitor.token);

			await request
				.post(api('livechat/room.saveInfo'))
				.set(credentials)
				.send({
					roomData: {
						_id: newRoom._id,
					},
					guestData: {
						_id: newVisitor._id,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.have.string('unauthorized');
				});

			await updatePermission('save-others-livechat-room-info', ['admin']);
			await updateSetting('Livechat_Routing_Method', 'Auto_Selection');
			// delay for 1 second to make sure the routing queue starts again
			await sleep(1000);
		});

		it('should throw an error if roomData is not provided', async () => {
			await updatePermission('view-l-room', ['admin']);

			await request
				.post(api('livechat/room.saveInfo'))
				.set(credentials)
				.send({
					guestData: {
						_id: 'invalid-guest-id',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should throw an error if guestData is not provided', async () => {
			await request
				.post(api('livechat/room.saveInfo'))
				.set(credentials)
				.send({
					roomData: {
						_id: 'invalid-room-id',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should throw an error if roomData is not of valid type', async () => {
			await request
				.post(api('livechat/room.saveInfo'))
				.set(credentials)
				.send({
					roomData: 'invalid-room-data',
					guestData: {
						_id: 'invalid-guest-id',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should throw an error if guestData is not of valid type', async () => {
			await request
				.post(api('livechat/room.saveInfo'))
				.set(credentials)
				.send({
					guestData: 'invalid-guest-data',
					roomData: {
						_id: 'invalid-room-id',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should allow user to update the room info', async () => {
			await updatePermission('view-l-room', ['admin']);

			const newVisitor = await createVisitor();
			// at this point, the chat will get transferred to agent "user"
			const newRoom = await createLivechatRoom(newVisitor.token);

			await request
				.post(api('livechat/room.saveInfo'))
				.set(credentials)
				.send({
					roomData: {
						_id: newRoom._id,
						topic: 'new topic',
						tags: ['tag1', 'tag2'],
					},
					guestData: {
						_id: newVisitor._id,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});

			const latestRoom = await getLivechatRoomInfo(newRoom._id);
			expect(latestRoom).to.have.property('topic', 'new topic');
			expect(latestRoom).to.have.property('tags').of.length(2);
			expect(latestRoom).to.have.property('tags').to.include('tag1');
			expect(latestRoom).to.have.property('tags').to.include('tag2');
		});

		(IS_EE ? it : it.skip)('should allow user to update the room info - EE fields', async () => {
			const cfName = faker.lorem.word();
			await createCustomField({
				searchable: true,
				field: cfName,
				label: cfName,
				scope: 'room',
				visibility: 'visible',
				regexp: '',
			} as unknown as ILivechatCustomField & { field: string });

			const newVisitor = await createVisitor();
			const newRoom = await createLivechatRoom(newVisitor.token);

			await request
				.post(api('livechat/room.saveInfo'))
				.set(credentials)
				.send({
					roomData: {
						_id: newRoom._id,
						topic: 'new topic',
						tags: ['tag1', 'tag2'],
						livechatData: {
							[cfName]: 'test-input-1-value',
						},
					},
					guestData: {
						_id: newVisitor._id,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});

			const latestRoom = await getLivechatRoomInfo(newRoom._id);
			expect(latestRoom).to.have.property('topic', 'new topic');
			expect(latestRoom).to.have.property('tags').of.length(2);
			expect(latestRoom).to.have.property('tags').to.include('tag1');
			expect(latestRoom).to.have.property('tags').to.include('tag2');
			expect(latestRoom).to.have.property('livechatData').to.have.property(cfName, 'test-input-1-value');
		});

		(IS_EE ? it : it.skip)('endpoint should handle empty custom fields', async () => {
			const newVisitor = await createVisitor();
			const newRoom = await createLivechatRoom(newVisitor.token);

			await request
				.post(api('livechat/room.saveInfo'))
				.set(credentials)
				.send({
					roomData: {
						_id: newRoom._id,
						topic: 'new topic',
						tags: ['tag1', 'tag2'],
						livechatData: {},
					},
					guestData: {
						_id: newVisitor._id,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});

			const latestRoom = await getLivechatRoomInfo(newRoom._id);
			expect(latestRoom).to.have.property('topic', 'new topic');
			expect(latestRoom).to.have.property('tags').of.length(2);
			expect(latestRoom).to.have.property('tags').to.include('tag1');
			expect(latestRoom).to.have.property('tags').to.include('tag2');
			expect(latestRoom).to.not.have.property('livechatData');
		});

		(IS_EE ? it : it.skip)('should throw an error if custom fields are not valid', async () => {
			await request
				.post(api('livechat/room.saveInfo'))
				.set(credentials)
				.send({
					roomData: {
						_id: 'invalid-room-id',
						livechatData: {
							key: {
								value: 'invalid',
							},
						},
					},
					guestData: {
						_id: 'invalid-visitor-id',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
	});

	describe('livechat/rooms/filters', () => {
		it('should fail if user doesnt have view-l-room permission', async () => {
			await updatePermission('view-l-room', []);
			await request.get(api('livechat/rooms/filters')).set(credentials).expect(403);
		});
		it('should return a list of available source filters', async () => {
			await updatePermission('view-l-room', ['admin']);
			const response = await request.get(api('livechat/rooms/filters')).set(credentials).expect(200);
			expect(response.body).to.have.property('filters').and.to.be.an('array');
			expect(response.body.filters.find((f: IOmnichannelRoom['source']) => f.type === 'api')).to.not.be.undefined;
		});
	});
});
