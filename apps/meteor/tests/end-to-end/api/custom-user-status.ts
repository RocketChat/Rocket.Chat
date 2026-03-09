import { expect } from 'chai';
import { after, afterEach, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { updatePermission } from '../../data/permissions.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';

async function createCustomUserStatus(name: string, statusType?: string): Promise<string> {
	const res = await request.post(api('custom-user-status.create')).set(credentials).send({ name, statusType }).expect(200);
	return res.body.customUserStatus._id;
}

async function deleteCustomUserStatus(id: string): Promise<void> {
	await request.post(api('custom-user-status.delete')).set(credentials).send({ customUserStatusId: id }).expect(200);
}

describe('[CustomUserStatus]', () => {
	let unauthorizedUser: any;
	let unauthorizedUserCredentials: any;

	before((done) => {
		getCredentials(done);
	});

	before(async () => {
		unauthorizedUser = await createUser();
		unauthorizedUserCredentials = await login(unauthorizedUser.username, password);
	});

	after(() => Promise.all([updatePermission('manage-user-status', ['admin']), deleteUser(unauthorizedUser)]));

	describe('[/custom-user-status.list]', () => {
		let customUserStatusId: string;
		let customUserStatusName: string;

		before(async () => {
			customUserStatusName = `test-${Date.now()}`;
			customUserStatusId = await createCustomUserStatus(customUserStatusName);
		});

		after(async () => {
			await deleteCustomUserStatus(customUserStatusId);
		});

		it('should return custom user status', (done) => {
			void request
				.get(api('custom-user-status.list'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('statuses').and.to.be.an('array');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});

		it('should return custom user status even requested with count and offset params', (done) => {
			void request
				.get(api('custom-user-status.list'))
				.set(credentials)
				.expect(200)
				.query({
					count: 5,
					offset: 0,
				})
				.expect((res) => {
					expect(res.body).to.have.property('statuses').and.to.be.an('array');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});

		it('should return one custom user status when requested with id param', (done) => {
			void request
				.get(api('custom-user-status.list'))
				.set(credentials)
				.expect(200)
				.query({
					_id: customUserStatusId,
				})
				.expect((res) => {
					expect(res.body).to.have.property('statuses').and.to.be.an('array').and.to.have.lengthOf(1);
					expect(res.body).to.have.property('total').and.to.equal(1);
					expect(res.body).to.have.property('offset').and.to.equal(0);
					expect(res.body).to.have.property('count').and.to.equal(1);
				})
				.end(done);
		});

		it('should return empty array when requested with an existing name param', (done) => {
			void request
				.get(api('custom-user-status.list'))
				.set(credentials)
				.expect(200)
				.query({
					name: customUserStatusName,
				})
				.expect((res) => {
					expect(res.body).to.have.property('statuses').and.to.be.an('array').and.to.have.lengthOf(1);
					expect(res.body).to.have.property('total').and.to.equal(1);
					expect(res.body).to.have.property('offset').and.to.equal(0);
					expect(res.body).to.have.property('count').and.to.equal(1);
				})
				.end(done);
		});

		it('should return empty array when requested with unknown name param', (done) => {
			void request
				.get(api('custom-user-status.list'))
				.set(credentials)
				.expect(200)
				.query({
					name: 'testxxx',
				})
				.expect((res) => {
					expect(res.body).to.have.property('statuses').and.to.be.an('array').and.to.have.lengthOf(0);
					expect(res.body).to.have.property('total').and.to.equal(0);
					expect(res.body).to.have.property('offset').and.to.equal(0);
					expect(res.body).to.have.property('count').and.to.equal(0);
				})
				.end(done);
		});
	});

	describe('[/custom-user-status.create]', () => {
		let customUserStatusId: string;

		afterEach(async () => {
			await updatePermission('manage-user-status', ['admin']);

			if (customUserStatusId) {
				await deleteCustomUserStatus(customUserStatusId);
				customUserStatusId = '';
			}
		});

		it('should throw an error if not authenticated', async () => {
			await request
				.post(api('custom-user-status.create'))
				.send({ name: 'test-status' })
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res: Response) => {
					expect(res.body).to.have.property('status', 'error');
				});
		});

		it('should throw an error if user does not have manage-user-status permission', async () => {
			await updatePermission('manage-user-status', []);

			await request
				.post(api('custom-user-status.create'))
				.set(unauthorizedUserCredentials)
				.send({ name: 'test-status' })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'not_authorized');
				});
		});

		it('should create a custom user status successfully', async () => {
			const statusName = `test-create-${Date.now()}`;

			await request
				.post(api('custom-user-status.create'))
				.set(credentials)
				.send({ name: statusName, statusType: 'busy' })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('customUserStatus');
					expect(res.body.customUserStatus).to.have.property('_id');
					expect(res.body.customUserStatus).to.have.property('name', statusName);
					expect(res.body.customUserStatus).to.have.property('statusType', 'busy');
					customUserStatusId = res.body.customUserStatus._id;
				});
		});

		it('should throw an error if name already exists', async () => {
			const statusName = `test-duplicate-${Date.now()}`;
			customUserStatusId = await createCustomUserStatus(statusName);

			await request
				.post(api('custom-user-status.create'))
				.set(credentials)
				.send({ name: statusName })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'Custom_User_Status_Error_Name_Already_In_Use');
				});
		});

		it('should throw an error if statusType is invalid', async () => {
			await request
				.post(api('custom-user-status.create'))
				.set(credentials)
				.send({ name: `test-invalid-status-type-${Date.now()}`, statusType: 'invalid' })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-input-is-not-a-valid-field');
				});
		});
	});

	describe('[/custom-user-status.update]', () => {
		let customUserStatusId: string;
		let customUserStatusName: string;

		before(async () => {
			customUserStatusName = `test-update-${Date.now()}`;
			customUserStatusId = await createCustomUserStatus(customUserStatusName);
		});

		afterEach(async () => {
			await updatePermission('manage-user-status', ['admin']);
		});

		after(async () => {
			if (customUserStatusId) {
				await deleteCustomUserStatus(customUserStatusId);
			}
			await updatePermission('manage-user-status', ['admin']);
		});

		it('should throw an error if not authenticated', async () => {
			await request
				.post(api('custom-user-status.update'))
				.send({ _id: customUserStatusId, name: 'updated-name' })
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res: Response) => {
					expect(res.body).to.have.property('status', 'error');
				});
		});

		it('should throw an error if user does not have manage-user-status permission', async () => {
			await updatePermission('manage-user-status', []);

			await request
				.post(api('custom-user-status.update'))
				.set(unauthorizedUserCredentials)
				.send({ _id: customUserStatusId, name: 'updated-name' })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'not_authorized');
				});
		});

		it('should throw an error if custom user status does not exist', async () => {
			await request
				.post(api('custom-user-status.update'))
				.set(credentials)
				.send({ _id: 'invalid-id', name: 'updated-name' })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('should update custom user status successfully', async () => {
			const newName = `test-updated-${Date.now()}`;

			await request
				.post(api('custom-user-status.update'))
				.set(credentials)
				.send({ _id: customUserStatusId, name: newName, statusType: 'away' })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('customUserStatus');
					expect(res.body.customUserStatus).to.have.property('_id', customUserStatusId);
					expect(res.body.customUserStatus).to.have.property('name', newName);
					expect(res.body.customUserStatus).to.have.property('statusType', 'away');
				});

			customUserStatusName = newName;
		});

		it('should throw an error if status name already exists', async () => {
			const existingStatusName = `test-update-duplicate-${Date.now()}`;
			const existingStatusId = await createCustomUserStatus(existingStatusName);

			await request
				.post(api('custom-user-status.update'))
				.set(credentials)
				.send({ _id: customUserStatusId, name: existingStatusName })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'Custom_User_Status_Error_Name_Already_In_Use');
				});

			await deleteCustomUserStatus(existingStatusId);
		});

		it('should throw an error if statusType is invalid', async () => {
			await request
				.post(api('custom-user-status.update'))
				.set(credentials)
				.send({ _id: customUserStatusId, name: customUserStatusName, statusType: 'invalid' })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-input-is-not-a-valid-field');
				});
		});
	});

	describe('[/custom-user-status.delete]', () => {
		let customUserStatusId: string;

		beforeEach(async () => {
			const statusName = `test-delete-${Date.now()}`;
			customUserStatusId = await createCustomUserStatus(statusName);
		});

		afterEach(async () => {
			await updatePermission('manage-user-status', ['admin']);

			if (customUserStatusId) {
				await deleteCustomUserStatus(customUserStatusId);
				customUserStatusId = '';
			}
		});

		it('should throw an error if not authenticated', async () => {
			await request
				.post(api('custom-user-status.delete'))
				.send({ customUserStatusId })
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res: Response) => {
					expect(res.body).to.have.property('status', 'error');
				});
		});

		it('should throw an error if user does not have manage-user-status permission', async () => {
			await updatePermission('manage-user-status', []);

			await request
				.post(api('custom-user-status.delete'))
				.set(unauthorizedUserCredentials)
				.send({ customUserStatusId })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'not_authorized');
				});
		});

		it('should throw an error if customUserStatusId is not provided', async () => {
			await request
				.post(api('custom-user-status.delete'))
				.set(credentials)
				.send({})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'The "customUserStatusId" params is required!');
				});
		});

		it('should throw an error if custom user status does not exist', async () => {
			await request
				.post(api('custom-user-status.delete'))
				.set(credentials)
				.send({ customUserStatusId: 'invalid-id' })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'Custom_User_Status_Error_Invalid_User_Status');
				});
		});

		it('should delete custom user status successfully', async () => {
			await request
				.post(api('custom-user-status.delete'))
				.set(credentials)
				.send({ customUserStatusId })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});

			customUserStatusId = '';
		});
	});
});
