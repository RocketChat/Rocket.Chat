import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';

describe('[Webdav]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/webdav.getMyAccounts]', () => {
		it('should return my webdav accounts', (done) => {
			request
				.get(api('webdav.getMyAccounts'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('accounts').and.to.be.a('array');
				})
				.end(done);
		});
	});
});
