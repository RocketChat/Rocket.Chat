/* eslint-env mocha */

import { faker } from '@faker-js/faker';
import type { Credentials } from '@rocket.chat/api-client';
import type { ILivechatDepartment, ILivechatVisitor, IOmnichannelRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createDepartmentWithAnOnlineAgent, deleteDepartment, addOrRemoveAgentFromDepartment } from '../../../data/livechat/department';
import {
	createVisitor,
	createLivechatRoom,
	closeOmnichannelRoom,
	deleteVisitor,
	createAgent,
	createDepartment,
	getLivechatRoomInfo,
	makeAgentAvailable,
	updateDepartment,
} from '../../../data/livechat/rooms';
import { createAnOnlineAgent, updateLivechatSettingsForUser } from '../../../data/livechat/users';
import { sleep } from '../../../data/livechat/utils';
import { updateEESetting, updatePermission, updateSetting } from '../../../data/permissions.helper';
import { password } from '../../../data/user';
import { createUser, deleteUser, login } from '../../../data/users.helper';
import { IS_EE } from '../../../e2e/config/constants';

const cleanupRooms = async () => {
	const response = await request.get(api('livechat/queue')).set(credentials).expect('Content-Type', 'application/json').expect(200);

	const { queue } = response.body;

	for await (const item of queue) {
		const {
			body: { rooms },
		} = await request.get(api('livechat/rooms')).query({ 'agents[]': item.user._id }).set(credentials);

		await Promise.all(
			rooms.map((room: IOmnichannelRoom) =>
				request.post(api('livechat/room.closeByUser')).set(credentials).send({ rid: room._id, comment: faker.lorem.sentence() }),
			),
		);
	}
};

