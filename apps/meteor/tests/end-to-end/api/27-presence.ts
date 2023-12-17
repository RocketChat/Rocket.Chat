import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';
import { updatePermission } from '../../data/permissions.helper';
import { password } from '../../data/user';
import { createUser, login } from '../../data/users.helper';

describe('[Presence]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	let unauthorizedUserCredentials: any;
	before(async () => {
		const createdUser = await createUser();
		unauthorizedUserCredentials = await login(createdUser.username, password);
	});

	describe('[/presence.getConnections]', () => {
		it('should throw an error if not authenticated', async () => {
			await request
				.get(api('presence.getConnections'))
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res: Response) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				});
		});

		it('should throw an error if user is unauthorized', async () => {
			await request
				.get(api('presence.getConnections'))
				.set(unauthorizedUserCredentials)
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				});
		});

		it("should throw an error if doesn't have required permission", async () => {
			await updatePermission('manage-user-status', []);

			await request
				.get(api('presence.getConnections'))
				.set(unauthorizedUserCredentials)
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				});

			await updatePermission('manage-user-status', ['admin']);
		});

		it('should return current and max connections of 200', async () => {
			await request
				.get(api('presence.getConnections'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('current').to.be.a('number');
					expect(res.body).to.have.property('max').to.be.a('number').and.to.be.equal(200);
				});
		});
	});

	describe('[/presence.enableBroadcast]', () => {
		it('should throw an error if not authenticated', async () => {
			await request
				.post(api('presence.enableBroadcast'))
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res: Response) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				});
		});

		it('should throw an error if user is unauthorized', async () => {
			await request
				.post(api('presence.enableBroadcast'))
				.set(unauthorizedUserCredentials)
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				});
		});

		it("should throw an error if doesn't have required permission", async () => {
			await updatePermission('manage-user-status', []);

			await request
				.post(api('presence.enableBroadcast'))
				.set(unauthorizedUserCredentials)
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				});

			await updatePermission('manage-user-status', ['admin']);
		});

		it('should return success', async () => {
			await request
				.post(api('presence.enableBroadcast'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});
		});
	});

	// describe('[/presence.enableBroadcast]', () => {});
});
