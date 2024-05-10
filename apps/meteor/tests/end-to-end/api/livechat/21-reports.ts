import type { IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { api, request, credentials, getCredentials } from '../../../data/api-data';
import { createDepartment, addOrRemoveAgentFromDepartment } from '../../../data/livechat/department';
import { startANewLivechatRoomAndTakeIt, createAgent } from '../../../data/livechat/rooms';
import { createMonitor, createUnit } from '../../../data/livechat/units';
import { restorePermissionToRoles, updatePermission } from '../../../data/permissions.helper';
import { password } from '../../../data/user';
import { createUser, deleteUser, login } from '../../../data/users.helper';
import { IS_EE } from '../../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('LIVECHAT - reports', () => {
	before((done) => getCredentials(done));

	let agent2: { user: IUser; credentials: { 'X-Auth-Token': string; 'X-User-Id': string } };
	let agent3: { user: IUser; credentials: { 'X-Auth-Token': string; 'X-User-Id': string } };

	before(async () => {
		const user: IUser = await createUser();
		const userCredentials = await login(user.username, password);
		if (!user.username) {
			throw new Error('user not created');
		}
		await createMonitor(user.username);

		agent2 = {
			user,
			credentials: userCredentials,
		};
	});

	before(async () => {
		const user: IUser = await createUser();
		const userCredentials = await login(user.username, password);
		await createAgent();
		if (!user.username) {
			throw new Error('user not created');
		}
		await createMonitor(user.username);
		const dep1 = await createDepartment();
		await addOrRemoveAgentFromDepartment(
			dep1._id,
			{ agentId: 'rocketchat.internal.admin.test', username: 'rocketchat.internal.admin.test', count: 0, order: 0 },
			true,
		);
		const { room, visitor } = await startANewLivechatRoomAndTakeIt({ departmentId: dep1._id });

		await request
			.post(api('livechat/room.saveInfo'))
			.set(credentials)
			.send({
				roomData: {
					_id: room._id,
					topic: 'new topic',
					tags: ['tag1', 'tag2'],
				},
				guestData: {
					_id: visitor._id,
				},
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res: Response) => {
				expect(res.body).to.have.property('success', true);
			});

		await createUnit(user._id, user.username, [dep1._id]);

		agent3 = {
			user,
			credentials: userCredentials,
		};
	});

	after(async () => {
		await deleteUser(agent2.user);
		await deleteUser(agent3.user);
	});

	describe('livechat/analytics/dashboards/conversations-by-source', () => {
		it('should return an error when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-reports', []);
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-source'))
				.set(credentials)
				.query({ start: 'test', end: 'test' })
				.expect(403);
		});
		it('should return an error when the start and end parameters are not provided', async () => {
			await restorePermissionToRoles('view-livechat-reports');
			await request.get(api('livechat/analytics/dashboards/conversations-by-source')).set(credentials).expect(400);
		});
		it('should return an error when the start parameter is not provided', async () => {
			await request.get(api('livechat/analytics/dashboards/conversations-by-source')).set(credentials).query({ end: 'test' }).expect(400);
		});
		it('should return an error when the end parameter is not provided', async () => {
			await request.get(api('livechat/analytics/dashboards/conversations-by-source')).set(credentials).query({ start: 'test' }).expect(400);
		});
		it('should return an error when the start parameter is not a valid date', async () => {
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-source'))
				.set(credentials)
				.query({ start: 'test', end: 'test' })
				.expect(400);
		});
		it('should fail if dates are more than 1 year apart', async () => {
			const oneYearAgo = new Date(Date.now() - 380 * 24 * 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();

			await request
				.get(api('livechat/analytics/dashboards/conversations-by-source'))
				.set(credentials)
				.query({ start: oneYearAgo, end: now })
				.expect(400);
		});
		it('should return an error when start is after end', async () => {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();

			await request
				.get(api('livechat/analytics/dashboards/conversations-by-source'))
				.set(credentials)
				.query({ start: now, end: oneHourAgo })
				.expect(400);
		});
		it('should return an error when the end parameter is not a valid date', async () => {
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-source'))
				.set(credentials)
				.query({ start: '2020-01-01', end: 'test' })
				.expect(400);
		});
		it('should return the proper data when the parameters are valid', async () => {
			// Note: this way all data will come as 0
			const now = new Date().toISOString();
			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-source'))
				.set(credentials)
				.query({ start: now, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('array');
			expect(body.data).to.have.lengthOf(0);
			expect(body.total).to.be.equal(0);
			expect(body.success).to.be.true;
		});
		it('should return empty set for a monitor with no units', async () => {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();
			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-source'))
				.set(agent2.credentials)
				.query({ start: oneHourAgo, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('array');
			expect(body.data).to.have.lengthOf(0);
			expect(body.success).to.be.true;
		});
		it('should return only the data from the unit the monitor belongs to', async () => {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();
			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-source'))
				.set(agent3.credentials)
				.query({ start: oneHourAgo, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('array');
			expect(body.data).to.have.lengthOf.greaterThan(0);
			expect(body.data.every((item: { value: number }) => item.value >= 0)).to.be.true;
			expect(body.total).to.be.greaterThan(0);
			expect(body.success).to.be.true;
		});
		it('should return valid data when login as a manager', async () => {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();

			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-source'))
				.set(credentials)
				.query({ start: oneHourAgo, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('array');
			expect(body.data).to.have.lengthOf.greaterThan(0);
			expect(body.data.every((item: { value: number }) => item.value >= 0)).to.be.true;
			expect(body.total).to.be.greaterThan(0);
		});
	});
	describe('livechat/analytics/dashboards/conversations-by-status', () => {
		it('should return an error when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-reports', []);
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-status'))
				.set(credentials)
				.query({ start: 'test', end: 'test' })
				.expect(403);
		});
		it('should return an error when the start and end parameters are not provided', async () => {
			await restorePermissionToRoles('view-livechat-reports');
			await request.get(api('livechat/analytics/dashboards/conversations-by-status')).set(credentials).expect(400);
		});
		it('should return an error when the start parameter is not provided', async () => {
			await request.get(api('livechat/analytics/dashboards/conversations-by-status')).set(credentials).query({ end: 'test' }).expect(400);
		});
		it('should return an error when the end parameter is not provided', async () => {
			await request.get(api('livechat/analytics/dashboards/conversations-by-status')).set(credentials).query({ start: 'test' }).expect(400);
		});
		it('should return an error when the start parameter is not a valid date', async () => {
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-status'))
				.set(credentials)
				.query({ start: 'test', end: 'test' })
				.expect(400);
		});
		it('should return an error when the end parameter is not a valid date', async () => {
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-status'))
				.set(credentials)
				.query({ start: '2020-01-01', end: 'test' })
				.expect(400);
		});
		it('should return an error if dates are more than 1 year apart', async () => {
			const oneYearAgo = new Date(Date.now() - 380 * 24 * 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();

			await request
				.get(api('livechat/analytics/dashboards/conversations-by-status'))
				.set(credentials)
				.query({ start: oneYearAgo, end: now })
				.expect(400);
		});
		it('should return an error when start is after end', async () => {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();

			await request
				.get(api('livechat/analytics/dashboards/conversations-by-status'))
				.set(credentials)
				.query({ start: now, end: oneHourAgo })
				.expect(400);
		});
		it('should return the proper data when the parameters are valid', async () => {
			// Note: this way all data will come as 0
			const now = new Date().toISOString();
			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-status'))
				.set(credentials)
				.query({ start: now, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('array');
			expect(body.data).to.have.lengthOf(0);
			expect(body.success).to.be.true;
		});
		it('should return empty set for a monitor with no units', async () => {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();
			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-status'))
				.set(agent2.credentials)
				.query({ start: oneHourAgo, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('array');
			expect(body.data).to.have.lengthOf(0);
			expect(body.success).to.be.true;
		});
		it('should return the proper data when login as a manager', async () => {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();

			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-status'))
				.set(credentials)
				.query({ start: oneHourAgo, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('array');
			expect(body.data).to.have.lengthOf.greaterThan(0);
			expect(body.data.every((item: { value: number }) => item.value >= 0)).to.be.true;
		});
	});
	describe('livechat/analytics/dashboards/conversations-by-department', () => {
		it('should return an error when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-reports', []);
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-department'))
				.set(credentials)
				.query({ start: 'test', end: 'test' })
				.expect(403);
		});
		it('should return an error when the start and end parameters are not provided', async () => {
			await restorePermissionToRoles('view-livechat-reports');
			await request.get(api('livechat/analytics/dashboards/conversations-by-department')).set(credentials).expect(400);
		});
		it('should return an error when the start parameter is not provided', async () => {
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-department'))
				.set(credentials)
				.query({ end: 'test' })
				.expect(400);
		});
		it('should return an error when the end parameter is not provided', async () => {
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-department'))
				.set(credentials)
				.query({ start: 'test' })
				.expect(400);
		});
		it('should return an error when the start parameter is not a valid date', async () => {
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-department'))
				.set(credentials)
				.query({ start: 'test', end: 'test' })
				.expect(400);
		});
		it('should return an error when the end parameter is not a valid date', async () => {
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-department'))
				.set(credentials)
				.query({ start: '2020-01-01', end: 'test' })
				.expect(400);
		});
		it('should return an error if dates are more than 1 year apart', async () => {
			const oneYearAgo = new Date(Date.now() - 380 * 24 * 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();

			await request
				.get(api('livechat/analytics/dashboards/conversations-by-department'))
				.set(credentials)
				.query({ start: oneYearAgo, end: now })
				.expect(400);
		});
		it('should return an error when start is after end', async () => {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();

			await request
				.get(api('livechat/analytics/dashboards/conversations-by-department'))
				.set(credentials)
				.query({ start: now, end: oneHourAgo })
				.expect(400);
		});
		it('should return the proper data when the parameters are valid', async () => {
			// Note: this way all data will come as 0
			const now = new Date().toISOString();
			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-department'))
				.set(credentials)
				.query({ start: now, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('array');
			expect(body.data).to.have.lengthOf(0);
			expect(body.success).to.be.true;
		});
		it('should return empty set for a monitor with no units', async () => {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();
			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-department'))
				.set(agent2.credentials)
				.query({ start: oneHourAgo, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('array');
			expect(body.data).to.have.lengthOf(0);
			expect(body.success).to.be.true;
		});
		it('should return the proper data when login as a manager', async () => {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();

			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-department'))
				.set(credentials)
				.query({ start: oneHourAgo, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('array');
			expect(body.data).to.have.lengthOf.greaterThan(0);
			expect(body.data.every((item: { value: number }) => item.value >= 0)).to.be.true;
		});
	});
	describe('livechat/analytics/dashboards/conversations-by-tags', () => {
		it('should return an error when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-reports', []);
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-tags'))
				.set(credentials)
				.query({ start: 'test', end: 'test' })
				.expect(403);
		});
		it('should return an error when the start and end parameters are not provided', async () => {
			await restorePermissionToRoles('view-livechat-reports');
			await request.get(api('livechat/analytics/dashboards/conversations-by-tags')).set(credentials).expect(400);
		});
		it('should return an error when the start parameter is not provided', async () => {
			await request.get(api('livechat/analytics/dashboards/conversations-by-tags')).set(credentials).query({ end: 'test' }).expect(400);
		});
		it('should return an error when the end parameter is not provided', async () => {
			await request.get(api('livechat/analytics/dashboards/conversations-by-tags')).set(credentials).query({ start: 'test' }).expect(400);
		});
		it('should return an error when the start parameter is not a valid date', async () => {
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-tags'))
				.set(credentials)
				.query({ start: 'test', end: 'test' })
				.expect(400);
		});
		it('should return an error when the end parameter is not a valid date', async () => {
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-tags'))
				.set(credentials)
				.query({ start: '2020-01-01', end: 'test' })
				.expect(400);
		});
		it('should return an error if dates are more than 1 year apart', async () => {
			const oneYearAgo = new Date(Date.now() - 380 * 24 * 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();

			await request
				.get(api('livechat/analytics/dashboards/conversations-by-tags'))
				.set(credentials)
				.query({ start: oneYearAgo, end: now })
				.expect(400);
		});
		it('should return an error when start is after end', async () => {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();

			await request
				.get(api('livechat/analytics/dashboards/conversations-by-tags'))
				.set(credentials)
				.query({ start: now, end: oneHourAgo })
				.expect(400);
		});
		it('should return the proper data when the parameters are valid', async () => {
			// Note: this way all data will come as 0
			const now = new Date().toISOString();
			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-tags'))
				.set(credentials)
				.query({ start: now, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('array');
			expect(body.data).to.have.lengthOf(0);
			expect(body.success).to.be.true;
		});
		it('should return empty set for a monitor with no units', async () => {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();
			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-tags'))
				.set(agent2.credentials)
				.query({ start: oneHourAgo, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('array');
			expect(body.data).to.have.lengthOf(0);
			expect(body.success).to.be.true;
		});
		it('should return the proper data when login as a manager', async () => {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();

			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-tags'))
				.set(credentials)
				.query({ start: oneHourAgo, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('array');
			expect(body.data).to.have.lengthOf.greaterThan(0);
			expect(body.data.every((item: { value: number }) => item.value >= 0)).to.be.true;
		});
	});
	describe('livechat/analytics/dashboards/conversations-by-agent', () => {
		it('should return an error when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-reports', []);
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-agent'))
				.set(credentials)
				.query({ start: 'test', end: 'test' })
				.expect(403);
		});
		it('should return an error when the start and end parameters are not provided', async () => {
			await restorePermissionToRoles('view-livechat-reports');
			await request.get(api('livechat/analytics/dashboards/conversations-by-agent')).set(credentials).expect(400);
		});
		it('should return an error when the start parameter is not provided', async () => {
			await request.get(api('livechat/analytics/dashboards/conversations-by-agent')).set(credentials).query({ end: 'test' }).expect(400);
		});
		it('should return an error when the end parameter is not provided', async () => {
			await request.get(api('livechat/analytics/dashboards/conversations-by-agent')).set(credentials).query({ start: 'test' }).expect(400);
		});
		it('should return an error when the start parameter is not a valid date', async () => {
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-agent'))
				.set(credentials)
				.query({ start: 'test', end: 'test' })
				.expect(400);
		});
		it('should return an error when the end parameter is not a valid date', async () => {
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-agent'))
				.set(credentials)
				.query({ start: '2020-01-01', end: 'test' })
				.expect(400);
		});
		it('should return an error if dates are more than 1 year apart', async () => {
			const oneYearAgo = new Date(Date.now() - 380 * 24 * 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();

			await request
				.get(api('livechat/analytics/dashboards/conversations-by-agent'))
				.set(credentials)
				.query({ start: oneYearAgo, end: now })
				.expect(400);
		});
		it('should return an error when start is after end', async () => {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();

			await request
				.get(api('livechat/analytics/dashboards/conversations-by-agent'))
				.set(credentials)
				.query({ start: now, end: oneHourAgo })
				.expect(400);
		});
		it('should return the proper data when the parameters are valid', async () => {
			// Note: this way all data will come as 0
			const now = new Date().toISOString();
			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-agent'))
				.set(credentials)
				.query({ start: now, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('array');
			expect(body.data).to.have.lengthOf(0);
		});
		it('should return empty set for a monitor with no units', async () => {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();
			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-agent'))
				.set(agent2.credentials)
				.query({ start: oneHourAgo, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('array');
			expect(body.data).to.have.lengthOf(0);
			expect(body.success).to.be.true;
		});
		it('should return the proper data when login as a manager', async () => {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();

			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-agent'))
				.set(credentials)
				.query({ start: oneHourAgo, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('array');
			expect(body.data).to.have.lengthOf.greaterThan(0);
			expect(body.data.every((item: { value: number }) => item.value >= 0)).to.be.true;
		});
	});
});
