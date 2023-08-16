import fs from 'fs';
import path from 'path';

import { faker } from '@faker-js/faker';
import type {
	IOmnichannelRoom,
	ILivechatVisitor,
	IUser,
	IOmnichannelSystemMessage,
	ILivechatPriority,
	ILivechatDepartment,
} from '@rocket.chat/core-typings';
import { LivechatPriorityWeight } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import type { SuccessResult } from '../../../../app/api/server/definition';
import { getCredentials, api, request, credentials, methodCall } from '../../../data/api-data';
import { createCustomField } from '../../../data/livechat/custom-fields';
import { createDepartmentWithAnOnlineAgent } from '../../../data/livechat/department';
import { createSLA, getRandomPriority } from '../../../data/livechat/priorities';
import {
	createVisitor,
	createLivechatRoom,
	createAgent,
	makeAgentAvailable,
	getLivechatRoomInfo,
	sendMessage,
	startANewLivechatRoomAndTakeIt,
	createManager,
	closeOmnichannelRoom,
} from '../../../data/livechat/rooms';
import { saveTags } from '../../../data/livechat/tags';
import type { DummyResponse } from '../../../data/livechat/utils';
import { sleep } from '../../../data/livechat/utils';
import {
	restorePermissionToRoles,
	addPermissions,
	removePermissionFromAllRoles,
	updateEEPermission,
	updatePermission,
	updateSetting,
} from '../../../data/permissions.helper';
import { getSubscriptionForRoom } from '../../../data/subscriptions';
import { adminUsername, password } from '../../../data/user';
import { createUser, deleteUser, login } from '../../../data/users.helper.js';
import { IS_EE } from '../../../e2e/config/constants';

