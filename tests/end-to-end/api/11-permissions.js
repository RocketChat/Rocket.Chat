/* eslint-env mocha */
/* globals expect */

import { getCredentials, api, request, credentials } from '../../data/api-data.js';

describe('[Permissions]', function() {
	this.retries(0);

	before(done => getCredentials(done));

	describe('[/permissions]', () => {
		it('should return all permissions that exists on the server, with respective roles', (done) => {
			request.get(api('permissions'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.be.a('array');

					const firstElement = res.body[0];
					expect(firstElement).to.have.property('_id');
					expect(firstElement).to.have.property('roles').and.to.be.a('array');
					expect(firstElement).to.have.property('_updatedAt');
				})
				.end(done);
		});
	});
});
