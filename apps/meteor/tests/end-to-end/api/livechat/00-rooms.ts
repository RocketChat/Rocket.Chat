import fs from 'fs';
import path from 'path';

import { faker } from '@faker-js/faker';
import type { Credentials } from '@rocket.chat/api-client';
import type {
	IOmnichannelRoom,
	ILivechatVisitor,
	IOmnichannelSystemMessage,
	ILivechatPriority,
	ILivechatDepartment,
	ISubscription,
	IOmnichannelBusinessUnit,
	IUser,
} from '@rocket.chat/core-typings';
import { LivechatPriorityWeight } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, afterEach, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import type { SuccessResult } from '../../../../app/api/server/definition';
import { getCredentials, api, request, credentials, methodCall } from '../../../data/api-data';
import { apps, APP_URL } from '../../../data/apps/apps-data';
import { createCustomField } from '../../../data/livechat/custom-fields';
import { createDepartmentWithAnOfflineAgent, createDepartmentWithAnOnlineAgent, deleteDepartment } from '../../../data/livechat/department';
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
	createDepartment,
	fetchMessages,
	deleteVisitor,
	makeAgentUnavailable,
	sendAgentMessage,
	fetchInquiry,
	takeInquiry,
} from '../../../data/livechat/rooms';
import { saveTags } from '../../../data/livechat/tags';
import { createMonitor, createUnit, deleteUnit } from '../../../data/livechat/units';
import type { DummyResponse } from '../../../data/livechat/utils';
import { parseMethodResponse, sleep } from '../../../data/livechat/utils';
import {
	restorePermissionToRoles,
	addPermissions,
	removePermissionFromAllRoles,
	updateEEPermission,
	updatePermission,
	updateSetting,
	updateEESetting,
} from '../../../data/permissions.helper';
import { adminUsername, password } from '../../../data/user';
import { createUser, deleteUser, login } from '../../../data/users.helper';
import { IS_EE } from '../../../e2e/config/constants';

const getSubscriptionForRoom = async (roomId: string, overrideCredential?: Credentials): Promise<ISubscription> => {
	const response = await request
		.get(api('subscriptions.getOne'))
		.set(overrideCredential || credentials)
		.query({ roomId })
		.expect('Content-Type', 'application/json')
		.expect(200);

	const { subscription } = response.body;

	return subscription;
};

