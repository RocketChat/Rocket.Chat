import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createDepartmentWithAnOnlineAgent, deleteDepartment } from '../../../data/livechat/department';
import {
	makeAgentAvailable,
	createAgent,
	createDepartment,
	createVisitor,
	createLivechatRoom,
	getLivechatRoomInfo,
} from '../../../data/livechat/rooms';
import { createMonitor, createUnit } from '../../../data/livechat/units';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { createUser, deleteUser } from '../../../data/users.helper';
import { IS_EE } from '../../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('LIVECHAT - Departments', () => {
	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
		await updatePermission('view-livechat-manager', ['admin']);
		await createAgent();
		await makeAgentAvailable();
		await updateSetting('Omnichannel_enable_department_removal', true);
	});

	describe('GET livechat/department', () => {
		it('should return unauthorized error when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-departments', []);
			await updatePermission('view-l-room', []);

			await request.get(api('livechat/department')).set(credentials).expect('Content-Type', 'application/json').expect(403);
		});

		it('should return a list of departments', async () => {
			await updatePermission('view-livechat-departments', ['admin']);
			await request
				.get(api('livechat/department'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('departments');
					expect(res.body.departments).to.be.an('array');
					expect(res.body.departments).to.have.length.of.at.least(0);
				});
		});
	});

	describe('POST livechat/departments', () => {
		it('should return unauthorized error when the user does not have the necessary permission', async () => {
			await updatePermission('manage-livechat-departments', []);
			await request
				.post(api('livechat/department'))
				.set(credentials)
				.send({
					department: { name: 'TestUnauthorized', enabled: true, showOnOfflineForm: true, showOnRegistration: true, email: 'bla@bla' },
				})
				.expect('Content-Type', 'application/json')
				.expect(403);
		});

		it('should return an error when no keys are provided', async () => {
			await updatePermission('manage-livechat-departments', ['admin']);
			await request
				.post(api('livechat/department'))
				.set(credentials)
				.send({ department: {} })
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should create a new department', async () => {
			await updatePermission('manage-livechat-departments', ['admin']);
			const { body } = await request
				.post(api('livechat/department'))
				.set(credentials)
				.send({ department: { name: 'Test', enabled: true, showOnOfflineForm: true, showOnRegistration: true, email: 'bla@bla' } })
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(body).to.have.property('success', true);
			expect(body).to.have.property('department');
			expect(body.department).to.have.property('_id');
			expect(body.department).to.have.property('name', 'Test');
			expect(body.department).to.have.property('enabled', true);
			expect(body.department).to.have.property('showOnOfflineForm', true);
			expect(body.department).to.have.property('showOnRegistration', true);
			await deleteDepartment(body.department._id);
		});
	});

	describe('GET livechat/department/:_id', () => {
		it('should return unauthorized error when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-departments', []);
			await request
				.get(api('livechat/department/testetetetstetete'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
		}).timeout(5000);

		it('should return an error when the department does not exist', async () => {
			await updatePermission('view-livechat-departments', ['admin']);
			await request
				.get(api('livechat/department/testesteteste'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('department');
					expect(res.body.department).to.be.null;
				});
		}).timeout(5000);

		it('should return the department', async () => {
			await updatePermission('view-livechat-departments', ['admin']);
			const department = await createDepartment();
			const { body } = await request
				.get(api(`livechat/department/${department._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(body).to.have.property('success', true);
			expect(body).to.have.property('department');
			expect(body.department).to.have.property('_id');
			expect(body.department).to.have.property('name', department.name);
			expect(body.department).to.have.property('enabled', department.enabled);
			expect(body.department).to.have.property('showOnOfflineForm', department.showOnOfflineForm);
			expect(body.department).to.have.property('showOnRegistration', department.showOnRegistration);
			expect(body.department).to.have.property('email', department.email);
			await deleteDepartment(body.department._id);
		});
	});

	describe('DELETE livechat/department/:_id', () => {
		it('should return unauthorized error when the user does not have the necessary permission', async () => {
			await updatePermission('manage-livechat-departments', []);
			await updatePermission('remove-livechat-department', []);

			await request
				.delete(api('livechat/department/testetetetstetete'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
		});

		it('should return an error when the department does not exist', async () => {
			await updatePermission('manage-livechat-departments', ['admin']);

			const resp: Response = await request
				.delete(api('livechat/department/testesteteste'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400);

			expect(resp.body).to.have.property('success', false);
			expect(resp.body).to.have.property('error', 'error-department-not-found');
		});

		it('it should remove the department', async () => {
			const department = await createDepartment();

			const resp: Response = await request
				.delete(api(`livechat/department/${department._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(resp.body).to.have.property('success', true);
		});

		it('it should remove the department and disassociate the rooms from it', async () => {
			const { department } = await createDepartmentWithAnOnlineAgent();
			const newVisitor = await createVisitor(department._id);
			const newRoom = await createLivechatRoom(newVisitor.token);

			const resp: Response = await request
				.delete(api(`livechat/department/${department._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(resp.body).to.have.property('success', true);

			const latestRoom = await getLivechatRoomInfo(newRoom._id);
			expect(latestRoom.departmentId).to.be.undefined;
		});

		(IS_EE ? it : it.skip)('it should remove the department and disassociate the rooms from it which have its units', async () => {
			const { department } = await createDepartmentWithAnOnlineAgent();
			const newVisitor = await createVisitor(department._id);
			const newRoom = await createLivechatRoom(newVisitor.token);

			const monitor = await createUser();
			await createMonitor(monitor.username);
			const unit = await createUnit(monitor._id, monitor.username, [department._id]);

			// except the room to have the unit
			let latestRoom = await getLivechatRoomInfo(newRoom._id);
			expect(latestRoom.departmentId).to.be.equal(department._id);
			expect(latestRoom.departmentAncestors).to.be.an('array').that.includes(unit._id);

			const resp: Response = await request
				.delete(api(`livechat/department/${department._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(resp.body).to.have.property('success', true);

			latestRoom = await getLivechatRoomInfo(newRoom._id);
			expect(latestRoom.departmentId).to.be.undefined;
			expect(latestRoom.departmentAncestors).to.be.undefined;

			// cleanup
			await deleteUser(monitor);
		});

		(IS_EE ? it : it.skip)(
			'contd from above test case: if a unit has more than 1 dept, then it should not disassociate rooms from other dept when any one dept is removed',
			async () => {
				const { department: department1 } = await createDepartmentWithAnOnlineAgent();
				const newVisitor1 = await createVisitor(department1._id);
				const newRoom1 = await createLivechatRoom(newVisitor1.token);

				const { department: department2 } = await createDepartmentWithAnOnlineAgent();
				const newVisitor2 = await createVisitor(department2._id);
				const newRoom2 = await createLivechatRoom(newVisitor2.token);

				const monitor = await createUser();
				await createMonitor(monitor.username);
				const unit = await createUnit(monitor._id, monitor.username, [department1._id, department2._id]);

				// except the room to have the unit
				let latestRoom1 = await getLivechatRoomInfo(newRoom1._id);
				let latestRoom2 = await getLivechatRoomInfo(newRoom2._id);
				expect(latestRoom1.departmentId).to.be.equal(department1._id);
				expect(latestRoom1.departmentAncestors).to.be.an('array').that.includes(unit._id);
				expect(latestRoom2.departmentId).to.be.equal(department2._id);
				expect(latestRoom2.departmentAncestors).to.be.an('array').that.includes(unit._id);

				const resp: Response = await request
					.delete(api(`livechat/department/${department1._id}`))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(resp.body).to.have.property('success', true);

				latestRoom1 = await getLivechatRoomInfo(newRoom1._id);
				expect(latestRoom1.departmentId).to.be.undefined;
				expect(latestRoom1.departmentAncestors).to.be.undefined;

				latestRoom2 = await getLivechatRoomInfo(newRoom2._id);
				expect(latestRoom2.departmentId).to.be.equal(department2._id);
				expect(latestRoom2.departmentAncestors).to.be.an('array').that.includes(unit._id);

				// cleanup
				await deleteUser(monitor);
			},
		);
	});

	describe('GET livechat/department.autocomplete', () => {
		it('should return an error when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-departments', []);
			await updatePermission('view-l-room', []);
			await request.get(api('livechat/department.autocomplete')).set(credentials).expect('Content-Type', 'application/json').expect(403);
		});
		it('should return an error when the query is not provided', async () => {
			await updatePermission('view-livechat-departments', ['admin']);
			await updatePermission('view-l-room', ['admin']);
			await request
				.get(api('livechat/department.autocomplete'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				});
		});

		it('should return an error when the query is empty', async () => {
			await updatePermission('view-livechat-departments', ['admin']);
			await updatePermission('view-l-room', ['admin']);
			await request
				.get(api('livechat/department.autocomplete'))
				.set(credentials)
				.query({ selector: '' })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				});
		});

		it('should return an error when the query is not a string', async () => {
			await updatePermission('view-livechat-departments', ['admin']);
			await updatePermission('view-l-room', ['admin']);
			await request
				.get(api('livechat/department.autocomplete'))
				.set(credentials)
				.query({ selector: { name: 'test' } })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				});
		});

		it('should return an error when selector is not valid JSON', async () => {
			await updatePermission('view-livechat-departments', ['admin']);
			await updatePermission('view-l-room', ['admin']);
			await request
				.get(api('livechat/department.autocomplete'))
				.set(credentials)
				.query({ selector: '{name: "test"' })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				});
		});

		it('should return a list of departments that match selector.term', async () => {
			// Convert to async/await
			await updatePermission('view-livechat-departments', ['admin']);
			await updatePermission('view-l-room', ['admin']);
			const department = await createDepartment(undefined, 'test');
			const response = await request
				.get(api('livechat/department.autocomplete'))
				.set(credentials)
				.query({ selector: '{"term":"test"}' })
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body).to.have.property('items');
			expect(response.body.items).to.be.an('array');
			expect(response.body.items).to.have.length.of.at.least(1);
			expect(response.body.items[0]).to.have.property('_id');
			expect(response.body.items[0]).to.have.property('name');
			await deleteDepartment(department._id);
		});

		it('should return a list of departments excluding the ids on selector.exceptions', async function () {
			if (!IS_EE) {
				this.skip();
			}

			await updatePermission('view-livechat-departments', ['admin']);
			await updatePermission('view-l-room', ['admin']);
			const dep1 = await createDepartment();
			await createDepartment();
			await request
				.get(api('livechat/department.autocomplete'))
				.set(credentials)
				.query({ selector: `{"exceptions":["${dep1._id}"]}` })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items');
					expect(res.body.items).to.be.an('array');
					expect(res.body.items).to.have.length.of.at.least(1);
					expect(res.body.items[0]).to.have.property('_id');
					expect(res.body.items[0]).to.have.property('name');
					expect(res.body.items.every((department: ILivechatDepartment) => department._id !== dep1._id)).to.be.true;
				});
		});
	});

	describe('GET livechat/departments.listByIds', () => {
		it('should throw an error if the user doesnt have the permission to view the departments', async () => {
			await updatePermission('view-livechat-departments', []);
			await updatePermission('view-l-room', []);
			await request.get(api('livechat/department.listByIds')).set(credentials).expect('Content-Type', 'application/json').expect(403);
		});

		it('should return an error when the query is not present', async () => {
			await updatePermission('view-livechat-departments', ['admin']);
			await updatePermission('view-l-room', ['admin']);
			await request
				.get(api('livechat/department.listByIds'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				});
		});

		it('should return an error when the query is not an array', async () => {
			await updatePermission('view-livechat-departments', ['admin']);
			await updatePermission('view-l-room', ['admin']);
			await request
				.get(api('livechat/department.listByIds'))
				.set(credentials)
				.query({ ids: 'test' })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				});
		});
	});

	describe('GET livechat/department/:departmentId/agents', () => {
		it('should throw an error if the user doesnt have the permission to view the departments', async () => {
			await updatePermission('view-livechat-departments', []);
			await updatePermission('view-l-room', []);
			await request.get(api('livechat/department/test/agents')).set(credentials).expect('Content-Type', 'application/json').expect(403);
		});

		it('should return an empty array when the departmentId is not valid', async () => {
			await updatePermission('view-livechat-departments', ['admin']);
			await updatePermission('view-l-room', ['admin', 'livechat-agent']);
			await request
				.get(api('livechat/department/test/agents'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('agents');
					expect(res.body.agents).to.be.an('array');
					expect(res.body.agents).to.have.lengthOf(0);
					expect(res.body.total).to.be.equal(0);
				});
		});

		it('should return an emtpy array for a department without agents', async () => {
			await updatePermission('view-livechat-departments', ['admin']);
			await updatePermission('view-l-room', ['admin', 'livechat-agent']);
			const dep = await createDepartment();
			const res = await request
				.get(api(`livechat/department/${dep._id}/agents`))
				.set(credentials)
				.expect(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('agents');
			expect(res.body.agents).to.be.an('array');
			expect(res.body.agents).to.have.lengthOf(0);
			expect(res.body.total).to.be.equal(0);
			await deleteDepartment(dep._id);
		});

		it('should return the agents of the department', async () => {
			// convert to async await
			await updatePermission('view-livechat-departments', ['admin']);
			await updatePermission('view-l-room', ['admin', 'livechat-agent']);
			const agent = await createAgent();
			const dep = await createDepartment([{ agentId: agent._id }]);
			const res = await request
				.get(api(`livechat/department/${dep._id}/agents`))
				.set(credentials)
				.expect(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('agents');
			expect(res.body.agents).to.be.an('array');
			expect(res.body.agents).to.have.lengthOf(1);
			expect(res.body.agents[0]).to.have.property('_id');
			expect(res.body.agents[0]).to.have.property('departmentId', dep._id);
			expect(res.body.agents[0]).to.have.property('departmentEnabled', true);
			expect(res.body.count).to.be.equal(1);
			await deleteDepartment(dep._id);
		});
	});

	describe('POST livechat/department/:departmentId/agents', () => {
		it('should throw an error if the user doesnt have the permission to manage the departments', async () => {
			await updatePermission('manage-livechat-departments', []);
			await updatePermission('add-livechat-department-agents', []);
			await request.post(api('livechat/department/test/agents')).set(credentials).expect('Content-Type', 'application/json').expect(403);
		});

		it('should throw an error if the departmentId is not valid', async () => {
			await updatePermission('manage-livechat-departments', ['admin']);
			await updatePermission('add-livechat-department-agents', ['admin', 'livechat-manager']);
			await request
				.post(api('livechat/department/test/agents'))
				.set(credentials)
				.send({ upsert: [], remove: [] })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'Department not found [error-department-not-found]');
				});
		});

		it('should throw an error if body doesnt contain { upsert: [], remove: [] }', async () => {
			await updatePermission('manage-livechat-departments', ['admin']);
			await updatePermission('add-livechat-department-agents', ['admin', 'livechat-manager']);
			const dep = await createDepartment();
			const res = await request
				.post(api(`livechat/department/${dep._id}/agents`))
				.set(credentials)
				.expect(400);
			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('error', "Match error: Missing key 'upsert'");
			await deleteDepartment(dep._id);
		});

		it('should throw an error if upsert or remove in body doesnt contain agentId and username', async () => {
			await updatePermission('manage-livechat-departments', ['admin']);
			await updatePermission('add-livechat-department-agents', ['admin', 'livechat-manager']);
			const dep = await createDepartment();
			const res = await request
				.post(api(`livechat/department/${dep._id}/agents`))
				.set(credentials)
				.send({ upsert: [{}], remove: [] })
				.expect(400);
			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('error', "Match error: Missing key 'agentId' in field upsert[0]");
			await deleteDepartment(dep._id);
		});

		it('should sucessfully add an agent to a department', async () => {
			await updatePermission('manage-livechat-departments', ['admin']);
			await updatePermission('add-livechat-department-agents', ['admin', 'livechat-manager']);
			const [dep, agent] = await Promise.all([createDepartment(), createAgent()]);
			const res = await request
				.post(api(`livechat/department/${dep._id}/agents`))
				.set(credentials)
				.send({ upsert: [{ agentId: agent._id, username: agent.username }], remove: [] })
				.expect(200);
			expect(res.body).to.have.property('success', true);
			await deleteDepartment(dep._id);
		});
	});

	describe('Department archivation', () => {
		let departmentForTest: ILivechatDepartment;
		it('should fail if user is not logged in', async () => {
			await request.post(api('livechat/department/123/archive')).expect(401);
		});
		it('should fail if user doesnt have manage-livechat-departments permission', async () => {
			await updatePermission('manage-livechat-departments', []);
			await request.post(api('livechat/department/123/archive')).set(credentials).expect(403);
		});
		it('should fail if departmentId is not valid', async () => {
			await updatePermission('manage-livechat-departments', ['admin']);
			await request.post(api('livechat/department/123/archive')).set(credentials).expect(400);
		});
		it('should archive a department', async () => {
			await updatePermission('manage-livechat-departments', ['admin']);
			const department = await createDepartment();
			await request
				.post(api(`livechat/department/${department._id}/archive`))
				.set(credentials)
				.expect(200);
			departmentForTest = department;
		});
		it('should return a list of archived departments', async () => {
			const { body } = await request.get(api('livechat/departments/archived')).set(credentials).expect(200);
			expect(body).to.have.property('success', true);
			expect(body).to.have.property('departments');
			expect(body.departments).to.be.an('array');
			expect(body.departments[0]).to.have.property('_id', departmentForTest._id);
			expect(body.departments.length).to.be.equal(1);
		});
		it('should unarchive a department', async () => {
			await request
				.post(api(`livechat/department/${departmentForTest._id}/unarchive`))
				.set(credentials)
				.expect(200);
		});
	});
});
