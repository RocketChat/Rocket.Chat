import child_process from 'child_process';
import path from 'path';

import { Page } from '@playwright/test';
import { v2 as compose } from 'docker-compose'
import { MongoClient } from 'mongodb';

import * as constants from './config/constants';
import { createUserFixture } from './fixtures/collections/users';
import { Users } from './fixtures/userStates';
import { Registration } from './page-objects';
import { getUserInfo } from './utils/getUserInfo';
import { setSettingValueById } from './utils/setSettingValueById';
import { test, expect } from './utils/test';

test.describe.parallel('SAML', () => {
	let poRegistration: Registration;

	const containerPath = path.join(__dirname, 'containers', 'saml');

	test.beforeAll(async ({ api }) => {
		await compose.buildOne('testsamlidp_idp', {
			cwd: containerPath,
		});

		await compose.upOne('testsamlidp_idp', {
			cwd: containerPath,
		});

		// Reset saml users' data on mongo in the beforeAll hook to allow re-running the tests within the same playwright session
		// This is needed because those tests will modify this data and running them a second time would trigger different code paths
		const connection = await MongoClient.connect(constants.URL_MONGODB);

		const usernamesToDelete = [Users.userForSamlMerge, Users.userForSamlMerge2, Users.samluser1, Users.samluser2].map(({ data: { username }}) => username);
		await connection
			.db()
			.collection('users')
			.deleteMany({
				username: {
					$in: usernamesToDelete,
				}
			});

		const usersFixtures = [Users.userForSamlMerge, Users.userForSamlMerge2].map((user) => createUserFixture(user));
		await Promise.all(
			usersFixtures.map((user) =>
				connection.db().collection('users').updateOne({ username: user.username }, { $set: user }, { upsert: true }),
			),
		);

		await Promise.all(
			[
				{
					_id: 'SAML_Custom_Default_logout_behaviour',
					value: 'SAML',
				},
				{
					_id: 'SAML_Custom_Default_immutable_property',
					value: 'EMail',
				},
				{
					_id: 'SAML_Custom_Default_mail_overwrite',
					value: false,
				},
				{
					_id: 'SAML_Custom_Default',
					value: false,
				},
			].map((setting) =>
				connection
					.db()
					.collection('rocketchat_settings')
					.updateOne({ _id: setting._id }, { $set: { value: setting.value } }),
			),
		);

		// Only one setting updated through the API to avoid refreshing the service configurations several times
		await expect((await setSettingValueById(api, 'SAML_Custom_Default', true)).status()).toBe(200);
	});

	test.afterAll(async () => {
		await compose.down({
			cwd: containerPath,
		});

		// the compose CLI doesn't have any way to remove images, so try to remove it with a direct call to the docker cli, but ignore errors if it fails.
		try {
			child_process.spawn('docker', ['rmi', 'saml-testsamlidp_idp'], {
				cwd: containerPath,
			});
		} catch {
			// ignore errors here
		}
	});

	test.beforeEach(async ({ page }) => {
		poRegistration = new Registration(page);

		await page.goto('/home');
	});

	test('Login', async ({ page, api }) => {
		await test.step('expect to have SAML login button available', async () => {
			await expect(poRegistration.btnLoginWithSaml).toBeVisible();
		});

		await test.step('expect to be redirected to the IdP for login', async () => {
			await poRegistration.btnLoginWithSaml.click();

			await expect(page).toHaveURL(/.*\/simplesaml\/module.php\/core\/loginuserpass.php.*/);
		});

		await test.step('expect to be redirected back on successful login', async () => {
			await page.getByLabel('Username').fill('samluser1');
			await page.getByLabel('Password').fill('password');
			await page.locator('role=button[name="Login"]').click();

			await expect(page).toHaveURL('/home');
		});

		await test.step('expect user data to have been mapped to the correct fields', async () => {
			const user = await getUserInfo(api, 'samluser1');

			expect(user).toBeDefined();
			expect(user?.username).toBe('samluser1');
			expect(user?.name).toBe('Saml User 1');
			expect(user?.emails).toBeDefined();
			expect(user?.emails?.[0].address).toBe('samluser1@example.com');
		});
	});

	const doLoginStep = async (page: Page, username: string) => {
		await test.step('expect successful login', async () => {
			await poRegistration.btnLoginWithSaml.click();
			// Redirect to Idp
			await expect(page).toHaveURL(/.*\/simplesaml\/module.php\/core\/loginuserpass.php.*/);

			// Fill username and password
			await page.getByLabel('Username').fill(username);
			await page.getByLabel('Password').fill('password');
			await page.locator('role=button[name="Login"]').click();

			// Redirect back to rocket.chat
			await expect(page).toHaveURL('/home');

			await expect(page.getByLabel('User Menu')).toBeVisible();
		});
	};

	const doLogoutStep = async (page: Page) => {
		await test.step('logout', async () => {
			await page.getByLabel('User Menu').click();
			await page.locator('//*[contains(@class, "rcx-option__content") and contains(text(), "Logout")]').click();

			await expect(page).toHaveURL('/home');
			await expect(page.getByLabel('User Menu')).not.toBeVisible();
		});
	};

	test('Logout - Rocket.Chat only', async ({ page, api }) => {
		await test.step('Configure logout to only logout from Rocket.Chat', async () => {
			await expect((await setSettingValueById(api, 'SAML_Custom_Default_logout_behaviour', 'Local')).status()).toBe(200);
		});

		await doLoginStep(page, 'samluser1');
		await doLogoutStep(page);

		await test.step('expect IdP to redirect back automatically on new login request', async () => {
			await poRegistration.btnLoginWithSaml.click();

			await expect(page).toHaveURL('/home');
		});
	});

	test('Logout - Single Sign Out', async ({ page, api }) => {
		await test.step('Configure logout to terminate SAML session', async () => {
			await expect((await setSettingValueById(api, 'SAML_Custom_Default_logout_behaviour', 'SAML')).status()).toBe(200);
		})

		await doLoginStep(page, 'samluser1');
		await doLogoutStep(page);

		await test.step('expect IdP to show login form on new login request', async () => {
			await poRegistration.btnLoginWithSaml.click();

			await expect(page).toHaveURL(/.*\/simplesaml\/module.php\/core\/loginuserpass.php.*/);
			await expect(page.getByLabel('Username')).toBeVisible();
		});
	});

	test('User Merge - By Email', async ({ page, api }) => {
		await test.step('Configure SAML to identify users by email', async () => {
			await expect((await setSettingValueById(api, 'SAML_Custom_Default_immutable_property', 'EMail')).status()).toBe(200);
		});

		await doLoginStep(page, 'samluser2');

		await test.step('expect user data to have been mapped to the correct fields', async () => {
			const user = await getUserInfo(api, 'samluser2');

			expect(user).toBeDefined();
			expect(user?._id).toBe('user_for_saml_merge');
			expect(user?.username).toBe('samluser2');
			expect(user?.name).toBe('Saml User 2');
			expect(user?.emails).toBeDefined();
			expect(user?.emails?.[0].address).toBe('user_for_saml_merge@email.com');
		});
	});

	test('User Merge - By Username', async ({ page, api }) => {
		await test.step('Configure SAML to identify users by username', async () => {
			await expect((await setSettingValueById(api, 'SAML_Custom_Default_immutable_property', 'Username')).status()).toBe(200);
			await expect((await setSettingValueById(api, 'SAML_Custom_Default_mail_overwrite', false)).status()).toBe(200);
		});

		await doLoginStep(page, 'samluser3');

		await test.step('expect user data to have been mapped to the correct fields', async () => {
			const user = await getUserInfo(api, 'user_for_saml_merge2');

			expect(user).toBeDefined();
			expect(user?._id).toBe('user_for_saml_merge2');
			expect(user?.username).toBe('user_for_saml_merge2');
			expect(user?.name).toBe('Saml User 3');
			expect(user?.emails).toBeDefined();
			expect(user?.emails?.[0].address).toBe('user_for_saml_merge2@email.com');
		});
	});

	test('User Merge - By Username with Email Override', async ({ page, api }) => {
		await test.step('Configure SAML to identify users by username', async () => {
			await expect((await setSettingValueById(api, 'SAML_Custom_Default_immutable_property', 'Username')).status()).toBe(200);
			await expect((await setSettingValueById(api, 'SAML_Custom_Default_mail_overwrite', true)).status()).toBe(200);
		});

		await doLoginStep(page, 'samluser3');

		await test.step('expect user data to have been mapped to the correct fields', async () => {
			const user = await getUserInfo(api, 'user_for_saml_merge2');

			expect(user).toBeDefined();
			expect(user?._id).toBe('user_for_saml_merge2');
			expect(user?.username).toBe('user_for_saml_merge2');
			expect(user?.name).toBe('Saml User 3');
			expect(user?.emails).toBeDefined();
			expect(user?.emails?.[0].address).toBe('samluser3@example.com');
		});
	});

	test.fixme('User Merge - By Custom Identifier', async () => {
		// Test user merge with a custom identifier configured in the fieldmap
	});

	test.fixme('Signature Validation', async () => {
		// Test login with signed responses
	});

	test.fixme('Login - User without username', async () => {
		// Test login with a SAML user with no username
		// Test different variations of the Immutable Property setting
	});

	test.fixme('Login - User without email', async () => {
		// Test login with a SAML user with no email
		// Test different variations of the Immutable Property setting
	});

	test.fixme('Login - User without name', async () => {
		// Test login with a SAML user with no name
	});

	test.fixme('Login - User with channels attribute', async () => {
		// Test login with a SAML user with a "channels" attribute
	});

	test.fixme('Data Sync - Custom Field Map', async () => {
		// Test the data sync using a custom fieldmap setting
	});
});
