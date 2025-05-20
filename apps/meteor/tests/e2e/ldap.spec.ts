import { MongoClient } from 'mongodb';

import * as constants from './config/constants';
import { provideContainerFor } from './containers/provideContainer';
import { Users } from './fixtures/userStates';
import { Registration } from './page-objects';
import { setSettingValueById } from './utils/setSettingValueById';
import { test, expect } from './utils/test';

const resetTestData = async () => {
	const connection = await MongoClient.connect(constants.URL_MONGODB);

	const usernamesToDelete = [Users.ldapUser1, Users.ldapUser2, Users.ldapUser3].map(({ data: { username } }) => username);
	await connection
		.db()
		.collection('users')
		.deleteMany({
			username: {
				$in: usernamesToDelete,
			},
		});
};

test.describe('LDAP', () => {
	const container = provideContainerFor('LDAP');

	test.beforeAll(async ({ api }) => {
		await resetTestData();

		// The params for the LDAP integration have been injected by the initial script, we only enable it by API
		expect((await setSettingValueById(api, 'LDAP_Enable', true)).status()).toBe(200);

		await container.startUp();
	});

	test.afterAll(async () => {
		await container.cleanUp();

		// Remove ldap test users so they don't interfere with other tests
		await resetTestData();
	});

	test('Connection Test', async ({ api }) => {
		await test.step('Expect to successfully execute a connection test', async () => {
			expect((await api.post('/ldap.testConnection', {})).status()).toBe(200);
		});
	});

	test('Login using LDAP credentials', async ({ page }) => {
		const poRegistration = new Registration(page);

		await page.goto('/home');

		await poRegistration.username.type('alan.bean');
		await poRegistration.inputPassword.type('ldappassword');
		await poRegistration.btnLogin.click();

		await expect(page.locator('role=heading[name="Welcome to Rocket.Chat"]')).toBeVisible();
	});
});
