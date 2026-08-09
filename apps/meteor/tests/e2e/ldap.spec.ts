import type { ISetting } from '@rocket.chat/core-typings';

import * as constants from './config/constants';
import { Login } from './page-objects';
import { getSettingValueById } from './utils/getSettingValueById';
import { getUserInfo } from './utils/getUserInfo';
import { setSettingValueById } from './utils/setSettingValueById';
import type { BaseTest } from './utils/test';
import { test, expect } from './utils/test';

const ldapUsername = 'ldap.e2e';

type Setting = {
	_id: ISetting['_id'];
	value: unknown;
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

const setSetting = async (api: BaseTest['api'], { _id, value }: Setting) => {
	const response = await setSettingValueById(api, _id, value);
	expect(response.status(), `Failed to update setting ${_id}`).toBe(200);
};

const applyLdapSettings = async (api: BaseTest['api'], settings: Setting[], enabled: boolean) => {
	await setSetting(api, { _id: 'LDAP_Enable', value: false });
	await Promise.all(settings.map((setting) => setSetting(api, setting)));
	await setSetting(api, { _id: 'LDAP_Enable', value: enabled });
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
				timeout: 15_000,
			},
		)
		.toBe(true);
};

const deleteLdapUser = async (api: BaseTest['api']) => {
	const response = await api.post('/users.delete', { username: ldapUsername });

	if (response.ok()) {
		return;
	}

	expect(response.status()).toBe(400);
	const result = await response.json();
	expect(result.errorType).toBe('error-invalid-user');
};

test.describe('LDAP', () => {
	test.skip(!constants.IS_EE);
	let originalSettings: Setting[] | undefined;

	test.beforeAll(async ({ api }) => {
		originalSettings = await Promise.all(
			[...ldapSettings.map(({ _id }) => _id), 'LDAP_Enable'].map(async (_id) => ({
				_id,
				value: await getSettingValueById(api, _id),
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

	test('connection', async ({ api }) => {
		await test.step('expect to successfully execute a connection test', async () => {
			const response = await api.post('/ldap.testConnection', {});
			expect(response.status()).toBe(200);
			const result = await response.json();
			expect(result.success).toBe(true);
		});
	});

	test('user search', async ({ api }) => {
		await test.step('expect to successfully search for LDAP users', async () => {
			const response = await api.post('/ldap.testSearch', {
				username: ldapUsername,
			});
			expect(response.status()).toBe(200);
			const result = await response.json();
			expect(result.success).toBe(true);
		});
	});

	test('login using LDAP credentials', async ({ page, api }) => {
		const poLogin = new Login(page);
		await page.goto('/home');

		await test.step('expect to be able to login with LDAP credentials', async () => {
			await poLogin.waitForDisplay();
			await poLogin.login(ldapUsername, 'ldappassword');

			await expect(page).toHaveURL('/home');
			await expect(page.getByRole('button', { name: 'User menu' })).toBeVisible();
		});

		await test.step('expect LDAP user data to have been mapped to the correct fields', async () => {
			const user = await getUserInfo(api, ldapUsername);

			expect(user).toBeDefined();
			expect(user?.username).toBe(ldapUsername);
			expect(user?.name).toBe('LDAP E2E');
			expect(user?.emails).toBeDefined();
			expect(user?.emails?.[0].address).toBe('ldap.e2e@space.air');
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