describe('LIVECHAT - Queue', () => {
	before((done) => getCredentials(done));

	before(async () =>
		Promise.all([
			updateSetting('Livechat_enabled', true),
			updateSetting('Livechat_Routing_Method', 'Auto_Selection'),
			updateEESetting('Livechat_Require_Contact_Verification', 'never'),
			updateSetting('Omnichannel_enable_department_removal', true),

			// this cleanup is required since previous tests left the DB dirty
			cleanupRooms(),
		]),
	);

	after(async () => {
		await updateSetting('Omnichannel_enable_department_removal', false);
	});

	describe('livechat/queue', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-l-room', []);
			await request.get(api('livechat/queue')).set(credentials).expect('Content-Type', 'application/json').expect(403);
			await updatePermission('view-l-room', ['admin']);
		});

		it('should return an array of queued metrics', async () => {
			await request
				.get(api('livechat/queue'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.queue).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				});
		});
		it('should return an array of queued metrics even requested with count and offset params', async () => {
			await request
				.get(api('livechat/queue'))
				.set(credentials)
				.query({
					count: 5,
					offset: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.queue).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				});
		});
	});

	describe('queue position', () => {
		let agent1: { user: IUser };
		let agent2: { user: IUser };
		let agent3: { user: IUser };
		let deptd1: ILivechatDepartment;
		let deptd2: ILivechatDepartment;

		const roomsToClose: IOmnichannelRoom[] = [];
		const visitors: ILivechatVisitor[] = [];
		const usersToDelete: IUser[] = [];

		before(async () => {
			const { department, agent } = await createDepartmentWithAnOnlineAgent();

			deptd1 = department;
			agent1 = agent;

			usersToDelete.push(agent.user);

			const newVisitor = await createVisitor(deptd1._id);
			const newRoom = await createLivechatRoom(newVisitor.token);

			roomsToClose.push(newRoom);
			visitors.push(newVisitor);
		});

		after(async () => {
			await deleteDepartment(deptd1._id);

			if (deptd2) {
				await deleteDepartment(deptd2._id);
			}

			await Promise.all(roomsToClose.map((room) => closeOmnichannelRoom(room._id)));
			await Promise.all(visitors.map((visitor) => deleteVisitor(visitor.token)));
			await Promise.all(usersToDelete.map((user) => deleteUser(user)));
		});

		it('should have one item in the queue', async () => {
			await request
				.get(api('livechat/queue'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
					expect(res.body.queue).to.be.an('array').of.length(1);

					const [queue] = res.body.queue;

					expect(queue).to.have.property('chats', 1);
					expect(queue).to.have.nested.property('user._id', agent1.user._id);
					expect(queue).to.have.nested.property('department._id', deptd1._id);
				});
		});

		it('should return empty results when filtering by another agent', async () => {
			await request
				.get(api('livechat/queue'))
				.query({ agentId: 'another-agent' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total', 0);
					expect(res.body).to.have.property('count', 0);
					expect(res.body.queue).to.be.an('array').of.length(0);
				});
		});

		it('should increase chats when a new room for same department is created', async () => {
			const newVisitor = await createVisitor();
			const newRoom = await createLivechatRoom(newVisitor.token);

			roomsToClose.push(newRoom);
			visitors.push(newVisitor);

			await request
				.get(api('livechat/queue'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
					expect(res.body.queue).to.be.an('array').of.length(1);

					const [queue] = res.body.queue;

					expect(queue).to.have.property('chats', 2);
					expect(queue).to.have.nested.property('user._id', agent1.user._id);
					expect(queue).to.have.nested.property('department._id', deptd1._id);
				});
		});

		it('should have two items when create room for another agent', async () => {
			const { user } = await createAnOnlineAgent();
			await addOrRemoveAgentFromDepartment(deptd1._id, { agentId: user._id, username: user.username }, true);

			agent2 = { user };

			usersToDelete.push(user);

			const newVisitor = await createVisitor(deptd1._id);
			const newRoom = await createLivechatRoom(newVisitor.token);

			roomsToClose.push(newRoom);
			visitors.push(newVisitor);

			await request
				.get(api('livechat/queue'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
					expect(res.body.queue).to.be.an('array').of.length(2);

					const [queue1, queue2] = res.body.queue;

					expect(queue1).to.have.property('chats', 2);
					expect(queue1).to.have.nested.property('user._id', agent1.user._id);
					expect(queue1).to.have.nested.property('department._id', deptd1._id);

					expect(queue2).to.have.property('chats', 1);
					expect(queue2).to.have.nested.property('user._id', agent2.user._id);
					expect(queue2).to.have.nested.property('department._id', deptd1._id);
				});
		});

		it('should be able to filter for second agent only', async () => {
			await request
				.get(api('livechat/queue'))
				.query({ agentId: agent2.user._id })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
					expect(res.body.queue).to.be.an('array').of.length(1);

					const [queue1] = res.body.queue;

					expect(queue1).to.have.property('chats', 1);
					expect(queue1).to.have.nested.property('user._id', agent2.user._id);
					expect(queue1).to.have.nested.property('department._id', deptd1._id);
				});
		});

		it('should return empty if filter for a department without chats', async () => {
			await request
				.get(api('livechat/queue'))
				.query({ departmentId: 'no-chats' })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total', 0);
					expect(res.body).to.have.property('count', 0);
					expect(res.body.queue).to.be.an('array').of.length(0);
				});
		});

		it('should be able to filter for first department only', async () => {
			await request
				.get(api('livechat/queue'))
				.query({ departmentId: deptd1._id })
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
					expect(res.body.queue).to.be.an('array').of.length(2);

					const [queue1] = res.body.queue;

					expect(queue1).to.have.property('chats', 2);
					expect(queue1).to.have.nested.property('user._id', agent1.user._id);
					expect(queue1).to.have.nested.property('department._id', deptd1._id);
				});
		});

		(IS_EE ? it : it.skip)('should have three items when create room for another department', async () => {
			const { department: dep2, agent: ag3 } = await createDepartmentWithAnOnlineAgent();

			agent3 = ag3;

			usersToDelete.push(ag3.user);

			deptd2 = dep2;

			const newVisitor = await createVisitor(deptd2._id);
			const newRoom = await createLivechatRoom(newVisitor.token);

			roomsToClose.push(newRoom);
			visitors.push(newVisitor);

			await request
				.get(api('livechat/queue'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
					expect(res.body.queue).to.be.an('array').of.length(3);

					const [queue1, queue2, queue3] = res.body.queue;

					expect(queue1).to.have.property('chats', 2);
					expect(queue1).to.have.nested.property('user._id', agent1.user._id);
					expect(queue1).to.have.nested.property('department._id', deptd1._id);

					expect(queue2).to.have.property('chats', 1);
					expect(queue3).to.have.property('chats', 1);
				});
		});

		(IS_EE ? it : it.skip)('should change the order when second department gets more rooms', async () => {
			const newVisitor1 = await createVisitor(deptd2._id);
			const newRoom1 = await createLivechatRoom(newVisitor1.token);

			roomsToClose.push(newRoom1);
			visitors.push(newVisitor1);

			const newVisitor2 = await createVisitor(deptd2._id);
			const newRoom2 = await createLivechatRoom(newVisitor2.token);

			roomsToClose.push(newRoom2);
			visitors.push(newVisitor2);

			await request
				.get(api('livechat/queue'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
					expect(res.body.queue).to.be.an('array').of.length(3);

					const [queue1, queue2, queue3] = res.body.queue;

					expect(queue1).to.have.property('chats', 3);
					expect(queue1).to.have.nested.property('user._id', agent3.user._id);
					expect(queue1).to.have.nested.property('department._id', deptd2._id);

					expect(queue2).to.have.property('chats', 2);
					expect(queue2).to.have.nested.property('user._id', agent1.user._id);
					expect(queue2).to.have.nested.property('department._id', deptd1._id);

					expect(queue3).to.have.property('chats', 1);
					expect(queue3).to.have.nested.property('user._id', agent2.user._id);
					expect(queue3).to.have.nested.property('department._id', deptd1._id);
				});
		});
	});
});

