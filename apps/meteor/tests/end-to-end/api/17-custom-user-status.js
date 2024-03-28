import { expect } from 'chai';
import { before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';

describe('[CustomUserStatus]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/custom-user-status.list]', () => {
		it('should return custom user status', (done) => {
			request
				.get(api('custom-user-status.list'))
				.set(credentials)
				.success()
				.expect((res) => {
					expect(res.body).to.have.property('statuses').and.to.be.an('array');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
		it('should return custom user status even requested with count and offset params', (done) => {
			request
				.get(api('custom-user-status.list'))
				.set(credentials)
				.success()
				.query({
					count: 5,
					offset: 0,
				})
				.expect((res) => {
					expect(res.body).to.have.property('statuses').and.to.be.an('array');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
	});
});
