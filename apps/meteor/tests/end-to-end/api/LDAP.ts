import type { ISetting } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, after, describe, it } from 'mocha';
import sharp from 'sharp';
import type { Response } from 'supertest';

import { retry } from './helpers/retry';
import { getCredentials, api, request, credentials } from '../../data/api-data';
import { getSettingValueById, updatePermission } from '../../data/permissions.helper';
import { IS_EE } from '../../e2e/config/constants';

const ldapUsername = 'ldap.e2e';
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
];

const applyLdapSettings = (settings: Setting[], enabled: boolean) =>
	request
		.post(api('settings'))
		.set(credentials)
		.send({ settings: [...settings, { _id: 'LDAP_Enable', value: enabled }] })
		.expect('Content-Type', 'application/json')
		.expect(200);

const deleteLdapUser = () => request.post(api('users.delete')).set(credentials).send({ username: ldapUsername });

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

describe('LDAP', function () {
	this.retries(0);
	before((done) => getCredentials(done));

	describe('[/ldap.syncNow]', () => {
		it('should throw an error containing totp-required error when not running EE', async function () {
			// TODO this is not the right way to do it. We're doing this way for now just because we have separate CI jobs for EE and CE,
			// ideally we should have a single CI job that adds a license and runs both CE and EE tests.
			if (IS_EE) {
				this.skip();
			}
			await request
				.post(api('ldap.syncNow'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'totp-required');
				});
		});

		it('should throw an error of LDAP disabled when running EE', async function () {
			if (!IS_EE) {
				this.skip();
			}
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

	describe('[/ldap.testSearch]', () => {
		before(async () => {
			return updatePermission('test-admin-options', ['admin']);
		});

		after(async () => {
			return updatePermission('test-admin-options', ['admin']);
		});

		it('should not allow testing LDAP search if user does NOT have the test-admin-options permission', async () => {
			await updatePermission('test-admin-options', []);
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

	describe('[/ldap.testConnection]', () => {
		before(async () => {
			return updatePermission('test-admin-options', ['admin']);
		});

		after(async () => {
			return updatePermission('test-admin-options', ['admin']);
		});

		it('should not allow testing LDAP connection if user does NOT have the test-admin-options permission', async () => {
			await updatePermission('test-admin-options', []);
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

	(IS_EE ? describe : describe.skip)('configured LDAP integration', () => {
		let originalSettings: Setting[] | undefined;

		before(async () => {
			originalSettings = await Promise.all(
				[...ldapSettings.map(({ _id }) => _id), 'LDAP_Enable'].map(async (_id) => ({
					_id,
					value: await getSettingValueById(_id),
				})),
			);

			await deleteLdapUser();
			await applyLdapSettings(ldapSettings, true);
			await waitForLdapConnection();
		});

		after(async () => {
			if (!originalSettings) {
				await deleteLdapUser();
				return;
			}

			const originalEnabled = Boolean(originalSettings.find(({ _id }) => _id === 'LDAP_Enable')?.value);

			await Promise.all([
				deleteLdapUser(),
				applyLdapSettings(
					originalSettings.filter(({ _id }) => _id !== 'LDAP_Enable'),
					originalEnabled,
				),
			]);
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

		it('should find the requested LDAP user', async () => {
			await request
				.post(api('ldap.testSearch'))
				.set(credentials)
				.send({ username: ldapUsername })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('message', 'LDAP_User_Found');
				});
		});

		it('should log in with LDAP credentials and synchronize mapped profile data and avatar', async () => {
			const loginResponse = await request
				.post(api('login'))
				.send({ user: ldapUsername, password: 'ldappassword' })
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(loginResponse.body).to.have.property('status', 'success');
			expect(loginResponse.body.data.me).to.include({
				username: ldapUsername,
				name: 'LDAP E2E',
			});
			expect(loginResponse.body.data.me.emails.map(({ address }: { address: string }) => address)).to.include('ldap.e2e@space.air');

			const avatarResponse = await request.get(`/avatar/${ldapUsername}`).buffer(true).expect('Content-Type', 'image/jpeg').expect(200);
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
