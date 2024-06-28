/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Credentials } from '@rocket.chat/api-client';
import type { ILivechatDepartment, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, it, describe, after } from 'mocha';

import { getCredentials, api, request, methodCall, credentials } from '../../../data/api-data';
import { addOrRemoveAgentFromDepartment, createDepartment } from '../../../data/livechat/department';
import {
	createAgent,
	createLivechatRoom,
	createManager,
	createVisitor,
	getLivechatRoomInfo,
	makeAgentAvailable,
} from '../../../data/livechat/rooms';
import { createMonitor, createUnit } from '../../../data/livechat/units';
import { updateSetting, updatePermission, restorePermissionToRoles, removePermissionFromAllRoles } from '../../../data/permissions.helper';
import { password } from '../../../data/user';
import { createUser, deleteUser, login, setUserActiveStatus } from '../../../data/users.helper';
import { IS_EE } from '../../../e2e/config/constants';

type TestUser = { user: IUser; credentials: Credentials };

(IS_EE ? describe : describe.skip)('Omnichannel - Monitors', () => {
	let manager: TestUser;
	let monitor: TestUser;
	let noUnitDepartment: ILivechatDepartment;
	let unitDepartment: ILivechatDepartment;

	before((done) => getCredentials(done));
	before(async () => {
		await updateSetting('Livechat_accept_chats_with_no_agents', true);
		await setUserActiveStatus('rocketchat.internal.admin.test', true);
		await createAgent();
		await makeAgentAvailable();
	});
	before(async () => {
		const user = await createUser();
		const userCredentials = await login(user.username, password);
		if (!user.username) {
			throw new Error('user not created');
		}
		await createManager(user.username);

		manager = {
			user,
			credentials: userCredentials,
		};
	});
	before(async () => {
		const user = await createUser();
		const userCredentials = await login(user.username, password);
		if (!user.username) {
			throw new Error('user not created');
		}
		await createMonitor(user.username);

		monitor = {
			user,
			credentials: userCredentials,
		};
	});
	before(async () => {
		noUnitDepartment = await createDepartment();
		unitDepartment = await createDepartment();

		await createUnit(monitor.user._id, monitor.user.username!, [unitDepartment._id]);
	});
	before(async () => {
		await updatePermission('transfer-livechat-guest', ['admin', 'livechat-manager', 'livechat-agent', 'livechat-monitor']);
	});

	describe('Monitors', () => {
		let user: IUser;
		before(async () => {
			user = await createUser();
		});
		after(async () => {
			await deleteUser(user);
		});

		it('should properly create a new monitor', async () => {
			const { body } = await request
				.post(methodCall(`livechat:addMonitor`))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'livechat:addMonitor',
						params: [user.username],
						id: '101',
						msg: 'method',
					}),
				})
				.expect(200);

			expect(body.success).to.be.true;
		});

		it('should not fail when trying to create a monitor that already exists', async () => {
			const { body } = await request
				.post(methodCall(`livechat:addMonitor`))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'livechat:addMonitor',
						params: [user.username],
						id: '101',
						msg: 'method',
					}),
				})
				.expect(200);

			expect(body.success).to.be.true;
		});

		it('should fail when trying to create a monitor with an invalid username', async () => {
			const { body } = await request
				.post(methodCall(`livechat:addMonitor`))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'livechat:addMonitor',
						params: ['invalid-username'],
						id: '101',
						msg: 'method',
					}),
				})
				.expect(200);

			expect(body.success).to.be.true;
			const parsedBody = JSON.parse(body.message);

			expect(parsedBody.error).to.have.property('error').to.be.equal('error-invalid-user');
		});

		it('should fail when trying to create a monitor with an empty username', async () => {
			const { body } = await request
				.post(methodCall(`livechat:addMonitor`))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'livechat:addMonitor',
						params: [''],
						id: '101',
						msg: 'method',
					}),
				})
				.expect(200);

			expect(body.success).to.be.true;
			const parsedBody = JSON.parse(body.message);

			expect(parsedBody.error).to.have.property('error').to.be.equal('error-invalid-user');
		});

		it('should remove a monitor', async () => {
			const { body } = await request
				.post(methodCall(`livechat:removeMonitor`))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'livechat:removeMonitor',
						params: [user.username],
						id: '101',
						msg: 'method',
					}),
				})
				.expect(200);

			expect(body.success).to.be.true;
		});

		it('should not fail when trying to remove a monitor that does not exist', async () => {
			const { body } = await request
				.post(methodCall(`livechat:removeMonitor`))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'livechat:removeMonitor',
						params: [user.username],
						id: '101',
						msg: 'method',
					}),
				})
				.expect(200);

			expect(body.success).to.be.true;
		});
	});

	describe('[GET] livechat/monitors', () => {
		it('should fail if manage-livechat-monitors permission is missing', async () => {
			await removePermissionFromAllRoles('manage-livechat-monitors');
			return request.get(api('livechat/monitors')).set(credentials).expect(403);
		});
		it('should return all monitors', async () => {
			await restorePermissionToRoles('manage-livechat-monitors');
			const user = await createUser();
			await createMonitor(user.username);

			const { body } = await request.get(api('livechat/monitors')).set(credentials).query({ text: user.username }).expect(200);
			expect(body).to.have.property('monitors');
			expect(body.monitors).to.have.lengthOf(1);
			expect(body.monitors[0]).to.have.property('username', user.username);

			// cleanup
			await deleteUser(user);
		});
	});

	describe('livechat/monitors/:username', () => {
		it('should fail if manage-livechat-monitors permission is missing', async () => {
			await removePermissionFromAllRoles('manage-livechat-monitors');
			return request.get(api('livechat/monitors/123')).set(credentials).expect(403);
		});
		it('should return a monitor', async () => {
			await restorePermissionToRoles('manage-livechat-monitors');
			const user = await createUser();
			await createMonitor(user.username);

			const { body } = await request
				.get(api(`livechat/monitors/${user.username}`))
				.set(credentials)
				.expect(200);
			expect(body).to.have.property('username', user.username);

			// cleanup
			await deleteUser(user);
		});
	});

	describe('Monitors & Rooms', () => {
		it('should not return a room of a department that the monitor is not assigned to', async () => {
			const visitor = await createVisitor(noUnitDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			const { body } = await request
				.get(api('livechat/rooms'))
				.set(monitor.credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('rooms').that.is.an('array');
			expect(body.rooms.find((r: any) => r._id === room._id)).to.not.exist;
		});
		it('should return a room of a department the monitor is assigned to', async () => {
			const visitor = await createVisitor(unitDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			const { body } = await request
				.get(api('livechat/rooms'))
				.set(monitor.credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('rooms').that.is.an('array');
			expect(body.rooms.find((r: any) => r._id === room._id)).to.exist;
		});
	});

	describe('Monitors & Departments', () => {
		it('should not return a department that the monitor is not assigned to', async () => {
			const { body } = await request
				.get(api('livechat/department'))
				.query({ onlyMyDepartments: true })
				.set(monitor.credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('departments').that.is.an('array');
			expect(body.departments.find((d: any) => d._id === noUnitDepartment._id)).to.not.exist;
		});
		it('should return a department that the monitor is assigned to', async () => {
			const { body } = await request
				.get(api('livechat/department'))
				.query({ onlyMyDepartments: true })
				.set(monitor.credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('departments').that.is.an('array');
			expect(body.departments.length).to.be.equal(1);
			expect(body.departments.find((d: any) => d._id === unitDepartment._id)).to.exist;
		});
		it('should return both created departments to a manager', async () => {
			const { body } = await request
				.get(api('livechat/department'))
				.query({ onlyMyDepartments: true, sort: '{ "_updatedAt": 1 }' })
				.set(manager.credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('departments').that.is.an('array');
			expect(body.departments.find((d: any) => d._id === noUnitDepartment._id)).to.exist;
			expect(body.departments.find((d: any) => d._id === unitDepartment._id)).to.exist;
		});
		it('should not return a department when monitor is only assigned as agent there', async () => {
			await createAgent(monitor.user.username!);
			await addOrRemoveAgentFromDepartment(
				noUnitDepartment._id,
				{ agentId: monitor.user._id, username: monitor.user.username!, count: 0, order: 0 },
				true,
			);

			const { body } = await request
				.get(api('livechat/department'))
				.query({ onlyMyDepartments: true })
				.set(monitor.credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('departments').that.is.an('array');
			expect(body.departments.length).to.be.equal(1);
			expect(body.departments.find((d: any) => d._id === noUnitDepartment._id)).to.not.exist;
		});
	});

	describe('Monitors & Forward', () => {
		it('should successfully forward a room to another agent', async () => {
			const visitor = await createVisitor(unitDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			const { body } = await request
				.post(api('livechat/room.forward'))
				.set(monitor.credentials)
				.send({
					roomId: room._id,
					userId: 'rocketchat.internal.admin.test',
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('success', true);

			const room2 = await getLivechatRoomInfo(room._id);

			expect(room2).to.have.property('servedBy').that.is.an('object');
			expect(room2.servedBy).to.have.property('_id', 'rocketchat.internal.admin.test');
		});
		it('should successfully forward a room to a department', async () => {
			const visitor = await createVisitor(noUnitDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			const { body } = await request
				.post(api('livechat/room.forward'))
				.set(monitor.credentials)
				.send({
					roomId: room._id,
					departmentId: unitDepartment._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.property('success', true);

			const room2 = await getLivechatRoomInfo(room._id);
			expect(room2.departmentId).to.be.equal(unitDepartment._id);
		});
	});
});
