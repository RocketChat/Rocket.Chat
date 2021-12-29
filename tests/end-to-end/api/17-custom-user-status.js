import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';

describe('[CustomUserStatus]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/custom-user-status.list]', () => {
		it('should return custom user status', (done) => {
			request
				.get(api('custom-user-status.list'))
				.set(credentials)
				.expect(200)
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
