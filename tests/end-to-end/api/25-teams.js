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

		it('should create a team with a defined owner', (done) => {
			request.post(api('teams.create'))
				.set(credentials)
				.send({
					name: 'test-team',
					type: 0,
					owner: 'rocket.cat'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('team');
					expect(res.body).to.have.nested.property('team._id');
				})
				.then((response) => {
					const teamId = response.body.team._id;
					return request.get(api('teams.members'))
						.set(credentials)
						.query({ teamId })
						.expect(200)
						.expect((response) => {
							expect(response.body).to.have.property('success', true);
							expect(response.body).to.have.property('members');

							const member = response.body.members[0];
							expect(member.userId).to.be.equal('rocket.cat');
							expect(member.roles).to.have.length(1);
							expect(member.roles[0]).to.be.equal('owner');
						});
				})
				.then(() => done())
				.catch(done);
		})

		it('should throw an error if the team already exists', (done) => {
			request.post(api('teams.create'))
				.set(credentials)
				.send({
					name: 'community',
					type: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
					expect(res.body.error).to.be.equal('A team with name community already exists [error-duplicate-team-name]')
				})
				.end(done);
		})
	});
});
