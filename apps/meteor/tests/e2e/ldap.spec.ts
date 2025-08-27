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

	const usernamesToDelete = [...[Users.ldapuser1, Users.ldapuser2].map(({ data: { username } }) => username)];
	await connection
		.db()
		.collection('users')
		.deleteMany({
			username: {
				$in: usernamesToDelete,
			},
		});

	// Also clear any LDAP-related users that might exist
	await connection
		.db()
		.collection('users')
		.deleteMany({
			'services.ldap': { $exists: true },
		});

	if (cleanupOnly) {
		return;
	}

	// No need to create fixture users for basic login tests

	// In CI, Rocket.Chat runs in a container and needs host.docker.internal to reach LDAP container
	// In local dev, both services run on host so localhost works
	const ldapHost = process.env.CI ? 'host.docker.internal' : 'localhost';

	const settings = [
		{ _id: 'Accounts_ManuallyApproveNewUsers', value: false },
		{ _id: 'Show_Setup_Wizard', value: 'completed' },
		{ _id: 'LDAP_Enable', value: true },
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
		{ _id: 'LDAP_Background_Sync', value: true },
		{ _id: 'LDAP_Sync_User_Active_State', value: 'disable' },
	];

	await Promise.all(settings.map(({ _id, value }) => setSettingValueById(api, _id, value)));

	// Wait a moment for settings to take effect
	await new Promise((resolve) => setTimeout(resolve, 1000));
};

test.describe('LDAP', () => {
	let poRegistration: Registration;

	const containerPath = path.join(__dirname, 'containers', 'ldap');

	test.beforeAll(async ({ api }) => {
		await resetTestData({ api });

		// Wait for LDAP service to initialize
		await new Promise((resolve) => setTimeout(resolve, 2000));

		await compose.buildOne('testldap_idp', {
			cwd: containerPath,
		});

		await compose.upOne('testldap_idp', {
			cwd: containerPath,
		});

		// Wait for services to be ready
		await new Promise((resolve) => setTimeout(resolve, 10000));

		// Trigger LDAP sync to ensure users are synchronized
		const syncResponse = await api.post('/ldap.syncNow', {});
		expect(syncResponse.status()).toBe(200);

		// Wait a bit for sync to complete
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

	test('LDAP Connection Test', async ({ api }) => {
		await test.step('should successfully test LDAP connection', async () => {
			const response = await api.post('/ldap.testConnection', {});
			expect(response.status()).toBe(200);
			const result = await response.json();
			expect(result.success).toBe(true);
		});
	});

	test('LDAP Search Test', async ({ api }) => {
		await test.step('should successfully search for LDAP users', async () => {
			const response = await api.post('/ldap.testSearch', {
				username: 'ldapuser1',
			});
			expect(response.status()).toBe(200);
			const result = await response.json();
			expect(result.success).toBe(true);
		});
	});

	test('Login with LDAP user', async ({ page, api }) => {
		await test.step('expect to have LDAP login available', async () => {
			// LDAP login should be available through the standard login form
			await expect(poRegistration.username).toBeVisible({ timeout: 10000 });
			await expect(poRegistration.inputPassword).toBeVisible({ timeout: 10000 });
		});

		await test.step('expect to be able to login with LDAP credentials', async () => {
			await poRegistration.username.fill('ldapuser1');
			await poRegistration.inputPassword.fill('password');
			await poRegistration.btnLogin.click();

			await expect(page).toHaveURL('/home');
			// Wait for user menu to be visible, indicating successful login
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

	test('Login with different LDAP users', async ({ page, api }) => {
		await test.step('expect to login with ldapuser2 and verify user info', async () => {
			await poRegistration.username.fill('ldapuser2');
			await poRegistration.inputPassword.fill('password');
			await poRegistration.btnLogin.click();

			await expect(page).toHaveURL('/home');
			// Wait for user menu to be visible, indicating successful login
			await expect(page.getByRole('button', { name: 'User menu' })).toBeVisible();

			const user = await getUserInfo(api, 'ldapuser2');
			expect(user).toBeDefined();
			expect(user?.username).toBe('ldapuser2');
			expect(user?.name).toBe('LDAP User 2');
			expect(user?.emails).toBeDefined();
			expect(user?.emails?.[0].address).toBe('user_for_ldap_merge@email.com');
		});
	});
});
