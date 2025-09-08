import type { Page } from '@playwright/test';

import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { AccountProfile } from '../page-objects';
import { preserveSettings } from '../utils/preserveSettings';
import { test, expect } from '../utils/test';

const settingsList = [
	'E2E_Enable',
	'E2E_Allow_Unencrypted_Messages',
	'E2E_Enabled_Default_DirectRooms',
	'E2E_Enabled_Default_PrivateRooms',
];

preserveSettings(settingsList);

test.describe('E2EE Key Reset', () => {
	let anotherClientPage: Page;

	test.use({ storageState: Users.userE2EE.state });

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true });
		await api.post('/settings/E2E_Enabled_Default_DirectRooms', { value: false });
		await api.post('/settings/E2E_Enabled_Default_PrivateRooms', { value: false });
		await api.post('/im.delete', { roomId: `user2${Users.userE2EE.data.username}` });
	});

	test.beforeEach(async ({ browser, page }) => {
		anotherClientPage = (await createAuxContext(browser, Users.userE2EE)).page;
		await page.goto('/home');
	});

	test.afterEach(async () => {
		await anotherClientPage.close();
	});

	test('expect force logout on e2e keys reset', async ({ page }) => {
		const poAccountProfile = new AccountProfile(page);

		await page.goto('/account/security');

		await poAccountProfile.securityE2EEncryptionSection.click();
		await poAccountProfile.securityE2EEncryptionResetKeyButton.click();

		await expect(page.locator('role=button[name="Login"]')).toBeVisible();
		await expect(anotherClientPage.locator('role=button[name="Login"]')).toBeVisible();
	});
});
