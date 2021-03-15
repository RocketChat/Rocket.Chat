import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data';

describe('[Teams]', () => {
	before((done) => getCredentials(done));

	const community = `community${ Date.now() }`;

	describe('/teams.create', () => {
		it('should create a public team', (done) => {
			request.post(api('teams.create'))
				.set(credentials)
				.send({
					name: community,
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
					name: `test-team-${ Date.now() }`,
					type: 0,
					owner: 'rocket.cat',
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
						.expect('Content-Type', 'application/json')
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
		});

		it('should throw an error if the team already exists', (done) => {
			request.post(api('teams.create'))
				.set(credentials)
				.send({
					name: community,
					type: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
					expect(res.body.error).to.be.equal('team-name-already-exists');
				})
				.end(done);
		});
	});

	describe('/teams.addMembers', () => {
		it('should add members to a public team', (done) => {
			request.post(api('teams.create'))
				.set(credentials)
				.send({
					teamName: community,
					members: [
						{
							userId: 'test-123',
							roles: ['member'],
						},
						{
							userId: 'test-456',
							roles: ['member'],
						},
					],
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.then(() =>
					request.get(api('teams.members'))
						.set(credentials)
						.query({
							teamName: community,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((response) => {
							expect(response.body).to.have.property('success', true);
							expect(response.body).to.have.property('members');
							expect(response.body.members).to.have.length(3);

							const firstMember = response.body.members[1];
							expect(firstMember.userId).to.be.equal('test-123');
							expect(firstMember.roles).to.have.length(1);
							expect(firstMember.roles[0]).to.be.equal('member');

							const secondMember = response.body.members[1];
							expect(secondMember.userId).to.be.equal('test-456');
							expect(secondMember.roles).to.have.length(1);
							expect(secondMember.roles[0]).to.be.equal('member');
						}),
				)
				.then(() => done())
				.catch(done);
		});
	});

	describe('/teams.members', () => {
		it('should list all the members from a public team', (done) => {
			request.get(api('teams.members'))
				.set(credentials)
				.query({
					teamName: community,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count', 2);
					expect(res.body).to.have.property('offset', 0);
					expect(res.body).to.have.property('total', 2);
					expect(res.body).to.have.property('members');
					expect(res.body).to.have.nested.property('user');
					expect(res.body).to.have.nested.property('createdBy');
					expect(res.body).to.have.nested.property('roles');
					expect(res.body).to.have.nested.property('createdAt');
				})
				.end(done);
		});
	});

	describe('/teams.updateMember', () => {
		it('should update member\'s data in a public team', (done) => {
			request.post(api('teams.updateMember'))
				.set(credentials)
				.send({
					teamName: community,
					member:
						{
							userId: 'test-123',
							roles: ['member', 'owner'],
						},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.then(() =>
					request.get(api('teams.members'))
						.set(credentials)
						.query({
							teamName: community,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((response) => {
							expect(response.body).to.have.property('success', true);
							expect(response.body).to.have.property('members');
							expect(response.body.members).to.have.length(3);

							const firstMember = response.body.members[1];
							expect(firstMember.userId).to.be.equal('test-123');
							expect(firstMember.roles).to.have.length(2);
							expect(firstMember.roles[0]).to.be.equal('member');
							expect(firstMember.roles[1]).to.be.equal('owner');
						}),
				)
				.then(() => done())
				.catch(done);
		});
	});

	describe('/teams.removeMembers', () => {
		it('should remove one member from a public team', (done) => {
			request.post(api('teams.removeMembers'))
				.set(credentials)
				.send({
					teamName: community,
					member:
						{
							userId: 'test-456',
						},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.then(() =>
					request.get(api('teams.members'))
						.set(credentials)
						.query({
							teamName: community,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((response) => {
							expect(response.body).to.have.property('success', true);
							expect(response.body).to.have.property('members');
							expect(response.body.members).to.have.length(2);

							const firstMember = response.body.members[1];
							expect(firstMember.userId).to.be.equal('test-123');
						}),
				)
				.then(() => done())
				.catch(done);
		});
	});

	describe('/teams.leave', () => {
		it('should remove the calling user from the team', (done) => {
			request.post(api('teams.leave'))
				.set(credentials)
				.send({
					teamName: community,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.then(() =>
					request.get(api('teams.members'))
						.set(credentials)
						.query({
							teamName: community,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((response) => {
							expect(response.body).to.have.property('success', true);
							expect(response.body).to.have.property('members');
							expect(response.body.members).to.have.length(1);

							const firstMember = response.body.members[0];
							expect(firstMember.userId).to.be.equal('test-123');
						}),
				)
				.then(() => done())
				.catch(done);
		});
	});
});
