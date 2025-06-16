import { expect } from 'chai';
import { before, describe, it, after } from 'mocha';

import { getCredentials, api, request, credentials, methodCall } from '../../data/api-data';
import { restorePermissionToRoles } from '../../data/permissions.helper';
import { IS_EE } from '../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('[Guest Permissions]', () => {
	const guestPermissions = ['view-d-room', 'view-joined-room', 'view-p-room', 'start-discussion', 'mobile-upload-file'];

	before((done) => getCredentials(done));

	after(() => Promise.all(guestPermissions.map((permissionName) => restorePermissionToRoles(permissionName))));

	function succeedRemoveGuestPermission(permissionName: string) {
		it(`should allow removing the whitelisted permission ${permissionName} from the guest role`, async () => {
			const res = await request
				.post(methodCall('authorization:removeRoleFromPermission'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'authorization:removeRoleFromPermission',
						params: [permissionName, 'guest'],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('message');
			const message = JSON.parse(res.body.message);
			expect(message).to.not.have.property('error');

			const permissionsListRes = await request
				.get(api('permissions.listAll'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(permissionsListRes.body).to.have.property('success', true);
			expect(permissionsListRes.body).to.have.property('update').and.to.be.an('array');
			expect(permissionsListRes.body).to.have.property('remove').and.to.be.an('array');

			const updatedPermission = permissionsListRes.body.update.find((permission: any) => permission._id === permissionName);
			expect(updatedPermission).to.have.property('_id', permissionName);
			expect(updatedPermission).to.have.property('roles').and.to.be.an('array').that.does.not.include('guest');
		});
	}

	function succeedAddGuestPermission(permissionName: string) {
		it(`should allow granting the whitelisted permission ${permissionName} to the guest role`, async () => {
			const res = await request
				.post(methodCall('authorization:addPermissionToRole'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'authorization:addPermissionToRole',
						params: [permissionName, 'guest'],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('message');
			const message = JSON.parse(res.body.message);
			expect(message).to.not.have.property('error');

			const permissionsListRes = await request
				.get(api('permissions.listAll'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(permissionsListRes.body).to.have.property('success', true);
			expect(permissionsListRes.body).to.have.property('update').and.to.be.an('array');
			expect(permissionsListRes.body).to.have.property('remove').and.to.be.an('array');

			const updatedPermission = permissionsListRes.body.update.find((permission: any) => permission._id === permissionName);
			expect(updatedPermission).to.have.property('_id', permissionName);
			expect(updatedPermission).to.have.property('roles').and.to.be.an('array').that.includes('guest');
		});
	}

	describe('Default guest roles', () => {
		guestPermissions.forEach((permissionName) => {
			succeedRemoveGuestPermission(permissionName);
		});

		guestPermissions.forEach((permissionName) => {
			succeedAddGuestPermission(permissionName);
		});

		it('should not allow adding a non whitelisted permission to the guest role', async () => {
			const res = await request
				.post(methodCall('authorization:addPermissionToRole'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'authorization:addPermissionToRole',
						params: ['create-c', 'guest'],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('message');
			const message = JSON.parse(res.body.message);
			expect(message).to.have.property('error');
			expect(message.error).to.have.property('reason', 'Permission is restricted');
		});
	});
});
