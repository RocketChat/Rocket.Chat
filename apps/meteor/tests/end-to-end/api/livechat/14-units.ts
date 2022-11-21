/* eslint-env mocha */

import type { ILivechatDepartment, IOmnichannelBusinessUnit } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createDepartment } from '../../../data/livechat/rooms';
import { createMonitor, createUnit } from '../../../data/livechat/units';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { createUser } from '../../../data/users.helper';
import { IS_EE } from '../../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('[EE] LIVECHAT - Units', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true).then(done);
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
			const unit = await createUnit(user._id, user.username, department._id);

			const { body } = await request.get(api('livechat/units')).set(credentials).expect(200);
			expect(body.units).to.be.an('array').with.lengthOf.greaterThan(0);
			const unitFound = body.units.find((u: IOmnichannelBusinessUnit) => u._id === unit._id);
			expect(unitFound).to.have.property('_id', unit._id);
			expect(unitFound).to.have.property('name', unit.name);
			expect(unitFound).to.have.property('numMonitors', 1);
			expect(unitFound).to.have.property('numDepartments', 1);
			expect(unitFound).to.have.property('type', 'u');
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
			const unit = await createUnit(user._id, user.username, department._id);

			const { body } = await request
				.get(api(`livechat/units/${unit._id}`))
				.set(credentials)
				.expect(200);
			expect(body).to.have.property('_id', unit._id);
			expect(body).to.have.property('name', unit.name);
			expect(body).to.have.property('numMonitors', 1);
			expect(body).to.have.property('numDepartments', 1);
			expect(body).to.have.property('type', 'u');
		});
	});

	describe('[POST] livechat/units/:id', () => {
		it('should fail if manage-livechat-units permission is missing', async () => {
			await updatePermission('manage-livechat-units', []);
			return request.post(api('livechat/units/123')).set(credentials).expect(403);
		});
		it('should return a updated unit', async () => {
			await updatePermission('manage-livechat-units', ['admin']);
			const user = await createUser();
			await createMonitor(user.username);
			const department = await createDepartment();
			const unit = await createUnit(user._id, user.username, department._id);

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
			const unit = await createUnit(user._id, user.username, department._id);

			const { body } = await request
				.delete(api(`livechat/units/${unit._id}`))
				.set(credentials)
				.expect(200);

			expect(body).to.have.be.a('number').equal(1);
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
			const unit = await createUnit(user._id, user.username, department._id);

			const { body } = await request
				.get(api(`livechat/units/${unit._id}/departments`))
				.set(credentials)
				.expect(200);

			expect(body).to.have.property('departments');
			expect(body.departments).to.have.lengthOf(1);
			expect(body.departments[0]).to.have.property('_id', department._id);
			expect(body.departments[0]).to.have.property('name', department.name);
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
			const unit = await createUnit(user._id, user.username, department._id);

			const { body } = await request
				.get(api(`livechat/units/${unit._id}/departments/available`))
				.set(credentials)
				.expect(200);

			expect(body).to.have.property('departments');
			expect(body.departments).to.have.lengthOf.greaterThan(0);

			const myUnit = body.departments.find((d: ILivechatDepartment) => d.parentId === unit._id);
			expect(myUnit).to.not.be.undefined.and.not.be.null;
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
			const unit = await createUnit(user._id, user.username, department._id);

			const { body } = await request
				.get(api(`livechat/units/${unit._id}/monitors`))
				.set(credentials)
				.expect(200);

			expect(body).to.have.property('monitors');
			expect(body.monitors).to.have.lengthOf(1);
			expect(body.monitors[0]).to.have.property('monitorId', user._id);
			expect(body.monitors[0]).to.have.property('username', user.username);
		});
	});

	describe('livechat/monitors', () => {
		it('should fail if manage-livechat-monitors permission is missing', async () => {
			await updatePermission('manage-livechat-monitors', []);
			return request.get(api('livechat/monitors')).set(credentials).expect(403);
		});
		it('should return all monitors', async () => {
			await updatePermission('manage-livechat-monitors', ['admin']);
			const user = await createUser();
			await createMonitor(user.username);

			const { body } = await request.get(api('livechat/monitors')).set(credentials).query({ text: user.username }).expect(200);
			expect(body).to.have.property('monitors');
			expect(body.monitors).to.have.lengthOf(1);
			expect(body.monitors[0]).to.have.property('username', user.username);
		});
	});

	describe('livechat/monitors/:username', () => {
		it('should fail if manage-livechat-monitors permission is missing', async () => {
			await updatePermission('manage-livechat-monitors', []);
			return request.get(api('livechat/monitors/123')).set(credentials).expect(403);
		});
		it('should return a monitor', async () => {
			await updatePermission('manage-livechat-monitors', ['admin']);
			const user = await createUser();
			await createMonitor(user.username);

			const { body } = await request
				.get(api(`livechat/monitors/${user.username}`))
				.set(credentials)
				.expect(200);
			expect(body).to.have.property('username', user.username);
		});
	});
});
