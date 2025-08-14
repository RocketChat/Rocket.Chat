import { Users, restoreState } from './fixtures/userStates';
import { test, expect } from './utils/test';

test.use({ storageState: Users.userE2EE.state });

test.describe('Account Login', () => {
	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true });
	});

	test.afterAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: false });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: false });
	});

	test.beforeEach(async ({ page }) => {
		await page.goto('/home');
		await restoreState(page, Users.userE2EE);
	});

	test('should remove private_key and public_key from localStorage when token expires', async ({ page }) => {
		expect(await page.evaluate(() => localStorage.getItem('Meteor.userId'))).not.toBeNull();
		expect(await page.evaluate(() => localStorage.getItem('Meteor.loginToken'))).not.toBeNull();
		expect(await page.evaluate(() => localStorage.getItem('Meteor.loginTokenExpires'))).not.toBeNull();
		expect(await page.evaluate(() => localStorage.getItem('private_key'))).not.toBeNull();
		expect(await page.evaluate(() => localStorage.getItem('public_key'))).not.toBeNull();

		await page.evaluate(() => {
			localStorage.setItem('Meteor.loginTokenExpires', new Date().toString());
		});

		await page.reload();

		await expect(page.getByRole('form', { name: 'Login' })).toBeVisible();

		expect(await page.evaluate(() => localStorage.getItem('Meteor.userId'))).toBeNull();
		expect(await page.evaluate(() => localStorage.getItem('Meteor.loginToken'))).toBeNull();
		expect(await page.evaluate(() => localStorage.getItem('Meteor.loginTokenExpires'))).toBeNull();
		expect(await page.evaluate(() => localStorage.getItem('private_key'))).toBeNull();
		expect(await page.evaluate(() => localStorage.getItem('public_key'))).toBeNull();
	});
});
