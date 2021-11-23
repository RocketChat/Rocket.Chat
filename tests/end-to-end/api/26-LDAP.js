import { expect } from 'chai';

import { getCredentials, api, request } from '../../data/api-data.js';

describe('LDAP', function() {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/ldap.syncNow]', () => {
		it('should throw an error containing totp-required error ', (done) => {
			request.post(api('ldap.syncNow'))
				.send({})
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'totp-required');
				})
				.end(done);
		});
	});
});
