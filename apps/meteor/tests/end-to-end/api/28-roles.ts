import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';

describe('[Roles]', function () {
	this.retries(0);

	const isEnterprise = Boolean(process.env.IS_EE);

	before((done) => getCredentials(done));

	describe.skip('[/roles.create]', () => {
		const testRoleName = `role.test.${Date.now()}`;
		it('should throw an error when not running EE to create a role', async function () {
			// TODO this is not the right way to do it. We're doing this way for now just because we have separate CI jobs for EE and CE,
			// ideally we should have a single CI job that adds a license and runs both CE and EE tests.
			if (isEnterprise) {
				this.skip();
				return;
			}
			await request
				.post(api('roles.create'))
				.set(credentials)
				.send({
					name: testRoleName,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'This is an enterprise feature [error-action-not-allowed]');
					expect(res.body).to.have.property('errorType', 'error-action-not-allowed');
				});
		});

		it('should successfully create a role in EE', async function () {
			// TODO this is not the right way to do it. We're doing this way for now just because we have separate CI jobs for EE and CE,
			// ideally we should have a single CI job that adds a license and runs both CE and EE tests.
			if (!isEnterprise) {
				this.skip();
				return;
			}
			await request
				.post(api('roles.create'))
				.set(credentials)
				.send({
					name: testRoleName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('role');
					expect(res.body.role).to.have.property('name', testRoleName);
				});
		});
	});

	describe('[/roles.update]', () => {
		const testRoleName = `role.test.${Date.now()}`;
		const newTestRoleName = `role.test.updated.${Date.now()}`;
		let testRoleId = '';

		before('Create a new role with Users scope', async () => {
			if (!isEnterprise) {
				return;
			}

			await request
				.post(api('roles.create'))
				.set(credentials)
				.send({
					name: testRoleName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('role');
					expect(res.body.role).to.have.property('name', testRoleName);
					testRoleId = res.body.role._id;
				});
		});

		it('should throw an error when not running EE to update a role', async function () {
			// TODO this is not the right way to do it. We're doing this way for now just because we have separate CI jobs for EE and CE,
			// ideally we should have a single CI job that adds a license and runs both CE and EE tests.
			if (isEnterprise) {
				this.skip();
				return;
			}
			await request
				.post(api('roles.update'))
				.set(credentials)
				.send({
					name: testRoleName,
					roleId: testRoleId,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'This is an enterprise feature [error-action-not-allowed]');
					expect(res.body).to.have.property('errorType', 'error-action-not-allowed');
				});
		});

		it('should successfully update a role in EE', async function () {
			// TODO this is not the right way to do it. We're doing this way for now just because we have separate CI jobs for EE and CE,
			// ideally we should have a single CI job that adds a license and runs both CE and EE tests.
			if (!isEnterprise) {
				this.skip();
				return;
			}

			await request
				.post(api('roles.update'))
				.set(credentials)
				.send({
					name: newTestRoleName,
					roleId: testRoleId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('role');
					expect(res.body.role).to.have.property('name', newTestRoleName);
				});
		});
	});
});