(IS_EE ? describe : describe.skip)('Livechat - Chat limits - AutoSelection', () => {
	let testUser: { user: IUser; credentials: Credentials };
	let testDepartment: ILivechatDepartment;
	let testDepartment2: ILivechatDepartment;

	before((done) => getCredentials(done));

	before(async () =>
		Promise.all([
			updateSetting('Livechat_enabled', true),
			updateSetting('Livechat_Routing_Method', 'Auto_Selection'),
			updateSetting('Omnichannel_enable_department_removal', true),
			updateEESetting('Livechat_maximum_chats_per_agent', 0),
			updateEESetting('Livechat_waiting_queue', true),
		]),
	);

	before(async () => {
		const user = await createUser();
		await createAgent(user.username);
		const credentials3 = await login(user.username, password);
		await makeAgentAvailable(credentials3);

		testUser = {
			user,
			credentials: credentials3,
		};
	});

	before(async () => {
		testDepartment = await createDepartment([{ agentId: testUser.user._id }], `${new Date().toISOString()}-department`, true, {
			maxNumberSimultaneousChat: 2,
		});
		testDepartment2 = await createDepartment([{ agentId: testUser.user._id }], `${new Date().toISOString()}-department2`, true, {
			maxNumberSimultaneousChat: 2,
		});
		await updateLivechatSettingsForUser(testUser.user._id, { maxNumberSimultaneousChat: 1 }, [testDepartment._id, testDepartment2._id]);
	});

	after(async () => {
		await Promise.all([
			deleteUser(testUser.user),
			updateEESetting('Livechat_maximum_chats_per_agent', 0),
			updateEESetting('Livechat_waiting_queue', false),
			deleteDepartment(testDepartment._id),
			deleteDepartment(testDepartment2._id),
		]);
		await updateSetting('Omnichannel_enable_department_removal', false);
	});

	it('should allow a user to take a chat on a department since agent limit is set to 1 and department limit is set to 2 (agent has 0 chats)', async () => {
		const visitor = await createVisitor(testDepartment._id);
		const room = await createLivechatRoom(visitor.token);

		await sleep(5000);

		const roomInfo = await getLivechatRoomInfo(room._id);

		expect(roomInfo.servedBy).to.be.an('object');
		expect(roomInfo.servedBy?._id).to.be.equal(testUser.user._id);
	});

	let previousChat: string;
	it('should not allow a user to take a chat on a department since agent limit is set to 1 and department limit is set to 2 (agent has 1 chat)', async () => {
		const visitor = await createVisitor(testDepartment._id);
		const room = await createLivechatRoom(visitor.token);

		await sleep(5000);

		const roomInfo = await getLivechatRoomInfo(room._id);

		expect(roomInfo.servedBy).to.be.undefined;
		previousChat = room._id;
	});

	it('should allow a user to take a chat on a department when agent limit is increased to 2 and department limit is set to 2 (agent has 1 chat)', async () => {
		await updateLivechatSettingsForUser(testUser.user._id, { maxNumberSimultaneousChat: 2 }, [testDepartment._id, testDepartment2._id]);
		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(previousChat);

		expect(roomInfo.servedBy).to.be.an('object');
		expect(roomInfo.servedBy?._id).to.be.equal(testUser.user._id);
	});

	it('should not allow user to take chat on department B when agent limit is 2 and already has 2 chats', async () => {
		const visitor = await createVisitor(testDepartment2._id);
		const room = await createLivechatRoom(visitor.token);

		await sleep(5000);

		const roomInfo = await getLivechatRoomInfo(room._id);

		expect(roomInfo.servedBy).to.be.undefined;
		previousChat = room._id;
	});

	it('should allow user to take a chat on department B when agent limit is increased to 3 and user has 2 chats on department A', async () => {
		await updateLivechatSettingsForUser(testUser.user._id, { maxNumberSimultaneousChat: 3 }, [testDepartment._id, testDepartment2._id]);

		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(previousChat);

		expect(roomInfo.servedBy).to.be.an('object');
		expect(roomInfo.servedBy?._id).to.be.equal(testUser.user._id);
	});

	it('should allow a user to take a chat on department B when agent limit is 0 and department B limit is 2 (user has 3 chats)', async () => {
		await updateLivechatSettingsForUser(testUser.user._id, { maxNumberSimultaneousChat: 0 }, [testDepartment._id, testDepartment2._id]);
		const visitor = await createVisitor(testDepartment2._id);
		const room = await createLivechatRoom(visitor.token);

		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(room._id);

		expect(roomInfo.servedBy).to.be.an('object');
		expect(roomInfo.servedBy?._id).to.be.equal(testUser.user._id);
	});

	it('should not allow user to take a chat on department B when is on the limit (user has 4 chats, 2 chats on department B)', async () => {
		const visitor = await createVisitor(testDepartment2._id);
		const room = await createLivechatRoom(visitor.token);

		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(room._id);

		expect(roomInfo.servedBy).to.be.undefined;
		previousChat = room._id;
	});

	it('should not allow user to take a chat on department B even if global limit allows it (user has 4 chats)', async () => {
		await updateEESetting('Livechat_maximum_chats_per_agent', 6);

		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(previousChat);

		expect(roomInfo.servedBy).to.be.undefined;
	});
	it('should allow user to take a chat when department B limit is removed and its below global limit (user has 4 chats)', async () => {
		await updateDepartment({ departmentId: testDepartment2._id, opts: { maxNumberSimultaneousChat: 0 }, userCredentials: credentials });
		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(previousChat);

		expect(roomInfo.servedBy).to.be.an('object');
		expect(roomInfo.servedBy?._id).to.be.equal(testUser.user._id);
	});

	it('should allow user to take a chat on department B (user has 5 chats, global limit is 6, department limit is 0)', async () => {
		const visitor = await createVisitor(testDepartment2._id);
		const room = await createLivechatRoom(visitor.token);

		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(room._id);

		expect(roomInfo.servedBy).to.be.an('object');
		expect(roomInfo.servedBy?._id).to.be.equal(testUser.user._id);
	});

	it('should not allow user to take a chat on department B (user has 6 chats, global limit is 6, department limit is 0)', async () => {
		const visitor = await createVisitor(testDepartment2._id);
		const room = await createLivechatRoom(visitor.token);

		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(room._id);

		expect(roomInfo.servedBy).to.be.undefined;
		previousChat = room._id;
	});

	it('should allow user to take chat once the global limit is removed (user has 7 chats)', async () => {
		await updateEESetting('Livechat_maximum_chats_per_agent', 0);

		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(previousChat);

		expect(roomInfo.servedBy).to.be.an('object');
		expect(roomInfo.servedBy?._id).to.be.equal(testUser.user._id);
	});

	it('should not allow user to take chat on department A (as limit for it hasnt changed)', async () => {
		const visitor = await createVisitor(testDepartment._id);
		const room = await createLivechatRoom(visitor.token);

		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(room._id);

		expect(roomInfo.servedBy).to.be.undefined;
	});

	it('should allow user to take a chat on department A when its limit gets removed (no agent, global or department filter are applied)', async () => {
		await updateDepartment({ departmentId: testDepartment._id, opts: { maxNumberSimultaneousChat: 0 }, userCredentials: credentials });

		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(previousChat);

		expect(roomInfo.servedBy).to.be.an('object');
		expect(roomInfo.servedBy?._id).to.be.equal(testUser.user._id);
	});

	it('should honor agent limit over global limit when both are set (user has 8 chats)', async () => {
		await updateEESetting('Livechat_maximum_chats_per_agent', 100000);
		await updateLivechatSettingsForUser(testUser.user._id, { maxNumberSimultaneousChat: 4 }, [testDepartment._id, testDepartment2._id]);

		const visitor = await createVisitor(testDepartment._id);
		const room = await createLivechatRoom(visitor.token);

		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(room._id);

		expect(roomInfo.servedBy).to.be.undefined;
		previousChat = room._id;
	});

	// We already tested this case but this way the queue ends up empty :)
	it('should receive the chat after agent limit is removed', async () => {
		await updateLivechatSettingsForUser(testUser.user._id, { maxNumberSimultaneousChat: 0 }, [testDepartment._id, testDepartment2._id]);

		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(previousChat);

		expect(roomInfo.servedBy).to.be.an('object');
		expect(roomInfo.servedBy?._id).to.be.equal(testUser.user._id);
	});
});

