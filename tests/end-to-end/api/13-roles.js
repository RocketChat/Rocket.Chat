/* eslint-env mocha */
/* globals expect */

import { getCredentials, api, request, credentials } from '../../data/api-data.js';

describe('[Roles]', function() {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('GET [/roles]', () => {
		it('should return all roles', (done) => {
			request.get(api('roles.list'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('roles').and.to.be.an('array');
				})
				.end(done);
		});
	});
});
