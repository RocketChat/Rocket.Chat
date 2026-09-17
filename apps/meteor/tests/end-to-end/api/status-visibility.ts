import type { Credentials } from '@rocket.chat/api-client';
import type { IRoom, ITeam, IUser } from '@rocket.chat/core-typings';
import { TeamType, UserStatus } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { api, credentials, getCredentials, request } from '../../data/api-data';
import { updateEESetting } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { createTeam, deleteTeam } from '../../data/teams.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login, setUserStatus } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('[Status Visibility] (Enterprise Only)', function () {
	this.retries(0);

	let hider: IUser & { username: string };
	let viewer: IUser & { username: string };
	let bystander: IUser & { username: string };
	let hiderCredentials: Credentials;
	let viewerCredentials: Credentials;
	let bystanderCredentials: Credentials;
	let channel: IRoom;
	let group: IRoom;
	let team: ITeam;

	const usernamesOf = (members: { username?: string }[]) => members.map((member) => member.username);
	const statusOf = (members: { username?: string; status?: string }[], username: string) =>
		members.find((member) => member.username === username)?.status;

	before((done) => getCredentials(done));

	before(async () => {
		await updateEESetting('Accounts_StatusVisibility_Enabled', true);

		[hider, viewer, bystander] = (await Promise.all([
			createUser({ joinDefaultChannels: false }),
			createUser({ joinDefaultChannels: false }),
			createUser({ joinDefaultChannels: false }),
		])) as (IUser & { username: string })[];

		[hiderCredentials, viewerCredentials, bystanderCredentials] = await Promise.all([
			login(hider.username, password),
			login(viewer.username, password),
			login(bystander.username, password),
		]);

		await setUserStatus(hiderCredentials, UserStatus.ONLINE);

		await request
			.post(api('users.setPreferences'))
			.set(hiderCredentials)
			.send({ data: { statusVisibilityDenied: [viewer.username] } })
			.expect(200);

		const members = [hider.username, viewer.username, bystander.username];

		channel = (await createRoom({ type: 'c', name: `status-visibility-c-${Date.now()}`, members, credentials })).body.channel;
		group = (await createRoom({ type: 'p', name: `status-visibility-p-${Date.now()}`, members, credentials })).body.group;
		team = await createTeam(credentials, `status-visibility-t-${Date.now()}`, TeamType.PUBLIC, members);
	});

	after(async () => {
		await Promise.all([deleteRoom({ type: 'c', roomId: channel._id }), deleteRoom({ type: 'p', roomId: group._id })]);
		await deleteTeam(credentials, team.name);
		await Promise.all([deleteUser(hider), deleteUser(viewer), deleteUser(bystander)]);
		await updateEESetting('Accounts_StatusVisibility_Enabled', false);
	});

	describe('[/rooms.membersOrderedByRole]', () => {
		it('should not return the hider when the viewer filters by online', async () => {
			await request
				.get(api('rooms.membersOrderedByRole'))
				.set(viewerCredentials)
				.query({ 'roomId': channel._id, 'status[]': UserStatus.ONLINE })
				.expect(200)
				.expect((res) => {
					expect(usernamesOf(res.body.members)).to.not.include(hider.username);
					expect(res.body.total).to.be.equal(res.body.members.length);
				});
		});

		it('should return the hider as online to a user they do not hide from', async () => {
			await request
				.get(api('rooms.membersOrderedByRole'))
				.set(bystanderCredentials)
				.query({ 'roomId': channel._id, 'status[]': UserStatus.ONLINE })
				.expect(200)
				.expect((res) => {
					expect(statusOf(res.body.members, hider.username)).to.be.equal(UserStatus.ONLINE);
				});
		});

		it('should return the hider as offline when the viewer does not filter', async () => {
			await request
				.get(api('rooms.membersOrderedByRole'))
				.set(viewerCredentials)
				.query({ roomId: channel._id })
				.expect(200)
				.expect((res) => {
					expect(usernamesOf(res.body.members)).to.include(hider.username);
					expect(statusOf(res.body.members, hider.username)).to.be.equal(UserStatus.OFFLINE);
				});
		});

		it('should return the hider when the viewer filters by offline', async () => {
			await request
				.get(api('rooms.membersOrderedByRole'))
				.set(viewerCredentials)
				.query({ 'roomId': channel._id, 'status[]': UserStatus.OFFLINE })
				.expect(200)
				.expect((res) => {
					expect(usernamesOf(res.body.members)).to.include(hider.username);
					expect(statusOf(res.body.members, hider.username)).to.be.equal(UserStatus.OFFLINE);
				});
		});
	});

	describe('[/channels.members]', () => {
		it('should not return the hider when the viewer filters by online', async () => {
			await request
				.get(api('channels.members'))
				.set(viewerCredentials)
				.query({ 'roomId': channel._id, 'status[]': UserStatus.ONLINE })
				.expect(200)
				.expect((res) => {
					expect(usernamesOf(res.body.members)).to.not.include(hider.username);
					expect(res.body.total).to.be.equal(res.body.members.length);
				});
		});

		it('should return the hider as online to a user they do not hide from', async () => {
			await request
				.get(api('channels.members'))
				.set(bystanderCredentials)
				.query({ 'roomId': channel._id, 'status[]': UserStatus.ONLINE })
				.expect(200)
				.expect((res) => {
					expect(statusOf(res.body.members, hider.username)).to.be.equal(UserStatus.ONLINE);
				});
		});
	});

	describe('[/channels.online]', () => {
		it('should not return the hider to the viewer', async () => {
			await request
				.get(api('channels.online'))
				.set(viewerCredentials)
				.query({ _id: channel._id })
				.expect(200)
				.expect((res) => {
					expect(usernamesOf(res.body.online)).to.not.include(hider.username);
				});
		});

		it('should return the hider to a user they do not hide from', async () => {
			await request
				.get(api('channels.online'))
				.set(bystanderCredentials)
				.query({ _id: channel._id })
				.expect(200)
				.expect((res) => {
					expect(usernamesOf(res.body.online)).to.include(hider.username);
				});
		});
	});

	describe('[/groups.members]', () => {
		it('should not return the hider when the viewer filters by online', async () => {
			await request
				.get(api('groups.members'))
				.set(viewerCredentials)
				.query({ 'roomId': group._id, 'status[]': UserStatus.ONLINE })
				.expect(200)
				.expect((res) => {
					expect(usernamesOf(res.body.members)).to.not.include(hider.username);
					expect(res.body.total).to.be.equal(res.body.members.length);
				});
		});

		it('should return the hider as online to a user they do not hide from', async () => {
			await request
				.get(api('groups.members'))
				.set(bystanderCredentials)
				.query({ 'roomId': group._id, 'status[]': UserStatus.ONLINE })
				.expect(200)
				.expect((res) => {
					expect(statusOf(res.body.members, hider.username)).to.be.equal(UserStatus.ONLINE);
				});
		});
	});

	describe('[/groups.online]', () => {
		it('should not return the hider to the viewer', async () => {
			await request
				.get(api('groups.online'))
				.set(viewerCredentials)
				.query({ _id: group._id })
				.expect(200)
				.expect((res) => {
					expect(usernamesOf(res.body.online)).to.not.include(hider.username);
				});
		});

		it('should return the hider to a user they do not hide from', async () => {
			await request
				.get(api('groups.online'))
				.set(bystanderCredentials)
				.query({ _id: group._id })
				.expect(200)
				.expect((res) => {
					expect(usernamesOf(res.body.online)).to.include(hider.username);
				});
		});
	});

	describe('[/teams.members]', () => {
		const teamUsernamesOf = (members: { user: IUser }[]) => members.map(({ user }) => user.username);

		it('should not return the hider when the viewer filters by online', async () => {
			await request
				.get(api('teams.members'))
				.set(viewerCredentials)
				.query({ 'teamId': team._id, 'status[]': UserStatus.ONLINE })
				.expect(200)
				.expect((res) => {
					expect(teamUsernamesOf(res.body.members)).to.not.include(hider.username);
				});
		});

		it('should return the hider to a user they do not hide from', async () => {
			await request
				.get(api('teams.members'))
				.set(bystanderCredentials)
				.query({ 'teamId': team._id, 'status[]': UserStatus.ONLINE })
				.expect(200)
				.expect((res) => {
					expect(teamUsernamesOf(res.body.members)).to.include(hider.username);
				});
		});

		it('should not expose the block list of any member', async () => {
			await request
				.get(api('teams.members'))
				.set(viewerCredentials)
				.query({ teamId: team._id })
				.expect(200)
				.expect((res) => {
					res.body.members.forEach(({ user }: { user: IUser }) => {
						expect(user.settings?.preferences ?? {}).to.not.have.property('statusVisibilityDenied');
					});
				});
		});
	});

	describe('[/users.getStatus]', () => {
		it('should report the hider as offline to the viewer', async () => {
			await request
				.get(api('users.getStatus'))
				.set(viewerCredentials)
				.query({ userId: hider._id })
				.expect(200)
				.expect((res) => {
					expect(res.body.status).to.be.equal(UserStatus.OFFLINE);
					expect(res.body).to.not.have.property('statusSource');
				});
		});

		it('should report the real status to a user they do not hide from', async () => {
			await request
				.get(api('users.getStatus'))
				.set(bystanderCredentials)
				.query({ userId: hider._id })
				.expect(200)
				.expect((res) => {
					expect(res.body.status).to.be.equal(UserStatus.ONLINE);
				});
		});
	});

	describe('[/users.getPresence]', () => {
		it('should report the hider as offline to the viewer', async () => {
			await request
				.get(api('users.getPresence'))
				.set(viewerCredentials)
				.query({ userId: hider._id })
				.expect(200)
				.expect((res) => {
					expect(res.body.presence).to.be.equal(UserStatus.OFFLINE);
				});
		});

		it('should report the real presence to a user they do not hide from', async () => {
			await request
				.get(api('users.getPresence'))
				.set(bystanderCredentials)
				.query({ userId: hider._id })
				.expect(200)
				.expect((res) => {
					expect(res.body.presence).to.be.equal(UserStatus.ONLINE);
				});
		});
	});

	describe('[/users.autocomplete]', () => {
		const selector = (conditions?: object) => JSON.stringify({ term: hider.username, exceptions: [], ...(conditions && { conditions }) });

		it('should list the hider as offline to the viewer', async () => {
			await request
				.get(api('users.autocomplete'))
				.set(viewerCredentials)
				.query({ selector: selector() })
				.expect(200)
				.expect((res) => {
					expect(statusOf(res.body.items, hider.username)).to.be.equal(UserStatus.OFFLINE);
				});
		});

		it('should list the real status to a user they do not hide from', async () => {
			await request
				.get(api('users.autocomplete'))
				.set(bystanderCredentials)
				.query({ selector: selector() })
				.expect(200)
				.expect((res) => {
					expect(statusOf(res.body.items, hider.username)).to.be.equal(UserStatus.ONLINE);
				});
		});

		it('should not return the hider when the viewer filters by online through the selector conditions', async () => {
			await request
				.get(api('users.autocomplete'))
				.set(viewerCredentials)
				.query({ selector: selector({ status: UserStatus.ONLINE }) })
				.expect(200)
				.expect((res) => {
					expect(usernamesOf(res.body.items)).to.not.include(hider.username);
				});
		});

		it('should return the hider through the selector conditions to a user they do not hide from', async () => {
			await request
				.get(api('users.autocomplete'))
				.set(bystanderCredentials)
				.query({ selector: selector({ status: UserStatus.ONLINE }) })
				.expect(200)
				.expect((res) => {
					expect(usernamesOf(res.body.items)).to.include(hider.username);
				});
		});
	});

	describe('[/im.members]', () => {
		let dm: IRoom;

		before(async () => {
			dm = (await createRoom({ type: 'd', username: hider.username, credentials: viewerCredentials })).body.room;
		});

		it('should return the hider when the viewer filters by offline', async () => {
			await request
				.get(api('im.members'))
				.set(viewerCredentials)
				.query({ 'roomId': dm._id, 'status[]': UserStatus.OFFLINE })
				.expect(200)
				.expect((res) => {
					expect(usernamesOf(res.body.members)).to.include(hider.username);
					expect(statusOf(res.body.members, hider.username)).to.be.equal(UserStatus.OFFLINE);
				});
		});
	});
});