describe('LIVECHAT - rooms', function () {
	this.retries(0);
	let visitor: ILivechatVisitor;
	let room: IOmnichannelRoom;

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
		await createAgent();
		await makeAgentAvailable();
		visitor = await createVisitor();

		room = await createLivechatRoom(visitor.token);
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
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await removePermissionFromAllRoles('view-livechat-rooms');
			await request
				.get(api('livechat/rooms'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('unauthorized');
				});

			await restorePermissionToRoles('view-livechat-rooms');
		});
		it('should return an error when the "agents" query parameter is not valid', async () => {
			await request
				.get(api('livechat/rooms?agents=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
		it('should return an error when the "roomName" query parameter is not valid', async () => {
			await request
				.get(api('livechat/rooms?roomName[]=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
		it('should return an error when the "departmentId" query parameter is not valid', async () => {
			await request
				.get(api('livechat/rooms?departmentId[]=marcos'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
		it('should return an error when the "open" query parameter is not valid', async () => {
			await request
				.get(api('livechat/rooms?open[]=true'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
		it('should return an error when the "tags" query parameter is not valid', async () => {
			await request
				.get(api('livechat/rooms?tags=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
		it('should return an error when the "createdAt" query parameter is not valid', async () => {
			await request
				.get(api('livechat/rooms?createdAt=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
		it('should return an error when the "closedAt" query parameter is not valid', async () => {
			await request
				.get(api('livechat/rooms?closedAt=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
		it('should return an error when the "customFields" query parameter is not valid', async () => {
			await request
				.get(api('livechat/rooms?customFields=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
		it('should return an array of rooms when has no parameters', async () => {
			await request
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
				});
		});
		it('should return an array of rooms when the query params is all valid', async () => {
			await request
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
				});
		});
		it('should not cause issues when the customFields is empty', async () => {
			await request
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
				});
		});
		it('should throw an error if customFields param is not a object', async () => {
			await request
				.get(api(`livechat/rooms`))
				.set(credentials)
				.query({ customFields: 'string' })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
		it('should only return closed rooms when "open" is set to false', async () => {
			// Create and close a room
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await closeOmnichannelRoom(room._id);

			const { body } = await request.get(api('livechat/rooms')).query({ open: false, roomName: room.fname }).set(credentials).expect(200);
			expect(body.rooms.every((room: IOmnichannelRoom) => !!room.closedAt)).to.be.true;
			expect(body.rooms.find((froom: IOmnichannelRoom) => froom._id === room._id)).to.be.not.undefined;
		});
		it('should only return open rooms when "open" is set to true', async () => {
			// Create and close a room
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await closeOmnichannelRoom(room._id);

			const { body } = await request.get(api('livechat/rooms')).query({ open: true, roomName: room.fname }).set(credentials).expect(200);
			expect(body.rooms.every((room: IOmnichannelRoom) => room.open)).to.be.true;
			expect(body.rooms.find((froom: IOmnichannelRoom) => froom._id === room._id)).to.be.undefined;
		});
		it('should return both closed/open when open param is not passed', async () => {
			// Create and close a room
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await closeOmnichannelRoom(room._id);

			const { body } = await request.get(api('livechat/rooms')).set(credentials).expect(200);
			expect(body.rooms.some((room: IOmnichannelRoom) => !!room.closedAt)).to.be.true;
			expect(body.rooms.some((room: IOmnichannelRoom) => room.open)).to.be.true;
		});
		(IS_EE ? it : it.skip)('should return only rooms with the given department', async () => {
			const { department } = await createDepartmentWithAnOnlineAgent();

			const { room: expectedRoom } = await startANewLivechatRoomAndTakeIt({
				departmentId: department._id,
			});

			const { body } = await request.get(api('livechat/rooms')).query({ departmentId: department._id }).set(credentials).expect(200);

			expect(body.rooms.length).to.be.equal(1);
			expect(body.rooms.some((room: IOmnichannelRoom) => room._id === expectedRoom._id)).to.be.true;
		});
		(IS_EE ? it : it.skip)('should return rooms with the given department and the given status', async () => {
			const { department } = await createDepartmentWithAnOnlineAgent();

			const { room: expectedRoom } = await startANewLivechatRoomAndTakeIt({
				departmentId: department._id,
			});

			const { body } = await request
				.get(api('livechat/rooms'))
				.query({ departmentId: department._id, open: true })
				.set(credentials)
				.expect(200);

			expect(body.rooms.length).to.be.equal(1);
			expect(body.rooms.some((room: IOmnichannelRoom) => room._id === expectedRoom._id)).to.be.true;
		});
		(IS_EE ? it : it.skip)('should return no rooms with the given department and the given status (if none match the filter)', async () => {
			const { department } = await createDepartmentWithAnOnlineAgent();

			await startANewLivechatRoomAndTakeIt({
				departmentId: department._id,
			});

			const { body } = await request
				.get(api('livechat/rooms'))
				.query({ departmentId: department._id, open: false })
				.set(credentials)
				.expect(200);

			expect(body.rooms.length).to.be.equal(0);
		});
		(IS_EE ? it : it.skip)('should return only rooms served by the given agent', async () => {
			const { department, agent } = await createDepartmentWithAnOnlineAgent();

			const { room: expectedRoom } = await startANewLivechatRoomAndTakeIt({
				departmentId: department._id,
				agent: agent.credentials,
			});

			const { body } = await request
				.get(api(`livechat/rooms?agents[]=${agent.user._id}`))
				.set(credentials)
				.expect(200);

			expect(body.rooms.length).to.be.equal(1);
			expect(body.rooms.some((room: IOmnichannelRoom) => room._id === expectedRoom._id)).to.be.true;
		});
		(IS_EE ? it : it.skip)('should return only rooms with the given tags', async () => {
			const tag = await saveTags();

			const { room: expectedRoom } = await startANewLivechatRoomAndTakeIt();
			await closeOmnichannelRoom(expectedRoom._id, [tag.name]);

			const { body } = await request
				.get(api(`livechat/rooms?tags[]=${tag.name}`))
				.set(credentials)
				.expect(200);

			expect(body.rooms.length).to.be.equal(1);
			expect(body.rooms.some((room: IOmnichannelRoom) => room._id === expectedRoom._id)).to.be.true;
		});
		(IS_EE ? describe : describe.skip)('sort', () => {
			let openRoom: IOmnichannelRoom;
			let closeRoom: IOmnichannelRoom;
			let department: ILivechatDepartment;

			it('prepare data for further tests', async () => {
				const { department: localDepartment } = await createDepartmentWithAnOnlineAgent();
				department = localDepartment;

				const { room: localOpenRoom } = await startANewLivechatRoomAndTakeIt({
					departmentId: department._id,
				});
				openRoom = localOpenRoom;
				const { room: localCloseRoom } = await startANewLivechatRoomAndTakeIt({
					departmentId: department._id,
				});
				closeRoom = localCloseRoom;
				await closeOmnichannelRoom(closeRoom._id);
			});
			it('should return only rooms in the asc order', async () => {
				const { body } = await request
					.get(api('livechat/rooms'))
					.query({ sort: JSON.stringify({ open: 1 }), departmentId: department._id })
					.set(credentials)
					.expect(200);

				expect(body.rooms.length).to.be.equal(2);
				expect(body.rooms[0]._id).to.be.equal(closeRoom._id);
				expect(body.rooms[1]._id).to.be.equal(openRoom._id);
			});
			it('should return only rooms in the desc order', async () => {
				const { body } = await request
					.get(api('livechat/rooms'))
					.query({ sort: JSON.stringify({ open: -1 }), departmentId: department._id })
					.set(credentials)
					.expect(200);

				expect(body.rooms.length).to.be.equal(2);
				expect(body.rooms[0]._id).to.be.equal(openRoom._id);
				expect(body.rooms[1]._id).to.be.equal(closeRoom._id);
			});
		});
	});

	describe('livechat/room.join', () => {
		it('should fail if user doesnt have view-l-room permission', async () => {
			await removePermissionFromAllRoles('view-l-room');
			await request.get(api('livechat/room.join')).set(credentials).query({ roomId: '123' }).send().expect(403);

			await restorePermissionToRoles('view-l-room');
		});
		it('should fail if no roomId is present on query params', async () => {
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
			await removePermissionFromAllRoles('view-l-room');

			await request.get(api('livechat/room.join')).set(credentials).query({ roomId: '123' }).send().expect(403);

			await restorePermissionToRoles('view-l-room');
		});
		it('should fail if no roomId is present on query params', async () => {
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
		it('should allow managers to join a room which is already being served by an agent', async () => {
			await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
			// delay for 1 second to make sure the routing queue gets stopped
			await sleep(1000);

			const {
				room: { _id: roomId },
			} = await startANewLivechatRoomAndTakeIt();

			const manager: IUser = await createUser();
			const managerCredentials = await login(manager.username, password);
			await createManager(manager.username);

			await request.get(api('livechat/room.join')).set(managerCredentials).query({ roomId }).send().expect(200);

			await updateSetting('Livechat_Routing_Method', 'Auto_Selection');

			// cleanup
			await deleteUser(manager);
		});
	});

	describe('livechat/room.close', () => {
		it('should return an "invalid-token" error when the visitor is not found due to an invalid token', async () => {
			await request
				.post(api('livechat/room.close'))
				.send({
					token: 'invalid-token',
					rid: room._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should return an "invalid-room" error when the room is not found due to invalid token and/or rid', async () => {
			await request
				.post(api('livechat/room.close'))
				.send({
					token: visitor.token,
					rid: 'invalid-rid',
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should return both the rid and the comment of the room when the query params is all valid', async () => {
			await request
				.post(api(`livechat/room.close`))
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
				});
		});

		it('should return an "room-closed" error when the room is already closed', async () => {
			await request
				.post(api('livechat/room.close'))
				.send({
					token: visitor.token,
					rid: room._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		(IS_EE ? it : it.skip)(
			'should close room when chat is closed by visitor and should also generate pdf transcript if serving agent has set appropriate preference set',
			async () => {
				const {
					room: { _id: roomId },
					visitor,
				} = await startANewLivechatRoomAndTakeIt();

				await request
					.post(api('users.setPreferences'))
					.set(credentials)
					.send({
						data: {
							omnichannelTranscriptPDF: true,
						},
					})
					.expect(200);

				// Give time for the setting to be on the user's preferences
				await sleep(500);

				await request.post(api('livechat/room.close')).send({ rid: roomId, token: visitor.token }).expect(200);

				const latestRoom = await getLivechatRoomInfo(roomId);
				expect(latestRoom).to.have.property('pdfTranscriptFileId').and.to.be.a('string');
			},
		);

		(IS_EE ? it : it.skip)(
			'should close room when chat is closed by visitor and should not generate pdf transcript if serving agent has not set appropriate preference set',
			async () => {
				const {
					room: { _id: roomId },
					visitor,
				} = await startANewLivechatRoomAndTakeIt();

				await request
					.post(api('users.setPreferences'))
					.set(credentials)
					.send({ data: { omnichannelTranscriptPDF: false } })
					.expect(200);

				await request.post(api('livechat/room.close')).send({ rid: roomId, token: visitor.token }).expect(200);

				// Wait for the pdf to not be generated
				await sleep(1500);

				const latestRoom = await getLivechatRoomInfo(roomId);
				expect(latestRoom).to.not.have.property('pdfTranscriptFileId');
			},
		);
	});

	describe('livechat/room.forward', () => {
		it('should return an "unauthorized error" when the user does not have "view-l-room" permission', async () => {
			await updatePermission('transfer-livechat-guest', ['admin']);
			await removePermissionFromAllRoles('view-l-room');

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
			await removePermissionFromAllRoles('transfer-livechat-guest');
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

			await restorePermissionToRoles('transfer-livechat-guest');
			await restorePermissionToRoles('view-l-room');
		});

		it('should not be successful when no target (userId or departmentId) was specified', async () => {
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

			// cleanup
			await deleteUser(initialAgentAssignedToChat);
			await deleteUser(forwardChatToUser);
		});
		(IS_EE ? it : it.skip)('should return a success message when transferred successfully to a department', async () => {
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
		it('should return an "invalid-token" error when the visitor is not found due to an invalid token', async () => {
			await request
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
				});
		});

		it('should return an "invalid-room" error when the room is not found due to invalid token and/or rid', async () => {
			await request
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
				});
		});

		it('should return "invalid-data" when the items answered are not part of config.survey.items', async () => {
			await request
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
				});
		});

		it('should return the room id and the answers when the query params is all valid', async () => {
			await request
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
				});
		});
	});

	describe('livechat/upload/:rid', () => {
		it('should throw an error if x-visitor-token header is not present', async () => {
			await request
				.post(api('livechat/upload/test'))
				.set(credentials)
				.attach('file', fs.createReadStream(path.join(__dirname, '../../../data/livechat/sample.png')))
				.expect('Content-Type', 'application/json')
				.expect(403);
		});

		it('should throw an error if x-visitor-token is present but with an invalid value', async () => {
			await request
				.post(api('livechat/upload/test'))
				.set(credentials)
				.set('x-visitor-token', 'invalid-token')
				.attach('file', fs.createReadStream(path.join(__dirname, '../../../data/livechat/sample.png')))
				.expect('Content-Type', 'application/json')
				.expect(403);
		});

		it('should throw unauthorized if visitor with token exists but room is invalid', async () => {
			const visitor = await createVisitor();
			await request
				.post(api('livechat/upload/test'))
				.set(credentials)
				.set('x-visitor-token', visitor.token)
				.attach('file', fs.createReadStream(path.join(__dirname, '../../../data/livechat/sample.png')))
				.expect('Content-Type', 'application/json')
				.expect(403);
		});

		it('should throw an error if the file is not attached', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await request
				.post(api(`livechat/upload/${room._id}`))
				.set(credentials)
				.set('x-visitor-token', visitor.token)
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should upload an image on the room if all params are valid', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await request
				.post(api(`livechat/upload/${room._id}`))
				.set(credentials)
				.set('x-visitor-token', visitor.token)
				.attach('file', fs.createReadStream(path.join(__dirname, '../../../data/livechat/sample.png')))
				.expect('Content-Type', 'application/json')
				.expect(200);
		});
	});

	describe('livechat/:rid/messages', () => {
		it('should fail if room provided is invalid', async () => {
			await request.get(api('livechat/test/messages')).set(credentials).expect('Content-Type', 'application/json').expect(400);
		});
		it('should throw an error if user doesnt have permission view-l-room', async () => {
			await removePermissionFromAllRoles('view-l-room');

			await request.get(api('livechat/test/messages')).set(credentials).expect('Content-Type', 'application/json').expect(403);

			await restorePermissionToRoles('view-l-room');
		});
		it('should return the messages of the room', async () => {
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
			expect(body.messages.length <= 4).to.be.true;
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
			expect(body.messages.length <= 4).to.be.true;
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
			await removePermissionFromAllRoles('view-livechat-rooms');
			const { body } = await request
				.get(api(`livechat/transfer.history/test`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
			expect(body).to.have.property('success', false);

			await restorePermissionToRoles('view-livechat-rooms');
		});
		it('should fail if room is not a valid room id', async () => {
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
			await updatePermission('view-l-room', ['admin', 'livechat-manager', 'livechat-agent']);
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

			// cleanup
			await deleteUser(initialAgentAssignedToChat);
			await deleteUser(forwardChatToUser);
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
			});

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
		(IS_EE ? it : it.skip)('should throw an error if a valid custom field fails the check', async () => {
			await request
				.post(methodCall('livechat:saveCustomField'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'livechat:saveCustomField',
						params: [
							null,
							{
								field: 'intfield',
								label: 'intfield',
								scope: 'room',
								visibility: 'visible',
								regexp: '\\d+',
								searchable: true,
								type: 'input',
								required: false,
								defaultValue: '0',
								options: '',
								public: false,
							},
						],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect(200);
			const newVisitor = await createVisitor();
			const newRoom = await createLivechatRoom(newVisitor.token);

			const response = await request
				.post(api('livechat/room.saveInfo'))
				.set(credentials)
				.send({
					roomData: {
						_id: newRoom._id,
						livechatData: { intfield: 'asdasd' },
					},
					guestData: {
						_id: newVisitor._id,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
			expect(response.body).to.have.property('error', 'Invalid value for intfield field');
		});
		(IS_EE ? it : it.skip)('should not throw an error if a valid custom field passes the check', async () => {
			const newVisitor = await createVisitor();
			const newRoom = await createLivechatRoom(newVisitor.token);

			const response2 = await request
				.post(api('livechat/room.saveInfo'))
				.set(credentials)
				.send({
					roomData: {
						_id: newRoom._id,
						livechatData: { intfield: '1' },
					},
					guestData: {
						_id: newVisitor._id,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response2.body).to.have.property('success', true);
		});

		(IS_EE ? it : it.skip)('should update room priority', async () => {
			await addPermissions({
				'save-others-livechat-room-info': ['admin', 'livechat-manager'],
				'view-l-room': ['livechat-agent', 'admin', 'livechat-manager'],
			});

			const newVisitor = await createVisitor();
			const newRoom = await createLivechatRoom(newVisitor.token);
			const priority = await getRandomPriority();

			await request
				.post(api('livechat/room.saveInfo'))
				.set(credentials)
				.send({
					roomData: {
						_id: newRoom._id,
						priorityId: priority._id,
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

			const updatedRoom = await getLivechatRoomInfo(newRoom._id);
			expect(updatedRoom).to.have.property('priorityId', priority._id);
			expect(updatedRoom).to.have.property('priorityWeight', priority.sortItem);
		});
		(IS_EE ? it : it.skip)('should update room sla', async () => {
			const newVisitor = await createVisitor();
			const newRoom = await createLivechatRoom(newVisitor.token);
			const sla = await createSLA();

			await request
				.post(api('livechat/room.saveInfo'))
				.set(credentials)
				.send({
					roomData: {
						_id: newRoom._id,
						slaId: sla._id,
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

			const updatedRoom = await getLivechatRoomInfo(newRoom._id);
			expect(updatedRoom).to.have.property('slaId', sla._id);
		});
	});
	(IS_EE ? describe : describe.skip)('livechat/room/:rid/priority', async () => {
		let priorities: ILivechatPriority[];
		let chosenPriority: ILivechatPriority;
		this.afterAll(async () => {
			await updateEEPermission('manage-livechat-priorities', ['admin', 'livechat-manager']);
			await updatePermission('view-l-room', ['admin', 'livechat-manager', 'livechat-agent']);
		});
		it('should return the list of priorities', async () => {
			const response = await request
				.get(api('livechat/priorities'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: DummyResponse<SuccessResult<{ priorities: ILivechatPriority[] }>>) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('priorities').and.to.be.an('array');
					expect(res.body.priorities).to.have.length.greaterThan(0);
				});
			priorities = response.body.priorities;
			const rnd = faker.number.int({ min: 0, max: priorities.length - 1 });
			chosenPriority = priorities[rnd];
		});
		it('should prioritize the room', async () => {
			const response = await request
				.post(api(`livechat/room/${room._id}/priority`))
				.set(credentials)
				.send({
					priorityId: chosenPriority._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
		});
		it('should return the room with the new priority', async () => {
			const updatedRoom = await getLivechatRoomInfo(room._id);
			expect(updatedRoom).to.have.property('priorityId', chosenPriority._id);
			expect(updatedRoom).to.have.property('priorityWeight', chosenPriority.sortItem);
		});
		it('should unprioritize the room', async () => {
			const response = await request
				.delete(api(`livechat/room/${room._id}/priority`))
				.set(credentials)
				.send()
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
		});
		it('should return the room with the new priority', async () => {
			const updatedRoom = await getLivechatRoomInfo(room._id);
			expect(updatedRoom).to.not.have.property('priorityId');
			expect(updatedRoom).to.have.property('priorityWeight', LivechatPriorityWeight.NOT_SPECIFIED);
		});
		it('should fail to return the priorities if lacking permissions', async () => {
			await updatePermission('manage-livechat-priorities', []);
			await updatePermission('view-l-room', []);
			await request.get(api('livechat/priorities')).set(credentials).expect('Content-Type', 'application/json').expect(403);
		});
		it('should fail to prioritize the room from a lack of permissions', async () => {
			await request
				.post(api(`livechat/room/${room._id}/priority`))
				.set(credentials)
				.send({
					priorityId: chosenPriority._id,
				})
				.expect(403);
		});
		it('should fail to unprioritize the room from a lack of permissions', async () => {
			await request
				.delete(api(`livechat/room/${room._id}/priority`))
				.set(credentials)
				.send()
				.expect(403);
		});
	});
	describe('livechat/rooms/filters', () => {
		it('should fail if user doesnt have view-l-room permission', async () => {
			await updatePermission('view-l-room', []);
			await request.get(api('livechat/rooms/filters')).set(credentials).expect(403);
		});
		it('should return a list of available source filters', async () => {
			await updatePermission('view-l-room', ['admin', 'livechat-agent', 'livechat-manager']);
			const response = await request.get(api('livechat/rooms/filters')).set(credentials).expect(200);
			expect(response.body).to.have.property('filters').and.to.be.an('array');
			expect(response.body.filters.find((f: IOmnichannelRoom['source']) => f.type === 'api')).to.not.be.undefined;
		});
	});

	describe('livechat/room.closeByUser', () => {
		it('should fail if user is not logged in', async () => {
			await request.post(api('livechat/room.closeByUser')).expect(401);
		});
		it('should fail if not all required params are passed (rid)', async () => {
			await request.post(api('livechat/room.closeByUser')).set(credentials).expect(400);
		});
		it('should fail if user doesnt have close-livechat-room permission', async () => {
			await updatePermission('close-livechat-room', []);
			await request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: 'invalid-room-id' }).expect(403);
		});
		it('should fail if room is not found', async () => {
			await updatePermission('close-livechat-room', ['admin']);
			await request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: 'invalid-room-id' }).expect(400);
		});
		it('should fail if user is not serving and doesnt have close-others-livechat-room permission', async () => {
			await updatePermission('close-others-livechat-room', []);
			const visitor = await createVisitor();
			const { _id } = await createLivechatRoom(visitor.token);
			await request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: _id }).expect(400);
		});
		it('should close room if user has permission', async () => {
			await updatePermission('close-others-livechat-room', ['admin']);
			const visitor = await createVisitor();
			const { _id } = await createLivechatRoom(visitor.token);
			await request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: _id }).expect(200);
		});
		it('should fail if room is closed', async () => {
			const visitor = await createVisitor();
			const { _id } = await createLivechatRoom(visitor.token);

			// close room
			await request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: _id }).expect(200);

			// try to close again
			await request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: _id }).expect(400);
		});

		(IS_EE ? it : it.skip)('should close room and generate transcript pdf', async () => {
			const {
				room: { _id: roomId },
			} = await startANewLivechatRoomAndTakeIt();

			await request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: roomId, generateTranscriptPdf: true }).expect(200);

			// Wait for the pdf to be generated
			await sleep(1500);

			const latestRoom = await getLivechatRoomInfo(roomId);
			expect(latestRoom).to.have.property('pdfTranscriptFileId').and.to.be.a('string');
		});

		(IS_EE ? it : it.skip)('should close room and not generate transcript pdf', async () => {
			const {
				room: { _id: roomId },
			} = await startANewLivechatRoomAndTakeIt();

			await request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: roomId, generateTranscriptPdf: false }).expect(200);

			// Wait for the pdf to not be generated
			await sleep(1500);

			const latestRoom = await getLivechatRoomInfo(roomId);
			expect(latestRoom).to.not.have.property('pdfTranscriptFileId');
		});
	});

	(IS_EE ? describe : describe.skip)('omnichannel/:rid/request-transcript', () => {
		before(async () => {
			await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
			// Wait for one sec to be sure routing stops
			await sleep(1000);
		});

		it('should fail if user is not logged in', async () => {
			await request.post(api('omnichannel/rid/request-transcript')).expect(401);
		});
		it('should fail if :rid doesnt exists', async () => {
			await request.post(api('omnichannel/rid/request-transcript')).set(credentials).expect(400);
		});
		it('should fail if user doesnt have request-pdf-transcript permission', async () => {
			await updatePermission('request-pdf-transcript', []);
			const visitor = await createVisitor();
			const { _id } = await createLivechatRoom(visitor.token);
			await request
				.post(api(`omnichannel/${_id}/request-transcript`))
				.set(credentials)
				.expect(403);
		});
		it('should fail if room is not closed', async () => {
			await updatePermission('request-pdf-transcript', ['admin', 'livechat-agent', 'livechat-manager']);
			const visitor = await createVisitor();
			const { _id } = await createLivechatRoom(visitor.token);
			await request
				.post(api(`omnichannel/${_id}/request-transcript`))
				.set(credentials)
				.expect(400);
		});
		it('should return OK if no one is serving the room (queued)', async () => {
			const visitor = await createVisitor();
			const { _id } = await createLivechatRoom(visitor.token);
			await closeOmnichannelRoom(_id);
			await request
				.post(api(`omnichannel/${_id}/request-transcript`))
				.set(credentials)
				.expect(200);
		});
		let roomWithTranscriptGenerated: string;
		it('should request a pdf transcript when all conditions are met', async () => {
			const {
				room: { _id: roomId },
			} = await startANewLivechatRoomAndTakeIt();

			// close room since pdf transcript is only generated for closed rooms
			await closeOmnichannelRoom(roomId);

			await request
				.post(api(`omnichannel/${roomId}/request-transcript`))
				.set(credentials)
				.expect(200);

			// wait for the pdf to be generated
			await sleep(1500);

			const latestRoom = await getLivechatRoomInfo(roomId);
			expect(latestRoom).to.have.property('pdfTranscriptFileId').and.to.be.a('string');

			roomWithTranscriptGenerated = roomId;
		});
		it('should return immediately if transcript was already requested', async () => {
			await request
				.post(api(`omnichannel/${roomWithTranscriptGenerated}/request-transcript`))
				.set(credentials)
				.expect(200);
		});
	});

	describe('it should mark room as unread when a new message arrives and the config is activated', () => {
		let room: IOmnichannelRoom;
		let visitor: ILivechatVisitor;
		let totalMessagesSent = 0;
		let departmentWithAgent: Awaited<ReturnType<typeof createDepartmentWithAnOnlineAgent>>;

		before(async () => {
			await updateSetting('Livechat_Routing_Method', 'Auto_Selection');
			await updateSetting('Unread_Count_Omni', 'all_messages');
		});

		it('it should prepare the required data for further tests', async () => {
			departmentWithAgent = await createDepartmentWithAnOnlineAgent();
			visitor = await createVisitor(departmentWithAgent.department._id);
			room = await createLivechatRoom(visitor.token);

			await sendMessage(room._id, 'message 1', visitor.token);
			await sendMessage(room._id, 'message 2', visitor.token);

			// 1st message is for the room creation, so we need to add 1 to the total messages sent
			totalMessagesSent = 3;
		});

		it("room's subscription should have correct unread count", async () => {
			const { unread } = await getSubscriptionForRoom(room._id, departmentWithAgent.agent.credentials);
			expect(unread).to.equal(totalMessagesSent);
		});
	});

	(IS_EE ? describe : describe.skip)('it should NOT mark room as unread when a new message arrives and the config is deactivated', () => {
		let room: IOmnichannelRoom;
		let visitor: ILivechatVisitor;
		let totalMessagesSent = 0;
		let departmentWithAgent: Awaited<ReturnType<typeof createDepartmentWithAnOnlineAgent>>;

		before(async () => {
			await updateSetting('Livechat_Routing_Method', 'Auto_Selection');
			await updateSetting('Unread_Count_Omni', 'mentions_only');
		});

		it('it should prepare the required data for further tests', async () => {
			departmentWithAgent = await createDepartmentWithAnOnlineAgent();
			visitor = await createVisitor(departmentWithAgent.department._id);
			room = await createLivechatRoom(visitor.token);

			await sendMessage(room._id, 'message 1', visitor.token);
			await sendMessage(room._id, 'message 2', visitor.token);

			// 1st message is for the room creation, so we need to add 1 to the total messages sent
			totalMessagesSent = 1;
		});

		it("room's subscription should have correct unread count", async () => {
			const { unread } = await getSubscriptionForRoom(room._id, departmentWithAgent.agent.credentials);
			expect(unread).to.equal(totalMessagesSent);
		});
	});
});