// Note: didn't add for LoadRotation as everything that changes is how the agent is selected
// but the limits applicable are the same as load balance and autoselection
(IS_EE ? describe : describe.skip)('Livechat - Chat limits - LoadBalance', () => {
	let testUser: { user: IUser; credentials: Credentials };
	let testUser2: { user: IUser; credentials: Credentials };
	let testDepartment: ILivechatDepartment;
	let testDepartment2: ILivechatDepartment;
	let testDepartment3: ILivechatDepartment;

	before((done) => getCredentials(done));

	before(async () =>
		Promise.all([
			updateSetting('Livechat_enabled', true),
			updateSetting('Livechat_Routing_Method', 'Load_Balancing'),
			updateSetting('Omnichannel_enable_department_removal', true),
			updateEESetting('Livechat_maximum_chats_per_agent', 0),
			updateEESetting('Livechat_waiting_queue', true),
		]),
	);

	before(async () => {
		const user = await createUser();
		const user2 = await createUser();
		await createAgent(user.username);
		await createAgent(user2.username);
		const credentials3 = await login(user.username, password);
		const credentials4 = await login(user2.username, password);
		await makeAgentAvailable(credentials3);
		await makeAgentAvailable(credentials4);

		testUser = {
			user,
			credentials: credentials3,
		};
		testUser2 = {
			user: user2,
			credentials: credentials4,
		};
	});

	before(async () => {
		testDepartment = await createDepartment([{ agentId: testUser.user._id }], `${new Date().toISOString()}-department`, true, {
			maxNumberSimultaneousChat: 2,
		});
		testDepartment2 = await createDepartment([{ agentId: testUser.user._id }], `${new Date().toISOString()}-department2`, true, {
			maxNumberSimultaneousChat: 2,
		});
		testDepartment3 = await createDepartment(
			[{ agentId: testUser.user._id }, { agentId: testUser2.user._id }],
			`${new Date().toISOString()}-department3`,
			true,
			{
				maxNumberSimultaneousChat: 2,
			},
		);

		await updateLivechatSettingsForUser(testUser.user._id, { maxNumberSimultaneousChat: 1 }, [
			testDepartment._id,
			testDepartment2._id,
			testDepartment3._id,
		]);
		await updateLivechatSettingsForUser(testUser2.user._id, { maxNumberSimultaneousChat: 1 }, [testDepartment3._id]);
	});

	after(async () => {
		await Promise.all([
			deleteUser(testUser.user),
			updateEESetting('Livechat_maximum_chats_per_agent', 0),
			updateEESetting('Livechat_waiting_queue', false),
			updateSetting('Livechat_Routing_Method', 'Auto_Selection'),
			deleteDepartment(testDepartment._id),
			deleteDepartment(testDepartment2._id),
			deleteDepartment(testDepartment3._id),
		]);
		await updateSetting('Omnichannel_enable_department_removal', false);
	});

	it('should allow a user to take a chat on a department since agent limit is set to 1 and department limit is set to 2 (agent has 0 chats)', async () => {
		const visitor = await createVisitor(testDepartment._id);
		const room = await createLivechatRoom(visitor.token);

		await sleep(5000);

		const roomInfo = await getLivechatRoomInfo(room._id);

		expect(roomInfo.servedBy).to.be.an('object');
		expect(roomInfo.servedBy?._id).to.be.equal(testUser.user._id);
	});

	let previousChat: string;
	it('should not allow a user to take a chat on a department since agent limit is set to 1 and department limit is set to 2 (agent has 1 chat)', async () => {
		const visitor = await createVisitor(testDepartment._id);
		const room = await createLivechatRoom(visitor.token);

		await sleep(5000);

		const roomInfo = await getLivechatRoomInfo(room._id);

		expect(roomInfo.servedBy).to.be.undefined;
		previousChat = room._id;
	});

	it('should allow a user to take a chat on a department when agent limit is increased to 2 and department limit is set to 2 (agent has 1 chat)', async () => {
		await updateLivechatSettingsForUser(testUser.user._id, { maxNumberSimultaneousChat: 2 }, [testDepartment._id, testDepartment2._id]);
		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(previousChat);

		expect(roomInfo.servedBy).to.be.an('object');
		expect(roomInfo.servedBy?._id).to.be.equal(testUser.user._id);
	});

	it('should not allow user to take chat on department B when agent limit is 2 and already has 2 chats', async () => {
		const visitor = await createVisitor(testDepartment2._id);
		const room = await createLivechatRoom(visitor.token);

		await sleep(5000);

		const roomInfo = await getLivechatRoomInfo(room._id);

		expect(roomInfo.servedBy).to.be.undefined;
		previousChat = room._id;
	});

	it('should allow user to take a chat on department B when agent limit is increased to 3 and user has 2 chats on department A', async () => {
		await updateLivechatSettingsForUser(testUser.user._id, { maxNumberSimultaneousChat: 3 }, [testDepartment._id, testDepartment2._id]);

		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(previousChat);

		expect(roomInfo.servedBy).to.be.an('object');
		expect(roomInfo.servedBy?._id).to.be.equal(testUser.user._id);
	});

	it('should allow a user to take a chat on department B when agent limit is 0 and department B limit is 2 (user has 3 chats)', async () => {
		await updateLivechatSettingsForUser(testUser.user._id, { maxNumberSimultaneousChat: 0 }, [testDepartment._id, testDepartment2._id]);
		const visitor = await createVisitor(testDepartment2._id);
		const room = await createLivechatRoom(visitor.token);

		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(room._id);

		expect(roomInfo.servedBy).to.be.an('object');
		expect(roomInfo.servedBy?._id).to.be.equal(testUser.user._id);
	});

	it('should not allow user to take a chat on department B when is on the limit (user has 4 chats, 2 chats on department B)', async () => {
		const visitor = await createVisitor(testDepartment2._id);
		const room = await createLivechatRoom(visitor.token);

		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(room._id);

		expect(roomInfo.servedBy).to.be.undefined;
		previousChat = room._id;
	});

	it('should not allow user to take a chat on department B even if global limit allows it (user has 4 chats)', async () => {
		await updateEESetting('Livechat_maximum_chats_per_agent', 6);

		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(previousChat);

		expect(roomInfo.servedBy).to.be.undefined;
	});
	it('should allow user to take a chat when department B limit is removed and its below global limit (user has 4 chats)', async () => {
		await updateDepartment({ departmentId: testDepartment2._id, opts: { maxNumberSimultaneousChat: 0 }, userCredentials: credentials });
		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(previousChat);

		expect(roomInfo.servedBy).to.be.an('object');
		expect(roomInfo.servedBy?._id).to.be.equal(testUser.user._id);
	});

	it('should allow user to take a chat on department B (user has 5 chats, global limit is 6, department limit is 0)', async () => {
		const visitor = await createVisitor(testDepartment2._id);
		const room = await createLivechatRoom(visitor.token);

		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(room._id);

		expect(roomInfo.servedBy).to.be.an('object');
		expect(roomInfo.servedBy?._id).to.be.equal(testUser.user._id);
	});

	it('should not allow user to take a chat on department B (user has 6 chats, global limit is 6, department limit is 0)', async () => {
		const visitor = await createVisitor(testDepartment2._id);
		const room = await createLivechatRoom(visitor.token);

		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(room._id);

		expect(roomInfo.servedBy).to.be.undefined;
		previousChat = room._id;
	});

	it('should allow user to take chat once the global limit is removed (user has 7 chats)', async () => {
		await updateEESetting('Livechat_maximum_chats_per_agent', 0);

		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(previousChat);

		expect(roomInfo.servedBy).to.be.an('object');
		expect(roomInfo.servedBy?._id).to.be.equal(testUser.user._id);
	});

	it('should not allow user to take chat on department A (as limit for it hasnt changed)', async () => {
		const visitor = await createVisitor(testDepartment._id);
		const room = await createLivechatRoom(visitor.token);

		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(room._id);

		expect(roomInfo.servedBy).to.be.undefined;
	});

	it('should allow user to take a chat on department A when its limit gets removed (no agent, global or department filter are applied)', async () => {
		await updateDepartment({ departmentId: testDepartment._id, opts: { maxNumberSimultaneousChat: 0 }, userCredentials: credentials });

		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(previousChat);

		expect(roomInfo.servedBy).to.be.an('object');
		expect(roomInfo.servedBy?._id).to.be.equal(testUser.user._id);
	});

	it('should honor agent limit over global limit when both are set (user has 8 chats)', async () => {
		await updateEESetting('Livechat_maximum_chats_per_agent', 100000);
		await updateLivechatSettingsForUser(testUser.user._id, { maxNumberSimultaneousChat: 4 }, [testDepartment._id, testDepartment2._id]);

		const visitor = await createVisitor(testDepartment._id);
		const room = await createLivechatRoom(visitor.token);

		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(room._id);

		expect(roomInfo.servedBy).to.be.undefined;
		previousChat = room._id;
	});

	// We already tested this case but this way the queue ends up empty :)
	it('should receive the chat after agent limit is removed', async () => {
		await updateLivechatSettingsForUser(testUser.user._id, { maxNumberSimultaneousChat: 0 }, [testDepartment._id, testDepartment2._id]);

		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(previousChat);

		expect(roomInfo.servedBy).to.be.an('object');
		expect(roomInfo.servedBy?._id).to.be.equal(testUser.user._id);
	});

	it('should route the chat to another agent if limit for agent A is reached and agent B is available', async () => {
		await updateLivechatSettingsForUser(testUser.user._id, { maxNumberSimultaneousChat: 1 }, [
			testDepartment._id,
			testDepartment2._id,
			testDepartment3._id,
		]);

		const visitor = await createVisitor(testDepartment3._id);
		const room = await createLivechatRoom(visitor.token);

		await sleep(5000);
		const roomInfo = await getLivechatRoomInfo(room._id);

		expect(roomInfo.servedBy).to.be.an('object');
		expect(roomInfo.servedBy?._id).to.be.equal(testUser2.user._id);
	});
});
