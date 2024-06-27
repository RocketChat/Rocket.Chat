import type { ILivechatDepartment, IOmnichannelBusinessUnit } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, after, describe, it, afterEach } from 'mocha';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { deleteDepartment } from '../../../data/livechat/department';
import { createDepartment } from '../../../data/livechat/rooms';
import { createMonitor, createUnit, deleteUnit } from '../../../data/livechat/units';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { password } from '../../../data/user';
import { createUser, deleteUser, login } from '../../../data/users.helper';
import { IS_EE } from '../../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('[EE] LIVECHAT - Units', () => {
	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
		await updatePermission('manage-livechat-departments', ['livechat-manager', 'livechat-monitor', 'admin']);
	});

	describe('[GET] livechat/units', () => {
		it('should fail if manage-livechat-units permission is missing', async () => {
			await updatePermission('manage-livechat-units', []);
			return request
				.get(api('livechat/units'))
				.set(credentials)
				.send({
					unitData: {
						name: 'test',
						enabled: true,
					},
					unitMonitors: [],
					unitDepartments: [],
				})
				.expect(403);
		});
		it('should return a list of units', async () => {
			await updatePermission('manage-livechat-units', ['admin']);
			const user = await createUser();
			await createMonitor(user.username);
			const department = await createDepartment();
			const unit = await createUnit(user._id, user.username, [department._id]);

			const { body } = await request.get(api('livechat/units')).set(credentials).expect(200);
			expect(body.units).to.be.an('array').with.lengthOf.greaterThan(0);
			const unitFound = body.units.find((u: IOmnichannelBusinessUnit) => u._id === unit._id);
			expect(unitFound).to.have.property('_id', unit._id);
			expect(unitFound).to.have.property('name', unit.name);
			expect(unitFound).to.have.property('numMonitors', 1);
			expect(unitFound).to.have.property('numDepartments', 1);
			expect(unitFound).to.have.property('type', 'u');

			// cleanup
			await deleteUser(user);
		});

		it('should return a list of units matching the provided filter', async () => {
			const user = await createUser();
			await createMonitor(user.username);
			const department = await createDepartment();
			const unit = await createUnit(user._id, user.username, [department._id]);

			const { body } = await request.get(api('livechat/units')).query({ text: unit.name }).set(credentials).expect(200);
			expect(body.units).to.be.an('array').with.lengthOf(1);
			const unitFound = body.units.find((u: IOmnichannelBusinessUnit) => u._id === unit._id);
			expect(unitFound).to.have.property('_id', unit._id);
			expect(unitFound).to.have.property('name', unit.name);
			expect(unitFound).to.have.property('numMonitors', 1);
			expect(unitFound).to.have.property('numDepartments', 1);
			expect(unitFound).to.have.property('type', 'u');

			// cleanup
			await deleteUser(user);
		});

		it('should properly paginate the result set', async () => {
			const { body } = await request.get(api('livechat/units')).query({ count: 1 }).set(credentials).expect(200);
			expect(body).to.have.property('units').and.to.be.an('array').with.lengthOf(1);
			expect(body).to.have.property('count').and.to.be.equal(1);
			const unit = body.units[0];

			const { body: body2 } = await request.get(api('livechat/units')).query({ count: 1, offset: 1 }).set(credentials).expect(200);
			expect(body2).to.have.property('units').and.to.be.an('array').with.lengthOf(1);
			const unit2 = body2.units[0];

			expect(unit._id).to.not.be.equal(unit2._id);
		});

		it('should sort the result set based on provided fields', async () => {
			const user = await createUser();
			await createMonitor(user.username);
			const department = await createDepartment();
			const unit = await createUnit(user._id, user.username, [department._id], 'A test 1234');
			const unit2 = await createUnit(user._id, user.username, [department._id], 'a test 1234');

			const { body } = await request
				.get(api('livechat/units'))
				.query({ sort: JSON.stringify({ name: 1 }), text: 'test', count: 2 })
				.set(credentials)
				.expect(200);
			expect(body).to.have.property('units').and.to.be.an('array').with.lengthOf(2);
			expect(body.units[0]._id).to.be.equal(unit._id);
			expect(body.units[1]._id).to.be.equal(unit2._id);

			await deleteUser(user);
		});
	});

	describe('[POST] livechat/units', () => {
		it('should fail if manage-livechat-units permission is missing', async () => {
			await updatePermission('manage-livechat-units', []);
			return request
				.post(api('livechat/units'))
				.set(credentials)
				.send({
					unitData: {
						name: 'test',
						enabled: true,
					},
					unitMonitors: [],
					unitDepartments: [],
				})
				.expect(403);
		});
		it('should return a created unit', async () => {
			await updatePermission('manage-livechat-units', ['admin']);
			const user = await createUser();
			await createMonitor(user.username);
			const department = await createDepartment();

			const { body } = await request
				.post(api('livechat/units'))
				.set(credentials)
				.send({
					unitData: { name: 'test', visibility: 'public', enabled: true, description: 'test' },
					unitMonitors: [{ monitorId: user._id, username: user.username }],
					unitDepartments: [{ departmentId: department._id }],
				})
				.expect(200);

			expect(body).to.have.property('_id');
			expect(body).to.have.property('name', 'test');
			expect(body).to.have.property('visibility', 'public');
			expect(body).to.have.property('type', 'u');
			expect(body).to.have.property('numMonitors', 1);
			expect(body).to.have.property('numDepartments', 1);

			// cleanup
			await deleteUser(user);
		});

		it('should return a unit with no monitors if a user who is not a monitor is passed', async () => {
			await updatePermission('manage-livechat-units', ['admin']);
			const user = await createUser();
			const department = await createDepartment();

			const { body } = await request
				.post(api('livechat/units'))
				.set(credentials)
				.send({
					unitData: { name: 'test', visibility: 'public', enabled: true, description: 'test' },
					unitMonitors: [{ monitorId: user._id, username: user.username }],
					unitDepartments: [{ departmentId: department._id }],
				})
				.expect(200);

			expect(body).to.have.property('numMonitors', 0);
			expect(body).to.have.property('name', 'test');

			// cleanup
			await deleteUser(user);
		});
	});

	describe('[GET] livechat/units/:id', () => {
		it('should fail if manage-livechat-units permission is missing', async () => {
			await updatePermission('manage-livechat-units', []);
			return request.get(api('livechat/units/123')).set(credentials).send().expect(403);
		});
		it('should return a unit', async () => {
			await updatePermission('manage-livechat-units', ['admin']);
			const user = await createUser();
			await createMonitor(user.username);
			const department = await createDepartment();
			const unit = await createUnit(user._id, user.username, [department._id]);

			const { body } = await request
				.get(api(`livechat/units/${unit._id}`))
				.set(credentials)
				.expect(200);
			expect(body).to.have.property('_id', unit._id);
			expect(body).to.have.property('name', unit.name);
			expect(body).to.have.property('numMonitors', 1);
			expect(body).to.have.property('numDepartments', 1);
			expect(body).to.have.property('type', 'u');

			// cleanup
			await deleteUser(user);
		});
	});

	describe('[POST] livechat/units/:id', () => {
		it('should fail if manage-livechat-units permission is missing', async () => {
			await updatePermission('manage-livechat-units', []);
			return request.post(api('livechat/units/123')).set(credentials).expect(403);
		});
		it('should fail if unit does not exist', async () => {
			await updatePermission('manage-livechat-units', ['admin']);
			const user = await createUser();
			await createMonitor(user.username);
			const department = await createDepartment();

			const { body } = await request
				.post(api('livechat/units/123'))
				.set(credentials)
				.send({
					unitData: { name: 'test', visibility: 'public', enabled: true, description: 'test' },
					unitMonitors: [{ monitorId: user._id, username: user.username }],
					unitDepartments: [{ departmentId: department._id }],
				})
				.expect(400);

			expect(body).to.have.property('success', false);
			// cleanup
			await deleteUser(user);
		});
		it('should return a updated unit', async () => {
			const user = await createUser();
			await createMonitor(user.username);
			const department = await createDepartment();
			const unit = await createUnit(user._id, user.username, [department._id]);

			const { body } = await request
				.post(api(`livechat/units/${unit._id}`))
				.set(credentials)
				.send({
					unitData: { name: 'test', visibility: 'private', enabled: true, description: 'test' },
					unitMonitors: [{ monitorId: user._id, username: user.username }],
					unitDepartments: [{ departmentId: department._id }],
				})
				.expect(200);

			expect(body).to.have.property('_id');
			expect(body).to.have.property('name', 'test');
			expect(body).to.have.property('visibility', 'private');
			expect(body).to.have.property('type', 'u');
			expect(body).to.have.property('numMonitors', 1);
			expect(body).to.have.property('numDepartments', 1);

			// cleanup
			await deleteUser(user);
		});
		it('should move the department to the latest unit that attempted to assign it', async () => {
			const user = await createUser();
			await createMonitor(user.username);
			const department = await createDepartment();
			const unit1 = await createUnit(user._id, user.username, [department._id]);
			const unit2 = await createUnit(user._id, user.username, [department._id]);

			const { body } = await request
				.get(api(`livechat/units/${unit1._id}/departments`))
				.set(credentials)
				.expect(200);

			expect(body).to.have.property('departments');
			expect(body.departments).to.have.lengthOf(0);
			expect(unit2.numDepartments).to.be.equal(1);
		});
		it('should remove the department from the unit if it is not passed in the request', async () => {
			const user = await createUser();
			await createMonitor(user.username);
			const department = await createDepartment();
			const unit1 = await createUnit(user._id, user.username, [department._id]);

			const { body } = await request
				.post(api(`livechat/units/${unit1._id}`))
				.set(credentials)
				.send({
					unitData: { name: unit1.name, visibility: unit1.visibility },
					unitMonitors: [{ monitorId: user._id, username: user.username }],
					unitDepartments: [],
				})
				.expect(200);

			expect(body).to.have.property('_id', unit1._id);
			expect(body).to.have.property('numDepartments', 0);
		});
		it('should remove the monitor from the unit if it is not passed in the request', async () => {
			const user = await createUser();
			await createMonitor(user.username);
			const department = await createDepartment();
			const unit1 = await createUnit(user._id, user.username, [department._id]);

			const { body } = await request
				.post(api(`livechat/units/${unit1._id}`))
				.set(credentials)
				.send({
					unitData: { name: unit1.name, visibility: unit1.visibility },
					unitMonitors: [],
					unitDepartments: [{ departmentId: department._id }],
				})
				.expect(200);

			expect(body).to.have.property('_id', unit1._id);
			expect(body).to.have.property('numMonitors', 0);
		});
	});

	describe('[DELETE] livechat/units/:id', () => {
		it('should fail if manage-livechat-units permission is missing', async () => {
			await updatePermission('manage-livechat-units', []);
			return request.delete(api('livechat/units/123')).set(credentials).expect(403);
		});
		it('should return a deleted unit', async () => {
			await updatePermission('manage-livechat-units', ['admin']);
			const user = await createUser();
			await createMonitor(user.username);
			const department = await createDepartment();
			const unit = await createUnit(user._id, user.username, [department._id]);

			const { body } = await request
				.delete(api(`livechat/units/${unit._id}`))
				.set(credentials)
				.expect(200);

			expect(body).to.have.be.a('number').equal(1);

			// cleanup
			await deleteUser(user);
		});
	});

	describe('livechat/units/:unitId/departments', () => {
		it('should fail if manage-livechat-units permission is missing', async () => {
			await updatePermission('manage-livechat-units', []);
			return request.get(api('livechat/units/123/departments')).set(credentials).expect(403);
		});
		it('should return departments associated with a unit', async () => {
			await updatePermission('manage-livechat-units', ['admin']);
			const user = await createUser();
			await createMonitor(user.username);
			const department = await createDepartment();
			const unit = await createUnit(user._id, user.username, [department._id]);

			const { body } = await request
				.get(api(`livechat/units/${unit._id}/departments`))
				.set(credentials)
				.expect(200);

			expect(body).to.have.property('departments');
			expect(body.departments).to.have.lengthOf(1);
			expect(body.departments[0]).to.have.property('_id', department._id);
			expect(body.departments[0]).to.have.property('name', department.name);

			// cleanup
			await deleteUser(user);
		});
	});

	describe('livechat/units/:unitId/departments/available', () => {
		it('should fail if manage-livechat-units permission is missing', async () => {
			await updatePermission('manage-livechat-units', []);
			return request.get(api('livechat/units/123/departments/available')).set(credentials).expect(403);
		});
		it('should return departments not associated with a unit', async () => {
			await updatePermission('manage-livechat-units', ['admin']);
			const user = await createUser();
			await createMonitor(user.username);
			const department = await createDepartment();
			const unit = await createUnit(user._id, user.username, [department._id]);

			const { body } = await request
				.get(api(`livechat/units/${unit._id}/departments/available`))
				.set(credentials)
				.expect(200);

			expect(body).to.have.property('departments');
			expect(body.departments).to.have.lengthOf.greaterThan(0);

			const myUnit = body.departments.find((d: ILivechatDepartment) => d.parentId === unit._id);
			expect(myUnit).to.not.be.undefined.and.not.be.null;

			// cleanup
			await deleteUser(user);
		});
	});

	describe('livechat/units/:unitId/monitors', () => {
		it('should fail if manage-livechat-units permission is missing', async () => {
			await updatePermission('manage-livechat-monitors', []);
			return request.get(api('livechat/units/123/monitors')).set(credentials).expect(403);
		});
		it('should return monitors associated with a unit', async () => {
			await updatePermission('manage-livechat-monitors', ['admin']);
			const user = await createUser();
			await createMonitor(user.username);
			const department = await createDepartment();
			const unit = await createUnit(user._id, user.username, [department._id]);

			const { body } = await request
				.get(api(`livechat/units/${unit._id}/monitors`))
				.set(credentials)
				.expect(200);

			expect(body).to.have.property('monitors');
			expect(body.monitors).to.have.lengthOf(1);
			expect(body.monitors[0]).to.have.property('monitorId', user._id);
			expect(body.monitors[0]).to.have.property('username', user.username);

			// cleanup
			await deleteUser(user);
		});
	});

	const testDepartmentsInUnit = (unitId: string, unitName: string, numDepartments: number) => {
		return request
			.get(api(`livechat/units/${unitId}`))
			.set(credentials)
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('_id', unitId);
				expect(res.body).to.have.property('name', unitName);
				expect(res.body).to.have.property('numMonitors', 1);
				expect(res.body).to.have.property('numDepartments', numDepartments);
				expect(res.body).to.have.property('type', 'u');
			});
	};

	const testDepartmentAncestors = (departmentId: string, departmentName: string, ancestor?: string | null) => {
		return request
			.get(api(`livechat/department/${departmentId}`))
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('department');
				expect(res.body.department).to.have.property('_id', departmentId);
				expect(res.body.department).to.have.property('name', departmentName);
				if (ancestor) {
					expect(res.body.department).to.have.property('parentId', ancestor);
					expect(res.body.department).to.have.property('ancestors').that.is.an('array').with.lengthOf(1);
					expect(res.body.department.ancestors[0]).to.equal(ancestor);
				}

				if (ancestor === null) {
					expect(res.body.department).to.have.property('parentId').that.is.null;
					expect(res.body.department).to.have.property('ancestors').that.is.null;
				}

				if (ancestor === undefined) {
					expect(res.body.department).to.not.have.property('parentId');
					expect(res.body.department).to.not.have.property('ancestors');
				}
			});
	};

	describe('[POST] livechat/department', () => {
		let departmentId: string;
		let monitor1: Awaited<ReturnType<typeof createUser>>;
		let monitor1Credentials: Awaited<ReturnType<typeof login>>;
		let monitor2: Awaited<ReturnType<typeof createUser>>;
		let monitor2Credentials: Awaited<ReturnType<typeof login>>;
		let unit: IOmnichannelBusinessUnit;

		before(async () => {
			monitor1 = await createUser();
			monitor2 = await createUser();
			await createMonitor(monitor1.username);
			monitor1Credentials = await login(monitor1.username, password);
			await createMonitor(monitor2.username);
			monitor2Credentials = await login(monitor2.username, password);
			unit = await createUnit(monitor1._id, monitor1.username, []);
		});

		after(async () => Promise.all([deleteUser(monitor1), deleteUser(monitor2), deleteUnit(unit)]));

		afterEach(() => {
			if (departmentId) {
				return deleteDepartment(departmentId);
			}
		});

		it('should fail creating department when providing an invalid property in the department unit object', () => {
			return request
				.post(api('livechat/department'))
				.set(credentials)
				.send({
					department: { name: 'Fail-Test', enabled: true, showOnOfflineForm: true, showOnRegistration: true, email: 'bla@bla' },
					departmentUnit: { invalidProperty: true },
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				});
		});

		it('should fail creating a department into an existing unit that a monitor does not supervise', async () => {
			const departmentName = 'Test-Department-Unit2';
			await request
				.post(api('livechat/department'))
				.set(monitor2Credentials)
				.send({
					department: { name: departmentName, enabled: true, showOnOfflineForm: true, showOnRegistration: true, email: 'bla@bla' },
					departmentUnit: { _id: unit._id },
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('department').that.is.an('object');
					expect(res.body.department).to.have.property('name', departmentName);
					expect(res.body.department).to.have.property('type', 'd');
					expect(res.body.department).to.have.property('_id');
					departmentId = res.body.department._id;
				});

			await testDepartmentsInUnit(unit._id, unit.name, 0);

			await testDepartmentAncestors(departmentId, departmentName);
		});

		it('should succesfully create a department into an existing unit as a livechat manager', async () => {
			const departmentName = 'Test-Department-Unit';
			await request
				.post(api('livechat/department'))
				.set(credentials)
				.send({
					department: { name: departmentName, enabled: true, showOnOfflineForm: true, showOnRegistration: true, email: 'bla@bla' },
					departmentUnit: { _id: unit._id },
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('department').that.is.an('object');
					expect(res.body.department).to.have.property('name', departmentName);
					expect(res.body.department).to.have.property('type', 'd');
					expect(res.body.department).to.have.property('_id');
					departmentId = res.body.department._id;
				});

			await testDepartmentsInUnit(unit._id, unit.name, 1);

			await testDepartmentAncestors(departmentId, departmentName, unit._id);
		});

		it('should succesfully create a department into an existing unit that a monitor supervises', async () => {
			const departmentName = 'Test-Department-Unit3';
			await request
				.post(api('livechat/department'))
				.set(monitor1Credentials)
				.send({
					department: { name: departmentName, enabled: true, showOnOfflineForm: true, showOnRegistration: true, email: 'bla@bla' },
					departmentUnit: { _id: unit._id },
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('department').that.is.an('object');
					expect(res.body.department).to.have.property('name', departmentName);
					expect(res.body.department).to.have.property('type', 'd');
					expect(res.body.department).to.have.property('_id');
					departmentId = res.body.department._id;
				});

			// Deleting a department currently does not decrease its unit's counter. We must adjust this check when this is fixed
			await testDepartmentsInUnit(unit._id, unit.name, 2);

			await testDepartmentAncestors(departmentId, departmentName, unit._id);
		});
	});

	describe('[PUT] livechat/department', () => {
		let monitor1: Awaited<ReturnType<typeof createUser>>;
		let monitor1Credentials: Awaited<ReturnType<typeof login>>;
		let monitor2: Awaited<ReturnType<typeof createUser>>;
		let monitor2Credentials: Awaited<ReturnType<typeof login>>;
		let unit: IOmnichannelBusinessUnit;
		let department: ILivechatDepartment;

		before(async () => {
			monitor1 = await createUser();
			monitor2 = await createUser();
			await createMonitor(monitor1.username);
			monitor1Credentials = await login(monitor1.username, password);
			await createMonitor(monitor2.username);
			monitor2Credentials = await login(monitor2.username, password);
			department = await createDepartment();
			unit = await createUnit(monitor1._id, monitor1.username, []);
		});

		after(async () => Promise.all([deleteUser(monitor1), deleteUser(monitor2), deleteUnit(unit), deleteDepartment(department._id)]));

		it("should fail updating a department's unit when providing an invalid property in the department unit object", () => {
			const updatedName = 'updated-department-name';
			return request
				.put(api(`livechat/department/${department._id}`))
				.set(credentials)
				.send({
					department: { name: updatedName, enabled: true, showOnOfflineForm: true, showOnRegistration: true, email: 'bla@bla' },
					departmentUnit: { invalidProperty: true },
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'Match error: Unknown key in field departmentUnit.invalidProperty');
				});
		});

		it("should fail updating a department's unit when providing an invalid _id type in the department unit object", () => {
			const updatedName = 'updated-department-name';
			return request
				.put(api(`livechat/department/${department._id}`))
				.set(credentials)
				.send({
					department: { name: updatedName, enabled: true, showOnOfflineForm: true, showOnRegistration: true, email: 'bla@bla' },
					departmentUnit: { _id: true },
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'Match error: Expected string, got boolean in field departmentUnit._id');
				});
		});

		it('should succesfully add an existing department to a unit as a livechat manager', async () => {
			const updatedName = 'updated-department-name';
			await request
				.put(api(`livechat/department/${department._id}`))
				.set(credentials)
				.send({
					department: { name: updatedName, enabled: true, showOnOfflineForm: true, showOnRegistration: true, email: 'bla@bla' },
					departmentUnit: { _id: unit._id },
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('department').that.is.an('object');
					expect(res.body.department).to.have.property('name', updatedName);
					expect(res.body.department).to.have.property('type', 'd');
					expect(res.body.department).to.have.property('_id', department._id);
				});

			await testDepartmentsInUnit(unit._id, unit.name, 1);

			await testDepartmentAncestors(department._id, updatedName, unit._id);
		});

		it('should succesfully remove an existing department from a unit as a livechat manager', async () => {
			const updatedName = 'updated-department-name';
			await request
				.put(api(`livechat/department/${department._id}`))
				.set(credentials)
				.send({
					department: { name: updatedName, enabled: true, showOnOfflineForm: true, showOnRegistration: true, email: 'bla@bla' },
					departmentUnit: {},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('department').that.is.an('object');
					expect(res.body.department).to.have.property('name', updatedName);
					expect(res.body.department).to.have.property('type', 'd');
					expect(res.body.department).to.have.property('_id', department._id);
				});

			await testDepartmentsInUnit(unit._id, unit.name, 0);

			await testDepartmentAncestors(department._id, updatedName, null);
		});

		it('should fail adding a department into an existing unit that a monitor does not supervise', async () => {
			const updatedName = 'updated-department-name2';
			await request
				.put(api(`livechat/department/${department._id}`))
				.set(monitor2Credentials)
				.send({
					department: { name: updatedName, enabled: true, showOnOfflineForm: true, showOnRegistration: true, email: 'bla@bla' },
					departmentUnit: { _id: unit._id },
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('department').that.is.an('object');
					expect(res.body.department).to.have.property('name', updatedName);
					expect(res.body.department).to.have.property('type', 'd');
					expect(res.body.department).to.have.property('_id');
				});

			await testDepartmentsInUnit(unit._id, unit.name, 0);

			await testDepartmentAncestors(department._id, updatedName, null);
		});

		it('should succesfully add a department into an existing unit that a monitor supervises', async () => {
			const updatedName = 'updated-department-name3';
			await request
				.put(api(`livechat/department/${department._id}`))
				.set(monitor1Credentials)
				.send({
					department: { name: updatedName, enabled: true, showOnOfflineForm: true, showOnRegistration: true, email: 'bla@bla' },
					departmentUnit: { _id: unit._id },
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('department').that.is.an('object');
					expect(res.body.department).to.have.property('name', updatedName);
					expect(res.body.department).to.have.property('type', 'd');
					expect(res.body.department).to.have.property('_id');
				});

			await testDepartmentsInUnit(unit._id, unit.name, 1);

			await testDepartmentAncestors(department._id, updatedName, unit._id);
		});

		it('should fail removing a department from a unit that a monitor does not supervise', async () => {
			const updatedName = 'updated-department-name4';
			await request
				.put(api(`livechat/department/${department._id}`))
				.set(monitor2Credentials)
				.send({
					department: { name: updatedName, enabled: true, showOnOfflineForm: true, showOnRegistration: true, email: 'bla@bla' },
					departmentUnit: {},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('department').that.is.an('object');
					expect(res.body.department).to.have.property('name', updatedName);
					expect(res.body.department).to.have.property('type', 'd');
					expect(res.body.department).to.have.property('_id');
				});

			await testDepartmentsInUnit(unit._id, unit.name, 1);

			await testDepartmentAncestors(department._id, updatedName, unit._id);
		});

		it('should succesfully remove a department from a unit that a monitor supervises', async () => {
			const updatedName = 'updated-department-name5';
			await request
				.put(api(`livechat/department/${department._id}`))
				.set(monitor1Credentials)
				.send({
					department: { name: updatedName, enabled: true, showOnOfflineForm: true, showOnRegistration: true, email: 'bla@bla' },
					departmentUnit: {},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('department').that.is.an('object');
					expect(res.body.department).to.have.property('name', updatedName);
					expect(res.body.department).to.have.property('type', 'd');
					expect(res.body.department).to.have.property('_id');
				});

			await testDepartmentsInUnit(unit._id, unit.name, 0);

			await testDepartmentAncestors(department._id, updatedName, null);
		});
	});
});
