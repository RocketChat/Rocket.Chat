import type { Credentials } from '@rocket.chat/api-client';
import type { IRole, IRoom, ITeam, IUser } from '@rocket.chat/core-typings';
import { TEAM_TYPE } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { getCredentials, api, request, credentials, methodCall } from '../../data/api-data';
import { updatePermission, updateSetting } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { createTeam, deleteTeam } from '../../data/teams.helper';
import { adminUsername, password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login } from '../../data/users.helper';

interface IUserInfo {
	_id: string;
	username?: string;
	name?: string;
	status?: string;
	settings?: Record<string, any>;
}

interface ITeamMemberInfo {
	user: IUserInfo;
	roles?: IRole['_id'][] | null;
	createdBy: Omit<IUserInfo, 'name' | 'status'>;
	createdAt: Date;
}

const addMembers = async (credentials: Record<string, any>, teamName: string, members: IUser['_id'][]): Promise<void> => {
	await request
		.post(api('teams.addMembers'))
		.set(credentials)
		.send({
			teamName,
			members: members.map((userId) => ({ userId, roles: ['member'] })),
		});
};

describe('[Teams]', () => {
	before((done) => getCredentials(done));

	describe('/teams.create', () => {
		const name = `test-team-create-${Date.now()}`;
		const createdTeams: ITeam[] = [];
		let testUser: TestUser<IUser>;

		before(async () => {
			testUser = await createUser();
			await updateSetting('UTF8_Channel_Names_Validation', '[0-9a-zA-Z-_.]+');
		});

		after(async () => {
			await Promise.all([
				...createdTeams.map((team) => deleteTeam(credentials, team.name)),
				deleteUser(testUser),
				updateSetting('UTF8_Channel_Names_Validation', '[0-9a-zA-Z-_.]+'),
			]);
		});

		it('should create a public team', (done) => {
			void request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name,
					type: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('team');
					expect(res.body).to.have.nested.property('team._id');
					createdTeams.push(res.body.team);
				})
				.end(done);
		});

		it('should create a public team with a member', (done) => {
			void request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name: `test-team-${Date.now()}`,
					type: 0,
					members: [testUser.username],
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('team');
					expect(res.body).to.have.nested.property('team._id');
					createdTeams.push(res.body.team);
				})
				.then((response) => {
					const teamId = response.body.team._id;
					return request
						.get(api('teams.members'))
						.set(credentials)
						.query({ teamId })
						.expect(200)
						.expect((response) => {
							expect(response.body).to.have.property('success', true);
							expect(response.body).to.have.property('members');

							// remove admin user from members because it's added automatically as owner
							const members = (response.body.members as ITeamMemberInfo[]).filter(({ user }) => user.username !== adminUsername);

							const [member] = members;
							expect(member.user.username).to.be.equal(testUser.username);
						});
				})
				.then(() => done())
				.catch(done);
		});

		it('should create private team with a defined owner', (done) => {
			void request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name: `test-team-private-owner-${Date.now()}`,
					type: 1,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('team');
					expect(res.body).to.have.nested.property('team._id');
					createdTeams.push(res.body.team);
				})
				.then((response) => {
					const teamId = response.body.team._id;
					return request
						.get(api('teams.members'))
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
			void request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name,
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

		it('should create a team with sidepanel items containing channels', async () => {
			const teamName = `test-team-with-sidepanel-${Date.now()}`;
			const sidepanelItems = ['channels'];

			const response = await request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name: teamName,
					type: 0,
					sidepanel: {
						items: sidepanelItems,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			await request
				.get(api('channels.info'))
				.set(credentials)
				.query({ roomId: response.body.team.roomId })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((response) => {
					expect(response.body).to.have.property('success', true);
					expect(response.body.channel).to.have.property('sidepanel');
					expect(response.body.channel.sidepanel).to.have.property('items').that.is.an('array').to.have.deep.members(sidepanelItems);
				});
			await deleteTeam(credentials, teamName);
		});

		it('should throw error when creating a team with sidepanel with more than 2 items', async () => {
			await request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name: `test-team-with-sidepanel-error-${Date.now()}`,
					type: 0,
					sidepanel: {
						items: ['channels', 'discussion', 'other'],
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should throw error when creating a team with sidepanel with incorrect items', async () => {
			await request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name: `test-team-with-sidepanel-error-${Date.now()}`,
					type: 0,
					sidepanel: {
						items: ['other'],
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});
		it('should throw error when creating a team with sidepanel with duplicated items', async () => {
			await request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name: `test-team-with-sidepanel-error-${Date.now()}`,
					type: 0,
					sidepanel: {
						items: ['channels', 'channels'],
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
		});

		it('should not create a team with no associated room', async () => {
			const teamName = 'invalid*team*name';

			await request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name: teamName,
					type: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((response) => {
					expect(response.body).to.have.property('success', false);
					expect(response.body).to.have.property('error');
					expect(response.body.error).to.be.equal('error-team-creation');
				});

			await request
				.get(api('teams.info'))
				.set(credentials)
				.query({
					teamName,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((response) => {
					expect(response.body).to.have.property('success', false);
					expect(response.body).to.have.property('error', 'Team not found');
				});

			await request
				.get(api('teams.members'))
				.set(credentials)
				.query({
					teamName,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((response) => {
					expect(response.body).to.have.property('success', false);
					expect(response.body).to.have.property('error', 'team-does-not-exist');
				});
		});
	});

	describe('/teams.convertToChannel', () => {
		let testTeam: ITeam;
		let channelToEraseId: IRoom['_id'];
		let channelToKeepId: IRoom['_id'];
		const teamName = `test-team-convert-to-channel-${Date.now()}`;
		const channelToEraseName = `${teamName}-channelToErase`;
		const channelToKeepName = `${teamName}-channelToKeep`;
		before('Create test team', (done) => {
			void request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name: teamName,
					type: 1,
				})
				.end((_err, res) => {
					testTeam = res.body.team;
					done();
				});
		});

		before('create channel (to erase after its team is converted to a channel)', (done) => {
			void request
				.post(api('channels.create'))
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
			void request
				.post(api('teams.addRooms'))
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
			void request
				.post(api('channels.create'))
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
			void request
				.post(api('teams.addRooms'))
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

		after(() =>
			Promise.all([
				deleteTeam(credentials, teamName),
				deleteRoom({ type: 'p', roomId: testTeam.roomId }),
				deleteRoom({ type: 'c', roomId: channelToKeepId }),
			]),
		);

		it('should convert the team to a channel, delete the specified room and move the other back to the workspace', (done) => {
			void request
				.post(api('teams.convertToChannel'))
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
					void request
						.get(api('channels.info'))
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
					void request
						.get(api('channels.info'))
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
					void request
						.get(api('channels.info'))
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
		let testTeam: ITeam;
		const teamName = `test-team-add-members-${Date.now()}`;
		let testUser: TestUser<IUser>;
		let testUser2: TestUser<IUser>;

		before(async () => {
			testUser = await createUser();
			testUser2 = await createUser();
		});

		before('Create test team', (done) => {
			void request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name: teamName,
					type: 0,
				})
				.end((_err, res) => {
					testTeam = res.body.team;
					done();
				});
		});

		after(() => Promise.all([deleteUser(testUser), deleteUser(testUser2), deleteTeam(credentials, teamName)]));

		it('should add members to a public team', (done) => {
			void request
				.post(api('teams.addMembers'))
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
				.then(
					() =>
						void request
							.get(api('teams.members'))
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

								const members = (response.body.members as ITeamMemberInfo[]).map(({ user, roles }) => ({
									_id: user._id,
									username: user.username,
									name: user.name,
									roles,
								}));

								expect(members).to.deep.own.include({
									_id: testUser._id,
									username: testUser.username,
									name: testUser.name,
									roles: ['member'],
								});
								expect(members).to.deep.own.include({
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
		let testTeam: ITeam;
		const teamName = `test-team-members-${Date.now()}`;
		let testUser: TestUser<IUser>;
		let testUser2: TestUser<IUser>;

		before(async () => {
			testUser = await createUser();
			testUser2 = await createUser();
		});

		before('Create test team', (done) => {
			void request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name: teamName,
					type: 0,
				})
				.end((_err, res) => {
					testTeam = res.body.team;
					done();
				});
		});

		before('Add members to team', (done) => {
			void request
				.post(api('teams.addMembers'))
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

		after(() => Promise.all([deleteUser(testUser), deleteUser(testUser2), deleteTeam(credentials, teamName)]));

		it('should list all the members from a public team', (done) => {
			void request
				.get(api('teams.members'))
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
		const teamName = `test-team-list-${Date.now()}`;

		let testUser1: TestUser<IUser>;
		let testUser1Credentials: Credentials;
		let testTeamAdmin: TestUser<IUser>;
		let testTeam1: IRoom;
		before('Create test team', (done) => {
			void request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name: teamName,
					type: 0,
				})
				.end(done);
		});

		before('Create test users', async () => {
			testUser1 = await createUser();
		});

		before('login test users', async () => {
			testUser1Credentials = await login(testUser1.username, password);
		});

		before('Create test team', async () => {
			await request.post(api('teams.create')).set(credentials).send({
				name: teamName,
				type: 0,
			});

			const team1Name = `test-team-1-${Date.now()}`;
			const teamAdminName = `test-team-admin-${Date.now()}`;

			testTeam1 = (
				await request.post(api('teams.create')).set(testUser1Credentials).send({
					name: team1Name,
					type: 0,
				})
			).body.team;
			testTeamAdmin = (
				await request.post(api('teams.create')).set(credentials).send({
					name: teamAdminName,
					type: 0,
				})
			).body.team;
		});

		after(() =>
			Promise.all([
				deleteTeam(credentials, teamName),
				deleteTeam(testUser1Credentials, testTeam1.name!),
				deleteTeam(credentials, testTeamAdmin.name!),
			]),
		);

		after('delete test users', () => deleteUser(testUser1));

		it('should list all teams', (done) => {
			void request
				.get(api('teams.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('offset', 0);
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('teams');
					expect(res.body.teams.length).to.be.gte(1);
					expect(res.body.teams[0]).to.have.property('_id');
					expect(res.body.teams[0]).to.have.property('_updatedAt');
					expect(res.body.teams[0]).to.have.property('name');
					expect(res.body.teams[0]).to.have.property('type');
					expect(res.body.teams[0]).to.have.property('roomId');
					expect(res.body.teams[0]).to.have.property('createdBy');
					expect(res.body.teams[0].createdBy).to.have.property('_id');
					expect(res.body.teams[0].createdBy).to.have.property('username');
					expect(res.body.teams[0]).to.have.property('createdAt');
					expect(res.body.teams[0]).to.have.property('rooms');
					expect(res.body.teams[0]).to.have.property('numberOfUsers');
				})
				.end(done);
		});

		it("should prevent users from accessing unrelated teams via 'query' parameter", () => {
			return request
				.get(api('teams.list'))
				.set(testUser1Credentials)
				.query({
					query: JSON.stringify({ _id: { $regex: '.*' } }),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body.teams.length).to.be.gte(1);
					expect(res.body.teams)
						.to.be.an('array')
						.and.to.satisfy(
							(teams: ITeam[]) => teams.every((team) => team.createdBy._id === testUser1._id),
							`Expected only user's own teams to be returned, but found unowned teams.\n${JSON.stringify(
								res.body.teams.filter((team: ITeam) => team.createdBy._id !== testUser1._id),
								null,
								2,
							)}`,
						);
				});
		});

		it("should prevent admins from accessing unrelated teams via 'query' parameter", () => {
			return request
				.get(api('teams.list'))
				.set(credentials)
				.query({
					query: JSON.stringify({ _id: { $regex: '.*' } }),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body.teams.length).to.be.gte(1);
					expect(res.body.teams)
						.to.be.an('array')
						.and.to.satisfy(
							(teams: ITeam[]) => teams.every((team) => team.createdBy._id === credentials['X-User-Id']),
							`Expected only admin's own teams to be returned, but found unowned teams.\n${JSON.stringify(
								res.body.teams.filter((team: ITeam) => team.createdBy._id !== credentials['X-User-Id']),
								null,
								2,
							)}`,
						);
				});
		});
	});

	describe('/teams.updateMember', () => {
		let testTeam: ITeam;
		const teamName = `test-team-update-member-${Date.now()}`;
		let testUser: TestUser<IUser>;
		let testUser2: TestUser<IUser>;

		before(async () => {
			testUser = await createUser();
			testUser2 = await createUser();
		});

		before('Create test team', (done) => {
			void request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name: teamName,
					type: 0,
				})
				.end((_err, res) => {
					testTeam = res.body.team;
					done();
				});
		});
		before('Add members to team', (done) => {
			void request
				.post(api('teams.addMembers'))
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

		after(() => Promise.all([deleteUser(testUser), deleteUser(testUser2), deleteTeam(credentials, teamName)]));

		it("should update member's data in a public team", (done) => {
			void request
				.post(api('teams.updateMember'))
				.set(credentials)
				.send({
					teamName: testTeam.name,
					member: {
						userId: testUser._id,
						roles: ['member', 'owner'],
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.then(
					() =>
						void request
							.get(api('teams.members'))
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

								const members = (response.body.members as ITeamMemberInfo[]).map(({ user, roles }) => ({
									_id: user._id,
									username: user.username,
									name: user.name,
									roles,
								}));

								expect(members).to.deep.own.include({
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
		let testTeam: ITeam;
		const teamName = `test-team-remove-member-${Date.now()}`;
		let testUser: TestUser<IUser>;
		let testUser2: TestUser<IUser>;

		before(async () => {
			testUser = await createUser();
			testUser2 = await createUser();
		});

		before('Create test team', (done) => {
			void request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name: teamName,
					type: 0,
				})
				.end((_err, res) => {
					testTeam = res.body.team;
					done();
				});
		});

		after(() => Promise.all([deleteUser(testUser), deleteUser(testUser2), deleteTeam(credentials, teamName)]));

		it('should not be able to remove the last owner', (done) => {
			void request
				.post(api('teams.removeMember'))
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

		it('should not be able to remove if rooms is empty', (done) => {
			void request
				.post(api('teams.removeMember'))
				.set(credentials)
				.send({
					teamName: testTeam.name,
					userId: credentials['X-User-Id'],
					rooms: [],
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
					expect(res.body.errorType).to.be.equal('invalid-params');
				})
				.then(() => done())
				.catch(done);
		});

		it('should remove one member from a public team', (done) => {
			void request
				.post(api('teams.addMembers'))
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
					request
						.post(api('teams.removeMember'))
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
							request
								.get(api('teams.members'))
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
		let testTeam: ITeam;
		const teamName = `test-team-leave-${Date.now()}`;
		let testUser: TestUser<IUser>;
		let testUser2: TestUser<IUser>;

		before(async () => {
			testUser = await createUser();
			testUser2 = await createUser();
		});

		before('Create test team', (done) => {
			void request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name: teamName,
					type: 0,
				})
				.end((_err, res) => {
					testTeam = res.body.team;
					done();
				});
		});

		after(() => Promise.all([deleteUser(testUser), deleteUser(testUser2), deleteTeam(credentials, teamName)]));

		it('should not be able to remove the last owner', (done) => {
			request
				.post(api('teams.leave'))
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
			request
				.post(api('teams.addMembers'))
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
					request
						.post(api('teams.leave'))
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

		it('should not be able to leave if rooms is empty', (done) => {
			request
				.post(api('teams.leave'))
				.set(credentials)
				.send({
					teamName: testTeam.name,
					userId: credentials['X-User-Id'],
					rooms: [],
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
					expect(res.body.errorType).to.be.equal('invalid-params');
				})
				.then(() => done())
				.catch(done);
		});
	});

	describe('/teams.info', () => {
		const teamName = `test-team-info-${Date.now()}`;
		let testTeam: ITeam;
		let testTeam2: ITeam;
		let testUser: TestUser<IUser>;
		let testUserCredentials: Credentials;

		before(async () => {
			testUser = await createUser();
			testUserCredentials = await login(testUser.username, password);
			testTeam = await createTeam(credentials, teamName, TEAM_TYPE.PUBLIC);
			testTeam2 = await createTeam(credentials, `${teamName}-2`, TEAM_TYPE.PRIVATE);
		});

		after(() => Promise.all([deleteTeam(credentials, testTeam.name), deleteTeam(credentials, testTeam2.name), deleteUser(testUser)]));

		it('should successfully get a team info by name', (done) => {
			request
				.get(api('teams.info'))
				.set(credentials)
				.query({
					teamName: testTeam.name,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((response) => {
					expect(response.body).to.have.property('success', true);
					expect(response.body).to.have.property('teamInfo');
					expect(response.body.teamInfo).to.have.property('_id', testTeam._id);
					expect(response.body.teamInfo).to.have.property('name', testTeam.name);
				})
				.then(() => done())
				.catch(done);
		});
		it('should successfully get a team info by id', (done) => {
			request
				.get(api('teams.info'))
				.set(credentials)
				.query({
					teamId: testTeam._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((response) => {
					expect(response.body).to.have.property('success', true);
					expect(response.body).to.have.property('teamInfo');
					expect(response.body.teamInfo).to.have.property('_id', testTeam._id);
					expect(response.body.teamInfo).to.have.property('name', testTeam.name);
				})
				.then(() => done())
				.catch(done);
		});
		it('should fail if a team is not found', (done) => {
			request
				.get(api('teams.info'))
				.set(credentials)
				.query({
					teamName: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((response) => {
					expect(response.body).to.have.property('success', false);
					expect(response.body).to.have.property('error', 'Team not found');
				})
				.then(() => done())
				.catch(done);
		});
		it('should fail if a user doesnt belong to a team', (done) => {
			request
				.get(api('teams.info'))
				.set(testUserCredentials)
				.query({
					teamName: testTeam2.name,
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((response) => {
					expect(response.body).to.have.property('success', false);
					expect(response.body).to.have.property('error', 'unauthorized');
				})
				.then(() => done())
				.catch(done);
		});
	});

	describe('/teams.delete', () => {
		describe('deleting an empty team', () => {
			let roomId: IRoom['_id'];
			const tempTeamName = `temporaryTeam-${Date.now()}`;

			before('create team', (done) => {
				void request
					.post(api('teams.create'))
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

			after(() => deleteTeam(credentials, tempTeamName));

			it('should delete the team and the main room', (done) => {
				request
					.post(api('teams.delete'))
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
						void request
							.get(api('teams.info'))
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
								void request
									.get(api('channels.info'))
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
			const tempTeamName = `temporaryTeam-${Date.now()}`;
			const channel1Name = `${tempTeamName}-channel1`;
			const channel2Name = `${tempTeamName}-channel2`;
			let teamId: ITeam['_id'];
			let channel1Id: IRoom['_id'];
			let channel2Id: IRoom['_id'];

			before('create team', (done) => {
				void request
					.post(api('teams.create'))
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
				void request
					.post(api('channels.create'))
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
				request
					.post(api('teams.addRooms'))
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
				void request
					.post(api('channels.create'))
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
				void request
					.post(api('teams.addRooms'))
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

			after(() => deleteRoom({ type: 'c', roomId: channel1Id }));

			it('should delete the specified room and move the other back to the workspace', (done) => {
				request
					.post(api('teams.delete'))
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
						void request
							.get(api('channels.info'))
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
								void request
									.get(api('channels.info'))
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
		let privateRoom: IRoom & { t: 'p' };
		let privateRoom2: IRoom & { t: 'p' };
		let privateRoom3: IRoom & { t: 'p' };
		let publicRoom: IRoom & { t: 'c' };
		let publicRoom2: IRoom & { t: 'c' };
		let publicTeam: ITeam;
		let privateTeam: ITeam;
		let testUser: TestUser<IUser>;
		let testUserCredentials: Credentials;

		before(async () => {
			testUser = await createUser();
			testUserCredentials = await login(testUser.username, password);
			privateRoom = (await createRoom({ type: 'p', name: `community-channel-private-1-${Date.now()}` })).body.group;
			privateRoom2 = (await createRoom({ type: 'p', name: `community-channel-private-2-${Date.now()}` })).body.group;
			privateRoom3 = (await createRoom({ type: 'p', name: `community-channel-private-3-${Date.now()}` })).body.group;
			publicRoom = (await createRoom({ type: 'c', name: `community-channel-public-1-${Date.now()}` })).body.channel;
			publicRoom2 = (await createRoom({ type: 'c', name: `community-channel-public-2-${Date.now()}` })).body.channel;
			publicTeam = await createTeam(credentials, `team-name-c-${Date.now()}`, TEAM_TYPE.PUBLIC);
			privateTeam = await createTeam(credentials, `team-name-p-${Date.now()}`, TEAM_TYPE.PRIVATE);
		});

		after(async () => {
			await Promise.all([deleteTeam(credentials, publicTeam.name), deleteTeam(credentials, privateTeam.name)]);
			await Promise.all([
				updatePermission('add-team-channel', ['admin', 'owner', 'moderator']),
				...[privateRoom, privateRoom2, privateRoom3, publicRoom, publicRoom2].map((room) => deleteRoom({ type: room.t, roomId: room._id })),
				deleteUser(testUser),
			]);
		});

		it('should throw an error if no permission', (done) => {
			void updatePermission('add-team-channel', []).then(() => {
				void request
					.post(api('teams.addRooms'))
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
			void updatePermission('add-team-channel', ['admin']).then(() => {
				void request
					.post(api('teams.addRooms'))
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

						const rids = (res.body.rooms as IRoom[]).map(({ _id }) => _id);

						expect(rids).to.include(publicRoom._id);
						expect(rids).to.include(privateRoom._id);
					})
					.end(done);
			});
		});

		it('should add public room to private team', (done) => {
			void updatePermission('add-team-channel', ['admin']).then(() => {
				void request
					.post(api('teams.addRooms'))
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
			void updatePermission('add-team-channel', ['admin']).then(() => {
				void request
					.post(api('teams.addRooms'))
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
			void updatePermission('add-team-channel', ['admin', 'user'])
				.then(() => {
					void request
						.post(api('teams.addRooms'))
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
			void request
				.post(methodCall('addUsersToRoom'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'addUsersToRoom',
						params: [{ rid: privateRoom3._id, users: [testUser.username] }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.then(() => {
					void request
						.post(api('teams.addRooms'))
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
		let testUser: TestUser<IUser>;
		let testUserCredentials: Credentials;
		let privateTeam: ITeam;
		let publicTeam: ITeam;
		let privateRoom: IRoom;
		let publicRoom: IRoom;
		let publicRoom2: IRoom;

		before(async () => {
			testUser = await createUser();
			testUserCredentials = await login(testUser.username, password);
			privateTeam = await createTeam(credentials, `teamName-private-${Date.now()}`, TEAM_TYPE.PRIVATE);
			publicTeam = await createTeam(testUserCredentials, `teamName-public-${Date.now()}`, TEAM_TYPE.PUBLIC);

			privateRoom = (await createRoom({ type: 'p', name: `test-p-${Date.now()}` })).body.group;
			publicRoom = (await createRoom({ type: 'c', name: `test-c-${Date.now()}` })).body.channel;
			publicRoom2 = (await createRoom({ type: 'c', name: `test-c2-${Date.now()}` })).body.channel;

			await request
				.post(api('teams.addRooms'))
				.set(credentials)
				.send({
					rooms: [privateRoom._id],
					teamId: publicTeam._id,
				});
			await request
				.post(api('teams.addRooms'))
				.set(credentials)
				.send({
					rooms: [publicRoom._id],
					teamId: publicTeam._id,
				});

			await request
				.post(api('teams.addRooms'))
				.set(credentials)
				.send({
					rooms: [publicRoom2._id],
					teamId: privateTeam._id,
				});
		});

		after(() =>
			Promise.all([
				updatePermission('view-all-teams', ['admin']),
				updatePermission('view-all-team-channels', ['admin', 'owner']),
				deleteUser(testUser),
				deleteTeam(credentials, privateTeam.name),
				deleteTeam(credentials, publicTeam.name),
				deleteRoom({ type: 'p', roomId: privateRoom._id }),
				deleteRoom({ type: 'c', roomId: publicRoom._id }),
				deleteRoom({ type: 'c', roomId: publicRoom2._id }),
			]),
		);

		it('should throw an error if team is private and no permission', (done) => {
			void updatePermission('view-all-teams', []).then(() => {
				void request
					.get(api('teams.listRooms'))
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
			void updatePermission('view-all-team-channels', []).then(() => {
				void request
					.get(api('teams.listRooms'))
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
			void updatePermission('view-all-team-channels', ['user']).then(() => {
				void request
					.get(api('teams.listRooms'))
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
		it('should return all rooms for public team even requested with count and offset params', (done) => {
			void updatePermission('view-all-team-channels', ['user']).then(() => {
				void request
					.get(api('teams.listRooms'))
					.set(testUserCredentials)
					.query({
						teamId: publicTeam._id,
						count: 5,
						offset: 0,
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
			void updatePermission('view-all-team-channels', []).then(() => {
				void updatePermission('view-all-teams', ['admin']).then(() => {
					void request
						.get(api('teams.listRooms'))
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
		it('should return public rooms for private team even requested with count and offset params', (done) => {
			void updatePermission('view-all-team-channels', []).then(() => {
				void updatePermission('view-all-teams', ['admin']).then(() => {
					void request
						.get(api('teams.listRooms'))
						.set(credentials)
						.query({
							teamId: privateTeam._id,
							count: 5,
							offset: 0,
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

	describe('/teams.updateRoom', () => {
		let publicRoom: IRoom;
		let publicTeam: ITeam;
		const name = `teamName-update-room-${Date.now()}`;

		before(async () => {
			publicRoom = (await createRoom({ type: 'c', name: `public-update-room-${Date.now()}` })).body.channel;
			publicTeam = await createTeam(credentials, name, TEAM_TYPE.PUBLIC);
			await request
				.post(api('teams.addRooms'))
				.set(credentials)
				.send({
					rooms: [publicRoom._id],
					teamId: publicTeam._id,
				});
		});

		after(async () => {
			await deleteTeam(credentials, name);
			await Promise.all([
				updatePermission('edit-team-channel', ['admin', 'owner', 'moderator']),
				deleteRoom({ type: 'c', roomId: publicRoom._id }),
			]);
		});

		it('should throw an error if no permission', (done) => {
			void updatePermission('edit-team-channel', []).then(() => {
				void request
					.post(api('teams.updateRoom'))
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
			void updatePermission('edit-team-channel', ['admin']).then(() => {
				void request
					.post(api('teams.updateRoom'))
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

		describe('team auto-join', () => {
			let testTeam: ITeam;
			let createdRoom: IRoom;
			let testUser1: TestUser<IUser>;
			let testUser2: TestUser<IUser>;

			before(async () => {
				const [testUser1Result, testUser2Result] = await Promise.all([createUser(), createUser()]);

				testUser1 = testUser1Result;
				testUser2 = testUser2Result;
			});

			beforeEach(async () => {
				const createTeamPromise = createTeam(credentials, `test-team-name${Date.now()}`, 0);
				const createRoomPromise = createRoom({ name: `test-room-name${Date.now()}`, type: 'c' });
				const [testTeamCreationResult, testRoomCreationResult] = await Promise.all([createTeamPromise, createRoomPromise]);

				testTeam = testTeamCreationResult;
				createdRoom = testRoomCreationResult.body.channel;

				await request
					.post(api('teams.addRooms'))
					.set(credentials)
					.expect(200)
					.send({
						rooms: [createdRoom._id],
						teamName: testTeam.name,
					});
			});

			afterEach(() => Promise.all([deleteTeam(credentials, testTeam.name), deleteRoom({ roomId: createdRoom._id, type: 'c' })]));

			after(() => Promise.all([updateSetting('API_User_Limit', 500), deleteUser(testUser1), deleteUser(testUser2)]));

			it('should add members when the members count is less than or equal to the API_User_Limit setting', async () => {
				await updateSetting('API_User_Limit', 2);

				await addMembers(credentials, testTeam.name, [testUser1._id, testUser2._id]);
				await request
					.post(api('teams.updateRoom'))
					.set(credentials)
					.send({
						roomId: createdRoom._id,
						isDefault: true,
					})
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.nested.property('room.usersCount').and.to.be.equal(3);
					});
			});

			it('should not add all members when we update a team channel to be auto-join and the members count is greater than the API_User_Limit setting', async () => {
				await updateSetting('API_User_Limit', 1);

				await addMembers(credentials, testTeam.name, [testUser1._id, testUser2._id]);
				await request
					.post(api('teams.updateRoom'))
					.set(credentials)
					.send({
						roomId: createdRoom._id,
						isDefault: true,
					})
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.nested.property('room.usersCount').and.to.be.equal(2);
					});
			});
		});
	});

	describe('/teams.removeRoom', () => {
		let publicRoom: IRoom;
		let publicTeam: ITeam;
		const name = `teamName-remove-room-${Date.now()}`;

		before(async () => {
			publicRoom = (await createRoom({ type: 'c', name: `public-remove-room-${Date.now()}` })).body.channel;
			publicTeam = await createTeam(credentials, name, TEAM_TYPE.PUBLIC);
			await request
				.post(api('teams.addRooms'))
				.set(credentials)
				.send({
					rooms: [publicRoom._id],
					teamId: publicTeam._id,
				});
		});

		after(async () => {
			await deleteTeam(credentials, name);
			await Promise.all([
				updatePermission('edit-team-channel', ['admin', 'owner', 'moderator']),
				deleteRoom({ type: 'c', roomId: publicRoom._id }),
			]);
		});

		after(() =>
			Promise.all([
				updatePermission('remove-team-channel', ['admin', 'owner', 'moderator']),
				deleteRoom({ type: 'c', roomId: publicRoom._id }),
				deleteTeam(credentials, name),
			]),
		);

		it('should throw an error if no permission', (done) => {
			void updatePermission('remove-team-channel', []).then(() => {
				void request
					.post(api('teams.removeRoom'))
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
			void updatePermission('remove-team-channel', ['admin']).then(() => {
				void request
					.post(api('teams.removeRoom'))
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
		let testTeam: ITeam;
		let testTeam2: ITeam;
		let testTeam3: ITeam;
		const teamName = `test-team-name1${Date.now()}`;
		const teamName2 = `test-team-name2${Date.now()}`;
		const teamName3 = `test-team-name3${Date.now()}`;
		const testTeamName = `test-team-name-changed${Date.now()}-1`;
		const testTeamName2 = `test-team-name-changed${Date.now()}-2`;
		let unauthorizedUser: TestUser<IUser>;

		before('Create test team', (done) => {
			void request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name: teamName,
					type: 0,
				})
				.end((_err, res) => {
					testTeam = res.body.team;
					done();
				});
		});

		before('Create test team', (done) => {
			void request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name: teamName2,
					type: 0,
				})
				.end((_err, res) => {
					testTeam2 = res.body.team;
					done();
				});
		});

		before('Create test team', (done) => {
			void request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name: teamName3,
					type: 0,
				})
				.end((_err, res) => {
					testTeam3 = res.body.team;
					done();
				});
		});

		before(async () => {
			unauthorizedUser = await createUser();
		});

		after(() =>
			Promise.all([...[testTeamName, testTeamName2, teamName3].map((name) => deleteTeam(credentials, name)), deleteUser(unauthorizedUser)]),
		);

		it('should update team name', async () => {
			const updateResponse = await request
				.post(api('teams.update'))
				.set(credentials)
				.send({
					teamId: testTeam._id,
					data: {
						name: testTeamName,
					},
				});

			expect(updateResponse.body).to.have.property('success', true);

			const infoResponse = await request.get(api('teams.info')).set(credentials).query({ teamId: testTeam._id });

			expect(infoResponse.body).to.have.property('success', true);

			const { teamInfo } = infoResponse.body;
			expect(teamInfo).to.have.property('name', testTeamName);
		});

		it('should update team type', async () => {
			const updateResponse = await request
				.post(api('teams.update'))
				.set(credentials)
				.send({
					teamId: testTeam._id,
					data: {
						type: 1,
					},
				});

			expect(updateResponse.body).to.have.property('success', true);

			const infoResponse = await request.get(api('teams.info')).set(credentials).query({ teamId: testTeam._id });

			expect(infoResponse.body).to.have.property('success', true);

			const { teamInfo } = infoResponse.body;
			expect(teamInfo).to.have.property('type', 1);
		});

		it('should update team name and type at once', async () => {
			const updateResponse = await request
				.post(api('teams.update'))
				.set(credentials)
				.send({
					teamId: testTeam2._id,
					data: {
						name: testTeamName2,
						type: 1,
					},
				});

			expect(updateResponse.body).to.have.property('success', true);

			const infoResponse = await request.get(api('teams.info')).set(credentials).query({ teamId: testTeam2._id });

			expect(infoResponse.body).to.have.property('success', true);

			const { teamInfo } = infoResponse.body;
			expect(teamInfo).to.have.property('type', 1);
		});

		it('should not update team if permissions are not met', async () => {
			const unauthorizedUserCredentials = await login(unauthorizedUser.username, password);

			const res = await request
				.post(api('teams.update'))
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

		describe('should update team room to default and invite users with the right notification preferences', () => {
			let userWithPrefs: TestUser<IUser>;
			let userCredentials: Credentials;
			let createdRoom: IRoom;

			before(async () => {
				userWithPrefs = await createUser();
				userCredentials = await login(userWithPrefs.username, password);

				createdRoom = (await createRoom({ type: 'c', name: `${Date.now()}-testTeam3` })).body.channel;

				await request
					.post(api('teams.addRooms'))
					.set(credentials)
					.send({
						rooms: [createdRoom._id],
						teamId: testTeam3._id,
					});
			});

			after(() => Promise.all([deleteUser(userWithPrefs), deleteRoom({ type: 'c', roomId: createdRoom._id })]));

			it('should update user prefs', async () => {
				await request
					.post(methodCall('saveUserPreferences'))
					.set(userCredentials)
					.send({
						message: JSON.stringify({
							method: 'saveUserPreferences',
							params: [{ emailNotificationMode: 'nothing' }],
							id: 'id',
							msg: 'method',
						}),
					})
					.expect(200);
			});

			it('should add user with prefs to team', (done) => {
				void request
					.post(api('teams.addMembers'))
					.set(credentials)
					.send({
						teamName: testTeam3.name,
						members: [
							{
								userId: userWithPrefs._id,
								roles: ['member'],
							},
						],
					})
					.end(done);
			});

			it('should update team channel to auto-join', async () => {
				const response = await request.post(api('teams.updateRoom')).set(credentials).send({
					roomId: createdRoom._id,
					isDefault: true,
				});
				expect(response.body).to.have.property('success', true);
			});

			it('should return the user subscription with the right notification preferences', (done) => {
				void request
					.get(api('subscriptions.getOne'))
					.set(userCredentials)
					.query({
						roomId: createdRoom._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('subscription').and.to.be.an('object');
						expect(res.body).to.have.nested.property('subscription.emailNotifications').and.to.be.equal('nothing');
					})
					.end(done);
			});
		});
	});

	describe('[teams.listChildren]', () => {
		const teamName = `team-${Date.now()}`;
		let testTeam: ITeam;
		let testPrivateTeam: ITeam;
		let testUser: IUser;
		let testUserCredentials: Credentials;

		let privateRoom: IRoom;
		let privateRoom2: IRoom;
		let publicRoom: IRoom;
		let publicRoom2: IRoom;

		let discussionOnPrivateRoom: IRoom;
		let discussionOnPublicRoom: IRoom;
		let discussionOnMainRoom: IRoom;

		before('Create test team', async () => {
			testUser = await createUser();
			testUserCredentials = await login(testUser.username, password);

			const members = testUser.username ? [testUser.username] : [];
			testTeam = await createTeam(credentials, teamName, 0, members);
			testPrivateTeam = await createTeam(testUserCredentials, `${teamName}private`, 1, []);
		});

		before('make user owner', async () => {
			await request
				.post(api('teams.updateMember'))
				.set(credentials)
				.send({
					teamName: testTeam.name,
					member: {
						userId: testUser._id,
						roles: ['member', 'owner'],
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
		});

		before('create rooms', async () => {
			privateRoom = (await createRoom({ type: 'p', name: `test-p-${Date.now()}` })).body.group;
			privateRoom2 = (await createRoom({ type: 'p', name: `test-p2-${Date.now()}`, credentials: testUserCredentials })).body.group;
			publicRoom = (await createRoom({ type: 'c', name: `test-c-${Date.now()}` })).body.channel;
			publicRoom2 = (await createRoom({ type: 'c', name: `test-c2-${Date.now()}` })).body.channel;

			await Promise.all([
				request
					.post(api('teams.addRooms'))
					.set(credentials)
					.send({
						rooms: [privateRoom._id, publicRoom._id, publicRoom2._id],
						teamId: testTeam._id,
					})
					.expect(200),
				request
					.post(api('teams.addRooms'))
					.set(testUserCredentials)
					.send({
						rooms: [privateRoom2._id],
						teamId: testTeam._id,
					})
					.expect(200),
			]);
		});

		before('Create discussions', async () => {
			discussionOnPrivateRoom = (
				await request
					.post(api('rooms.createDiscussion'))
					.set(credentials)
					.send({
						prid: privateRoom._id,
						t_name: `test-d-${Date.now()}`,
					})
			).body.discussion;
			discussionOnPublicRoom = (
				await request
					.post(api('rooms.createDiscussion'))
					.set(credentials)
					.send({
						prid: publicRoom._id,
						t_name: `test-d-${Date.now()}`,
					})
			).body.discussion;
			discussionOnMainRoom = (
				await request
					.post(api('rooms.createDiscussion'))
					.set(credentials)
					.send({
						prid: testTeam.roomId,
						t_name: `test-d-${Date.now()}`,
					})
			).body.discussion;
		});

		after(async () => {
			await Promise.all([
				deleteRoom({ type: 'p', roomId: privateRoom._id }),
				deleteRoom({ type: 'p', roomId: privateRoom2._id }),
				deleteRoom({ type: 'c', roomId: publicRoom._id }),
				deleteRoom({ type: 'c', roomId: publicRoom2._id }),
				deleteRoom({ type: 'p', roomId: discussionOnPrivateRoom._id }),
				deleteRoom({ type: 'c', roomId: discussionOnPublicRoom._id }),
				deleteRoom({ type: 'c', roomId: discussionOnMainRoom._id }),
				deleteTeam(credentials, teamName),
				deleteTeam(credentials, testPrivateTeam.name),
				deleteUser({ _id: testUser._id }),
			]);
		});

		it('should fail if user is not logged in', async () => {
			await request.get(api('teams.listChildren')).expect(401);
		});

		it('should fail if teamId is not passed as queryparam', async () => {
			await request.get(api('teams.listChildren')).set(credentials).expect(400);
		});

		it('should fail if teamId is not valid', async () => {
			await request.get(api('teams.listChildren')).set(credentials).query({ teamId: 'invalid' }).expect(404);
		});

		it('should fail if teamId is empty', async () => {
			await request.get(api('teams.listChildren')).set(credentials).query({ teamId: '' }).expect(404);
		});

		it('should fail if both properties are passed', async () => {
			await request.get(api('teams.listChildren')).set(credentials).query({ teamId: testTeam._id, teamName: testTeam.name }).expect(400);
		});

		it('should fail if teamName is empty', async () => {
			await request.get(api('teams.listChildren')).set(credentials).query({ teamName: '' }).expect(404);
		});

		it('should fail if teamName is invalid', async () => {
			await request.get(api('teams.listChildren')).set(credentials).query({ teamName: 'invalid' }).expect(404);
		});

		it('should fail if roomId is empty', async () => {
			await request.get(api('teams.listChildren')).set(credentials).query({ roomId: '' }).expect(404);
		});

		it('should fail if roomId is invalid', async () => {
			await request.get(api('teams.listChildren')).set(credentials).query({ teamName: 'invalid' }).expect(404);
		});

		it('should return a list of valid rooms for user', async () => {
			const res = await request.get(api('teams.listChildren')).query({ teamId: testTeam._id }).set(credentials).expect(200);

			expect(res.body).to.have.property('total').to.be.equal(5);
			expect(res.body).to.have.property('data').to.be.an('array');
			expect(res.body.data).to.have.lengthOf(5);

			const mainRoom = res.body.data.find((room: IRoom) => room._id === testTeam.roomId);
			expect(mainRoom).to.be.an('object');

			const publicChannel1 = res.body.data.find((room: IRoom) => room._id === publicRoom._id);
			expect(publicChannel1).to.be.an('object');

			const publicChannel2 = res.body.data.find((room: IRoom) => room._id === publicRoom2._id);
			expect(publicChannel2).to.be.an('object');

			const privateChannel1 = res.body.data.find((room: IRoom) => room._id === privateRoom._id);
			expect(privateChannel1).to.be.an('object');

			const privateChannel2 = res.body.data.find((room: IRoom) => room._id === privateRoom2._id);
			expect(privateChannel2).to.be.undefined;

			const discussionOnP = res.body.data.find((room: IRoom) => room._id === discussionOnPrivateRoom._id);
			expect(discussionOnP).to.be.undefined;

			const discussionOnC = res.body.data.find((room: IRoom) => room._id === discussionOnPublicRoom._id);
			expect(discussionOnC).to.be.undefined;

			const mainDiscussion = res.body.data.find((room: IRoom) => room._id === discussionOnMainRoom._id);
			expect(mainDiscussion).to.be.an('object');
		});

		it('should return a valid list of rooms for non admin member too', async () => {
			const res = await request.get(api('teams.listChildren')).query({ teamName: testTeam.name }).set(testUserCredentials).expect(200);

			expect(res.body).to.have.property('total').to.be.equal(5);
			expect(res.body).to.have.property('data').to.be.an('array');
			expect(res.body.data).to.have.lengthOf(5);

			const mainRoom = res.body.data.find((room: IRoom) => room._id === testTeam.roomId);
			expect(mainRoom).to.be.an('object');

			const publicChannel1 = res.body.data.find((room: IRoom) => room._id === publicRoom._id);
			expect(publicChannel1).to.be.an('object');

			const publicChannel2 = res.body.data.find((room: IRoom) => room._id === publicRoom2._id);
			expect(publicChannel2).to.be.an('object');

			const privateChannel1 = res.body.data.find((room: IRoom) => room._id === privateRoom._id);
			expect(privateChannel1).to.be.undefined;

			const privateChannel2 = res.body.data.find((room: IRoom) => room._id === privateRoom2._id);
			expect(privateChannel2).to.be.an('object');

			const discussionOnP = res.body.data.find((room: IRoom) => room._id === discussionOnPrivateRoom._id);
			expect(discussionOnP).to.be.undefined;

			const discussionOnC = res.body.data.find((room: IRoom) => room._id === discussionOnPublicRoom._id);
			expect(discussionOnC).to.be.undefined;

			const mainDiscussion = res.body.data.find((room: IRoom) => room._id === discussionOnMainRoom._id);
			expect(mainDiscussion).to.be.an('object');
		});

		it('should return a valid list of rooms for non admin member too when filtering by teams main room id', async () => {
			const res = await request.get(api('teams.listChildren')).query({ roomId: testTeam.roomId }).set(testUserCredentials).expect(200);

			expect(res.body).to.have.property('total').to.be.equal(5);
			expect(res.body).to.have.property('data').to.be.an('array');
			expect(res.body.data).to.have.lengthOf(5);

			const mainRoom = res.body.data.find((room: IRoom) => room._id === testTeam.roomId);
			expect(mainRoom).to.be.an('object');

			const publicChannel1 = res.body.data.find((room: IRoom) => room._id === publicRoom._id);
			expect(publicChannel1).to.be.an('object');

			const publicChannel2 = res.body.data.find((room: IRoom) => room._id === publicRoom2._id);
			expect(publicChannel2).to.be.an('object');

			const privateChannel1 = res.body.data.find((room: IRoom) => room._id === privateRoom._id);
			expect(privateChannel1).to.be.undefined;

			const privateChannel2 = res.body.data.find((room: IRoom) => room._id === privateRoom2._id);
			expect(privateChannel2).to.be.an('object');

			const discussionOnP = res.body.data.find((room: IRoom) => room._id === discussionOnPrivateRoom._id);
			expect(discussionOnP).to.be.undefined;

			const discussionOnC = res.body.data.find((room: IRoom) => room._id === discussionOnPublicRoom._id);
			expect(discussionOnC).to.be.undefined;

			const mainDiscussion = res.body.data.find((room: IRoom) => room._id === discussionOnMainRoom._id);
			expect(mainDiscussion).to.be.an('object');
		});

		it('should return a list of rooms filtered by name using the filter parameter', async () => {
			const res = await request
				.get(api('teams.listChildren'))
				.query({ teamId: testTeam._id, filter: 'test-p' })
				.set(credentials)
				.expect(200);

			expect(res.body).to.have.property('total').to.be.equal(1);
			expect(res.body).to.have.property('data').to.be.an('array');
			expect(res.body.data[0]._id).to.be.equal(privateRoom._id);
			expect(res.body.data.find((room: IRoom) => room._id === privateRoom2._id)).to.be.undefined;
		});

		it('should paginate results', async () => {
			const res = await request
				.get(api('teams.listChildren'))
				.query({ teamId: testTeam._id, offset: 1, count: 2 })
				.set(credentials)
				.expect(200);

			expect(res.body).to.have.property('total').to.be.equal(5);
			expect(res.body).to.have.property('data').to.be.an('array');
			expect(res.body.data).to.have.lengthOf(2);
		});

		it('should return only items of type channel', async () => {
			const res = await request
				.get(api('teams.listChildren'))
				.query({ teamId: testTeam._id, type: 'channels' })
				.set(credentials)
				.expect(200);

			expect(res.body).to.have.property('total').to.be.equal(4);
			expect(res.body).to.have.property('data').to.be.an('array');
			expect(res.body.data).to.have.lengthOf(4);
			expect(res.body.data.some((room: IRoom) => !!room.prid)).to.be.false;
		});

		it('should return only items of type discussion', async () => {
			const res = await request
				.get(api('teams.listChildren'))
				.query({ teamId: testTeam._id, type: 'discussions' })
				.set(credentials)
				.expect(200);

			expect(res.body).to.have.property('total').to.be.equal(1);
			expect(res.body).to.have.property('data').to.be.an('array');
			expect(res.body.data).to.have.lengthOf(1);
			expect(res.body.data.every((room: IRoom) => !!room.prid)).to.be.true;
		});

		it('should return both when type is not passed', async () => {
			const res = await request.get(api('teams.listChildren')).query({ teamId: testTeam._id }).set(credentials).expect(200);

			expect(res.body).to.have.property('total').to.be.equal(5);
			expect(res.body).to.have.property('data').to.be.an('array');
			expect(res.body.data).to.have.lengthOf(5);
			expect(res.body.data.some((room: IRoom) => !!room.prid)).to.be.true;
			expect(res.body.data.some((room: IRoom) => !room.prid)).to.be.true;
		});

		it('should fail if type is other than channel or discussion', async () => {
			await request.get(api('teams.listChildren')).query({ teamId: testTeam._id, type: 'other' }).set(credentials).expect(400);
		});

		it('should properly list children of a private team', async () => {
			const res = await request.get(api('teams.listChildren')).query({ teamId: testPrivateTeam._id }).set(testUserCredentials).expect(200);

			expect(res.body).to.have.property('total').to.be.equal(1);
			expect(res.body).to.have.property('data').to.be.an('array');
			expect(res.body.data).to.have.lengthOf(1);
		});

		it('should throw an error when a non member user tries to fetch info for team', async () => {
			await request.get(api('teams.listChildren')).query({ teamId: testPrivateTeam._id }).set(credentials).expect(400);
		});
	});
});
