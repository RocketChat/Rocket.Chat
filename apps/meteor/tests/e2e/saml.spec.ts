import child_process from 'child_process';
import path from 'path';

import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';
import { v2 as compose } from 'docker-compose';
import { MongoClient } from 'mongodb';

import * as constants from './config/constants';
import { createUserFixture } from './fixtures/collections/users';
import { Users } from './fixtures/userStates';
import { Registration } from './page-objects';
import { convertHexToRGB } from './utils/convertHexToRGB';
import { createCustomRole, deleteCustomRole } from './utils/custom-role';
import { getUserInfo } from './utils/getUserInfo';
import { parseMeteorResponse } from './utils/parseMeteorResponse';
import { setSettingValueById } from './utils/setSettingValueById';
import type { BaseTest } from './utils/test';
import { test, expect } from './utils/test';

const KEY = 'fuselage-sessionStorage-saml_invite_token';

const resetTestData = async ({ api, cleanupOnly = false }: { api?: any; cleanupOnly?: boolean } = {}) => {
	// Reset saml users' data on mongo in the beforeAll hook to allow re-running the tests within the same playwright session
	// This is needed because those tests will modify this data and running them a second time would trigger different code paths
	const connection = await MongoClient.connect(constants.URL_MONGODB);

	const usernamesToDelete = [Users.userForSamlMerge, Users.userForSamlMerge2, Users.samluser1, Users.samluser2, Users.samluser4].map(
		({ data: { username } }) => username,
	);
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

	const usersFixtures = [Users.userForSamlMerge, Users.userForSamlMerge2].map((user) => createUserFixture(user));
	await Promise.all(
		usersFixtures.map((user) =>
			connection.db().collection('users').updateOne({ username: user.username }, { $set: user }, { upsert: true }),
		),
	);

	const settings = [
		{ _id: 'Accounts_AllowAnonymousRead', value: false },
		{ _id: 'SAML_Custom_Default_logout_behaviour', value: 'SAML' },
		{ _id: 'SAML_Custom_Default_immutable_property', value: 'EMail' },
		{ _id: 'SAML_Custom_Default_mail_overwrite', value: false },
		{ _id: 'SAML_Custom_Default_name_overwrite', value: false },
		{ _id: 'SAML_Custom_Default', value: false },
		{ _id: 'SAML_Custom_Default_role_attribute_sync', value: true },
		{ _id: 'SAML_Custom_Default_role_attribute_name', value: 'role' },
		{ _id: 'SAML_Custom_Default_user_data_fieldmap', value: '{"username":"username", "email":"email", "name": "cn"}' },
		{ _id: 'SAML_Custom_Default_provider', value: 'test-sp' },
		{ _id: 'SAML_Custom_Default_issuer', value: 'http://localhost:3000/_saml/metadata/test-sp' },
		{ _id: 'SAML_Custom_Default_entry_point', value: 'http://localhost:8080/simplesaml/saml2/idp/SSOService.php' },
		{ _id: 'SAML_Custom_Default_idp_slo_redirect_url', value: 'http://localhost:8080/simplesaml/saml2/idp/SingleLogoutService.php' },
		{ _id: 'SAML_Custom_Default_button_label_text', value: 'SAML test login button' },
		{ _id: 'SAML_Custom_Default_button_color', value: '#185925' },
	];

	await Promise.all(settings.map(({ _id, value }) => setSettingValueById(api, _id, value)));
};

const setupCustomRole = async (api: BaseTest['api']) => {
	const roleResponse = await createCustomRole(api, { name: 'saml-role' });
	expect(roleResponse.status()).toBe(200);

	const { role } = await roleResponse.json();
	return role._id;
};

