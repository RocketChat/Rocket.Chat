import type { Response } from 'supertest';
import { expect } from 'chai';

import { getCredentials, request, credentials } from '../../data/api-data.js';

describe('LDAP', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('/apps/isEnabled', () => {
		it('should fail if not logged in', function (done) {
			request
				.get('/api/apps/isEnabled')
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res: Response) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});
		it('should return if the app is enabled', function (done) {
			request
				.get('/api/apps/isEnabled')
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('enabled', true);
				})
				.end(done);
		});
	});
});
