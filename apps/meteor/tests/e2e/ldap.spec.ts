import child_process from 'child_process';
import path from 'path';

import { v2 as compose } from 'docker-compose';
import { MongoClient } from 'mongodb';

import * as constants from './config/constants';
import { Users } from './fixtures/userStates';
import { Registration } from './page-objects';
import { getUserInfo } from './utils/getUserInfo';
import { setSettingValueById } from './utils/setSettingValueById';
import type { BaseTest } from './utils/test';
import { test, expect } from './utils/test';

const resetTestData = async ({ api, cleanupOnly = false }: { api: BaseTest['api']; cleanupOnly?: boolean }) => {
	// Reset LDAP users' data on mongo in the beforeAll hook to allow re-running the tests within the same playwright session
	// This is needed because those tests will modify this data and running them a second time would trigger different code paths
	const connection = await MongoClient.connect(constants.URL_MONGODB);

	const usernamesToDelete = [...[Users.ldapuser1].map(({ data: { username } }) => username)];
	await connection
		.db()
		.collection('users')
		.deleteMany({
			username: {
				$in: usernamesToDelete,
			},
		});

	if (cleanupOnly) {
		return;
	}

	// In CI: Use container name for container-to-container communication
	const ldapHost = process.env.CI ? 'host.docker.internal' : 'localhost';

	const settings = [
		{ _id: 'Accounts_ManuallyApproveNewUsers', value: false },
		{ _id: 'Show_Setup_Wizard', value: 'completed' },
		{ _id: 'LDAP_Enable', value: true },
		{ _id: 'LDAP_Server_Type', value: '' }, // Empty string = "Other" (not Active Directory)
		{ _id: 'LDAP_Host', value: ldapHost },
		{ _id: 'LDAP_Authentication', value: true },
		{ _id: 'LDAP_Authentication_UserDN', value: 'cn=admin,dc=rcldap,dc=com,dc=br' },
		{ _id: 'LDAP_Authentication_Password', value: 'password' },
		{ _id: 'LDAP_BaseDN', value: 'ou=people,dc=rcldap,dc=com,dc=br' },
		{ _id: 'LDAP_User_Search_Field', value: 'uid' },
		{ _id: 'LDAP_Username_Field', value: 'uid' },
		{ _id: 'LDAP_Email_Field', value: 'mail' },
		{ _id: 'LDAP_Name_Field', value: 'cn' },
		{ _id: 'LDAP_Sync_User_Data', value: true },
	];

	await Promise.all(settings.map(({ _id, value }) => setSettingValueById(api, _id, value)));
};

test.describe('LDAP', () => {
	let poRegistration: Registration;

	const containerPath = path.join(__dirname, 'containers', 'ldap');

	test.beforeAll(async ({ api }) => {
		await resetTestData({ api });

		await compose.buildOne('testldap_idp', {
			cwd: containerPath,
		});

		await compose.upOne('testldap_idp', {
			cwd: containerPath,
		});

		// Wait for sync to complete
		await new Promise((resolve) => setTimeout(resolve, 5000));
	});

	test.afterAll(async ({ api }) => {
		await compose.down({
			cwd: containerPath,
		});

		// the compose CLI doesn't have any way to remove images, so try to remove it with a direct call to the docker cli, but ignore errors if it fails.
		try {
			child_process.spawn('docker', ['rmi', 'ldap-testldap_idp'], {
				cwd: containerPath,
			});
		} catch {
			// ignore errors here
		}

		// Remove LDAP test users so they don't interfere with other tests
		await resetTestData({ api, cleanupOnly: true });
	});

	test.beforeEach(async ({ page }) => {
		poRegistration = new Registration(page);

		await page.goto('/home');
	});

	test('Connection', async ({ api }) => {
		await test.step('should successfully test LDAP server connection', async () => {
			const response = await api.post('/ldap.testConnection', {});
			expect(response.status()).toBe(200);
			const result = await response.json();
			expect(result.success).toBe(true);
		});
	});

	test('User Search', async ({ api }) => {
		await test.step('should successfully search for LDAP users by username', async () => {
			const response = await api.post('/ldap.testSearch', {
				username: 'ldapuser1',
			});
			expect(response.status()).toBe(200);
			const result = await response.json();
			expect(result.success).toBe(true);
		});
	});

	test('Login with LDAP user', async ({ page, api }) => {
		await test.step('expect to be able to login with LDAP credentials', async () => {
			await expect(poRegistration.username).toBeVisible();
			await expect(poRegistration.inputPassword).toBeVisible();
			await poRegistration.username.fill('ldapuser1');
			await poRegistration.inputPassword.fill('password');
			await poRegistration.btnLogin.click();

			await expect(page).toHaveURL('/home');
			await expect(page.getByRole('button', { name: 'User menu' })).toBeVisible();
		});

		await test.step('expect user data to have been mapped to the correct fields', async () => {
			const user = await getUserInfo(api, 'ldapuser1');

			expect(user).toBeDefined();
			expect(user?.username).toBe('ldapuser1');
			expect(user?.name).toBe('LDAP User 1');
			expect(user?.emails).toBeDefined();
			expect(user?.emails?.[0].address).toBe('ldapuser1@example.com');
		});
	});
});
