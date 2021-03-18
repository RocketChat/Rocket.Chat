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
					owner: 'rocket.cat',
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
					.set(credentials)
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
					.set(testUserCredentials)
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
						expect(res.body.rooms.length).to.equal(3);
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
		it('should add members to a public team', (done) => {
			request.post(api('teams.addMembers'))
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
							expect(response.body.members).to.have.lengthOf(3);
							expect(response.body.members[1].userId).to.eql('test-123');
							expect(response.body.members[1].roles).to.have.lengthOf(1);
							expect(response.body.members[1].roles).to.eql(['member']);
							expect(response.body.members[2].userId).to.eql('test-456');
							expect(response.body.members[2].roles).to.have.lengthOf(1);
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
					expect(res.body.members[0]).to.have.property('_id');
					expect(res.body.members[0]).to.have.property('roles');
					expect(res.body.members[0]).to.have.property('createdAt');
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
							expect(response.body.members[1].userId).to.eql('test-123');
							expect(response.body.members[1].roles).to.have.lengthOf(2);
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
							userId: 'test-456',
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
							expect(response.body.members).to.have.lengthOf(2);
							expect(response.body.members[1].userId).to.eql('test-123');
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
							expect(response.body.members).to.have.lengthOf(1);
							expect(response.body.members[0].userId).to.eql('test-123');
						}),
				)
				.then(() => done())
				.catch(done);
		});
	});

	describe('/teams.delete', () => {
		describe('deleting an empty team', () => {
			let roomId;
			let teamId;
			const tempTeamName = `temporaryTeam-${ Date.now() }`;

			before('create team', (done) => {
				request.post(api('teams.create'))
					.set(credentials)
					.send({
						name: tempTeamName,
						type: 0,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((resp) => {
						expect(resp.body).to.have.property('success', true);
						expect(resp.body).to.have.property('team');
						expect(resp.body.team).to.have.property('name', tempTeamName);
						expect(resp.body.team).to.have.property('_id');
						expect(resp.body.team).to.have.property('roomId');

						teamId = resp.body.team._id;
						roomId = resp.body.team.roomId;
					})
					.then(() => done());
			});

			it('should delete the team and the main room', (done) => {
				request.post(api('teams.delete'))
					.set(credentials)
					.send({
						teamName: tempTeamName,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.then(() =>
						request.get(api('teams.info'))
							.set(credentials)
							.query({
								teamName: tempTeamName,
							})
							.expect('Content-Type', 'application/json')
							.expect(400)
							.expect((response) => {
								expect(response.body).to.have.property('success', false);
								expect(response.body).to.have.property('error');
								expect(response.body.error).to.be.equal('Team not found');
							})
							.then(() => {
								request.get(api('channels.info'))
									.set(credentials)
									.query({
										roomId,
									})
									.expect('Content-Type', 'application/json')
									.expect(400)
									.expect((response) => {
										expect(response.body).to.have.property('success', false);
										expect(response.body).to.have.property('error');
										expect(response.body.error).to.include('[error-room-not-found]');
									})
									.then(() => done())
							})
					)
					.catch(done);
			});
		});

		describe('delete team with two rooms', () => {
			const tempTeamName = `temporaryTeam-${ Date.now() }`;
			const channel1Name = `${ tempTeamName }-channel1`;
			const channel2Name = `${ tempTeamName }-channel2`;
			let teamId;
			let channel1Id;
			let channel2Id;

			before('create team', (done) => {
				request.post(api('teams.create'))
					.set(credentials)
					.send({
						name: tempTeamName,
						type: 0,
					})
					.then((response) => {
						teamId = response.body.team._id;
					})
					.then(() => done());
			});

			before('create channel 1', (done) => {
				request.post(api('channels.create'))
					.set(credentials)
					.send({
						name: channel1Name,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						channel1Id = res.body.channel._id;
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.nested.property('channel._id');
						expect(res.body).to.have.nested.property('channel.name', channel1Name);
						expect(res.body).to.have.nested.property('channel.t', 'c');
						expect(res.body).to.have.nested.property('channel.msgs', 0);
					})
					.then(() => done());
			});

			before('add channel 1 to team', (done) => {
				request.post(api('teams.addRoom'))
					.set(credentials)
					.send({
						roomId: channel1Id,
						teamId,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('room');
						expect(res.body.room).to.have.property('teamId', teamId);
						expect(res.body.room).to.have.property('teamDefault', false);
					})
					.then(() => done());
			});

			before('create channel 2', (done) => {
				request.post(api('channels.create'))
					.set(credentials)
					.send({
						name: channel2Name,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						channel2Id = res.body.channel._id;
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.nested.property('channel._id');
						expect(res.body).to.have.nested.property('channel.name', channel2Name);
						expect(res.body).to.have.nested.property('channel.t', 'c');
						expect(res.body).to.have.nested.property('channel.msgs', 0);
					})
					.then(() => done());
			});

			before('add channel 2 to team', (done) => {
				request.post(api('teams.addRoom'))
					.set(credentials)
					.send({
						roomId: channel2Id,
						teamId,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('room');
						expect(res.body.room).to.have.property('teamId', teamId);
						expect(res.body.room).to.have.property('teamDefault', false);
					})
					.then(() => done());
			});

			it('should delete the specified room and move the other back to the workspace', (done) => {
				request.post(api('teams.delete'))
					.set(credentials)
					.send({
						teamName: tempTeamName,
						roomsToRemove: [channel2Id]
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.then(() => {
						request.get(api('channels.info'))
							.set(credentials)
							.query({
								roomId: channel2Id,
							})
							.expect('Content-Type', 'application/json')
							.expect(400)
							.expect((response) => {
								expect(response.body).to.have.property('success', false);
								expect(response.body).to.have.property('error');
								expect(response.body.error).to.include('[error-room-not-found]');
							})
							.then(() => {
								request.get(api('channels.info'))
									.set(credentials)
									.query({
										roomId: channel1Id,
									})
									.expect('Content-Type', 'application/json')
									.expect(200)
									.expect((response) => {
										expect(response.body).to.have.property('success', true);
										expect(response.body).to.have.property('channel');
										expect(response.body.channel).to.have.property('_id', channel1Id);
										expect(response.body.channel).to.not.have.property('teamId');
									})
									.then(() => done())
							})
					})
					.catch(done);
			})
		});
	});
});
