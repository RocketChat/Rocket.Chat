import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data';

// test for the /moderation.history endpoint

describe('[Moderation]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/moderation.history]', () => {
		it('should return an array of reports', (done) => {
			request
				.get(api('moderation.history'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('reports').and.to.be.an('array');
				})
				.end(done);
		});

		it('should return an array of reports even requested with count and offset params', (done) => {
			request
				.get(api('moderation.history'))
				.set(credentials)
				.query({
					count: 5,
					offset: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('reports').and.to.be.an('array');
				})
				.end(done);
		});

		it('should return an array of reports even requested with oldest param', (done) => {
			request
				.get(api('moderation.history'))
				.set(credentials)
				.query({
					oldest: new Date(),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('reports').and.to.be.an('array');
				})
				.end(done);
		});

		it('should return an array of reports even requested with latest param', (done) => {
			request
				.get(api('moderation.history'))
				.set(credentials)
				.query({
					latest: new Date(),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('reports').and.to.be.an('array');
				})
				.end(done);
		});
	});
});
