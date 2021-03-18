import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { updatePermission } from '../../data/permissions.helper.js';

describe('[Teams]', () => {
	before((done) => getCredentials(done));

	const community = `community${ Date.now() }`;
	let publicTeam = null;
	let privateTeam = null;
	let publicRoom = null;
	let publicRoom2 = null;
	let privateRoom = null;
	let testUser;
	let testUser2;

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
					publicTeam = res.body.team;
				})
				.end(done);
		});

		it('should create private team with a defined owner', (done) => {
			request.post(api('teams.create'))
				.set(credentials)
				.send({
					name: `test-team-${ Date.now() }`,
					type: 1,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('team');
					expect(res.body).to.have.nested.property('team._id');
					privateTeam = res.body.team;
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
							expect(member).to.have.property('user');
							expect(member).to.have.property('roles');
							expect(member).to.have.property('createdBy');
							expect(member).to.have.property('createdAt');
							expect(member.user).to.have.property('_id');
							expect(member.user).to.have.property('username');
							expect(member.user).to.have.property('name');
							expect(member.user).to.have.property('status');
							expect(member.createdBy).to.have.property('_id');
							expect(member.createdBy).to.have.property('username');
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

	describe('/teams.addRoom', () => {
		before('create private channel', (done) => {
			const channelName = `community-channel-private${ Date.now() }`;
			request.post(api('groups.create'))
				.set(credentials)
				.send({
					name: channelName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');
					expect(res.body).to.have.nested.property('group.name', channelName);
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.nested.property('group.msgs', 0);
					privateRoom = res.body.group;
				})
				.end(done);
		});
		before('create public channel', (done) => {
			const channelName = `community-channel-public${ Date.now() }`;
			request.post(api('channels.create'))
				.set(credentials)
				.send({
					name: channelName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel._id');
					expect(res.body).to.have.nested.property('channel.name', channelName);
					expect(res.body).to.have.nested.property('channel.t', 'c');
					expect(res.body).to.have.nested.property('channel.msgs', 0);
					publicRoom = res.body.channel;
				})
				.end(done);
		});
		before('create another public channel', (done) => {
			const channelName = `community-channel-public${ Date.now() }`;
			request.post(api('channels.create'))
				.set(credentials)
				.send({
					name: `${ channelName }2`,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel._id');
					expect(res.body).to.have.nested.property('channel.name', `${ channelName }2`);
					expect(res.body).to.have.nested.property('channel.t', 'c');
					expect(res.body).to.have.nested.property('channel.msgs', 0);
					publicRoom2 = res.body.channel;
				})
				.end(done);
		});

		it('should throw an error if no permission', (done) => {
			updatePermission('add-team-channel', []).then(() => {
				request.post(api('teams.addRoom'))
					.set(credentials)
					.send({
						roomId: publicRoom._id,
						teamId: publicTeam._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
						expect(res.body.error).to.be.equal('unauthorized');
					})
					.end(done);
			});
		});

		it('should add public room to team', (done) => {
			updatePermission('add-team-channel', ['admin']).then(() => {
				request.post(api('teams.addRoom'))
					.set(credentials)
					.send({
						roomId: publicRoom._id,
						teamId: publicTeam._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('room');
						expect(res.body.room).to.have.property('teamId', publicTeam._id);
						expect(res.body.room).to.have.property('teamDefault', false);
					})
					.end(done);
			});
		});

		it('should add another public room to private team', (done) => {
			updatePermission('add-team-channel', ['admin']).then(() => {
				request.post(api('teams.addRoom'))
					.set(credentials)
					.send({
						roomId: publicRoom2._id,
						teamId: privateTeam._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('room');
						expect(res.body.room).to.have.property('teamId', privateTeam._id);
						expect(res.body.room).to.have.property('teamDefault', false);
					})
					.end(done);
			});
		});

		it('should add private room to team', (done) => {
			updatePermission('add-team-channel', ['admin']).then(() => {
				request.post(api('teams.addRoom'))
					.set(credentials)
					.send({
						roomId: privateRoom._id,
						teamId: publicTeam._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('room');
						expect(res.body.room).to.have.property('teamId', publicTeam._id);
						expect(res.body.room).to.have.property('teamDefault', false);
					})
					.end(done);
			});
		});
	});

	describe('/teams.updateRoom', () => {
		it('should throw an error if no permission', (done) => {
			updatePermission('edit-team-channel', []).then(() => {
				request.post(api('teams.updateRoom'))
					.set(credentials)
					.send({
						roomId: publicRoom._id,
						isDefault: true,
					})
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
						expect(res.body.error).to.be.equal('unauthorized');
					})
					.end(done);
			});
		});

		it('should set room to team default', (done) => {
			updatePermission('edit-team-channel', ['admin']).then(() => {
				request.post(api('teams.updateRoom'))
					.set(credentials)
					.send({
						roomId: publicRoom._id,
						isDefault: true,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('room');
						expect(res.body.room).to.have.property('teamId', publicTeam._id);
						expect(res.body.room).to.have.property('teamDefault', true);
					})
					.end(done);
			});
		});
	});

	describe('/teams.listRooms', () => {
		let testUser;
		let testUserCredentials;
		before('Create test user', (done) => {
			const username = `user.test.${ Date.now() }`;
			const email = `${ username }@rocket.chat`;
			request.post(api('users.create'))
				.set(credentials)
				.send({ email, name: username, username, password: username })
				.end((err, res) => {
					testUser = res.body.user;
					done();
				});
		});
		before('Login as test user', (done) => {
			request.post(api('login'))
				.send({
					user: testUser.username,
					password: testUser.username,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					testUserCredentials = {};
					testUserCredentials['X-Auth-Token'] = res.body.data.authToken;
					testUserCredentials['X-User-Id'] = res.body.data.userId;
				})
				.end(done);
		});
		it('should throw an error if team is private and no permission', (done) => {
			updatePermission('view-all-teams', []).then(() => {
				request.get(api('teams.listRooms'))
					.set(testUserCredentials)
					.query({
						teamId: privateTeam._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
						expect(res.body.error).to.be.equal('user-not-on-private-team');
					})
					.end(done);
			});
		});

		it('should return only public rooms for public team', (done) => {
			updatePermission('view-all-team-channels', []).then(() => {
				request.get(api('teams.listRooms'))
					.set(credentials)
					.query({
						teamId: publicTeam._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('rooms');
						expect(res.body.rooms).to.be.an('array');
						expect(res.body.rooms.length).to.equal(2);
					})
					.end(done);
			});
		});

		it('should return all rooms for public team', (done) => {
			updatePermission('view-all-team-channels', ['admin']).then(() => {
				request.get(api('teams.listRooms'))
					.set(credentials)
					.query({
						teamId: publicTeam._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('rooms');
						expect(res.body.rooms).to.be.an('array');
						expect(res.body.rooms.length).to.equal(2);
					})
					.end(done);
			});
		});

		it('should return public rooms for private team', (done) => {
			updatePermission('view-all-team-channels', []).then(() => {
				updatePermission('view-all-teams', ['admin']).then(() => {
					request.get(api('teams.listRooms'))
						.set(credentials)
						.query({
							teamId: privateTeam._id,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('rooms');
							expect(res.body.rooms).to.be.an('array');
							expect(res.body.rooms.length).to.equal(1);
						})
						.end(done);
				});
			});
		});
	});

	describe('/teams.removeRoom', () => {
		it('should throw an error if no permission', (done) => {
			updatePermission('remove-team-channel', []).then(() => {
				request.post(api('teams.removeRoom'))
					.set(credentials)
					.send({
						roomId: publicRoom._id,
						teamId: publicTeam._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
						expect(res.body.error).to.be.equal('unauthorized');
					})
					.end(done);
			});
		});

		it('should remove room from team', (done) => {
			updatePermission('remove-team-channel', ['admin']).then(() => {
				request.post(api('teams.removeRoom'))
					.set(credentials)
					.send({
						roomId: publicRoom._id,
						teamId: publicTeam._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('room');
						expect(res.body.room).to.not.have.property('teamId');
						expect(res.body.room).to.not.have.property('teamDefault');
					})
					.end(done);
			});
		});
	});

	describe('/teams.addMembers', () => {
		before('Create test users', (done) => {
			let username = `user.test.${ Date.now() }`;
			let email = `${ username }@rocket.chat`;
			request.post(api('users.create'))
				.set(credentials)
				.send({ email, name: username, username, password: username })
				.end((err, res) => {
					testUser = res.body.user;
				});
			username = `user.test.${ Date.now() }`;
			email = `${ username }@rocket.chat`;
			request.post(api('users.create'))
				.set(credentials)
				.send({ email, name: username, username, password: username })
				.end((err, res) => {
					testUser2 = res.body.user;
					done();
				});
		});
		
		it('should add members to a public team', (done) => {
			request.post(api('teams.addMembers'))
				.set(credentials)
				.send({
					teamName: community,
					members: [
						{
							userId: testUser._id,
							roles: ['member'],
						},
						{
							userId: testUser2._id,
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
							expect(response.body.members[1]).to.have.property('user');
							expect(response.body.members[1]).to.have.property('roles');
							expect(response.body.members[1]).to.have.property('createdBy');
							expect(response.body.members[1]).to.have.property('createdAt');
							expect(response.body.members[1].user).to.have.property('_id', testUser._id);
							expect(response.body.members[1].roles).to.have.length(1);
							expect(response.body.members[1].roles).to.eql(['member']);
							expect(response.body.members[2].user).to.have.property('_id', testUser2._id);
							expect(response.body.members[2].roles).to.have.length(1);
							expect(response.body.members[2].roles).to.eql(['member']);
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
					expect(res.body).to.have.property('count', 3);
					expect(res.body).to.have.property('offset', 0);
					expect(res.body).to.have.property('total', 3);
					expect(res.body).to.have.property('members');
					expect(res.body.members).to.have.length(3);
					expect(res.body.members[0]).to.have.property('user');
					expect(res.body.members[0]).to.have.property('roles');
					expect(res.body.members[0]).to.have.property('createdBy');
					expect(res.body.members[0]).to.have.property('createdAt');
					expect(res.body.members[0].user).to.have.property('_id');
					expect(res.body.members[0].user).to.have.property('username');
					expect(res.body.members[0].user).to.have.property('name');
					expect(res.body.members[0].user).to.have.property('status');
					expect(res.body.members[0].createdBy).to.have.property('_id');
					expect(res.body.members[0].createdBy).to.have.property('username');
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
							userId: testUser._id,
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
							expect(response.body.members[1].user._id).to.eql(testUser._id);
							expect(response.body.members[1].user.username).to.eql(testUser.username);
							expect(response.body.members[1].user.name).to.eql(testUser.name);
							expect(response.body.members[1].roles).to.have.length(2);
							expect(response.body.members[1].roles).to.eql(['member', 'owner']);
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
					members: [
						{
							userId: testUser._id,
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
							expect(response.body.members).to.have.length(2);
							expect(response.body.members[1].user._id).to.eql(testUser2._id);
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
				.end(done);
		});
	});
});
