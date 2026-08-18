import type { ISetting } from '@rocket.chat/core-typings';

import { IS_EE } from './config/constants';
import { AccountProfile, Login } from './page-objects';
import { getSettingValueById } from './utils/getSettingValueById';
import { saveSettings } from './utils/saveSettings';
import type { BaseTest } from './utils/test';
import { test, expect } from './utils/test';

const ldapUsername = 'ldap.e2e';

type Setting = {
	_id: ISetting['_id'];
	value: ISetting['value'];
};

const ldapSettings: Setting[] = [
	{ _id: 'Accounts_ManuallyApproveNewUsers', value: false },
	{ _id: 'LDAP_Server_Type', value: '' },
	{ _id: 'LDAP_Host', value: process.env.CI === 'true' ? 'openldap' : 'localhost' },
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

const applyLdapSettings = async (api: BaseTest['api'], settings: Setting[], enabled: boolean) => {
	const response = await saveSettings(api, [...settings, { _id: 'LDAP_Enable', value: enabled }]);
	expect(response.status(), 'Failed to update LDAP settings').toBe(200);
};

const waitForLdapConnection = async (api: BaseTest['api']) => {
	await expect
		.poll(
			async () => {
				const connectionResponse = await api.post('/ldap.testConnection', {});
				if (!connectionResponse.ok()) {
					return false;
				}

				const result = await connectionResponse.json();
				return result.success;
			},
			{
				message: 'LDAP settings did not propagate to the running server',
			},
		)
		.toBe(true);
};

const deleteLdapUser = (api: BaseTest['api']) => api.post('/users.delete', { username: ldapUsername });

test.describe('LDAP', () => {
	test.skip(!IS_EE);
	let originalSettings: Setting[] | undefined;

	test.beforeAll(async ({ api }) => {
		originalSettings = await Promise.all(
			[...ldapSettings.map(({ _id }) => _id), 'LDAP_Enable'].map(async (_id) => ({
				_id,
				value: (await getSettingValueById(api, _id)) as ISetting['value'],
			})),
		);

		await deleteLdapUser(api);
		await applyLdapSettings(api, ldapSettings, true);
		await waitForLdapConnection(api);
	});

	test.afterAll(async ({ api }) => {
		if (!originalSettings) {
			await deleteLdapUser(api);
			return;
		}

		const originalEnabled = Boolean(originalSettings.find(({ _id }) => _id === 'LDAP_Enable')?.value);
		await Promise.all([
			applyLdapSettings(
				api,
				originalSettings.filter(({ _id }) => _id !== 'LDAP_Enable'),
				originalEnabled,
			),
			deleteLdapUser(api),
		]);
	});

	test('should connect to LDAP successfully', async ({ api }) => {
		const response = await api.post('/ldap.testConnection', {});
		expect(response.status()).toBe(200);
		const result = await response.json();
		expect(result.success).toBe(true);
	});

	test('should find the requested LDAP user', async ({ api }) => {
		const response = await api.post('/ldap.testSearch', {
			username: ldapUsername,
		});
		expect(response.status()).toBe(200);
		const result = await response.json();
		expect(result.success).toBe(true);
		expect(result.message).toBe('LDAP_User_Found');
	});

	test('should log in with LDAP credentials and synchronize mapped profile data', async ({ page }) => {
		const poLogin = new Login(page);
		const poAccountProfile = new AccountProfile(page);
		await page.goto('/home');

		await test.step('expect to be able to login with LDAP credentials', async () => {
			await poLogin.waitForDisplay();
			await poLogin.login(ldapUsername, 'ldappassword');

			await expect(page.getByRole('button', { name: 'User menu' })).toBeVisible();
		});

		await test.step('expect LDAP user data to have been mapped to the correct fields', async () => {
			await page.goto('/account/profile');
			await expect(poAccountProfile.inputUsername).toHaveValue(ldapUsername);
			await expect(poAccountProfile.inputName).toHaveValue('LDAP E2E');
			await expect(poAccountProfile.emailTextInput).toHaveValue('ldap.e2e@space.air');
		});

		await test.step('expect LDAP user avatar to have been synchronized', async () => {
			const response = await page.request.get(`/avatar/${ldapUsername}`);

			expect(response.status()).toBe(200);
			expect(response.headers()['content-type']).toBe('image/jpeg');
			expect(await response.body()).toMatchSnapshot('ldap-avatar.jpeg', {
				maxDiffPixelRatio: 0.01,
			});
		});
	});
});
