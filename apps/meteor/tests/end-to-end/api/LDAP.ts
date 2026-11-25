import { after, before, beforeEach, describe, it } from 'node:test';

import type { ISetting } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import sharp from 'sharp';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { getSettingValueById, updatePermission, updateSetting } from '../../data/permissions.helper';
import { retry } from '../../data/retry';
import { createTeam, deleteTeam } from '../../data/teams.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

const ldapLoginUsername = 'ldap.e2e';
const ldapAvatarUsername = 'ldap.avatar';
const ldapSyncUsername = 'ldap.sync';
const ldapNoEmailUsername = 'userwithnoemail';
const ldapAvatarRgb = [0, 102, 203];

type Setting = Pick<ISetting, '_id' | 'value'>;

const ldapSettings: Setting[] = [
	{ _id: 'Accounts_ManuallyApproveNewUsers', value: false },
	{ _id: 'LDAP_Server_Type', value: '' },
	{ _id: 'LDAP_Host', value: 'openldap' },
	{ _id: 'LDAP_Port', value: 1389 },
	{ _id: 'LDAP_Authentication', value: true },
	{ _id: 'LDAP_Authentication_UserDN', value: 'cn=admin,dc=space,dc=air' },
	{ _id: 'LDAP_Authentication_Password', value: 'adminpassword' },
	{ _id: 'LDAP_BaseDN', value: 'ou=others,dc=space,dc=air' },
	{ _id: 'LDAP_User_Search_Field', value: 'uid' },
	{ _id: 'LDAP_Username_Field', value: 'uid' },
	{ _id: 'LDAP_Email_Field', value: 'mail' },
	{ _id: 'LDAP_Name_Field', value: 'cn' },
	{ _id: 'LDAP_Sync_User_Avatar', value: true },
	{ _id: 'LDAP_Avatar_Field', value: 'jpegPhoto' },
	{ _id: 'LDAP_Find_User_After_Login', value: false },
	{ _id: 'LDAP_Background_Sync', value: false },
	{ _id: 'LDAP_Background_Sync_Avatars', value: false },
	{ _id: 'LDAP_Background_Sync_ABAC_Attributes', value: false },
	{ _id: 'LDAP_Default_Domain', value: '' },
];

const deleteLdapUsers = () =>
	Promise.all(
		[ldapLoginUsername, ldapAvatarUsername, ldapSyncUsername, ldapNoEmailUsername].map((username) =>
			request.post(api('users.delete')).set(credentials).send({ username }),
		),
	);

const waitForLdapConnection = () =>
	retry(
		'LDAP settings propagation',
		async () => {
			await request
				.post(api('ldap.testConnection'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});
		},
		{ delayMs: 1_000 },
	);