test.describe('SAML', () => {
	let poRegistration: Registration;
	let samlRoleId: string;
	let targetInviteGroupId: string;
	let targetInviteGroupName: string;
	let inviteId: string;

	const containerPath = path.join(__dirname, 'containers', 'saml');

	test.beforeAll(async ({ api }) => {
		await resetTestData({ api });

		// Only one setting updated through the API to avoid refreshing the service configurations several times
		await expect((await setSettingValueById(api, 'SAML_Custom_Default', true)).status()).toBe(200);

		// Create a new custom role
		if (constants.IS_EE) {
			samlRoleId = await setupCustomRole(api);
		}

		await compose.buildOne('testsamlidp_idp', {
			cwd: containerPath,
		});

		await compose.upOne('testsamlidp_idp', {
			cwd: containerPath,
		});
	});

	test.beforeAll(async ({ api }) => {
		const groupResponse = await api.post('/groups.create', { name: faker.string.uuid() });
		expect(groupResponse.status()).toBe(200);
		const { group } = await groupResponse.json();
		targetInviteGroupId = group._id;
		targetInviteGroupName = group.name;

		const inviteResponse = await api.post('/findOrCreateInvite', { rid: targetInviteGroupId, days: 1, maxUses: 0 });
		expect(inviteResponse.status()).toBe(200);
		const { _id } = await inviteResponse.json();
		inviteId = _id;
	});

	test.afterAll(async ({ api }) => {
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

		// Remove saml test users so they don't interfere with other tests
		await resetTestData({ cleanupOnly: true });

		// Remove created custom role
		if (constants.IS_EE) {
			expect((await deleteCustomRole(api, 'saml-role')).status()).toBe(200);
		}
	});

	test.afterAll(async ({ api }) => {
		expect((await api.post('/groups.delete', { roomId: targetInviteGroupId })).status()).toBe(200);
	});

	test.beforeEach(async ({ page }) => {
		poRegistration = new Registration(page);

		await page.goto('/home');
	});

	test('Login', async ({ page, api }) => {
		await test.step('expect to have SAML login button available', async () => {
			await expect(poRegistration.btnLoginWithSaml).toBeVisible({ timeout: 10000 });
		});

		await test.step('expect to have SAML login button to have the required background color', async () => {
			await expect(poRegistration.btnLoginWithSaml).toHaveCSS('background-color', convertHexToRGB('#185925'));
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

	test('Allow password change for OAuth users', async ({ api }) => {
		await test.step("should not send password reset mail if 'Allow Password Change for OAuth Users' setting is disabled", async () => {
			expect((await setSettingValueById(api, 'Accounts_AllowPasswordChangeForOAuthUsers', false)).status()).toBe(200);

			const response = await api.post('/method.call/sendForgotPasswordEmail', {
				message: JSON.stringify({ msg: 'method', id: 'id', method: 'sendForgotPasswordEmail', params: ['samluser1@example.com'] }),
			});
			const mailSent = await parseMeteorResponse<boolean>(response);
			expect(response.status()).toBe(200);
			expect(mailSent).toBe(false);
		});

		await test.step("should send password reset mail if 'Allow Password Change for OAuth Users' setting is enabled", async () => {
			expect((await setSettingValueById(api, 'Accounts_AllowPasswordChangeForOAuthUsers', true)).status()).toBe(200);

			const response = await api.post('/method.call/sendForgotPasswordEmail', {
				message: JSON.stringify({ msg: 'method', id: 'id', method: 'sendForgotPasswordEmail', params: ['samluser1@example.com'] }),
			});
			const mailSent = await parseMeteorResponse<boolean>(response);
			expect(response.status()).toBe(200);
			expect(mailSent).toBe(true);
		});
	});

	const doLoginStep = async (page: Page, username: string, redirectUrl: string | null = '/home') => {
		await test.step('expect successful login', async () => {
			await poRegistration.btnLoginWithSaml.click();
			// Redirect to Idp
			await expect(page).toHaveURL(/.*\/simplesaml\/module.php\/core\/loginuserpass.php.*/);

			// Fill username and password
			await page.getByLabel('Username').fill(username);
			await page.getByLabel('Password').fill('password');
			await page.locator('role=button[name="Login"]').click();

			// Redirect back to rocket.chat
			if (redirectUrl) {
				await expect(page).toHaveURL(redirectUrl);
				await expect(page.getByRole('button', { name: 'User menu' })).toBeVisible();
			}
		});
	};

	const doLogoutStep = async (page: Page) => {
		await test.step('logout', async () => {
			await page.getByRole('button', { name: 'User menu' }).click();
			await page.locator('//*[contains(@class, "rcx-option__content") and contains(text(), "Logout")]').click();

			await expect(page).toHaveURL('/home');
			await expect(page.getByRole('button', { name: 'User menu' })).not.toBeVisible();
		});
	};

	test('Logout - Rocket.Chat only', async ({ page, api }) => {
		await test.step('Configure logout to only logout from Rocket.Chat', async () => {
			await expect((await setSettingValueById(api, 'SAML_Custom_Default_logout_behaviour', 'Local')).status()).toBe(200);
		});

		await page.goto('/home');
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
		});

		await page.goto('/home');
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
			expect(user?.name).toBe('user_for_saml_merge');
			expect(user?.emails).toBeDefined();
			expect(user?.emails?.[0].address).toBe('user_for_saml_merge@email.com');
		});
	});

	test('User Merge - By Email with Name Override', async ({ page, api }) => {
		await test.step('Configure SAML to identify users by email', async () => {
			expect((await setSettingValueById(api, 'SAML_Custom_Default_immutable_property', 'EMail')).status()).toBe(200);
			expect((await setSettingValueById(api, 'SAML_Custom_Default_name_overwrite', true)).status()).toBe(200);
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
			expect((await setSettingValueById(api, 'SAML_Custom_Default_immutable_property', 'Username')).status()).toBe(200);
			expect((await setSettingValueById(api, 'SAML_Custom_Default_name_overwrite', false)).status()).toBe(200);
			expect((await setSettingValueById(api, 'SAML_Custom_Default_mail_overwrite', false)).status()).toBe(200);
		});

		await doLoginStep(page, 'samluser3');

		await test.step('expect user data to have been mapped to the correct fields', async () => {
			const user = await getUserInfo(api, 'user_for_saml_merge2');

			expect(user).toBeDefined();
			expect(user?._id).toBe('user_for_saml_merge2');
			expect(user?.username).toBe('user_for_saml_merge2');
			expect(user?.name).toBe('user_for_saml_merge2');
			expect(user?.emails).toBeDefined();
			expect(user?.emails?.[0].address).toBe('user_for_saml_merge2@email.com');
		});
	});

	test('User Merge - By Username with Email Override', async ({ page, api }) => {
		await test.step('Configure SAML to identify users by username', async () => {
			expect((await setSettingValueById(api, 'SAML_Custom_Default_immutable_property', 'Username')).status()).toBe(200);
			expect((await setSettingValueById(api, 'SAML_Custom_Default_name_overwrite', false)).status()).toBe(200);
			expect((await setSettingValueById(api, 'SAML_Custom_Default_mail_overwrite', true)).status()).toBe(200);
		});

		await doLoginStep(page, 'samluser3');

		await test.step('expect user data to have been mapped to the correct fields', async () => {
			const user = await getUserInfo(api, 'user_for_saml_merge2');

			expect(user).toBeDefined();
			expect(user?._id).toBe('user_for_saml_merge2');
			expect(user?.username).toBe('user_for_saml_merge2');
			expect(user?.name).toBe('user_for_saml_merge2');
			expect(user?.emails).toBeDefined();
			expect(user?.emails?.[0].address).toBe('samluser3@example.com');
		});
	});

	test('User Merge - By Username with Name Override', async ({ page, api }) => {
		await test.step('Configure SAML to identify users by username', async () => {
			await expect((await setSettingValueById(api, 'SAML_Custom_Default_immutable_property', 'Username')).status()).toBe(200);
			await expect((await setSettingValueById(api, 'SAML_Custom_Default_name_overwrite', true)).status()).toBe(200);
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

	test('User Mapping - Custom Role', async ({ page, api }) => {
		test.skip(!constants.IS_EE);

		await doLoginStep(page, 'samluser4');

		await test.step('expect users role to have been mapped correctly', async () => {
			const user = await getUserInfo(api, 'samluser4');

			expect(user).toBeDefined();
			expect(user?.username).toBe('samluser4');
			expect(user?.name).toBe('Saml User 4');
			expect(user?.emails).toBeDefined();
			expect(user?.emails?.[0].address).toBe('samluser4@example.com');
			expect(user?.roles).toBeDefined();
			expect(user?.roles?.length).toBe(1);
			expect(user?.roles).toContain(samlRoleId);
		});
	});

	test('Redirect to a specific group after login when using a valid invite link', async ({ page }) => {
		await page.goto(`/invite/${inviteId}`);
		await page.getByRole('link', { name: 'Back to Login' }).click();

		expect(await page.evaluate((key) => sessionStorage.getItem(key), KEY)).toEqual(JSON.stringify(inviteId));

		await doLoginStep(page, 'samluser1', null);

		await test.step('expect to be redirected to the invited room after succesful login', async () => {
			await expect(page).toHaveURL(`/group/${targetInviteGroupName}`);
			expect(await page.evaluate((key) => sessionStorage.getItem(key), KEY)).toEqual('null');
		});
	});

	test('Remove invite token from session storage if invite is not used', async ({ page }) => {
		await page.goto(`/invite/${inviteId}`);
		await page.getByRole('link', { name: 'Back to Login' }).click();

		expect(await page.evaluate((key) => sessionStorage.getItem(key), KEY)).toEqual(JSON.stringify(inviteId));

		await page.goto(`/home`);
		await doLoginStep(page, 'samluser2');

		expect(await page.evaluate((key) => sessionStorage.getItem(key), KEY)).toEqual('null');
	});

	test('Redirect to home after login when no redirectUrl is provided', async ({ page }) => {
		await doLoginStep(page, 'samluser2');

		await test.step('expect to be redirected to the homepage after succesful login', async () => {
			await expect(page).toHaveURL('/home');
		});
	});

	test('Respect redirectUrl on multiple parallel logins', async ({ page, browser }) => {
		const page2 = await browser.newPage();
		const poRegistration2 = new Registration(page2);

		await page2.goto(`/home`);
		await expect(page2).toHaveURL('/home');

		await page.goto(`/invite/${inviteId}`);
		await page.getByRole('link', { name: 'Back to Login' }).click();

		expect(await page.evaluate((key) => sessionStorage.getItem(key), KEY)).toEqual(JSON.stringify(inviteId));
		expect(await page2.evaluate((key) => sessionStorage.getItem(key), KEY)).toEqual('null');

		await expect(poRegistration.btnLoginWithSaml).toBeVisible();
		await poRegistration.btnLoginWithSaml.click();
		await expect(page).toHaveURL(/.*\/simplesaml\/module.php\/core\/loginuserpass.php.*/);

		await expect(page2.getByRole('button', { name: 'User menu' })).not.toBeVisible();
		await expect(poRegistration2.btnLoginWithSaml).toBeVisible();
		await poRegistration2.btnLoginWithSaml.click();
		await expect(page2).toHaveURL(/.*\/simplesaml\/module.php\/core\/loginuserpass.php.*/);

		await page.getByLabel('Username').fill('samluser1');
		await page.getByLabel('Password').fill('password');
		await page.locator('role=button[name="Login"]').click();

		await page2.getByLabel('Username').fill('samluser2');
		await page2.getByLabel('Password').fill('password');
		await page2.locator('role=button[name="Login"]').click();

		await expect(page).toHaveURL(`/group/${targetInviteGroupName}`);
		await expect(page2).toHaveURL('/home');

		expect(await page.evaluate((key) => sessionStorage.getItem(key), KEY)).toEqual('null');
		expect(await page2.evaluate((key) => sessionStorage.getItem(key), KEY)).toEqual('null');

		await page2.close();
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
