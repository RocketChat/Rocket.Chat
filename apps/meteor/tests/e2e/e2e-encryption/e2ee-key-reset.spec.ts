import type { Page } from '@playwright/test';

import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { AccountProfile } from '../page-objects';
import { getSettingValueById } from '../utils';
import { test, expect } from '../utils/test';

const settings = {
	E2E_Enable: false as unknown,
	E2E_Allow_Unencrypted_Messages: false as unknown,
	E2E_Enabled_Default_DirectRooms: false as unknown,
	E2E_Enabled_Default_PrivateRooms: false as unknown,
};

test.beforeAll(async ({ api }) => {
	settings.E2E_Enable = await getSettingValueById(api, 'E2E_Enable');
	settings.E2E_Allow_Unencrypted_Messages = await getSettingValueById(api, 'E2E_Allow_Unencrypted_Messages');
	settings.E2E_Enabled_Default_DirectRooms = await getSettingValueById(api, 'E2E_Enabled_Default_DirectRooms');
	settings.E2E_Enabled_Default_PrivateRooms = await getSettingValueById(api, 'E2E_Enabled_Default_PrivateRooms');
});

test.afterAll(async ({ api }) => {
	await api.post('/settings/E2E_Enable', { value: settings.E2E_Enable });
	await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: settings.E2E_Allow_Unencrypted_Messages });
	await api.post('/settings/E2E_Enabled_Default_DirectRooms', { value: settings.E2E_Enabled_Default_DirectRooms });
	await api.post('/settings/E2E_Enabled_Default_PrivateRooms', { value: settings.E2E_Enabled_Default_PrivateRooms });
});

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
