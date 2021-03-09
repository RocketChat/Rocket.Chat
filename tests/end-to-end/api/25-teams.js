import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data';

describe('[Teams]', () => {
	before((done) => getCredentials(done));

	describe('/teams.create', () => {
		it('should create a public team', (done) => {
			request.post(api('teams.create'))
				.set(credentials)
				.send({
					name: 'community',
					type: 0,
					room: {
						readonly: false,
						members: credentials['X-User-Id'],
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('team');
					expect(res.body).to.have.nested.property('team._id');
				})
				.end(done);
		});
	});
});