describe('LIVECHAT - rooms', () => {
	let visitor: ILivechatVisitor;
	let room: IOmnichannelRoom;
	let appId: string;

	before((done) => getCredentials(done));

	before(async () => {
		if (IS_EE) {
			// install the app
			await request
				.post(apps())
				.set(credentials)
				.send({ url: APP_URL })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('app');
					expect(res.body.app).to.have.a.property('id');
					expect(res.body.app).to.have.a.property('version');
					expect(res.body.app).to.have.a.property('status').and.to.be.equal('auto_enabled');

					appId = res.body.app.id;
				});
		}

		await updateSetting('Livechat_enabled', true);
		await updateEESetting('Livechat_Require_Contact_Verification', 'never');
		await updateSetting('Omnichannel_enable_department_removal', true);
		await createAgent();
		await makeAgentAvailable();

		visitor = await createVisitor();

		room = await createLivechatRoom(visitor.token);
	});

	after(async () => {
		await updateSetting('Omnichannel_enable_department_removal', false);

		if (IS_EE) {
			await request
				.delete(apps(`/${appId}`))
				.set(credentials)
				.expect(200);
		}
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
		(IS_EE ? it : it.skip)('should prevent create a room for visitor if an app throws an error', async () => {
			// this test relies on the app installed by the insertApp fixture
			const visitor = await createVisitor(undefined, 'visitor prevent from app');
			const { body } = await request.get(api('livechat/room')).query({ token: visitor.token });

			expect(body).to.have.property('success', false);
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
					expect(res.body).to.have.property('error', 'unauthorized');
				});

			await restorePermissionToRoles('view-livechat-rooms');
		});
		it('should return an error when the "agents" query parameter is not valid', async () => {
			await request
				.get(api('livechat/rooms'))
				.query({ agents: 'invalid' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
		it('should return an error when the "roomName" query parameter is not valid', async () => {
			await request
				.get(api('livechat/rooms'))
				.query({ 'roomName[]': 'invalid' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
		it('should return an error when the "departmentId" query parameter is not valid', async () => {
			await request
				.get(api('livechat/rooms'))
				// it accepts an array now!
				.query({ departmentId: { test: true } })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
		it('should return an error when the "open" query parameter is not valid', async () => {
			await request
				.get(api('livechat/rooms'))
				.query({ 'open[]': 'true' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
		it('should return an error when the "tags" query parameter is not valid', async () => {
			await request
				.get(api('livechat/rooms'))
				.query({ tags: 'invalid' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
		it('should return an error when the "createdAt" query parameter is not valid', async () => {
			await request
				.get(api('livechat/rooms'))
				.query({ createdAt: 'invalid' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
		it('should return an error when the "closedAt" query parameter is not valid', async () => {
			await request
				.get(api('livechat/rooms'))
				.query({ closedAt: 'invalid' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
		it('should return an error when the "customFields" query parameter is not valid', async () => {
			await request
				.get(api('livechat/rooms'))
				.query({ customFields: 'invalid' })
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

		describe('roomName filter', () => {
			let room1: IOmnichannelRoom;
			let room2: IOmnichannelRoom;
			before(async () => {
				const visitor = await createVisitor(undefined, 'TEST_1');
				const visitor2 = await createVisitor(undefined, 'TEST_2');
				room1 = await createLivechatRoom(visitor.token);
				room2 = await createLivechatRoom(visitor2.token);
			});

			it('should return only rooms matching exact term when roomName is between quotes', async () => {
				const { body } = await request.get(api('livechat/rooms')).query({ roomName: `"TEST_1"` }).set(credentials).expect(200);
				expect(body.rooms[0].fname).to.equal('TEST_1');
				expect(body.rooms.find((r: IOmnichannelRoom) => r.fname === 'TEST_2')).to.be.undefined;
			});
			it('should return rooms matching using regex when searching by roomName', async () => {
				const { body } = await request.get(api('livechat/rooms')).query({ roomName: `TEST_` }).set(credentials).expect(200);
				expect(body.rooms.find((froom: IOmnichannelRoom) => froom._id === room1._id)).to.be.not.undefined;
				expect(body.rooms.find((froom: IOmnichannelRoom) => froom._id === room2._id)).to.be.not.undefined;
			});
			it('should return empty if no room matches term', async () => {
				const { body } = await request.get(api('livechat/rooms')).query({ roomName: `"TEST_"` }).set(credentials).expect(200);
				expect(body.rooms).to.be.empty;
			});
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
		it('should return queued rooms when `queued` param is passed', async () => {
			await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);

			const { body } = await request.get(api('livechat/rooms')).query({ queued: true }).set(credentials).expect(200);

			expect(body.rooms.every((room: IOmnichannelRoom) => room.open)).to.be.true;
			expect(body.rooms.every((room: IOmnichannelRoom) => !room.servedBy)).to.be.true;
			expect(body.rooms.find((froom: IOmnichannelRoom) => froom._id === room._id)).to.be.not.undefined;
		});
		it('should return queued rooms when `queued` and `open` params are passed', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);

			const { body } = await request.get(api('livechat/rooms')).query({ queued: true, open: true }).set(credentials).expect(200);

			expect(body.rooms.every((room: IOmnichannelRoom) => room.open)).to.be.true;
			expect(body.rooms.every((room: IOmnichannelRoom) => !room.servedBy)).to.be.true;
			expect(body.rooms.find((froom: IOmnichannelRoom) => froom._id === room._id)).to.be.not.undefined;
		});
		it('should return open rooms when `open` is param is passed. Open rooms should not include queued conversations', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);

			const { room: room2 } = await startANewLivechatRoomAndTakeIt();

			const { body } = await request.get(api('livechat/rooms')).query({ open: true }).set(credentials).expect(200);

			expect(body.rooms.every((room: IOmnichannelRoom) => room.open)).to.be.true;
			expect(body.rooms.find((froom: IOmnichannelRoom) => froom._id === room2._id)).to.be.not.undefined;
			expect(body.rooms.find((froom: IOmnichannelRoom) => froom._id === room._id)).to.be.undefined;

			await updateSetting('Livechat_Routing_Method', 'Auto_Selection');
		});
		(IS_EE ? describe : describe.skip)('Queued and OnHold chats', () => {
			before(async () => {
				await updateSetting('Livechat_allow_manual_on_hold', true);
				await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
			});

			after(async () => {
				await updateSetting('Livechat_Routing_Method', 'Auto_Selection');
				await updateSetting('Livechat_allow_manual_on_hold', false);
			});

			it('should not return on hold rooms along with queued rooms when `queued` is true and `onHold` is true', async () => {
				const { room } = await startANewLivechatRoomAndTakeIt();
				await sendAgentMessage(room._id);
				const response = await request
					.post(api('livechat/room.onHold'))
					.set(credentials)
					.send({
						roomId: room._id,
					})
					.expect(200);

				expect(response.body.success).to.be.true;

				const visitor = await createVisitor();
				const room2 = await createLivechatRoom(visitor.token);

				const { body } = await request.get(api('livechat/rooms')).query({ queued: true, onhold: true }).set(credentials).expect(200);

				expect(body.rooms.every((room: IOmnichannelRoom) => room.open)).to.be.true;
				expect(body.rooms.every((room: IOmnichannelRoom) => !room.servedBy)).to.be.true;
				expect(body.rooms.every((room: IOmnichannelRoom) => !room.onHold)).to.be.true;
				expect(body.rooms.find((froom: IOmnichannelRoom) => froom._id === room._id)).to.be.undefined;
				expect(body.rooms.find((froom: IOmnichannelRoom) => froom._id === room2._id)).to.be.not.undefined;
			});
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
		(IS_EE ? it : it.skip)('should return rooms with the given departments', async () => {
			const { department } = await createDepartmentWithAnOnlineAgent();
			const { department: department2 } = await createDepartmentWithAnOnlineAgent();

			const { room: expectedRoom } = await startANewLivechatRoomAndTakeIt({
				departmentId: department._id,
			});

			const { room: expectedRoom2 } = await startANewLivechatRoomAndTakeIt({
				departmentId: department2._id,
			});

			const { body } = await request
				.get(api('livechat/rooms'))
				.query({ departmentId: [department._id, department2._id] })
				.set(credentials)
				.expect(200);

			expect(body.rooms.length).to.be.equal(2);
			expect(body.rooms.some((room: IOmnichannelRoom) => room._id === expectedRoom._id)).to.be.true;
			expect(body.rooms.some((room: IOmnichannelRoom) => room._id === expectedRoom2._id)).to.be.true;

			await Promise.all([deleteDepartment(department._id), deleteDepartment(department2._id)]);
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

			const { body } = await request.get(api('livechat/rooms')).query({ 'agents[]': agent.user._id }).set(credentials).expect(200);

			expect(body.rooms.length).to.be.equal(1);
			expect(body.rooms.some((room: IOmnichannelRoom) => room._id === expectedRoom._id)).to.be.true;

			await Promise.all([deleteDepartment(department._id)]);
		});
		(IS_EE ? it : it.skip)('should return only rooms served by the given agents', async () => {
			const { department, agent } = await createDepartmentWithAnOnlineAgent();

			const { room: expectedRoom } = await startANewLivechatRoomAndTakeIt({
				departmentId: department._id,
				agent: agent.credentials,
			});

			const { department: department2, agent: agent2 } = await createDepartmentWithAnOnlineAgent();

			const { room: expectedRoom2 } = await startANewLivechatRoomAndTakeIt({
				departmentId: department2._id,
				agent: agent2.credentials,
			});

			const { body } = await request
				.get(api('livechat/rooms'))
				.query({ agents: [agent.user._id, agent2.user._id] })
				.set(credentials)
				.expect(200);

			expect(body.rooms.length).to.be.equal(2);
			expect(body.rooms.some((room: IOmnichannelRoom) => room._id === expectedRoom._id)).to.be.true;
			expect(body.rooms.some((room: IOmnichannelRoom) => room._id === expectedRoom2._id)).to.be.true;

			await Promise.all([deleteDepartment(department._id), deleteDepartment(department2._id)]);
		});
		(IS_EE ? it : it.skip)('should return only rooms with the given tags', async () => {
			const tag = await saveTags();

			const { room: expectedRoom } = await startANewLivechatRoomAndTakeIt();
			await closeOmnichannelRoom(expectedRoom._id, [tag.name]);

			const { body } = await request.get(api('livechat/rooms')).query({ 'tags[]': tag.name }).set(credentials).expect(200);

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
		(IS_EE ? describe : describe.skip)('monitors', () => {
			let user: IUser;
			let userCreds: Credentials;
			let user2: IUser;
			let user2Creds: Credentials;
			let department: ILivechatDepartment;
			let department2: ILivechatDepartment;
			let agent: any;
			let agent2: any;
			let unit: IOmnichannelBusinessUnit;
			let unit2: IOmnichannelBusinessUnit;
			let room1: IOmnichannelRoom;
			let room2: IOmnichannelRoom;

			before(async () => {
				user = await createUser();
				userCreds = await login(user.username!, password);
				user2 = await createUser();
				user2Creds = await login(user2.username!, password);

				await createMonitor(user.username!);
				await createMonitor(user2.username!);
				const { department: dep1, agent: agent1 } = await createDepartmentWithAnOnlineAgent();
				const { department: dep2, agent: agen2 } = await createDepartmentWithAnOnlineAgent();

				department = dep1;
				agent = agent1;
				department2 = dep2;
				agent2 = agen2;

				unit = await createUnit(user._id, user.username!, [department._id], '', [{ monitorId: user2._id, username: user2.username! }]);
				unit2 = await createUnit(user2._id, user2.username!, [department2._id]);
			});
			before(async () => {
				const { room: localOpenRoom } = await startANewLivechatRoomAndTakeIt({
					departmentId: department._id,
					agent: agent.credentials,
				});
				room1 = localOpenRoom;
				const { room: localOpenRoom2 } = await startANewLivechatRoomAndTakeIt({
					departmentId: department2._id,
					agent: agent2.credentials,
				});
				room2 = localOpenRoom2;
			});
			before(async () => {
				await restorePermissionToRoles('view-livechat-rooms');
			});
			after(async () => {
				await Promise.all([
					deleteUser(user),
					deleteUser(user),
					deleteUnit(unit),
					deleteUnit(unit2),
					deleteDepartment(department._id),
					deleteDepartment(department2._id),
				]);
			});

			it('should return valid list of rooms for monitor', () => {
				return request
					.get(api('livechat/rooms'))
					.set(userCreds)
					.expect(200)
					.expect((res) => {
						expect(res.body.rooms.length).to.be.equal(1);
						expect(res.body.rooms[0]._id).to.be.equal(room1._id);
					});
			});
			it('should return a valid list of rooms for monitor 2', () => {
				return request
					.get(api('livechat/rooms'))
					.set(user2Creds)
					.expect(200)
					.expect((res) => {
						expect(res.body.rooms.length).to.be.equal(2);
					});
			});
			it('should allow monitor 1 to filter by units', async () => {
				const { body } = await request.get(api('livechat/rooms')).set(userCreds).query({ 'units[]': unit._id }).expect(200);
				expect(body.rooms.length).to.be.equal(1);
				expect(body.rooms[0]._id).to.be.equal(room1._id);
			});
			it('should not allow monitor 1 to filter by a unit hes not part of', async () => {
				const { body } = await request.get(api('livechat/rooms')).set(userCreds).query({ 'units[]': unit2._id }).expect(200);
				expect(body.rooms.length).to.be.equal(0);
			});
			it('should allow monitor 2 to filter by only one unit', async () => {
				const { body } = await request.get(api('livechat/rooms')).set(user2Creds).query({ 'units[]': unit2._id }).expect(200);
				expect(body.rooms.length).to.be.equal(1);
				expect(body.rooms[0]._id).to.be.equal(room2._id);
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

			const manager = await createUser();
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

		describe('Special case: visitors closing is disabled', () => {
			before(async () => {
				await updateSetting('Omnichannel_allow_visitors_to_close_conversation', false);
			});
			after(async () => {
				await updateSetting('Omnichannel_allow_visitors_to_close_conversation', true);
			});
			it('should not allow visitor to close a conversation', async () => {
				const { room, visitor } = await startANewLivechatRoomAndTakeIt();
				await request
					.post(api('livechat/room.close'))
					.send({
						token: visitor.token,
						rid: room._id,
					})
					.expect(400);
			});
		});
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
			const initialAgentAssignedToChat = await createUser();
			const initialAgentCredentials = await login(initialAgentAssignedToChat.username, password);
			await createAgent(initialAgentAssignedToChat.username);
			await makeAgentAvailable(initialAgentCredentials);

			const newVisitor = await createVisitor();
			// at this point, the chat will get transferred to agent "user"
			const newRoom = await createLivechatRoom(newVisitor.token);

			const forwardChatToUser = await createUser();
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

		(IS_EE ? it : it.skip)('should return error message when transferred to a offline agent', async () => {
			await updateSetting('Livechat_Routing_Method', 'Auto_Selection');
			const { department: initialDepartment } = await createDepartmentWithAnOnlineAgent();
			const { department: forwardToOfflineDepartment } = await createDepartmentWithAnOfflineAgent({ allowReceiveForwardOffline: false });

			const newVisitor = await createVisitor(initialDepartment._id);
			const newRoom = await createLivechatRoom(newVisitor.token);

			await request
				.post(api('livechat/room.forward'))
				.set(credentials)
				.send({
					roomId: newRoom._id,
					departmentId: forwardToOfflineDepartment._id,
					clientAction: true,
					comment: 'test comment',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'error-no-agents-online-in-department');
				});

			await deleteDepartment(initialDepartment._id);
			await deleteDepartment(forwardToOfflineDepartment._id);
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
		(IS_EE ? it : it.skip)(
			'should return a success message when transferred successfully to an offline department when the department accepts it',
			async () => {
				const { department: initialDepartment } = await createDepartmentWithAnOnlineAgent();
				const { department: forwardToOfflineDepartment } = await createDepartmentWithAnOfflineAgent({ allowReceiveForwardOffline: true });

				const newVisitor = await createVisitor(initialDepartment._id);
				const newRoom = await createLivechatRoom(newVisitor.token);

				await request
					.post(api('livechat/room.forward'))
					.set(credentials)
					.send({
						roomId: newRoom._id,
						departmentId: forwardToOfflineDepartment._id,
						clientAction: true,
						comment: 'test comment',
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
					});

				await deleteDepartment(initialDepartment._id);
				await deleteDepartment(forwardToOfflineDepartment._id);
			},
		);
		(IS_EE ? it : it.skip)('inquiry should be taken automatically when agent on department is online again', async () => {
			await updateSetting('Livechat_Routing_Method', 'Auto_Selection');
			const { department: initialDepartment } = await createDepartmentWithAnOnlineAgent();
			const { department: forwardToOfflineDepartment } = await createDepartmentWithAnOfflineAgent({ allowReceiveForwardOffline: true });

			const newVisitor = await createVisitor(initialDepartment._id);
			const newRoom = await createLivechatRoom(newVisitor.token);

			await request.post(api('livechat/room.forward')).set(credentials).send({
				roomId: newRoom._id,
				departmentId: forwardToOfflineDepartment._id,
				clientAction: true,
				comment: 'test comment',
			});

			await makeAgentAvailable();

			const latestRoom = await getLivechatRoomInfo(newRoom._id);

			expect(latestRoom).to.have.property('departmentId');
			expect(latestRoom.departmentId).to.be.equal(forwardToOfflineDepartment._id);

			expect(latestRoom).to.have.property('lastMessage');
			expect(latestRoom.lastMessage?.t).to.be.equal('livechat_transfer_history');
			expect(latestRoom.lastMessage?.u?.username).to.be.equal(adminUsername);
			expect((latestRoom.lastMessage as any)?.transferData?.comment).to.be.equal('test comment');
			expect((latestRoom.lastMessage as any)?.transferData?.scope).to.be.equal('department');
			expect((latestRoom.lastMessage as any)?.transferData?.nextDepartment?._id).to.be.equal(forwardToOfflineDepartment._id);

			await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
			await deleteDepartment(initialDepartment._id);
			await deleteDepartment(forwardToOfflineDepartment._id);
		});

		(IS_EE ? it : it.skip)('when manager forward to offline department the inquiry should be set to the queue', async () => {
			await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
			const { department: initialDepartment } = await createDepartmentWithAnOnlineAgent();
			const { department: forwardToOfflineDepartment, agent: offlineAgent } = await createDepartmentWithAnOfflineAgent({
				allowReceiveForwardOffline: true,
			});

			const newVisitor = await createVisitor(initialDepartment._id);
			const newRoom = await createLivechatRoom(newVisitor.token);

			await makeAgentUnavailable(offlineAgent.credentials);

			const manager = await createUser();
			const managerCredentials = await login(manager.username, password);
			await createManager(manager.username);

			await request.post(api('livechat/room.forward')).set(managerCredentials).send({
				roomId: newRoom._id,
				departmentId: forwardToOfflineDepartment._id,
				clientAction: true,
				comment: 'test comment',
			});

			await request
				.get(api(`livechat/queue`))
				.set(credentials)
				.query({
					count: 1,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.queue).to.be.an('array');
					expect(res.body.queue[0].chats).not.to.undefined;
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				});

			await deleteDepartment(initialDepartment._id);
			await deleteDepartment(forwardToOfflineDepartment._id);
		});

		(IS_EE ? it : it.skip)(
			'should update inquiry last message when manager forward to offline department and the inquiry returns to queued',
			async () => {
				await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
				const { department: initialDepartment, agent } = await createDepartmentWithAnOnlineAgent();
				const { department: forwardToOfflineDepartment, agent: offlineAgent } = await createDepartmentWithAnOfflineAgent({
					allowReceiveForwardOffline: true,
				});

				const newVisitor = await createVisitor(initialDepartment._id);
				const newRoom = await createLivechatRoom(newVisitor.token);

				const inq = await fetchInquiry(newRoom._id);
				await takeInquiry(inq._id, agent.credentials);

				const msgText = `return to queue ${Date.now()}`;
				await request.post(api('livechat/message')).send({ token: newVisitor.token, rid: newRoom._id, msg: msgText }).expect(200);

				await makeAgentUnavailable(offlineAgent.credentials);

				const manager = await createUser();
				const managerCredentials = await login(manager.username, password);
				await createManager(manager.username);

				await request.post(api('livechat/room.forward')).set(managerCredentials).send({
					roomId: newRoom._id,
					departmentId: forwardToOfflineDepartment._id,
					clientAction: true,
					comment: 'test comment',
				});

				await request
					.get(api(`livechat/queue`))
					.set(credentials)
					.query({
						count: 1,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.queue).to.be.an('array');
						expect(res.body.queue[0].chats).not.to.undefined;
						expect(res.body).to.have.property('offset');
						expect(res.body).to.have.property('total');
						expect(res.body).to.have.property('count');
					});

				const inquiry = await fetchInquiry(newRoom._id);

				expect(inquiry).to.have.property('_id', inquiry._id);
				expect(inquiry).to.have.property('rid', newRoom._id);
				expect(inquiry).to.have.property('lastMessage');
				expect(inquiry.lastMessage).to.have.property('msg', '');
				expect(inquiry.lastMessage).to.have.property('t', 'livechat_transfer_history');

				await deleteDepartment(initialDepartment._id);
				await deleteDepartment(forwardToOfflineDepartment._id);
			},
		);

		let roomId: string;
		let visitorToken: string;
		(IS_EE ? it : it.skip)('should return a success message when transferring to a fallback department', async () => {
			await updateSetting('Livechat_Routing_Method', 'Auto_Selection');
			const { department: initialDepartment } = await createDepartmentWithAnOnlineAgent();
			const { department: forwardToDepartment } = await createDepartmentWithAnOnlineAgent();
			const forwardToDepartment1 = await createDepartment(undefined, undefined, true, {
				fallbackForwardDepartment: forwardToDepartment._id,
			});

			const newVisitor = await createVisitor(initialDepartment._id);
			const newRoom = await createLivechatRoom(newVisitor.token);

			await request
				.post(api('livechat/room.forward'))
				.set(credentials)
				.send({
					roomId: newRoom._id,
					departmentId: forwardToDepartment1._id,
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

			roomId = newRoom._id;
			visitorToken = newVisitor.token;
		});
		(IS_EE ? describe : describe.skip)('fallback department', () => {
			let fallbackDepartment: Awaited<ReturnType<typeof createDepartmentWithAnOnlineAgent>>['department'];
			let initialDepartment: Awaited<ReturnType<typeof createDepartmentWithAnOfflineAgent>>['department'];
			let newVisitor: ILivechatVisitor;
			let latestRoom: IOmnichannelRoom;
			before(async () => {
				await updateSetting('Livechat_Routing_Method', 'Auto_Selection');

				fallbackDepartment = (await createDepartmentWithAnOnlineAgent()).department;
				initialDepartment = (
					await createDepartmentWithAnOfflineAgent({
						fallbackForwardDepartment: fallbackDepartment._id,
					})
				).department;

				expect(initialDepartment.fallbackForwardDepartment).to.be.equal(fallbackDepartment._id);
			});

			after(async () => {
				await Promise.all([
					deleteDepartment(fallbackDepartment._id),
					deleteDepartment(initialDepartment._id),
					deleteVisitor(newVisitor._id),
					closeOmnichannelRoom(latestRoom._id),
				]);
			});

			it('should redirect chat to fallback department when all agents in the initial department are offline', async () => {
				await updateSetting('Livechat_Routing_Method', 'Auto_Selection');

				newVisitor = await createVisitor(initialDepartment._id);
				const newRoom = await createLivechatRoom(newVisitor.token);

				latestRoom = await getLivechatRoomInfo(newRoom._id);

				expect(latestRoom).to.have.property('departmentId');
				expect(latestRoom.departmentId).to.be.equal(fallbackDepartment._id);
			});
		});
		(IS_EE ? it : it.skip)('system messages sent on transfer should be properly generated', async () => {
			const messagesList = await fetchMessages(roomId, visitorToken);

			const fallbackMessages = messagesList.filter((m) => m.t === 'livechat_transfer_history_fallback');
			expect(fallbackMessages.length).to.be.equal(1);

			const userJoinedMessages = messagesList.filter((m) => m.t === 'uj');
			expect(userJoinedMessages.length).to.be.equal(2);

			const transferMessages = messagesList.filter((m) => m.t === 'livechat_transfer_history');
			expect(transferMessages.length).to.be.equal(1);

			const userLeavingMessages = messagesList.filter((m) => m.t === 'ul');
			expect(userLeavingMessages.length).to.be.equal(1);
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
		let visitor: ILivechatVisitor | undefined;

		afterEach(() => {
			if (visitor?.token) {
				return deleteVisitor(visitor.token);
			}
		});

		after(async () => {
			await updateSetting('FileUpload_Enabled', true);
			await updateSetting('Livechat_fileupload_enabled', true);
		});

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
			visitor = await createVisitor();
			await request
				.post(api('livechat/upload/test'))
				.set(credentials)
				.set('x-visitor-token', visitor.token)
				.attach('file', fs.createReadStream(path.join(__dirname, '../../../data/livechat/sample.png')))
				.expect('Content-Type', 'application/json')
				.expect(403);
		});

		it('should throw an error if the file is not attached', async () => {
			visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await request
				.post(api(`livechat/upload/${room._id}`))
				.set(credentials)
				.set('x-visitor-token', visitor.token)
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should throw and error if file uploads are enabled but livechat file uploads are disabled', async () => {
			await updateSetting('Livechat_fileupload_enabled', false);
			visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await request
				.post(api(`livechat/upload/${room._id}`))
				.set(credentials)
				.set('x-visitor-token', visitor.token)
				.attach('file', fs.createReadStream(path.join(__dirname, '../../../data/livechat/sample.png')))
				.expect('Content-Type', 'application/json')
				.expect(400);
			await updateSetting('Livechat_fileupload_enabled', true);
		});

		it('should throw and error if livechat file uploads are enabled but file uploads are disabled', async () => {
			await updateSetting('FileUpload_Enabled', false);
			visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await request
				.post(api(`livechat/upload/${room._id}`))
				.set(credentials)
				.set('x-visitor-token', visitor.token)
				.attach('file', fs.createReadStream(path.join(__dirname, '../../../data/livechat/sample.png')))
				.expect('Content-Type', 'application/json')
				.expect(400);
			await updateSetting('FileUpload_Enabled', true);
		});

		it('should throw and error if both file uploads are disabled', async () => {
			await updateSetting('Livechat_fileupload_enabled', false);
			await updateSetting('FileUpload_Enabled', false);
			visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await request
				.post(api(`livechat/upload/${room._id}`))
				.set(credentials)
				.set('x-visitor-token', visitor.token)
				.attach('file', fs.createReadStream(path.join(__dirname, '../../../data/livechat/sample.png')))
				.expect('Content-Type', 'application/json')
				.expect(400);
			await updateSetting('FileUpload_Enabled', true);
			await updateSetting('Livechat_fileupload_enabled', true);
		});

		it('should upload an image on the room if all params are valid', async () => {
			await updateSetting('FileUpload_Enabled', true);
			await updateSetting('Livechat_fileupload_enabled', true);
			visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await request
				.post(api(`livechat/upload/${room._id}`))
				.set(credentials)
				.set('x-visitor-token', visitor.token)
				.attach('file', fs.createReadStream(path.join(__dirname, '../../../data/livechat/sample.png')))
				.expect('Content-Type', 'application/json')
				.expect(200);
		});

		it('should allow visitor to download file', async () => {
			visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);

			const { body } = await request
				.post(api(`livechat/upload/${room._id}`))
				.set('x-visitor-token', visitor.token)
				.attach('file', fs.createReadStream(path.join(__dirname, '../../../data/livechat/sample.png')))
				.expect('Content-Type', 'application/json')
				.expect(200);

			const {
				files: [{ _id, name }],
			} = body;
			const imageUrl = `/file-upload/${_id}/${name}`;
			await request.get(imageUrl).query({ rc_token: visitor.token, rc_room_type: 'l', rc_rid: room._id }).expect(200);
			await closeOmnichannelRoom(room._id);
		});

		it('should allow visitor to download file even after room is closed', async () => {
			visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const { body } = await request
				.post(api(`livechat/upload/${room._id}`))
				.set('x-visitor-token', visitor.token)
				.attach('file', fs.createReadStream(path.join(__dirname, '../../../data/livechat/sample.png')))
				.expect('Content-Type', 'application/json')
				.expect(200);

			await closeOmnichannelRoom(room._id);
			const {
				files: [{ _id, name }],
			} = body;
			const imageUrl = `/file-upload/${_id}/${name}`;
			await request.get(imageUrl).query({ rc_token: visitor.token, rc_room_type: 'l', rc_rid: room._id }).expect(200);
		});

		it('should not allow visitor to download a file from a room he didnt create', async () => {
			visitor = await createVisitor();
			const visitor2 = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const { body } = await request
				.post(api(`livechat/upload/${room._id}`))
				.set(credentials)
				.set('x-visitor-token', visitor.token)
				.attach('file', fs.createReadStream(path.join(__dirname, '../../../data/livechat/sample.png')))
				.expect('Content-Type', 'application/json')
				.expect(200);

			await closeOmnichannelRoom(room._id);
			const {
				files: [{ _id, name }],
			} = body;
			const imageUrl = `/file-upload/${_id}/${name}`;
			await request.get(imageUrl).query({ rc_token: visitor2.token, rc_room_type: 'l', rc_rid: room._id }).expect(403);
			await deleteVisitor(visitor2.token);
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
			await deleteVisitor(visitor.token);
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
			await deleteVisitor(visitor.token);
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
			await deleteVisitor(visitor.token);
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
			await deleteVisitor(visitor.token);
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
			await deleteVisitor(visitor.token);
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
			await deleteVisitor(visitor.token);
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
			await deleteVisitor(visitor.token);
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
			await deleteVisitor(visitor.token);
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
			await deleteVisitor(visitor.token);
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
			await deleteVisitor(visitor.token);
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
			await deleteVisitor(visitor.token);
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
			await deleteVisitor(visitor.token);
		});
		it('should return the transfer history for a room', async () => {
			await updatePermission('view-l-room', ['admin', 'livechat-manager', 'livechat-agent']);
			const initialAgentAssignedToChat = await createUser();
			const initialAgentCredentials = await login(initialAgentAssignedToChat.username, password);
			await createAgent(initialAgentAssignedToChat.username);
			await makeAgentAvailable(initialAgentCredentials);

			const newVisitor = await createVisitor();
			// at this point, the chat will get transferred to agent "user"
			const newRoom = await createLivechatRoom(newVisitor.token);

			const forwardChatToUser = await createUser();
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
			await deleteVisitor(newVisitor.token);
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
			await deleteVisitor(newVisitor.token);
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
			await deleteVisitor(newVisitor.token);
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
			await deleteVisitor(newVisitor.token);
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
			await deleteVisitor(newVisitor.token);
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
			await deleteVisitor(newVisitor.token);
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
			await deleteVisitor(newVisitor.token);
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
			await deleteVisitor(newVisitor.token);
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
			await deleteVisitor(newVisitor.token);
		});
	});
	(IS_EE ? describe : describe.skip)('livechat/room/:rid/priority', async () => {
		let priorities: ILivechatPriority[];
		let chosenPriority: ILivechatPriority;
		after(async () => {
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
			await deleteVisitor(visitor.token);
		});
		it('should not close a room without comment', async () => {
			await restorePermissionToRoles('close-others-livechat-room');
			const visitor = await createVisitor();
			const { _id } = await createLivechatRoom(visitor.token);
			const response = await request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: _id }).expect(400);

			expect(response.body).to.have.property('success', false);
			expect(response.body).to.have.property('error', 'error-comment-is-required');
			await deleteVisitor(visitor.token);
		});
		it('should not close a room when comment is an empty string', async () => {
			await restorePermissionToRoles('close-others-livechat-room');
			const visitor = await createVisitor();
			const { _id } = await createLivechatRoom(visitor.token);
			const response = await request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: _id, comment: '' }).expect(400);

			expect(response.body).to.have.property('success', false);
			await deleteVisitor(visitor.token);
		});
		it('should close room if user has permission', async () => {
			const visitor = await createVisitor();
			const { _id } = await createLivechatRoom(visitor.token);
			await request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: _id, comment: 'test' }).expect(200);
			await deleteVisitor(visitor.token);
		});
		it('should fail if room is closed', async () => {
			const visitor = await createVisitor();
			const { _id } = await createLivechatRoom(visitor.token);

			// close room
			await request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: _id, comment: 'test' }).expect(200);

			// try to close again
			await request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: _id, comment: 'test' }).expect(400);
			await deleteVisitor(visitor.token);
		});
		it('should fail one of the requests if 3 simultaneous closes are attempted', async () => {
			const visitor = await createVisitor();
			const { _id } = await createLivechatRoom(visitor.token);

			const results = await Promise.allSettled([
				request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: _id, comment: 'test' }),
				request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: _id, comment: 'test' }),
				request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: _id, comment: 'test' }),
			]);

			const validResponse = results.filter((res) => (res as any).value.status === 200);
			const invalidResponses = results.filter((res) => (res as any).value.status !== 200);

			expect(validResponse.length).to.equal(1);
			expect(invalidResponses.length).to.equal(2);
			// @ts-expect-error promise typings
			expect(invalidResponses[0].value.body).to.have.property('success', false);
			// @ts-expect-error promise typings
			expect(invalidResponses[0].value.body).to.have.property('error');
			// The transaction is not consistent on the error apparently, sometimes it will reach the point of trying to close the inquiry and abort there (since another call already closed the room and finished)
			// and sometimes it will abort because the transactions are still running and they're being locked. This is something i'm not liking but since tx should be retried we got this
			// @ts-expect-error promise typings
			expect(['error-room-cannot-be-closed-try-again', 'Error removing inquiry']).to.include(invalidResponses[0].value.body.error);
		});

		it('should allow different rooms to be closed simultaneously', async () => {
			const visitor = await createVisitor();
			const { _id } = await createLivechatRoom(visitor.token);

			const visitor2 = await createVisitor();
			const { _id: _id2 } = await createLivechatRoom(visitor2.token);

			const results = await Promise.allSettled([
				request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: _id, comment: 'test' }),
				request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: _id2, comment: 'test' }),
			]);

			const validResponse = results.filter((res) => (res as any).value.status === 200);
			const invalidResponses = results.filter((res) => (res as any).value.status !== 200);

			expect(validResponse.length).to.equal(2);
			expect(invalidResponses.length).to.equal(0);
		});

		it('when both user & visitor try to close room, only one will succeed (theres no guarantee who will win)', async () => {
			const visitor = await createVisitor();
			const { _id } = await createLivechatRoom(visitor.token);

			const results = await Promise.allSettled([
				request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: _id, comment: 'test' }),
				request.post(api('livechat/room.close')).set(credentials).send({ rid: _id, token: visitor.token }),
			]);

			const validResponse = results.filter((res) => (res as any).value.status === 200);
			const invalidResponses = results.filter((res) => (res as any).value.status !== 200);

			// @ts-expect-error promise typings
			const whoWon = validResponse[0].value.request.url.includes('closeByUser') ? 'user' : 'visitor';

			expect(validResponse.length).to.equal(1);
			expect(invalidResponses.length).to.equal(1);
			// @ts-expect-error promise typings
			expect(invalidResponses[0].value.body).to.have.property('success', false);
			// This error indicates a conflict in the simultaneous close and that the request was rejected
			// @ts-expect-error promise typings
			expect(invalidResponses[0].value.body).to.have.property('error');
			// @ts-expect-error promise typings
			expect(['error-room-cannot-be-closed-try-again', 'Error removing inquiry']).to.include(invalidResponses[0].value.body.error);

			const room = await getLivechatRoomInfo(_id);

			expect(room).to.not.have.property('open');
			expect(room).to.have.property('closer', whoWon);
		});

		it('when a close request is tried multiple times, the final state of the room should be valid', async () => {
			const visitor = await createVisitor();
			const { _id } = await createLivechatRoom(visitor.token);

			await Promise.allSettled([
				request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: _id, comment: 'test' }),
				request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: _id, comment: 'test' }),
				request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: _id, comment: 'test' }),
			]);

			const room = await getLivechatRoomInfo(_id);
			const inqForRoom = await fetchInquiry(_id);
			const sub = await request
				.get(api('subscriptions.getOne'))
				.set(credentials)
				.query({ roomId: _id })
				.expect('Content-Type', 'application/json');

			expect(room).to.not.have.property('open');
			expect(room).to.have.property('closedAt');
			expect(room).to.have.property('closer', 'user');
			expect(inqForRoom).to.be.null;
			expect(sub.body.subscription).to.be.null;
		});

		describe('Force closing', () => {
			after(async () => {
				await updateSetting('Omnichannel_allow_force_close_conversations', false);
			});
			it('should not allow force closing if setting Omnichannel_allow_force_close_conversations is off', async () => {
				const visitor = await createVisitor();
				const { _id } = await createLivechatRoom(visitor.token);
				await request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: _id, comment: 'test' });

				// Room closed, try to close again should return an error
				const result = await request
					.post(api('livechat/room.closeByUser'))
					.set(credentials)
					.send({ rid: _id, comment: 'test', forceClose: true });

				expect(result.body).to.have.property('success', false);
				expect(result.body).to.have.property('error', 'error-room-already-closed');
			});
			it('should allow to force close a conversation (even if the conversation is already closed)', async () => {
				await updateSetting('Omnichannel_allow_force_close_conversations', true);

				const visitor = await createVisitor();
				const { _id } = await createLivechatRoom(visitor.token);
				await request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: _id, comment: 'test' });

				// Room closed, try to force close again should work
				const result = await request
					.post(api('livechat/room.closeByUser'))
					.set(credentials)
					.send({ rid: _id, comment: 'test', forceClose: true });

				expect(result.body).to.have.property('success', true);
			});
		});

		(IS_EE ? it : it.skip)('should close room and generate transcript pdf', async () => {
			const {
				room: { _id: roomId },
			} = await startANewLivechatRoomAndTakeIt();

			await request
				.post(api('livechat/room.closeByUser'))
				.set(credentials)
				.send({ rid: roomId, comment: 'test', generateTranscriptPdf: true })
				.expect(200);

			// Wait for the pdf to be generated
			await sleep(1500);

			const latestRoom = await getLivechatRoomInfo(roomId);
			expect(latestRoom).to.have.property('pdfTranscriptFileId').and.to.be.a('string');
		});

		(IS_EE ? it : it.skip)('should close room and not generate transcript pdf', async () => {
			const {
				room: { _id: roomId },
			} = await startANewLivechatRoomAndTakeIt();

			await request
				.post(api('livechat/room.closeByUser'))
				.set(credentials)
				.send({ rid: roomId, comment: 'test', generateTranscriptPdf: false })
				.expect(200);

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
			await deleteVisitor(visitor.token);
		});
		it('should fail if room is not closed', async () => {
			await updatePermission('request-pdf-transcript', ['admin', 'livechat-agent', 'livechat-manager']);
			const visitor = await createVisitor();
			const { _id } = await createLivechatRoom(visitor.token);
			await request
				.post(api(`omnichannel/${_id}/request-transcript`))
				.set(credentials)
				.expect(400);
			await deleteVisitor(visitor.token);
		});
		it('should return OK if no one is serving the room (queued)', async () => {
			const visitor = await createVisitor();
			const { _id } = await createLivechatRoom(visitor.token);
			await closeOmnichannelRoom(_id);
			await request
				.post(api(`omnichannel/${_id}/request-transcript`))
				.set(credentials)
				.expect(200);
			await deleteVisitor(visitor.token);
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

		after(async () => {
			await deleteDepartment(departmentWithAgent.department._id);
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
			await deleteVisitor(visitor.token);
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
			await deleteVisitor(visitor.token);
		});
	});

	describe('livechat/transcript/:rid', () => {
		it('should fail if user is not logged in', async () => {
			await request.delete(api('livechat/transcript/rid')).expect(401);
		});
		it('should fail if user doesnt have send-omnichannel-chat-transcript permission', async () => {
			await updatePermission('send-omnichannel-chat-transcript', []);
			await request.delete(api('livechat/transcript/rid')).set(credentials).expect(403);
		});
		it('should fail if :rid is not a valid room id', async () => {
			await updatePermission('send-omnichannel-chat-transcript', ['admin']);
			await request.delete(api('livechat/transcript/rid')).set(credentials).expect(400);
		});
		it('should fail if room is closed', async () => {
			const visitor = await createVisitor();
			const { _id } = await createLivechatRoom(visitor.token);
			await closeOmnichannelRoom(_id);
			await request
				.delete(api(`livechat/transcript/${_id}`))
				.set(credentials)
				.expect(400);
			await deleteVisitor(visitor.token);
		});
		it('should fail if room doesnt have a transcript request active', async () => {
			const visitor = await createVisitor();
			const { _id } = await createLivechatRoom(visitor.token);
			await request
				.delete(api(`livechat/transcript/${_id}`))
				.set(credentials)
				.expect(400);
			await deleteVisitor(visitor.token);
		});
		it('should return OK if all conditions are met', async () => {
			const visitor = await createVisitor();
			const { _id } = await createLivechatRoom(visitor.token);
			// First, request transcript with livechat:requestTranscript method
			await request
				.post(api(`livechat/transcript/${_id}`))
				.set(credentials)
				.send({
					email: 'test@test.com',
					subject: 'Transcript of your omnichannel conversation',
				})
				.expect(200);

			// Then, delete the transcript
			await request
				.delete(api(`livechat/transcript/${_id}`))
				.set(credentials)
				.expect(200);
			await deleteVisitor(visitor.token);
		});
	});

	describe('livechat:sendTranscript', () => {
		it('should fail if user doesnt have send-omnichannel-chat-transcript permission', async () => {
			await updatePermission('send-omnichannel-chat-transcript', []);
			const { body } = await request
				.post(methodCall('livechat:sendTranscript'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						msg: 'method',
						id: '1091',
						method: 'livechat:sendTranscript',
						params: ['test', 'test', 'test', 'test'],
					}),
				})
				.expect(200);

			const result = parseMethodResponse(body);
			expect(body.success).to.be.true;
			expect(result).to.have.property('error').that.is.an('object').that.has.property('error', 'error-not-allowed');
		});
		it('should fail if not all params are provided', async () => {
			await updatePermission('send-omnichannel-chat-transcript', ['admin']);
			const { body } = await request
				.post(methodCall('livechat:sendTranscript'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						msg: 'method',
						id: '1091',
						method: 'livechat:sendTranscript',
						params: [],
					}),
				})
				.expect(200);

			const result = parseMethodResponse(body);
			expect(body.success).to.be.true;
			expect(result).to.have.property('error').that.is.an('object').that.has.property('errorType', 'Match.Error');
		});
		it('should fail if token is invalid', async () => {
			const { body } = await request
				.post(methodCall('livechat:sendTranscript'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						msg: 'method',
						id: '1091',
						method: 'livechat:sendTranscript',
						params: ['invalid-token', 'test', 'test', 'test'],
					}),
				})
				.expect(200);

			const result = parseMethodResponse(body);
			expect(body.success).to.be.true;
			expect(result).to.have.property('error').that.is.an('object');
		});
		it('should fail if roomId is invalid', async () => {
			const visitor = await createVisitor();
			const { body } = await request
				.post(methodCall('livechat:sendTranscript'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						msg: 'method',
						id: '1091',
						method: 'livechat:sendTranscript',
						params: [visitor.token, 'invalid-room-id', 'test', 'test'],
					}),
				})
				.expect(200);

			const result = parseMethodResponse(body);
			expect(body.success).to.be.true;
			expect(result).to.have.property('error').that.is.an('object');
			await deleteVisitor(visitor.token);
		});
		it('should fail if token is from another conversation', async () => {
			const visitor = await createVisitor();
			const visitor2 = await createVisitor();
			const { _id } = await createLivechatRoom(visitor.token);
			const { body } = await request
				.post(methodCall('livechat:sendTranscript'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						msg: 'method',
						id: '1091',
						method: 'livechat:sendTranscript',
						params: [visitor2.token, _id, 'test', 'test'],
					}),
				})
				.expect(200);

			const result = parseMethodResponse(body);
			expect(body.success).to.be.true;
			expect(result).to.have.property('error').that.is.an('object');
			await deleteVisitor(visitor.token);
			await deleteVisitor(visitor2.token);
		});
		it('should fail if email provided is invalid', async () => {
			const visitor = await createVisitor();
			const { _id } = await createLivechatRoom(visitor.token);
			const { body } = await request
				.post(methodCall('livechat:sendTranscript'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						msg: 'method',
						id: '1091',
						method: 'livechat:sendTranscript',
						params: [visitor.token, _id, 'invalid-email', 'test'],
					}),
				})
				.expect(200);

			const result = parseMethodResponse(body);
			expect(body.success).to.be.true;
			expect(result).to.have.property('error').that.is.an('object');
			await deleteVisitor(visitor.token);
		});
		it('should work if all params are good', async () => {
			const visitor = await createVisitor();
			const { _id } = await createLivechatRoom(visitor.token);
			const { body } = await request
				.post(methodCall('livechat:sendTranscript'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						msg: 'method',
						id: '1091',
						method: 'livechat:sendTranscript',
						params: [visitor.token, _id, 'test@test', 'test'],
					}),
				})
				.expect(200);

			const result = parseMethodResponse(body);
			expect(body.success).to.be.true;
			expect(result).to.have.property('result', true);
			await deleteVisitor(visitor.token);
		});
	});
});
