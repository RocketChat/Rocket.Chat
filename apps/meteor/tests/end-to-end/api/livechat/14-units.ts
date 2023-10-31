import type { ILivechatDepartment, IOmnichannelBusinessUnit } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createDepartment } from '../../../data/livechat/rooms';
import { createMonitor, createUnit } from '../../../data/livechat/units';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { createUser, deleteUser } from '../../../data/users.helper';
import { IS_EE } from '../../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('[EE] LIVECHAT - Units', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
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
});