(IS_EE ? describe : describe.skip)('LDAP', () => {
	before((_t, done) => getCredentials(done));

	let originalSettings: Setting[] | undefined;

	before(async () => {
		originalSettings = await Promise.all(
			[...ldapSettings.map(({ _id }) => _id), 'LDAP_Enable'].map(async (_id) => ({
				_id,
				value: await getSettingValueById(_id),
			})),
		);

		await updatePermission('test-admin-options', ['admin']);
		await deleteLdapUsers();
		await Promise.all(ldapSettings.map(({ _id, value }) => updateSetting(_id, value)));
		await updateSetting('LDAP_Enable', true);
		await waitForLdapConnection();
	});

	after(async () => {
		if (!originalSettings) {
			await deleteLdapUsers();
			return;
		}

		await Promise.all([deleteLdapUsers(), ...originalSettings.map(({ _id, value }) => updateSetting(_id, value))]);
	});

	describe('[/ldap.syncNow]', () => {
		describe('when LDAP is disabled', () => {
			before(async () => {
				await updateSetting('LDAP_Enable', false);
			});

			after(async () => {
				await updateSetting('LDAP_Enable', true);
				await waitForLdapConnection();
			});

			it('should throw an error when LDAP is disabled', async () => {
				await request
					.post(api('ldap.syncNow'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'LDAP_disabled');
					});
			});
		});

		describe('when nothing is set to sync', () => {
			it('should report that nothing is enabled to sync', async () => {
				const res = await request.post(api('ldap.syncNow')).set(credentials).expect('Content-Type', 'application/json').expect(400);

				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error', 'LDAP_Background_Sync_disabled');
			});
		});

		describe('when only ABAC attribute sync is enabled but ABAC is off', () => {
			before(async () => {
				await updateSetting('LDAP_Background_Sync_ABAC_Attributes', true);
			});

			after(async () => {
				await updateSetting('LDAP_Background_Sync_ABAC_Attributes', false);
			});

			it('should report that nothing is enabled to sync', async () => {
				const res = await request.post(api('ldap.syncNow')).set(credentials).expect('Content-Type', 'application/json').expect(400);

				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error', 'LDAP_Background_Sync_disabled');
			});
		});

		describe('when only avatar sync is enabled', () => {
			before(async () => {
				await updateSetting('LDAP_Background_Sync_Avatars', true);
			});

			after(async () => {
				await updateSetting('LDAP_Background_Sync_Avatars', false);
			});

			it('should still run the sync', async () => {
				const res = await request.post(api('ldap.syncNow')).set(credentials).expect('Content-Type', 'application/json').expect(200);

				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('message', 'Sync_in_progress');
			});

			describe('when the LDAP server is unreachable', () => {
				before(async () => {
					await updateSetting('LDAP_Port', 1);
				});

				after(async () => {
					await updateSetting('LDAP_Port', 1389);
					await waitForLdapConnection();
				});

				it('should report the error that stopped the sync', async () => {
					await retry(
						'LDAP settings propagation',
						async () => {
							const res = await request.post(api('ldap.syncNow')).set(credentials).expect('Content-Type', 'application/json').expect(400);

							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.property('error', 'LDAP_Sync_failed');
						},
						{ delayMs: 1_000 },
					);
				});
			});
		});

		describe('when LDAP is enabled', () => {
			const syncSettings: Setting[] = [
				{ _id: 'LDAP_User_Search_Filter', value: `(uid=${ldapSyncUsername})` },
				{ _id: 'LDAP_Background_Sync_Import_New_Users', value: true },
				{ _id: 'LDAP_Background_Sync_Keep_Existant_Users_Updated', value: false },
			];
			let originalSyncSettings: Setting[] = [];

			before(async () => {
				originalSyncSettings = await Promise.all(syncSettings.map(async ({ _id }) => ({ _id, value: await getSettingValueById(_id) })));
				await Promise.all(syncSettings.map(({ _id, value }) => updateSetting(_id, value)));
				await updateSetting('LDAP_Background_Sync', true);
				await waitForLdapConnection();
			});

			after(async () => {
				await updateSetting('LDAP_Background_Sync', false);
				await Promise.all(originalSyncSettings.map(({ _id, value }) => updateSetting(_id, value)));
			});

			it('should synchronize a new LDAP user successfully', async () => {
				await request.get(api('users.info')).set(credentials).query({ username: ldapSyncUsername }).expect(400);

				await request
					.post(api('ldap.syncNow'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('message', 'Sync_in_progress');
					});

				await request
					.get(api('users.info'))
					.set(credentials)
					.query({ username: ldapSyncUsername })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.user).to.include({ username: ldapSyncUsername, name: 'LDAP Sync' });
						expect(res.body.user.emails.map(({ address }: { address: string }) => address)).to.include('ldap.sync@space.air');
					});

				for (const username of [ldapLoginUsername, ldapAvatarUsername]) {
					await request.get(api('users.info')).set(credentials).query({ username }).expect(400);
				}
			});

			describe('when an existing LDAP user has no email', () => {
				before(async () => {
					await updateSetting('LDAP_BaseDN', 'ou=users,dc=space,dc=air');
					await updateSetting('LDAP_User_Search_Filter', `(uid=${ldapNoEmailUsername})`);
					await updateSetting('LDAP_Default_Domain', 'space.air');
					await waitForLdapConnection();
					await request.post(api('ldap.syncNow')).set(credentials).expect(200);

					await updateSetting('LDAP_Default_Domain', '');
					await updateSetting('LDAP_Background_Sync_Import_New_Users', false);
					await updateSetting('LDAP_Background_Sync_Keep_Existant_Users_Updated', true);
					await updateSetting('LDAP_BaseDN', 'dc=space,dc=air');
					await updateSetting('LDAP_User_Search_Filter', `(|(uid=${ldapSyncUsername})(uid=${ldapNoEmailUsername}))`);
					await waitForLdapConnection();

					const { body } = await request.get(api('users.info')).set(credentials).query({ username: ldapSyncUsername }).expect(200);
					await request
						.post(api('users.update'))
						.set(credentials)
						.send({ userId: body.user._id, data: { name: 'Renamed In Rocket.Chat' } })
						.expect(200);
				});

				after(async () => {
					await updateSetting('LDAP_BaseDN', 'ou=others,dc=space,dc=air');
					await waitForLdapConnection();
				});

				it('should skip that user and still update the other existing users', async () => {
					await retry(
						'LDAP settings propagation',
						async () => {
							await request
								.post(api('ldap.syncNow'))
								.set(credentials)
								.expect('Content-Type', 'application/json')
								.expect(200)
								.expect((res: Response) => {
									expect(res.body).to.have.property('success', true);
									expect(res.body).to.have.property('message', 'Sync_in_progress');
								});

							await request
								.get(api('users.info'))
								.set(credentials)
								.query({ username: ldapSyncUsername })
								.expect(200)
								.expect((res: Response) => {
									expect(res.body.user).to.have.property('name', 'LDAP Sync');
								});
						},
						{ delayMs: 1_000 },
					);
				});
			});
		});
	});

	describe('[/ldap.testSearch]', () => {
		describe('without test-admin-options permission', () => {
			before(async () => {
				await updatePermission('test-admin-options', []);
			});

			after(async () => {
				await updatePermission('test-admin-options', ['admin']);
			});

			it('should not allow testing LDAP search if user does NOT have the test-admin-options permission', async () => {
				await request
					.post(api('ldap.testSearch'))
					.set(credentials)
					.send({
						username: 'test-search',
					})
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-forbidden');
					});
			});
		});

		it('should find the requested LDAP user', async () => {
			await request
				.post(api('ldap.testSearch'))
				.set(credentials)
				.send({ username: ldapLoginUsername })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('message', 'LDAP_User_Found');
				});
		});

		it('should report that no LDAP user matches an unknown username', async () => {
			await request
				.post(api('ldap.testSearch'))
				.set(credentials)
				.send({ username: 'ldap.does-not-exist' })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'LDAP_User_not_found');
				});
		});
	});

	describe('with a wrong authentication password', () => {
		before(async () => {
			await updateSetting('LDAP_Authentication_Password', 'wrong-password');
		});

		after(async () => {
			await updateSetting('LDAP_Authentication_Password', 'adminpassword');
			await waitForLdapConnection();
		});

		it('should fail the connection test with the bind error', async () => {
			await retry(
				'LDAP settings propagation',
				async () => {
					await request
						.post(api('ldap.testConnection'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res: Response) => {
							expect(res.body).to.have.property('error', 'LDAP_Bind_failed');
							expect(res.body).to.have.nested.property('details.error').that.is.a('string').and.not.empty;
						});
				},
				{ delayMs: 1_000 },
			);
		});

		it('should fail the search test with the bind error instead of searching anonymously', async () => {
			await request
				.post(api('ldap.testSearch'))
				.set(credentials)
				.send({ username: ldapLoginUsername })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('error', 'LDAP_Bind_failed');
					expect(res.body).to.have.nested.property('details.error').that.is.a('string').and.not.empty;
				});
		});
	});

	describe('[/ldap.testConnection]', () => {
		describe('without test-admin-options permission', () => {
			before(async () => {
				await updatePermission('test-admin-options', []);
			});

			after(async () => {
				await updatePermission('test-admin-options', ['admin']);
			});

			it('should not allow testing LDAP connection if user does NOT have the test-admin-options permission', async () => {
				await request
					.post(api('ldap.testConnection'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-forbidden');
					});
			});
		});

		it('should connect to LDAP successfully', async () => {
			await request
				.post(api('ldap.testConnection'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('message', 'LDAP_Connection_successful');
				});
		});
	});

	describe('[/login]', () => {
		it('should log in with LDAP credentials and synchronize mapped profile data', async () => {
			const loginResponse = await request
				.post(api('login'))
				.send({ user: ldapLoginUsername, password: 'ldappassword' })
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(loginResponse.body).to.have.property('status', 'success');
			expect(loginResponse.body.data.me).to.include({
				username: ldapLoginUsername,
				name: 'LDAP E2E',
			});
			expect(loginResponse.body.data.me.emails.map(({ address }: { address: string }) => address)).to.include('ldap.e2e@space.air');
		});

		it('should synchronize the LDAP avatar on login', async () => {
			const loginResponse = await request
				.post(api('login'))
				.send({ user: ldapAvatarUsername, password: 'ldappassword' })
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(loginResponse.body).to.have.property('status', 'success');

			const { userId, authToken } = loginResponse.body.data;

			const avatarResponse = await request
				.get(`/avatar/${ldapAvatarUsername}`)
				.set({ cookie: `rc_uid=${userId}; rc_token=${authToken}` })
				.buffer(true)
				.expect('Content-Type', 'image/jpeg')
				.expect(200);
			const metadata = await sharp(avatarResponse.body as Buffer).metadata();
			const stats = await sharp(avatarResponse.body as Buffer).stats();
			const avatarChannels = stats.channels.slice(0, 3);

			expect(metadata.format).to.equal('jpeg');
			expect(metadata.width).to.equal(200);
			expect(metadata.height).to.equal(200);
			expect(avatarChannels.map(({ min }) => min)).to.deep.equal(ldapAvatarRgb);
			expect(avatarChannels.map(({ max }) => max)).to.deep.equal(ldapAvatarRgb);
		});
	});

	describe('with the group filter enabled', () => {
		const groupMember = 'alan.bean';
		const nonMember = 'neil.armstrong';
		const syncedMember = 'buzz.aldrin';
		const syncedNonMember = 'james.irwin';
		const groupFilterSettings: Setting[] = [
			{ _id: 'LDAP_BaseDN', value: 'dc=space,dc=air' },
			{ _id: 'LDAP_Group_Filter_Enable', value: true },
			{ _id: 'LDAP_Group_Filter_ObjectClass', value: 'groupOfNames' },
			{ _id: 'LDAP_Group_Filter_Group_Id_Attribute', value: 'cn' },
			{ _id: 'LDAP_Group_Filter_Group_Member_Attribute', value: 'member' },
			{ _id: 'LDAP_Group_Filter_Group_Member_Format', value: '#{userdn}' },
			{ _id: 'LDAP_Group_Filter_Group_Name', value: 'astronauts' },
		];
		let originalGroupFilterSettings: Setting[] = [];

		const deleteGroupFilterUsers = () =>
			Promise.all(
				[groupMember, nonMember, syncedMember, syncedNonMember].map((username) =>
					request.post(api('users.delete')).set(credentials).send({ username }),
				),
			);

		before(async () => {
			originalGroupFilterSettings = await Promise.all(
				groupFilterSettings.map(async ({ _id }) => ({ _id, value: await getSettingValueById(_id) })),
			);
			await deleteGroupFilterUsers();
			await Promise.all(groupFilterSettings.map(({ _id, value }) => updateSetting(_id, value)));
			await waitForLdapConnection();
		});

		after(async () => {
			await deleteGroupFilterUsers();
			await Promise.all(originalGroupFilterSettings.map(({ _id, value }) => updateSetting(_id, value)));
			await waitForLdapConnection();
		});

		it('should log in a member of the group', async () => {
			const res = await request
				.post(api('login'))
				.send({ user: groupMember, password: 'ldappassword' })
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.property('status', 'success');
			expect(res.body.data.me).to.have.property('username', groupMember);
		});

		it('should refuse a user who is not a member of the group', async () => {
			const res = await request
				.post(api('login'))
				.send({ user: nonMember, password: 'ldappassword' })
				.expect('Content-Type', 'application/json')
				.expect(401);

			expect(res.body).to.have.property('error', 'Unauthorized');
			await request.get(api('users.info')).set(credentials).query({ username: nonMember }).expect(400);
		});

		describe('when LDAP sync runs', () => {
			const syncSettings: Setting[] = [
				{ _id: 'LDAP_User_Search_Filter', value: `(|(uid=${syncedMember})(uid=${syncedNonMember}))` },
				{ _id: 'LDAP_Background_Sync', value: true },
				{ _id: 'LDAP_Background_Sync_Import_New_Users', value: true },
				{ _id: 'LDAP_Background_Sync_Keep_Existant_Users_Updated', value: false },
			];
			let originalSyncSettings: Setting[] = [];

			before(async () => {
				originalSyncSettings = await Promise.all(syncSettings.map(async ({ _id }) => ({ _id, value: await getSettingValueById(_id) })));
				await Promise.all(syncSettings.map(({ _id, value }) => updateSetting(_id, value)));
				await waitForLdapConnection();
			});

			after(async () => {
				await Promise.all(originalSyncSettings.map(({ _id, value }) => updateSetting(_id, value)));
			});

			it('should import only the members of the group', async () => {
				await request.post(api('ldap.syncNow')).set(credentials).expect('Content-Type', 'application/json').expect(200);

				const res = await request.get(api('users.info')).set(credentials).query({ username: syncedMember }).expect(200);

				expect(res.body.user).to.include({ username: syncedMember, name: 'Buzz Aldrin' });
				await request.get(api('users.info')).set(credentials).query({ username: syncedNonMember }).expect(400);
			});
		});
	});

	describe('with LDAP groups mapped to Rocket.Chat', () => {
		const astronaut = 'gene.cernan';
		const cosmonaut = 'yuri.romanenko';
		const suffix = Date.now();
		const astronautsChannel = `ldap-astronauts-${suffix}`;
		const cosmonautsChannel = `ldap-cosmonauts-${suffix}`;
		const astronautsTeam = `ldap-astronauts-team-${suffix}`;
		const groupFilter = '(&(cn=#{groupName})(member=#{userdn}))';
		const mappingSettings: Setting[] = [
			{ _id: 'LDAP_BaseDN', value: 'dc=space,dc=air' },
			{ _id: 'LDAP_Sync_User_Data_Roles', value: false },
			{ _id: 'LDAP_Sync_User_Data_Roles_AutoRemove', value: false },
			{ _id: 'LDAP_Sync_User_Data_Roles_BaseDN', value: 'dc=space,dc=air' },
			{ _id: 'LDAP_Sync_User_Data_Roles_Filter', value: groupFilter },
			{ _id: 'LDAP_Sync_User_Data_Roles_GroupMembershipValidationStrategy', value: 'each_group' },
			{ _id: 'LDAP_Sync_User_Data_RolesMap', value: '{}' },
			{ _id: 'LDAP_Sync_User_Data_Channels', value: false },
			{ _id: 'LDAP_Sync_User_Data_Channels_Admin', value: 'rocket.cat' },
			{ _id: 'LDAP_Sync_User_Data_Channels_BaseDN', value: 'dc=space,dc=air' },
			{ _id: 'LDAP_Sync_User_Data_Channels_Filter', value: groupFilter },
			{ _id: 'LDAP_Sync_User_Data_Channels_GroupMembershipValidationStrategy', value: 'each_group' },
			{ _id: 'LDAP_Sync_User_Data_ChannelsMap', value: '{}' },
			{ _id: 'LDAP_Sync_User_Data_Channels_Enforce_AutoChannels', value: false },
			{ _id: 'LDAP_Enable_LDAP_Groups_To_RC_Teams', value: false },
			{ _id: 'LDAP_Teams_BaseDN', value: 'dc=space,dc=air' },
			{ _id: 'LDAP_Teams_Name_Field', value: 'cn' },
			{ _id: 'LDAP_Query_To_Get_User_Teams', value: '(&(objectClass=groupOfNames)(member=#{userdn}))' },
			{ _id: 'LDAP_Groups_To_Rocket_Chat_Teams', value: '{}' },
			{ _id: 'LDAP_Validate_Teams_For_Each_Login', value: false },
		];
		let originalMappingSettings: Setting[] = [];

		const deleteMappedUsers = () =>
			Promise.all([astronaut, cosmonaut].map((username) => request.post(api('users.delete')).set(credentials).send({ username })));

		const ldapLogin = (username: string) => login(username, 'ldappassword');

		const getUser = async (username: string) =>
			(await request.get(api('users.info')).set(credentials).query({ username }).expect(200)).body.user;

		const getChannelMembers = async (roomName: string) => {
			const res = await request.get(api('channels.members')).set(credentials).query({ roomName }).expect(200);
			return res.body.members.map(({ username }: { username: string }) => username);
		};

		before(async () => {
			originalMappingSettings = await Promise.all(mappingSettings.map(async ({ _id }) => ({ _id, value: await getSettingValueById(_id) })));
			await deleteMappedUsers();
			await Promise.all(mappingSettings.map(({ _id, value }) => updateSetting(_id, value)));
			await waitForLdapConnection();
		});

		after(async () => {
			await deleteMappedUsers();
			await Promise.all(originalMappingSettings.map(({ _id, value }) => updateSetting(_id, value)));
			await waitForLdapConnection();
		});

		describe('to roles', () => {
			let roleId: string;

			before(async () => {
				const res = await request
					.post(api('roles.create'))
					.set(credentials)
					.send({ name: `ldap-astronaut-${suffix}`, scope: 'Users' });
				roleId = res.body.role._id;
				await updateSetting('LDAP_Sync_User_Data_RolesMap', JSON.stringify({ astronauts: roleId }));
				await updateSetting('LDAP_Sync_User_Data_Roles', true);
			});

			after(async () => {
				await deleteMappedUsers();
				await updateSetting('LDAP_Sync_User_Data_Roles', false);
				await updateSetting('LDAP_Sync_User_Data_Roles_AutoRemove', false);
				await updateSetting('LDAP_Sync_User_Data_RolesMap', '{}');
				await request.post(api('roles.delete')).set(credentials).send({ roleId });
			});

			it('should give the mapped role to a member of the group on login', async () => {
				await ldapLogin(astronaut);
				await ldapLogin(cosmonaut);

				expect((await getUser(astronaut)).roles).to.include(roleId);
				expect((await getUser(cosmonaut)).roles).to.not.include(roleId);
			});

			it('should keep a mapped role the user got outside LDAP when auto-remove is off', async () => {
				await request.post(api('roles.addUserToRole')).set(credentials).send({ roleId, username: cosmonaut }).expect(200);

				await ldapLogin(cosmonaut);

				expect((await getUser(cosmonaut)).roles).to.include(roleId);
			});

			it('should take a mapped role from a user outside the group when auto-remove is on', async () => {
				expect((await getUser(cosmonaut)).roles).to.include(roleId);
				await updateSetting('LDAP_Sync_User_Data_Roles_AutoRemove', true);

				await ldapLogin(cosmonaut);

				expect((await getUser(cosmonaut)).roles).to.not.include(roleId);
			});
		});

		describe('to channels', () => {
			before(async () => {
				await updateSetting(
					'LDAP_Sync_User_Data_ChannelsMap',
					JSON.stringify({ astronauts: astronautsChannel, cosmonauts: cosmonautsChannel }),
				);
				await updateSetting('LDAP_Sync_User_Data_Channels', true);
			});

			after(async () => {
				await deleteMappedUsers();
				await updateSetting('LDAP_Sync_User_Data_Channels', false);
				await updateSetting('LDAP_Sync_User_Data_Channels_Enforce_AutoChannels', false);
				await updateSetting('LDAP_Sync_User_Data_ChannelsMap', '{}');
				await Promise.all(
					[astronautsChannel, cosmonautsChannel].map((roomName) =>
						request.post(api('channels.delete')).set(credentials).send({ roomName }),
					),
				);
			});

			it('should create the mapped channel and add the member of the group on login', async () => {
				await ldapLogin(astronaut);

				const res = await request.get(api('channels.info')).set(credentials).query({ roomName: astronautsChannel }).expect(200);
				expect(res.body.channel.u).to.have.property('username', 'rocket.cat');
				expect(await getChannelMembers(astronautsChannel)).to.include(astronaut);
			});

			it('should remove a user from the channel of a group they are not in when the mapping is enforced', async () => {
				await ldapLogin(cosmonaut);
				const { _id: userId } = await getUser(cosmonaut);
				const { body } = await request.get(api('channels.info')).set(credentials).query({ roomName: astronautsChannel }).expect(200);
				await request.post(api('channels.invite')).set(credentials).send({ roomId: body.channel._id, userId }).expect(200);
				await updateSetting('LDAP_Sync_User_Data_Channels_Enforce_AutoChannels', true);

				await ldapLogin(cosmonaut);

				expect(await getChannelMembers(astronautsChannel)).to.not.include(cosmonaut);
				expect(await getChannelMembers(cosmonautsChannel)).to.include(cosmonaut);
			});
		});

		describe('to teams', () => {
			const getTeamMembers = async () => {
				const res = await request.get(api('teams.members')).set(credentials).query({ teamName: astronautsTeam }).expect(200);
				return res.body.members.map(({ user }: { user: { username: string } }) => user.username);
			};

			before(async () => {
				await createTeam(credentials, astronautsTeam, 0);
				await updateSetting('LDAP_Groups_To_Rocket_Chat_Teams', JSON.stringify({ astronauts: [astronautsTeam] }));
				await updateSetting('LDAP_Enable_LDAP_Groups_To_RC_Teams', true);
				await updateSetting('LDAP_Validate_Teams_For_Each_Login', true);
			});

			after(async () => {
				await deleteMappedUsers();
				await updateSetting('LDAP_Enable_LDAP_Groups_To_RC_Teams', false);
				await updateSetting('LDAP_Validate_Teams_For_Each_Login', false);
				await updateSetting('LDAP_Groups_To_Rocket_Chat_Teams', '{}');
				await deleteTeam(credentials, astronautsTeam);
			});

			it('should add a member of the group to the mapped team on login', async () => {
				await ldapLogin(astronaut);

				expect(await getTeamMembers()).to.include(astronaut);
			});

			it('should remove a user who is not in the group from the mapped team on login', async () => {
				await ldapLogin(cosmonaut);
				const { _id: userId } = await getUser(cosmonaut);
				await request
					.post(api('teams.addMembers'))
					.set(credentials)
					.send({ teamName: astronautsTeam, members: [{ userId, roles: ['member'] }] })
					.expect(200);

				await ldapLogin(cosmonaut);

				expect(await getTeamMembers()).to.not.include(cosmonaut);
			});
		});

		describe('when the sync looks for users that left LDAP', () => {
			const syncSettings: Setting[] = [
				{ _id: 'LDAP_Background_Sync', value: true },
				{ _id: 'LDAP_Background_Sync_Import_New_Users', value: false },
				{ _id: 'LDAP_Background_Sync_Keep_Existant_Users_Updated', value: true },
				{ _id: 'LDAP_Background_Sync_Disable_Missing_Users', value: false },
			];
			let originalSyncSettings: Setting[] = [];

			const leaveLdapAndSync = async () => {
				await updateSetting('LDAP_BaseDN', 'ou=others,dc=space,dc=air');
				await waitForLdapConnection();
				await request.post(api('ldap.syncNow')).set(credentials).expect(200);
			};

			before(async () => {
				originalSyncSettings = await Promise.all(syncSettings.map(async ({ _id }) => ({ _id, value: await getSettingValueById(_id) })));
				await Promise.all(syncSettings.map(({ _id, value }) => updateSetting(_id, value)));
			});

			beforeEach(async () => {
				await deleteMappedUsers();
				await updateSetting('LDAP_BaseDN', 'dc=space,dc=air');
				await waitForLdapConnection();
				await ldapLogin(astronaut);
			});

			after(async () => {
				await deleteMappedUsers();
				await updateSetting('LDAP_BaseDN', 'dc=space,dc=air');
				await Promise.all(originalSyncSettings.map(({ _id, value }) => updateSetting(_id, value)));
			});

			it('should keep a user who left LDAP active when missing users are not disabled', async () => {
				await leaveLdapAndSync();

				expect(await getUser(astronaut)).to.have.property('active', true);
			});

			it('should deactivate a user who left LDAP when missing users are disabled', async () => {
				await updateSetting('LDAP_Background_Sync_Disable_Missing_Users', true);

				await leaveLdapAndSync();

				expect(await getUser(astronaut)).to.have.property('active', false);
			});
		});
	});

	describe('when the avatar sync runs', () => {
		before(async () => {
			await login(ldapAvatarUsername, 'ldappassword');
			await request.post(api('users.resetAvatar')).set(credentials).send({ username: ldapAvatarUsername }).expect(200);
			await updateSetting('LDAP_Background_Sync_Avatars', true);
		});

		after(async () => {
			await updateSetting('LDAP_Background_Sync_Avatars', false);
			await request.post(api('users.delete')).set(credentials).send({ username: ldapAvatarUsername });
		});

		const getAvatar = () =>
			request
				.get(`/avatar/${ldapAvatarUsername}`)
				.set({ cookie: `rc_uid=${credentials['X-User-Id']}; rc_token=${credentials['X-Auth-Token']}` })
				.buffer(true)
				.expect(200);

		it('should set the LDAP avatar of a user who logged in before avatars were synced', async () => {
			expect((await getAvatar()).headers['content-type']).to.not.equal('image/jpeg');

			await request.post(api('ldap.syncNow')).set(credentials).expect(200);

			const avatarResponse = await getAvatar().expect('Content-Type', 'image/jpeg');
			const stats = await sharp(avatarResponse.body as Buffer).stats();
			expect(stats.channels.slice(0, 3).map(({ min }) => min)).to.deep.equal(ldapAvatarRgb);
		});
	});

	describe('[/ldap.syncNow] without the sync-auth-services-users permission', () => {
		let user: Awaited<ReturnType<typeof createUser>>;
		let userCredentials: Awaited<ReturnType<typeof login>>;

		before(async () => {
			user = await createUser();
			userCredentials = await login(user.username, password);
		});

		after(() => deleteUser(user));

		it('should refuse to run the sync', async () => {
			const res = await request.post(api('ldap.syncNow')).set(userCredentials).expect('Content-Type', 'application/json').expect(403);

			expect(res.body).to.have.property('success', false);
		});
	});
});
