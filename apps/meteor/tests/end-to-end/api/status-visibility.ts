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

	const statusSeenBy = async (overrideCredentials: Credentials, userId: string) => {
		const { body } = await request.get(api('users.getStatus')).set(overrideCredentials).query({ userId }).expect(200);

		return body.status;
	};

	const setAdminDenied = (userId: string, usernames: string[], data?: Record<string, unknown>, overrideCredentials = credentials) =>
		request
			.post(api('users.update'))
			.set(overrideCredentials)
			.send({ userId, data: { statusVisibilityDeniedByAdmin: usernames, ...data } });

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

	describe('[presenceDisabledByAdmin]', () => {
		const setPresenceDisabled = (userId: string, disabled: boolean, overrideCredentials = credentials) =>
			request
				.post(api('users.update'))
				.set(overrideCredentials)
				.send({ userId, data: { presenceDisabledByAdmin: disabled } });

		after(async () => {
			await setPresenceDisabled(bystander._id, false).expect(200);
		});

		it('should hide the target from a viewer they never blocked', async () => {
			await setUserStatus(bystanderCredentials, UserStatus.ONLINE);
			expect(await statusSeenBy(viewerCredentials, bystander._id)).to.be.equal(UserStatus.ONLINE);

			await setPresenceDisabled(bystander._id, true).expect(200);

			expect(await statusSeenBy(viewerCredentials, bystander._id)).to.be.equal(UserStatus.OFFLINE);
			expect(await statusSeenBy(hiderCredentials, bystander._id)).to.be.equal(UserStatus.OFFLINE);
		});

		it('should keep the target visible to themselves', async () => {
			await request
				.get(api('users.getStatus'))
				.set(bystanderCredentials)
				.expect(200)
				.expect((res) => {
					expect(res.body.status).to.be.equal(UserStatus.ONLINE);
				});
		});

		it('should refuse a status change from a disabled user', async () => {
			await setPresenceDisabled(bystander._id, true).expect(200);

			await request.post(api('users.setStatus')).set(bystanderCredentials).send({ status: UserStatus.BUSY }).expect(400);
		});

		it('should refuse a user turning their own status off', async () => {
			await request
				.post(api('users.update'))
				.set(viewerCredentials)
				.send({ userId: viewer._id, data: { presenceDisabledByAdmin: true } })
				.expect(400)
				.expect((res) => {
					expect(res.body.errorType).to.be.equal('error-action-not-allowed');
				});

			await request
				.get(api('users.info'))
				.set(credentials)
				.query({ userId: viewer._id })
				.expect(200)
				.expect((res) => {
					expect(res.body.user.presenceDisabledByAdmin).to.not.be.equal(true);
				});
		});

		it('should refuse the call from a user who cannot edit other users', async () => {
			await setPresenceDisabled(hider._id, true, viewerCredentials)
				.expect(400)
				.expect((res) => {
					expect(res.body.errorType).to.be.equal('error-action-not-allowed');
				});
		});

		it('should restore the real status once the admin re-enables it', async () => {
			await setPresenceDisabled(bystander._id, false).expect(200);

			expect(await statusSeenBy(viewerCredentials, bystander._id)).to.be.equal(UserStatus.ONLINE);
		});

		it('should not touch the per-user choices of the CORE-2522 axis', async () => {
			expect(await statusSeenBy(viewerCredentials, hider._id)).to.be.equal(UserStatus.OFFLINE);
			expect(await statusSeenBy(bystanderCredentials, hider._id)).to.be.equal(UserStatus.ONLINE);
		});

		it('should hide the target only from the viewers an admin listed', async () => {
			await setUserStatus(bystanderCredentials, UserStatus.ONLINE);

			await setAdminDenied(bystander._id, [viewer.username]).expect(200);

			expect(await statusSeenBy(viewerCredentials, bystander._id)).to.be.equal(UserStatus.OFFLINE);
			expect(await statusSeenBy(hiderCredentials, bystander._id)).to.be.equal(UserStatus.ONLINE);

			await setAdminDenied(bystander._id, []).expect(200);

			expect(await statusSeenBy(viewerCredentials, bystander._id)).to.be.equal(UserStatus.ONLINE);
		});

		it('should refuse the exception list from a user who cannot edit other users', async () => {
			await setAdminDenied(hider._id, [viewer.username], undefined, bystanderCredentials).expect(400);
		});
	});

	describe('[Accounts_UserStatus_Enabled]', () => {
		before(async () => {
			await setUserStatus(bystanderCredentials, UserStatus.ONLINE);
			await setUserStatus(viewerCredentials, UserStatus.BUSY);
			await updateEESetting('Accounts_UserStatus_Enabled', false);
		});

		after(async () => {
			await updateEESetting('Accounts_UserStatus_Enabled', true);
		});

		it('should hide everyone from everyone, not only the users who chose to hide', async () => {
			expect(await statusSeenBy(viewerCredentials, bystander._id)).to.be.equal(UserStatus.OFFLINE);
			expect(await statusSeenBy(bystanderCredentials, hider._id)).to.be.equal(UserStatus.OFFLINE);
			expect(await statusSeenBy(hiderCredentials, bystander._id)).to.be.equal(UserStatus.OFFLINE);
		});

		it('should return nobody when a member list filters by a non-offline status', async () => {
			await request
				.get(api('rooms.membersOrderedByRole'))
				.set(bystanderCredentials)
				.query({ 'roomId': channel._id, 'status[]': UserStatus.ONLINE })
				.expect(200)
				.expect((res) => {
					expect(res.body.members).to.have.lengthOf(0);
				});
		});

		it('should return every member when a member list filters by offline', async () => {
			await request
				.get(api('rooms.membersOrderedByRole'))
				.set(bystanderCredentials)
				.query({ 'roomId': channel._id, 'status[]': UserStatus.OFFLINE })
				.expect(200)
				.expect((res) => {
					expect(usernamesOf(res.body.members)).to.include(hider.username);
					expect(statusOf(res.body.members, hider.username)).to.be.equal(UserStatus.OFFLINE);
				});
		});

		it('should not leak a real status through the members projection', async () => {
			await request
				.get(api('channels.members'))
				.set(bystanderCredentials)
				.query({ roomId: channel._id })
				.expect(200)
				.expect((res) => {
					expect(res.body.members.every((member: { status?: string }) => member.status === UserStatus.OFFLINE)).to.be.true;
				});
		});

		it('should drop everyone from the online-only lists', async () => {
			await request
				.get(api('channels.online'))
				.set(bystanderCredentials)
				.query({ _id: channel._id })
				.expect(200)
				.expect((res) => {
					expect(res.body.online).to.have.lengthOf(0);
				});
		});

		it('should refuse a status change from anyone', async () => {
			await request.post(api('users.setStatus')).set(bystanderCredentials).send({ status: UserStatus.BUSY }).expect(400);
		});

		it('should not order users.list by the real status it redacts', async () => {
			const { body } = await request
				.get(api('users.list'))
				.set(bystanderCredentials)
				.query({ sort: JSON.stringify({ status: 1, username: 1 }), count: 50 })
				.expect(200);

			const usernames = usernamesOf(body.users);

			expect(body.users.every((user: { status?: string }) => user.status === UserStatus.OFFLINE)).to.be.true;
			expect(usernames.length).to.be.greaterThan(1);
			expect(usernames).to.be.deep.equal([...usernames].sort());
		});

		it('should keep the target offline after an admin rule is cleared', async () => {
			await setAdminDenied(bystander._id, [viewer.username]).expect(200);

			expect(await statusSeenBy(viewerCredentials, bystander._id)).to.be.equal(UserStatus.OFFLINE);

			await setAdminDenied(bystander._id, []).expect(200);

			expect(await statusSeenBy(viewerCredentials, bystander._id)).to.be.equal(UserStatus.OFFLINE);
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

	describe('[/users.listStatusVisibility]', () => {
		it('should refuse a user who cannot edit other users', async () => {
			await request.get(api('users.listStatusVisibility')).set(bystanderCredentials).expect(403);
		});

		it('should list only users under an admin rule, with usernames resolved', async () => {
			await setAdminDenied(hider._id, [bystander.username]).expect(200);

			const { body } = await request.get(api('users.listStatusVisibility')).set(credentials).expect(200);
			const row = body.users.find((user: { _id: string }) => user._id === hider._id);

			expect(row).to.not.be.undefined;
			expect(row.statusVisibilityDeniedByAdmin).to.be.deep.equal([bystander.username]);
			expect(body.users.every((user: { _id: string }) => user._id !== viewer._id)).to.be.true;
		});

		it('should redact the presence of a target that hides from the caller', async () => {
			const admin = await request.get(api('me')).set(credentials).expect(200);
			const statusText = `status-message-${Date.now()}`;
			const rowOf = async () => {
				const { body } = await request.get(api('users.listStatusVisibility')).set(credentials).expect(200);

				return body.users.find((user: { _id: string }) => user._id === hider._id);
			};

			await setAdminDenied(hider._id, [bystander.username], { statusText }).expect(200);

			expect((await rowOf()).statusText).to.be.equal(statusText);

			await setAdminDenied(hider._id, [admin.body.username]).expect(200);

			const redacted = await rowOf();

			expect(redacted.status).to.be.equal(UserStatus.OFFLINE);
			expect(redacted.statusText).to.be.undefined;

			await setAdminDenied(hider._id, [], { statusText: '' }).expect(200);

			expect(await rowOf()).to.be.undefined;
		});

		it('should expose the admin exception list through users.info only to admins, and as usernames', async () => {
			await setAdminDenied(hider._id, [bystander.username]).expect(200);

			const { body } = await request.get(api('users.info')).set(credentials).query({ userId: hider._id }).expect(200);

			expect(body.user.statusVisibilityDeniedByAdmin).to.be.deep.equal([bystander.username]);

			const { body: ownView } = await request.get(api('users.info')).set(hiderCredentials).query({ userId: hider._id }).expect(200);

			expect(ownView.user).to.not.have.property('statusVisibilityDeniedByAdmin');

			await setAdminDenied(hider._id, []).expect(200);
		});

		it('should never expose either hide list through users.list', async () => {
			const assertDenied = async (fields: Record<string, 1>) => {
				const response = await request
					.get(api('users.list'))
					.set(bystanderCredentials)
					.query({ fields: JSON.stringify(fields) });

				expect(response.status).to.be.oneOf([200, 400]);

				if (response.status === 200) {
					expect(
						response.body.users.every(
							(user: Record<string, unknown> & { settings?: { preferences?: Record<string, unknown> } }) =>
								!('statusVisibilityDeniedByAdmin' in user) && !user.settings?.preferences?.statusVisibilityDenied,
						),
					).to.be.true;
				}
			};

			await setAdminDenied(hider._id, [bystander.username]).expect(200);

			await assertDenied({ statusVisibilityDeniedByAdmin: 1, username: 1 });
			await assertDenied({ 'settings.preferences.statusVisibilityDenied': 1, 'username': 1 });

			await setAdminDenied(hider._id, []).expect(200);
		});
	});
});
