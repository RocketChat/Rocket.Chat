/* eslint-env mocha */
/* globals expect */

import { getCredentials, api, request, credentials } from '../../data/api-data.js';

describe('[Messages]', function() {
	this.retries(0);

	before(done => getCredentials(done));

	describe('GET - /messages/types', () => {
		it('should return list of types of messages', (done) => {
			request.get(api('messages/types'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('result').and.to.be.a('array');
				})
				.end(done);
		});
	});
});
