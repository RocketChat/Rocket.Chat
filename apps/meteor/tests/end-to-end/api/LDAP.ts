import type { ISetting } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, after, describe, it } from 'mocha';
import sharp from 'sharp';
import type { Response } from 'supertest';

import { retry } from './helpers/retry';
import { getCredentials, api, request, credentials } from '../../data/api-data';
import { getSettingValueById, updatePermission, updateSetting } from '../../data/permissions.helper';
import { IS_EE } from '../../e2e/config/constants';

const ldapLoginUsername = 'ldap.e2e';
const ldapAvatarUsername = 'ldap.avatar';
const ldapSyncUsername = 'ldap.sync';
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
];

const deleteLdapUsers = () =>
	Promise.all(
		[ldapLoginUsername, ldapAvatarUsername, ldapSyncUsername].map((username) =>
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
	before((done) => getCredentials(done));

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
						expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
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
						expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
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
});
