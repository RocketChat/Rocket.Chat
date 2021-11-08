import { expect } from 'chai';

import { getCredentials, api, request, credentials, methodCall } from '../../data/api-data';
import { updatePermission } from '../../data/permissions.helper.js';
import { createUser, login } from '../../data/users.helper';
import { password } from '../../data/user';

describe('[Teams]', () => {
	before((done) => getCredentials(done));

	const community = `community${ Date.now() }`;
	let publicTeam = null;
	let privateTeam = null;
	let publicRoom = null;
	let publicRoom2 = null;
	let privateRoom = null;
	let privateRoom2 = null;
	let testUser;
	let testUser2;
	const testUserCredentials = {};

	before('Create test users', (done) => {
		let username = `user.test.${ Date.now() }`;
		let email = `${ username }@rocket.chat`;
		request.post(api('users.create'))
			.set(credentials)
			.send({ email, name: username, username, password: username, roles: ['user'] })
			.then((res) => {
				testUser = res.body.user;

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
	});

	before('login testUser', (done) => {
		request.post(api('login'))
			.send({
				user: testUser.username,
				password: testUser.username,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				testUserCredentials['X-Auth-Token'] = res.body.data.authToken;
				testUserCredentials['X-User-Id'] = res.body.data.userId;
			})
			.end(done);
	});

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

	describe('/teams.convertToChannel', () => {
		let testTeam;
		let channelToEraseId;
		let channelToKeepId;
		const teamName = `test-team-convert-to-channel-${ Date.now() }`;
		const channelToEraseName = `${ teamName }-channelToErase`;
		const channelToKeepName = `${ teamName }-channelToKeep`;
		before('Create test team', (done) => {
			request.post(api('teams.create'))
				.set(credentials)
				.send({
					name: teamName,
					type: 1,
				})
				.end((err, res) => {
					testTeam = res.body.team;
					done();
				});
		});

		before('create channel (to erase after its team is converted to a channel)', (done) => {
			request.post(api('channels.create'))
				.set(credentials)
				.send({
					name: channelToEraseName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					channelToEraseId = res.body.channel._id;
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel._id');
					expect(res.body).to.have.nested.property('channel.name', channelToEraseName);
					expect(res.body).to.have.nested.property('channel.t', 'c');
					expect(res.body).to.have.nested.property('channel.msgs', 0);
				})
				.then(() => done());
		});

		before('add first channel to team', (done) => {
			request.post(api('teams.addRooms'))
				.set(credentials)
				.send({
					rooms: [channelToEraseId],
					teamId: testTeam._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('rooms');
					expect(res.body.rooms[0]).to.have.property('teamId', testTeam._id);
					expect(res.body.rooms[0]).to.not.have.property('teamDefault');
				})
				.then(() => done())
				.catch(done);
		});

		before('create channel (to keep after its team is converted to a channel)', (done) => {
			request.post(api('channels.create'))
				.set(credentials)
				.send({
					name: channelToKeepName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					channelToKeepId = res.body.channel._id;
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel._id');
					expect(res.body).to.have.nested.property('channel.name', channelToKeepName);
					expect(res.body).to.have.nested.property('channel.t', 'c');
					expect(res.body).to.have.nested.property('channel.msgs', 0);
				})
				.then(() => done());
		});

		before('add second channel to team', (done) => {
			request.post(api('teams.addRooms'))
				.set(credentials)
				.send({
					rooms: [channelToKeepId],
					teamId: testTeam._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('rooms');
					expect(res.body.rooms[0]).to.have.property('teamId', testTeam._id);
					expect(res.body.rooms[0]).to.not.have.property('teamDefault');
				})
				.then(() => done());
		});

		it('should convert the team to a channel, delete the specified room and move the other back to the workspace', (done) => {
			request.post(api('teams.convertToChannel'))
				.set(credentials)
				.send({
					teamName,
					roomsToRemove: [channelToEraseId],
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
							roomId: channelToEraseId,
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((response) => {
							expect(response.body).to.have.property('success', false);
							expect(response.body).to.have.property('error');
							expect(response.body.error).to.include('[error-room-not-found]');
						});
				})
				.then(() => {
					request.get(api('channels.info'))
						.set(credentials)
						.query({
							roomId: channelToKeepId,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((response) => {
							expect(response.body).to.have.property('success', true);
							expect(response.body).to.have.property('channel');
							expect(response.body.channel).to.have.property('_id', channelToKeepId);
							expect(response.body.channel).to.not.have.property('teamId');
						});
				})
				.then(() => {
					request.get(api('channels.info'))
						.set(credentials)
						.query({
							roomId: testTeam.roomId,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((response) => {
							expect(response.body).to.have.property('success', true);
							expect(response.body).to.have.property('channel');
							expect(response.body.channel).to.have.property('_id', testTeam.roomId);
							expect(response.body.channel).to.not.have.property('teamId');
							expect(response.body.channel).to.not.have.property('teamMain');
						});
				})
				.then(() => done())
				.catch(done);
		});
	});

	describe('/teams.addMembers', () => {
		let testTeam;
		before('Create test team', (done) => {
			const teamName = `test-team-${ Date.now() }`;
			request.post(api('teams.create'))
				.set(credentials)
				.send({
					name: teamName,
					type: 0,
				})
				.end((err, res) => {
					testTeam = res.body.team;
					done();
				});
		});
		it('should add members to a public team', (done) => {
			request.post(api('teams.addMembers'))
				.set(credentials)
				.send({
					teamName: testTeam.name,
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
							teamName: testTeam.name,
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

							const members = response.body.members.map(({ user, roles }) => ({
								_id: user._id,
								username: user.username,
								name: user.name,
								roles,
							}));

							expect(members).to.own.deep.include({
								_id: testUser._id,
								username: testUser.username,
								name: testUser.name,
								roles: ['member'],
							});
							expect(members).to.own.deep.include({
								_id: testUser2._id,
								username: testUser2.username,
								name: testUser2.name,
								roles: ['member'],
							});
						}),
				)
				.then(() => done())
				.catch(done);
		});
	});

	describe('/teams.members', () => {
		let testTeam;
		before('Create test team', (done) => {
			const teamName = `test-team-${ Date.now() }`;
			request.post(api('teams.create'))
				.set(credentials)
				.send({
					name: teamName,
					type: 0,
				})
				.end((err, res) => {
					testTeam = res.body.team;
					done();
				});
		});
		before('Add members to team', (done) => {
			request.post(api('teams.addMembers'))
				.set(credentials)
				.send({
					teamName: testTeam.name,
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
				.end(done);
		});
		it('should list all the members from a public team', (done) => {
			request.get(api('teams.members'))
				.set(credentials)
				.query({
					teamName: testTeam.name,
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

	describe('/teams.list', () => {
		before('Create test team', (done) => {
			const teamName = `test-team-${ Date.now() }`;
			request.post(api('teams.create'))
				.set(credentials)
				.send({
					name: teamName,
					type: 0,
				})
				.end(done);
		});
		it('should list all teams', (done) => {
			request.get(api('teams.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('offset', 0);
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('teams');
					expect(res.body.teams).to.have.length.greaterThan(1);
					expect(res.body.teams[0]).to.include.property('_id');
					expect(res.body.teams[0]).to.include.property('_updatedAt');
					expect(res.body.teams[0]).to.include.property('name');
					expect(res.body.teams[0]).to.include.property('type');
					expect(res.body.teams[0]).to.include.property('roomId');
					expect(res.body.teams[0]).to.include.property('createdBy');
					expect(res.body.teams[0].createdBy).to.include.property('_id');
					expect(res.body.teams[0].createdBy).to.include.property('username');
					expect(res.body.teams[0]).to.include.property('createdAt');
					expect(res.body.teams[0]).to.include.property('rooms');
					expect(res.body.teams[0]).to.include.property('numberOfUsers');
				})
				.end(done);
		});
	});

	describe('/teams.updateMember', () => {
		let testTeam;
		before('Create test team', (done) => {
			const teamName = `test-team-${ Date.now() }`;
			request.post(api('teams.create'))
				.set(credentials)
				.send({
					name: teamName,
					type: 0,
				})
				.end((err, res) => {
					testTeam = res.body.team;
					done();
				});
		});
		before('Add members to team', (done) => {
			request.post(api('teams.addMembers'))
				.set(credentials)
				.send({
					teamName: testTeam.name,
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
				.end(done);
		});
		it('should update member\'s data in a public team', (done) => {
			request.post(api('teams.updateMember'))
				.set(credentials)
				.send({
					teamName: testTeam.name,
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
							teamName: testTeam.name,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((response) => {
							expect(response.body).to.have.property('success', true);
							expect(response.body).to.have.property('members');
							expect(response.body.members).to.have.length(3);

							const members = response.body.members.map(({ user, roles }) => ({
								_id: user._id,
								username: user.username,
								name: user.name,
								roles,
							}));

							expect(members).to.own.deep.include({
								_id: testUser._id,
								username: testUser.username,
								name: testUser.name,
								roles: ['member', 'owner'],
							});
						}),
				)
				.then(() => done())
				.catch(done);
		});
	});

	describe('/teams.removeMember', () => {
		let testTeam;
		before('Create test team', (done) => {
			const teamName = `test-team-${ Date.now() }`;
			request.post(api('teams.create'))
				.set(credentials)
				.send({
					name: teamName,
					type: 0,
				})
				.end((err, res) => {
					testTeam = res.body.team;
					done();
				});
		});

		it('should not be able to remove the last owner', (done) => {
			request.post(api('teams.removeMember'))
				.set(credentials)
				.send({
					teamName: testTeam.name,
					userId: credentials['X-User-Id'],
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
					expect(res.body.error).to.be.equal('last-owner-can-not-be-removed');
				})
				.then(() => done())
				.catch(done);
		});

		it('should remove one member from a public team', (done) => {
			request.post(api('teams.addMembers'))
				.set(credentials)
				.send({
					teamName: testTeam.name,
					members: [
						{
							userId: testUser._id,
							roles: ['member'],
						},
						{
							userId: testUser2._id,
							roles: ['member', 'owner'],
						},
					],
				})
				.then(() =>
					request.post(api('teams.removeMember'))
						.set(credentials)
						.send({
							teamName: testTeam.name,
							userId: testUser2._id,
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
									teamName: testTeam.name,
								})
								.expect('Content-Type', 'application/json')
								.expect(200)
								.expect((response) => {
									expect(response.body).to.have.property('success', true);
									expect(response.body).to.have.property('members');
									expect(response.body.members).to.have.length(2);
								}),
						)
						.then(() => done()),
				)
				.catch(done);
		});
	});

	describe('/teams.leave', () => {
		let testTeam;
		before('Create test team', (done) => {
			const teamName = `test-team-${ Date.now() }`;
			request.post(api('teams.create'))
				.set(credentials)
				.send({
					name: teamName,
					type: 0,
				})
				.end((err, res) => {
					testTeam = res.body.team;
					done();
				});
		});

		it('should not be able to remove the last owner', (done) => {
			request.post(api('teams.leave'))
				.set(credentials)
				.send({
					teamName: testTeam.name,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
					expect(res.body.error).to.be.equal('last-owner-can-not-be-removed');
				})
				.then(() => done())
				.catch(done);
		});

		it('should remove the calling user from the team', (done) => {
			request.post(api('teams.addMembers'))
				.set(credentials)
				.send({
					teamName: testTeam.name,
					members: [
						{
							userId: testUser._id,
							roles: ['member'],
						},
						{
							userId: testUser2._id,
							roles: ['member', 'owner'],
						},
					],
				})
				.then(() =>
					request.post(api('teams.leave'))
						.set(credentials)
						.send({
							teamName: testTeam.name,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
						})
						.then(() => done()),
				)
				.catch(done);
		});
	});

	describe('/teams.delete', () => {
		describe('deleting an empty team', () => {
			let roomId;
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
					.then(() => {
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
									.then(() => done());
							});
					})
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
				request.post(api('teams.addRooms'))
					.set(credentials)
					.send({
						rooms: [channel1Id],
						teamId,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('rooms');
						expect(res.body.rooms[0]).to.have.property('teamId', teamId);
						expect(res.body.rooms[0]).to.not.have.property('teamDefault');
					})
					.then(() => done())
					.catch(done);
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
				request.post(api('teams.addRooms'))
					.set(credentials)
					.send({
						rooms: [channel2Id],
						teamId,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('rooms');
						expect(res.body.rooms[0]).to.have.property('teamId', teamId);
						expect(res.body.rooms[0]).to.not.have.property('teamDefault');
					})
					.then(() => done());
			});

			it('should delete the specified room and move the other back to the workspace', (done) => {
				request.post(api('teams.delete'))
					.set(credentials)
					.send({
						teamName: tempTeamName,
						roomsToRemove: [channel2Id],
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
									.then(() => done());
							});
					})
					.catch(done);
			});
		});
	});

	describe('/teams.addRooms', () => {
		let privateRoom3;

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
		before('create another private channel', (done) => {
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
					privateRoom2 = res.body.group;
				})
				.end(done);
		});
		before('create yet another private channel', (done) => {
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
					privateRoom3 = res.body.group;
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
				request.post(api('teams.addRooms'))
					.set(credentials)
					.send({
						rooms: [publicRoom._id],
						teamId: publicTeam._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
						expect(res.body.error).to.be.equal('error-no-permission-team-channel');
					})
					.end(done);
			});
		});

		it('should add public and private rooms to team', (done) => {
			updatePermission('add-team-channel', ['admin']).then(() => {
				request.post(api('teams.addRooms'))
					.set(credentials)
					.send({
						rooms: [publicRoom._id, privateRoom._id],
						teamId: publicTeam._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('rooms');
						expect(res.body.rooms).to.have.length(2);
						expect(res.body.rooms[0]).to.have.property('_id');
						expect(res.body.rooms[0]).to.have.property('teamId', publicTeam._id);
						expect(res.body.rooms[1]).to.have.property('_id');
						expect(res.body.rooms[1]).to.have.property('teamId', publicTeam._id);

						const rids = res.body.rooms.map(({ _id }) => _id);

						expect(rids).to.include(publicRoom._id);
						expect(rids).to.include(privateRoom._id);
					})
					.end(done);
			});
		});

		it('should add public room to private team', (done) => {
			updatePermission('add-team-channel', ['admin']).then(() => {
				request.post(api('teams.addRooms'))
					.set(credentials)
					.send({
						rooms: [publicRoom2._id],
						teamId: privateTeam._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('rooms');
						expect(res.body.rooms[0]).to.have.property('teamId', privateTeam._id);
						expect(res.body.rooms[0]).to.not.have.property('teamDefault');
					})
					.end(done);
			});
		});

		it('should add private room to team', (done) => {
			updatePermission('add-team-channel', ['admin']).then(() => {
				request.post(api('teams.addRooms'))
					.set(credentials)
					.send({
						rooms: [privateRoom2._id],
						teamId: privateTeam._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('rooms');
						expect(res.body.rooms[0]).to.have.property('teamId', privateTeam._id);
						expect(res.body.rooms[0]).to.not.have.property('teamDefault');
					})
					.end(done);
			});
		});

		it('should fail if the user cannot access the channel', (done) => {
			updatePermission('add-team-channel', ['admin', 'user'])
				.then(() => {
					request.post(api('teams.addRooms'))
						.set(testUserCredentials)
						.send({
							rooms: [privateRoom3._id],
							teamId: privateTeam._id,
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.property('error');
							expect(res.body.error).to.be.equal('invalid-room');
						})
						.end(done);
				})
				.catch(done);
		});

		it('should fail if the user is not the owner of the channel', (done) => {
			request.post(methodCall('addUsersToRoom'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'addUsersToRoom',
						params: [{ rid: privateRoom3._id, users: [testUser.username] }],
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.then(() => {
					request.post(api('teams.addRooms'))
						.set(testUserCredentials)
						.send({
							rooms: [privateRoom3._id],
							teamId: privateTeam._id,
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.property('error');
							expect(res.body.error).to.be.equal('error-no-owner-channel');
						})
						.end(done);
				})
				.catch(done);
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
						// main room should not be returned here
						expect(res.body.rooms.length).to.equal(1);
					})
					.end(done);
			});
		});

		it('should return all rooms for public team', (done) => {
			updatePermission('view-all-team-channels', ['user']).then(() => {
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
							expect(res.body.rooms.length).to.equal(2);
						})
						.end(done);
				});
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

	describe('/teams.update', () => {
		let testTeam;
		let testTeam2;
		before('Create test team', (done) => {
			const teamName = `test-team-name${ Date.now() }`;
			request.post(api('teams.create'))
				.set(credentials)
				.send({
					name: teamName,
					type: 0,
				})
				.end((err, res) => {
					testTeam = res.body.team;
					done();
				});
		});

		before('Create test team', (done) => {
			const teamName2 = `test-team-name${ Date.now() }`;
			request.post(api('teams.create'))
				.set(credentials)
				.send({
					name: teamName2,
					type: 0,
				})
				.end((err, res) => {
					testTeam2 = res.body.team;
					done();
				});
		});

		it('should update team name', async () => {
			const testTeamName = `test-team-name-changed${ Date.now() }`;
			const updateResponse = await request.post(api('teams.update'))
				.set(credentials)
				.send({
					teamId: testTeam._id,
					data: {
						name: testTeamName,
					},
				});

			expect(updateResponse.body).to.have.property('success', true);

			const infoResponse = await request.get(api('teams.info'))
				.set(credentials)
				.query({ teamId: testTeam._id });

			expect(infoResponse.body).to.have.property('success', true);

			const { teamInfo } = infoResponse.body;
			expect(teamInfo).to.have.property('name', testTeamName);
		});

		it('should update team type', async () => {
			const updateResponse = await request.post(api('teams.update'))
				.set(credentials)
				.send({
					teamId: testTeam._id,
					data: {
						type: 1,
					},
				});

			expect(updateResponse.body).to.have.property('success', true);

			const infoResponse = await request.get(api('teams.info'))
				.set(credentials)
				.query({ teamId: testTeam._id });

			expect(infoResponse.body).to.have.property('success', true);

			const { teamInfo } = infoResponse.body;
			expect(teamInfo).to.have.property('type', 1);
		});

		it('should update team name and type at once', async () => {
			const testTeamName = `test-team-name-changed${ Date.now() }`;
			const updateResponse = await request.post(api('teams.update'))
				.set(credentials)
				.send({
					teamId: testTeam2._id,
					data: {
						name: testTeamName,
						type: 1,
					},
				});

			expect(updateResponse.body).to.have.property('success', true);

			const infoResponse = await request.get(api('teams.info'))
				.set(credentials)
				.query({ teamId: testTeam2._id });

			expect(infoResponse.body).to.have.property('success', true);

			const { teamInfo } = infoResponse.body;
			expect(teamInfo).to.have.property('type', 1);
		});

		it('should not update team if permissions are not met', async () => {
			const unauthorizedUser = await createUser();
			const unauthorizedUserCredentials = await login(unauthorizedUser.username, password);

			const res = await request.post(api('teams.update'))
				.set(unauthorizedUserCredentials)
				.send({
					teamId: testTeam._id,
					data: {
						name: 'anyname',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(403);

			expect(res.body).to.have.property('success', false);
		});
	});
});
