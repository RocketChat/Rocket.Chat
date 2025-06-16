import type { ILivechatDepartment, IOmnichannelBusinessUnit } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, after, describe, it } from 'mocha';

import { getCredentials, api, request, credentials, methodCall } from '../../../data/api-data';
import { deleteDepartment, getDepartmentById, createDepartmentWithMethod } from '../../../data/livechat/department';
import { createDepartment, updateDepartment } from '../../../data/livechat/rooms';
import { createMonitor, createUnit, deleteUnit, getUnit } from '../../../data/livechat/units';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { password } from '../../../data/user';
import { createUser, deleteUser, login } from '../../../data/users.helper';
import { IS_EE } from '../../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('[EE] LIVECHAT - Units', () => {
	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
		await updatePermission('manage-livechat-departments', ['livechat-manager', 'livechat-monitor', 'admin']);
		await updateSetting('Omnichannel_enable_department_removal', true);
	});
	after(async () => {
		await updateSetting('Omnichannel_enable_department_removal', false);
	});

	describe('[GET] livechat/units', () => {
		it('should return empty if manage-livechat-units permission is missing', async () => {
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
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('units').that.is.an('array').with.lengthOf(0);
				});
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

	describe('[POST] livechat/department', () => {
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
			const department = await createDepartment(undefined, undefined, undefined, undefined, { _id: unit._id }, monitor2Credentials);

			const updatedUnit = await getUnit(unit._id);
			expect(updatedUnit).to.have.property('name', unit.name);
			expect(updatedUnit).to.have.property('numMonitors', 1);
			expect(updatedUnit).to.have.property('numDepartments', 0);

			const fullDepartment = await getDepartmentById(department._id);
			expect(fullDepartment).to.not.have.property('parentId');
			expect(fullDepartment).to.not.have.property('ancestors');

			await deleteDepartment(department._id);
		});

		it('should succesfully create a department into an existing unit as an admin', async () => {
			const department = await createDepartment(undefined, undefined, undefined, undefined, { _id: unit._id });

			const updatedUnit = await getUnit(unit._id);
			expect(updatedUnit).to.have.property('name', unit.name);
			expect(updatedUnit).to.have.property('numMonitors', 1);
			expect(updatedUnit).to.have.property('numDepartments', 1);

			const fullDepartment = await getDepartmentById(department._id);
			expect(fullDepartment).to.have.property('parentId', unit._id);
			expect(fullDepartment).to.have.property('ancestors').that.is.an('array').with.lengthOf(1);
			expect(fullDepartment.ancestors?.[0]).to.equal(unit._id);

			await deleteDepartment(department._id);
		});

		it('should succesfully create a department into an existing unit that a monitor supervises', async () => {
			const department = await createDepartment(undefined, undefined, undefined, undefined, { _id: unit._id }, monitor1Credentials);

			const updatedUnit = await getUnit(unit._id);
			expect(updatedUnit).to.have.property('name', unit.name);
			expect(updatedUnit).to.have.property('numMonitors', 1);
			expect(updatedUnit).to.have.property('numDepartments', 1);

			const fullDepartment = await getDepartmentById(department._id);
			expect(fullDepartment).to.have.property('parentId', unit._id);
			expect(fullDepartment).to.have.property('ancestors').that.is.an('array').with.lengthOf(1);
			expect(fullDepartment.ancestors?.[0]).to.equal(unit._id);

			await deleteDepartment(department._id);
		});

		it('unit should end up with 0 departments after removing all of them', async () => {
			const updatedUnit = await getUnit(unit._id);
			expect(updatedUnit).to.have.property('name', unit.name);
			expect(updatedUnit).to.have.property('numMonitors', 1);
			expect(updatedUnit).to.have.property('numDepartments', 0);
		});
	});

	describe('[PUT] livechat/department', () => {
		let monitor1: Awaited<ReturnType<typeof createUser>>;
		let monitor1Credentials: Awaited<ReturnType<typeof login>>;
		let monitor2: Awaited<ReturnType<typeof createUser>>;
		let monitor2Credentials: Awaited<ReturnType<typeof login>>;
		let unit: IOmnichannelBusinessUnit;
		let department: ILivechatDepartment;
		let baseDepartment: ILivechatDepartment;

		before(async () => {
			monitor1 = await createUser();
			monitor2 = await createUser();
			await createMonitor(monitor1.username);
			monitor1Credentials = await login(monitor1.username, password);
			await createMonitor(monitor2.username);
			monitor2Credentials = await login(monitor2.username, password);
			department = await createDepartment();
			baseDepartment = await createDepartment();
			unit = await createUnit(monitor1._id, monitor1.username, [baseDepartment._id]);
		});

		after(async () =>
			Promise.all([
				deleteUser(monitor1),
				deleteUser(monitor2),
				deleteUnit(unit),
				deleteDepartment(department._id),
				deleteDepartment(baseDepartment._id),
			]),
		);

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

		it('should fail removing the last department from a unit', () => {
			const updatedName = 'updated-department-name';
			return request
				.put(api(`livechat/department/${baseDepartment._id}`))
				.set(credentials)
				.send({
					department: { name: updatedName, enabled: true, showOnOfflineForm: true, showOnRegistration: true, email: 'bla@bla' },
					departmentUnit: {},
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-unit-cant-be-empty');
				});
		});

		it('should succesfully add an existing department to a unit as an admin', async () => {
			const updatedName = 'updated-department-name';

			const updatedDepartment = await updateDepartment({
				userCredentials: credentials,
				departmentId: department._id,
				name: updatedName,
				departmentUnit: { _id: unit._id },
			});
			expect(updatedDepartment).to.have.property('name', updatedName);
			expect(updatedDepartment).to.have.property('type', 'd');
			expect(updatedDepartment).to.have.property('_id', department._id);

			const updatedUnit = await getUnit(unit._id);
			expect(updatedUnit).to.have.property('name', unit.name);
			expect(updatedUnit).to.have.property('numMonitors', 1);
			expect(updatedUnit).to.have.property('numDepartments', 2);

			const fullDepartment = await getDepartmentById(department._id);
			expect(fullDepartment).to.have.property('parentId', unit._id);
			expect(fullDepartment).to.have.property('ancestors').that.is.an('array').with.lengthOf(1);
			expect(fullDepartment.ancestors?.[0]).to.equal(unit._id);
		});

		it('should succesfully remove an existing department from a unit as an admin', async () => {
			const updatedName = 'updated-department-name';

			const updatedDepartment = await updateDepartment({
				userCredentials: credentials,
				departmentId: department._id,
				name: updatedName,
				departmentUnit: {},
			});
			expect(updatedDepartment).to.have.property('name', updatedName);
			expect(updatedDepartment).to.have.property('type', 'd');
			expect(updatedDepartment).to.have.property('_id', department._id);

			const updatedUnit = await getUnit(unit._id);
			expect(updatedUnit).to.have.property('name', unit.name);
			expect(updatedUnit).to.have.property('numMonitors', 1);
			expect(updatedUnit).to.have.property('numDepartments', 1);

			const fullDepartment = await getDepartmentById(department._id);
			expect(fullDepartment).to.have.property('parentId').that.is.null;
			expect(fullDepartment).to.have.property('ancestors').that.is.null;
		});

		it('should fail adding a department into an existing unit that a monitor does not supervise', async () => {
			const updatedName = 'updated-department-name2';

			const updatedDepartment = await updateDepartment({
				userCredentials: monitor2Credentials,
				departmentId: department._id,
				name: updatedName,
				departmentUnit: { _id: unit._id },
			});
			expect(updatedDepartment).to.have.property('name', updatedName);
			expect(updatedDepartment).to.have.property('type', 'd');
			expect(updatedDepartment).to.have.property('_id', department._id);

			const updatedUnit = await getUnit(unit._id);
			expect(updatedUnit).to.have.property('name', unit.name);
			expect(updatedUnit).to.have.property('numMonitors', 1);
			expect(updatedUnit).to.have.property('numDepartments', 1);

			const fullDepartment = await getDepartmentById(department._id);
			expect(fullDepartment).to.have.property('parentId').that.is.null;
			expect(fullDepartment).to.have.property('ancestors').that.is.null;
		});

		it('should succesfully add a department into an existing unit that a monitor supervises', async () => {
			const updatedName = 'updated-department-name3';

			const updatedDepartment = await updateDepartment({
				userCredentials: monitor1Credentials,
				departmentId: department._id,
				name: updatedName,
				departmentUnit: { _id: unit._id },
			});
			expect(updatedDepartment).to.have.property('name', updatedName);
			expect(updatedDepartment).to.have.property('type', 'd');
			expect(updatedDepartment).to.have.property('_id', department._id);

			const updatedUnit = await getUnit(unit._id);
			expect(updatedUnit).to.have.property('name', unit.name);
			expect(updatedUnit).to.have.property('numMonitors', 1);
			expect(updatedUnit).to.have.property('numDepartments', 2);

			const fullDepartment = await getDepartmentById(department._id);
			expect(fullDepartment).to.have.property('name', updatedName);
			expect(fullDepartment).to.have.property('parentId', unit._id);
			expect(fullDepartment).to.have.property('ancestors').that.is.an('array').with.lengthOf(1);
			expect(fullDepartment.ancestors?.[0]).to.equal(unit._id);
		});

		it('should fail removing a department from a unit that a monitor does not supervise', async () => {
			const updatedName = 'updated-department-name4';

			const updatedDepartment = await updateDepartment({
				userCredentials: monitor2Credentials,
				departmentId: department._id,
				name: updatedName,
				departmentUnit: {},
			});
			expect(updatedDepartment).to.have.property('name', updatedName);
			expect(updatedDepartment).to.have.property('type', 'd');
			expect(updatedDepartment).to.have.property('_id', department._id);

			const updatedUnit = await getUnit(unit._id);
			expect(updatedUnit).to.have.property('name', unit.name);
			expect(updatedUnit).to.have.property('numMonitors', 1);
			expect(updatedUnit).to.have.property('numDepartments', 2);

			const fullDepartment = await getDepartmentById(department._id);
			expect(fullDepartment).to.have.property('name', updatedName);
			expect(fullDepartment).to.have.property('parentId', unit._id);
			expect(fullDepartment).to.have.property('ancestors').that.is.an('array').with.lengthOf(1);
			expect(fullDepartment.ancestors?.[0]).to.equal(unit._id);
		});

		it('should succesfully remove a department from a unit that a monitor supervises', async () => {
			const updatedName = 'updated-department-name5';

			const updatedDepartment = await updateDepartment({
				userCredentials: monitor1Credentials,
				departmentId: department._id,
				name: updatedName,
				departmentUnit: {},
			});
			expect(updatedDepartment).to.have.property('name', updatedName);
			expect(updatedDepartment).to.have.property('type', 'd');
			expect(updatedDepartment).to.have.property('_id', department._id);

			const updatedUnit = await getUnit(unit._id);
			expect(updatedUnit).to.have.property('name', unit.name);
			expect(updatedUnit).to.have.property('numMonitors', 1);
			expect(updatedUnit).to.have.property('numDepartments', 1);

			const fullDepartment = await getDepartmentById(department._id);
			expect(fullDepartment).to.have.property('name', updatedName);
			expect(fullDepartment).to.have.property('parentId').that.is.null;
			expect(fullDepartment).to.have.property('ancestors').that.is.null;
		});
	});

	describe('[POST] livechat:saveDepartment', () => {
		let monitor1: Awaited<ReturnType<typeof createUser>>;
		let monitor1Credentials: Awaited<ReturnType<typeof login>>;
		let monitor2: Awaited<ReturnType<typeof createUser>>;
		let monitor2Credentials: Awaited<ReturnType<typeof login>>;
		let unit: IOmnichannelBusinessUnit;
		const departmentName = 'Test-Department-Livechat-Method';
		let testDepartmentId = '';
		let baseDepartment: ILivechatDepartment;

		before(async () => {
			monitor1 = await createUser();
			monitor2 = await createUser();
			await createMonitor(monitor1.username);
			monitor1Credentials = await login(monitor1.username, password);
			await createMonitor(monitor2.username);
			monitor2Credentials = await login(monitor2.username, password);
			baseDepartment = await createDepartment();
			unit = await createUnit(monitor1._id, monitor1.username, [baseDepartment._id]);
		});

		after(async () =>
			Promise.all([
				deleteUser(monitor1),
				deleteUser(monitor2),
				deleteUnit(unit),
				deleteDepartment(testDepartmentId),
				deleteDepartment(baseDepartment._id),
			]),
		);

		it('should fail creating department when providing an invalid _id type in the department unit object', () => {
			return request
				.post(methodCall('livechat:saveDepartment'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'livechat:saveDepartment',
						params: [
							'',
							{ name: 'Fail-Test', enabled: true, showOnOfflineForm: true, showOnRegistration: true, email: 'bla@bla' },
							[],
							{ _id: true },
						],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('message').that.is.a('string');
					const data = JSON.parse(res.body.message);
					expect(data).to.have.property('error').that.is.an('object');
					expect(data.error).to.have.property('errorType', 'Meteor.Error');
					expect(data.error).to.have.property('error', 'error-invalid-department-unit');
				});
		});

		it('should fail removing last department from unit', () => {
			return request
				.post(methodCall('livechat:saveDepartment'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'livechat:saveDepartment',
						params: [
							baseDepartment._id,
							{ name: 'Fail-Test', enabled: true, showOnOfflineForm: true, showOnRegistration: true, email: 'bla@bla' },
							[],
							{},
						],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('message').that.is.a('string');
					const data = JSON.parse(res.body.message);
					expect(data).to.have.property('error').that.is.an('object');
					expect(data.error).to.have.property('errorType', 'Meteor.Error');
					expect(data.error).to.have.property('error', 'error-unit-cant-be-empty');
				});
		});

		it('should fail creating a department into an existing unit that a monitor does not supervise', async () => {
			const departmentName = 'Fail-Test';

			const department = await createDepartmentWithMethod({
				userCredentials: monitor2Credentials,
				name: departmentName,
				departmentUnit: { _id: unit._id },
			});
			testDepartmentId = department._id;

			const updatedUnit = await getUnit(unit._id);
			expect(updatedUnit).to.have.property('name', unit.name);
			expect(updatedUnit).to.have.property('numMonitors', 1);
			expect(updatedUnit).to.have.property('numDepartments', 1);

			const fullDepartment = await getDepartmentById(testDepartmentId);
			expect(fullDepartment).to.not.have.property('parentId');
			expect(fullDepartment).to.not.have.property('ancestors');

			await deleteDepartment(testDepartmentId);
		});

		it('should succesfully create a department into an existing unit as an admin', async () => {
			const testDepartment = await createDepartmentWithMethod({ name: departmentName, departmentUnit: { _id: unit._id } });
			testDepartmentId = testDepartment._id;

			const updatedUnit = await getUnit(unit._id);
			expect(updatedUnit).to.have.property('name', unit.name);
			expect(updatedUnit).to.have.property('numMonitors', 1);
			expect(updatedUnit).to.have.property('numDepartments', 2);

			const fullDepartment = await getDepartmentById(testDepartmentId);
			expect(fullDepartment).to.have.property('parentId', unit._id);
			expect(fullDepartment).to.have.property('ancestors').that.is.an('array').with.lengthOf(1);
			expect(fullDepartment.ancestors?.[0]).to.equal(unit._id);
		});

		it('should succesfully remove an existing department from a unit as an admin', async () => {
			await createDepartmentWithMethod({ name: departmentName, departmentUnit: {}, departmentId: testDepartmentId });

			const updatedUnit = await getUnit(unit._id);
			expect(updatedUnit).to.have.property('name', unit.name);
			expect(updatedUnit).to.have.property('numMonitors', 1);
			expect(updatedUnit).to.have.property('numDepartments', 1);

			const fullDepartment = await getDepartmentById(testDepartmentId);
			expect(fullDepartment).to.have.property('parentId').that.is.null;
			expect(fullDepartment).to.have.property('ancestors').that.is.null;
		});

		it('should succesfully add an existing department to a unit as an admin', async () => {
			await createDepartmentWithMethod({ name: departmentName, departmentUnit: { _id: unit._id }, departmentId: testDepartmentId });

			const updatedUnit = await getUnit(unit._id);
			expect(updatedUnit).to.have.property('name', unit.name);
			expect(updatedUnit).to.have.property('numMonitors', 1);
			expect(updatedUnit).to.have.property('numDepartments', 2);

			const fullDepartment = await getDepartmentById(testDepartmentId);
			expect(fullDepartment).to.have.property('parentId', unit._id);
			expect(fullDepartment).to.have.property('ancestors').that.is.an('array').with.lengthOf(1);
			expect(fullDepartment.ancestors?.[0]).to.equal(unit._id);
		});

		it('should succesfully remove a department from a unit that a monitor supervises', async () => {
			await createDepartmentWithMethod({
				name: departmentName,
				departmentUnit: {},
				departmentId: testDepartmentId,
				userCredentials: monitor1Credentials,
			});

			const updatedUnit = await getUnit(unit._id);
			expect(updatedUnit).to.have.property('name', unit.name);
			expect(updatedUnit).to.have.property('numMonitors', 1);
			expect(updatedUnit).to.have.property('numDepartments', 1);

			const fullDepartment = await getDepartmentById(testDepartmentId);
			expect(fullDepartment).to.have.property('parentId').that.is.null;
			expect(fullDepartment).to.have.property('ancestors').that.is.null;
		});

		it('should succesfully add an existing department to a unit that a monitor supervises', async () => {
			await createDepartmentWithMethod({
				name: departmentName,
				departmentUnit: { _id: unit._id },
				departmentId: testDepartmentId,
				userCredentials: monitor1Credentials,
			});

			const updatedUnit = await getUnit(unit._id);
			expect(updatedUnit).to.have.property('name', unit.name);
			expect(updatedUnit).to.have.property('numMonitors', 1);
			expect(updatedUnit).to.have.property('numDepartments', 2);

			const fullDepartment = await getDepartmentById(testDepartmentId);
			expect(fullDepartment).to.have.property('parentId', unit._id);
			expect(fullDepartment).to.have.property('ancestors').that.is.an('array').with.lengthOf(1);
			expect(fullDepartment.ancestors?.[0]).to.equal(unit._id);
		});

		it('should fail removing a department from a unit that a monitor does not supervise', async () => {
			await createDepartmentWithMethod({
				name: departmentName,
				departmentUnit: {},
				departmentId: testDepartmentId,
				userCredentials: monitor2Credentials,
			});

			const updatedUnit = await getUnit(unit._id);
			expect(updatedUnit).to.have.property('name', unit.name);
			expect(updatedUnit).to.have.property('numMonitors', 1);
			expect(updatedUnit).to.have.property('numDepartments', 2);

			const fullDepartment = await getDepartmentById(testDepartmentId);
			expect(fullDepartment).to.have.property('parentId', unit._id);
			expect(fullDepartment).to.have.property('ancestors').that.is.an('array').with.lengthOf(1);
			expect(fullDepartment.ancestors?.[0]).to.equal(unit._id);

			await deleteDepartment(testDepartmentId);
		});

		it('should succesfully create a department in a unit that a monitor supervises', async () => {
			const testDepartment = await createDepartmentWithMethod({
				name: departmentName,
				departmentUnit: { _id: unit._id },
				userCredentials: monitor1Credentials,
			});
			testDepartmentId = testDepartment._id;

			const updatedUnit = await getUnit(unit._id);
			expect(updatedUnit).to.have.property('name', unit.name);
			expect(updatedUnit).to.have.property('numMonitors', 1);
			expect(updatedUnit).to.have.property('numDepartments', 2);

			const fullDepartment = await getDepartmentById(testDepartmentId);
			expect(fullDepartment).to.have.property('parentId', unit._id);
			expect(fullDepartment).to.have.property('ancestors').that.is.an('array').with.lengthOf(1);
			expect(fullDepartment.ancestors?.[0]).to.equal(unit._id);
		});
	});
});
