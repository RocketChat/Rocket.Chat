/* eslint-env mocha */
/* globals expect */

import {getCredentials, api, request, credentials } from '../../data/api-data.js';

describe('[Spotlight]', function() {
	this.retries(0);

	before(done => getCredentials(done));

	describe('[/spotlight]', () => {
		it('should fail when does not have query param', (done) => {
			request.get(api('spotlight'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				})
				.end(done);
		});

		it('should return objects for a valid query param', (done) => {
			request.get(api('spotlight'))
				.query({
					query: 'foobar'
				})
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('users').that.have.lengthOf(0);
					expect(res.body).to.have.property('rooms').that.have.lengthOf(0);
				})
				.end(done);
		});
	});
});
