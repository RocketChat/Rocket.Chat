import type { ISetting } from '@rocket.chat/core-typings';
import { MongoClient } from 'mongodb';

import * as constants from './config/constants';
import { Login } from './page-objects';
import { getSettingValueById } from './utils/getSettingValueById';
import { getUserInfo } from './utils/getUserInfo';
import { setSettingValueById } from './utils/setSettingValueById';
import type { BaseTest } from './utils/test';
import { test, expect } from './utils/test';

const ldapUsernames = ['alan.bean', 'john.young', 'buzz.aldrin'];

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
	{ _id: 'LDAP_BaseDN', value: 'ou=users,dc=space,dc=air' },
	{ _id: 'LDAP_User_Search_Field', value: 'uid' },
	{ _id: 'LDAP_Username_Field', value: 'uid' },
	{ _id: 'LDAP_Email_Field', value: 'mail' },
	{ _id: 'LDAP_Name_Field', value: 'cn' },
	{ _id: 'LDAP_Find_User_After_Login', value: false },
	{ _id: 'LDAP_Sync_User_Active_State', value: 'none' },
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

const resetTestData = async () => {
	const connection = await MongoClient.connect(constants.URL_MONGODB);

	try {
		await connection
			.db()
			.collection('users')
			.deleteMany({
				username: {
					$in: ldapUsernames,
				},
			});
	} finally {
		await connection.close();
	}
};

test.describe('LDAP', () => {
	test.skip(!constants.IS_EE, 'Enterprise only');
	let originalSettings: Setting[] | undefined;

	test.beforeAll(async ({ api }) => {
		originalSettings = await Promise.all(
			[...ldapSettings.map(({ _id }) => _id), 'LDAP_Enable'].map(async (_id) => ({
				_id,
				value: await getSettingValueById(api, _id),
			})),
		);

		await resetTestData();
		await applyLdapSettings(api, ldapSettings, true);
		await waitForLdapConnection(api);
	});

	test.afterAll(async ({ api }) => {
		if (!originalSettings) {
			await resetTestData();
			return;
		}

		const originalEnabled = Boolean(originalSettings.find(({ _id }) => _id === 'LDAP_Enable')?.value);
		await Promise.all([
			applyLdapSettings(
				api,
				originalSettings.filter(({ _id }) => _id !== 'LDAP_Enable'),
				originalEnabled,
			),
			resetTestData(),
		]);
	});

	test('Connection Test', async ({ api }) => {
		await test.step('Expect to successfully execute a connection test', async () => {
			const response = await api.post('/ldap.testConnection', {});
			expect(response.status()).toBe(200);
			const result = await response.json();
			expect(result.success).toBe(true);
		});
	});

	test('User Search Test', async ({ api }) => {
		await test.step('Expect to successfully search for LDAP users', async () => {
			const response = await api.post('/ldap.testSearch', {
				username: 'alan.bean',
			});
			expect(response.status()).toBe(200);
			const result = await response.json();
			expect(result.success).toBe(true);
		});
	});

	test('Login using LDAP credentials', async ({ page, api }) => {
		const poLogin = new Login(page);
		await page.goto('/home');

		await test.step('Expect to be able to login with LDAP credentials', async () => {
			await poLogin.waitForDisplay();
			await poLogin.login('alan.bean', 'ldappassword');

			await expect(page).toHaveURL('/home');
			await expect(page.getByRole('button', { name: 'User menu' })).toBeVisible();
		});

		await test.step('Expect LDAP user data to have been mapped to the correct fields', async () => {
			const user = await getUserInfo(api, 'alan.bean');

			expect(user).toBeDefined();
			expect(user?.username).toBe('alan.bean');
			expect(user?.name).toBe('Alan Bean');
			expect(user?.emails).toBeDefined();
			expect(user?.emails?.[0].address).toBe('alan.bean@space.air');
		});
	});
});
