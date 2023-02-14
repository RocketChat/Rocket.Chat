import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';

describe('[CustomSounds]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/custom-sounds.list]', () => {
		it('should return custom sounds', (done) => {
			request
				.get(api('custom-sounds.list'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('sounds').and.to.be.an('array');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
		it('should return custom sounds even requested with count and offset params', (done) => {
			request
				.get(api('custom-sounds.list'))
				.set(credentials)
				.expect(200)
				.query({
					count: 5,
					offset: 0,
				})
				.expect((res) => {
					expect(res.body).to.have.property('sounds').and.to.be.an('array');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
	});
});
