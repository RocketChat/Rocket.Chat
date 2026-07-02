import type { Credentials } from '@rocket.chat/api-client';
import type { IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { password } from '../../data/user';
import { createUser, login, deleteUser } from '../../data/users.helper';

describe('[admin/users/behaviour-metrics]', () => {
	before((done) => getCredentials(done));

	let testUser: IUser;

	before(async () => {
		testUser = await createUser();
	});

	after(async () => {
		await deleteUser(testUser);
	});

	// Test 1: Admin can access the endpoint
	it('should return behaviour metrics for a valid user', async () => {
		await request
			.get(api('admin/users/behaviour-metrics'))
			.set(credentials)
			.query({ userId: testUser._id })
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res: Response) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('userId', testUser._id);
				expect(res.body).to.have.property('windowDays', 7);
				expect(res.body).to.have.property('accountAgeDays').and.to.be.a('number');
				expect(res.body).to.have.property('metrics').and.to.be.an('object');

				const { metrics } = res.body;
				expect(metrics).to.have.property('messagesSent').and.to.be.a('number');
				expect(metrics).to.have.property('messagesPerHour').and.to.be.a('number');
				expect(metrics).to.have.property('distinctRoomsMessaged').and.to.be.a('number');
				expect(metrics).to.have.property('dmRoomsMessaged').and.to.be.a('number');
				expect(metrics).to.have.property('urlMessages').and.to.be.a('number');
				expect(metrics).to.have.property('urlDensity').and.to.be.a('number');
			});
	});

	// Test 2: Normal user cannot access the endpoint
	it('should return 403 for non-admin user', async () => {
		const normalUser = await createUser();
		const normalUserCredentials: Credentials = await login(normalUser.username, password);

		try {
			await request
				.get(api('admin/users/behaviour-metrics'))
				.set(normalUserCredentials)
				.query({ userId: testUser._id })
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		} finally {
			await deleteUser(normalUser);
		}
	});

	// Test 3: Invalid days value is rejected
	it('should return 400 for invalid days value', async () => {
		await request
			.get(api('admin/users/behaviour-metrics'))
			.set(credentials)
			.query({ userId: testUser._id, days: 14 })
			.expect('Content-Type', 'application/json')
			.expect(400)
			.expect((res: Response) => {
				expect(res.body).to.have.property('success', false);
			});
	});

	// Test 4: Missing userId is rejected
	it('should return 400 when userId is missing', async () => {
		await request
			.get(api('admin/users/behaviour-metrics'))
			.set(credentials)
			.query({ days: 7 })
			.expect('Content-Type', 'application/json')
			.expect(400)
			.expect((res: Response) => {
				expect(res.body).to.have.property('success', false);
			});
	});

	// Test 5: Zero-message user returns safe defaults (no NaN/Infinity)
	it('should return zero metrics for a user with no messages', async () => {
		const freshUser = await createUser();

		try {
			await request
				.get(api('admin/users/behaviour-metrics'))
				.set(credentials)
				.query({ userId: freshUser._id })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('userId', freshUser._id);
					expect(res.body).to.have.property('windowDays', 7);
					expect(res.body).to.have.property('accountAgeDays').and.to.be.a('number');
					expect(res.body).to.have.property('metrics').and.to.be.an('object');

					const { metrics } = res.body;
					expect(metrics.messagesSent).to.equal(0);
					expect(metrics.messagesPerHour).to.equal(0);
					expect(metrics.distinctRoomsMessaged).to.equal(0);
					expect(metrics.dmRoomsMessaged).to.equal(0);
					expect(metrics.urlMessages).to.equal(0);
					expect(metrics.urlDensity).to.equal(0);

					// Verify no NaN or Infinity values
					Object.values(metrics).forEach((value) => {
						expect(Number.isFinite(value)).to.equal(true);
					});
				});
		} finally {
			await deleteUser(freshUser);
		}
	});

	// Test 6: days=1 is no longer allowed
	it('should return 400 for days=1', async () => {
		await request
			.get(api('admin/users/behaviour-metrics'))
			.set(credentials)
			.query({ userId: testUser._id, days: 1 })
			.expect('Content-Type', 'application/json')
			.expect(400)
			.expect((res: Response) => {
				expect(res.body).to.have.property('success', false);
			});
	});

	// Test 7: Metrics are calculated correctly
	describe('metrics calculation', () => {
		let metricsUser: IUser;
		let metricsUserCredentials: Credentials;

		before(async () => {
			metricsUser = await createUser();
			metricsUserCredentials = await login(metricsUser.username, password);
		});

		after(async () => {
			await deleteUser(metricsUser);
		});

		it('should correctly calculate message metrics', async () => {
			// Send some messages as the test user to the GENERAL channel
			const messagesToSend = [
				{ msg: 'Test behaviour metric message 1' },
				{ msg: 'Test behaviour metric message 2' },
				{ msg: 'Check out https://example.com for more info' },
			];

			for (const message of messagesToSend) {
				await request
					.post(api('chat.sendMessage'))
					.set(metricsUserCredentials)
					.send({
						message: {
							rid: 'GENERAL',
							...message,
						},
					})
					.expect(200);
			}

			// Now fetch behaviour metrics for the user (using days=7, the default)
			await request
				.get(api('admin/users/behaviour-metrics'))
				.set(credentials)
				.query({ userId: metricsUser._id, days: 7 })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('userId', metricsUser._id);
					expect(res.body).to.have.property('windowDays', 7);

					const { metrics } = res.body;
					// The user sent at least 3 messages
					expect(metrics.messagesSent).to.be.at.least(3);
					// messagesPerHour should be > 0
					expect(metrics.messagesPerHour).to.be.greaterThan(0);
					// At least 1 distinct room (GENERAL)
					expect(metrics.distinctRoomsMessaged).to.be.at.least(1);
					// At least 1 message with a URL
					expect(metrics.urlMessages).to.be.at.least(1);
					// urlDensity should be > 0 and <= 1
					expect(metrics.urlDensity).to.be.greaterThan(0);
					expect(metrics.urlDensity).to.be.at.most(1);

					// Verify all metrics are finite numbers
					Object.values(metrics).forEach((value) => {
						expect(Number.isFinite(value)).to.equal(true);
					});
				});
		});
	});
});
