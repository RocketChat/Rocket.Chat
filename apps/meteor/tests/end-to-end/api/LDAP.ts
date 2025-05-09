import { expect } from 'chai';
import { before, after, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { updatePermission } from '../../data/permissions.helper';

describe('LDAP', function () {
	this.retries(0);
	before((done) => getCredentials(done));

	describe('[/ldap.syncNow]', () => {
		it('should throw an error containing totp-required error when not running EE', async function () {
			// TODO this is not the right way to do it. We're doing this way for now just because we have separate CI jobs for EE and CE,
			// ideally we should have a single CI job that adds a license and runs both CE and EE tests.
			if (process.env.IS_EE) {
				this.skip();
				return;
			}
			await request
				.post(api('ldap.syncNow'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'totp-required');
				});
		});

		it('should throw an error of LDAP disabled when running EE', async function () {
			if (!process.env.IS_EE) {
				this.skip();
				return;
			}
			await request
				.post(api('ldap.syncNow'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'LDAP_disabled');
				});
		});
	});

	describe('[/ldap.testSearch]', () => {
		before(async () => {
			return updatePermission('test-admin-options', ['admin']);
		});

		after(async () => {
			return updatePermission('test-admin-options', ['admin']);
		});

		it('should not allow testing LDAP search if user does NOT have the test-admin-options permission', async () => {
			await updatePermission('test-admin-options', []);
			await request
				.post(api('ldap.testSearch'))
				.set(credentials)
				.send({
					username: 'test-search',
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
				});
		});
	});

	describe('[/ldap.testConnection]', () => {
		before(async () => {
			return updatePermission('test-admin-options', ['admin']);
		});

		after(async () => {
			return updatePermission('test-admin-options', ['admin']);
		});

		it('should not allow testing LDAP connection if user does NOT have the test-admin-options permission', async () => {
			await updatePermission('test-admin-options', []);
			await request
				.post(api('ldap.testConnection'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
				});
		});
	});
});
