/* eslint-env mocha */

import fs from 'fs';
import path from 'path';

import { expect } from 'chai';
import type { IOmnichannelRoom, ILivechatVisitor, IUser, IOmnichannelSystemMessage } from '@rocket.chat/core-typings';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createVisitor, createLivechatRoom, createAgent, makeAgentAvailable, getLivechatRoomInfo } from '../../../data/livechat/rooms';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { createUser, login } from '../../../data/users.helper.js';
import { adminUsername, password } from '../../../data/user.js';
import { createDepartmentWithAnOnlineAgent } from '../../../data/livechat/department';

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
				.get(
					api(`livechat/rooms?agents[]=teste&departamentId=123&open=true&createdAt={"start": "2018-01-26T00:11:22.345Z", "end": "2018-01-26T00:11:22.345Z"}
			&closedAt={"start": "2018-01-26T00:11:22.345Z", "end": "2018-01-26T00:11:22.345Z"}&tags[]=rocket
			&customFields={"docId": "031041"}&count=3&offset=1&sort={"_updatedAt": 1}&fields={"msgs": 0}&roomName=test`),
				)
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
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('invalid-token');
				})
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
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('invalid-room');
				})
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
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('room-closed');
				})
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
					expect(res.body.error).to.be.equal('[invalid-token]');
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
					expect(res.body.error).to.be.equal('[invalid-room]');
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
					expect(res.body.error).to.be.equal('[invalid-data]');
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
});
