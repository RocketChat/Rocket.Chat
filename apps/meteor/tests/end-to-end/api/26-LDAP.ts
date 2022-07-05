import { expect } from 'chai';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';

describe('LDAP', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/ldap.syncNow]', () => {
		it('should throw an error containing totp-required error ', (done) => {
			request
				.post(api('ldap.syncNow'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'totp-required');
				})
				.end(done);
		});
	});
});
