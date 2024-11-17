/* eslint-env mocha */

import { faker } from '@faker-js/faker';
import type { ILivechatDepartment, ILivechatVisitor, IOmnichannelRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createDepartmentWithAnOnlineAgent, deleteDepartment, addOrRemoveAgentFromDepartment } from '../../../data/livechat/department';
import { createVisitor, createLivechatRoom, closeOmnichannelRoom, deleteVisitor } from '../../../data/livechat/rooms';
import { createAnOnlineAgent } from '../../../data/livechat/users';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { deleteUser } from '../../../data/users.helper';
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

			// this cleanup is required since previous tests left the DB dirty
			cleanupRooms(),
		]),
	);

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
