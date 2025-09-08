import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
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

test.describe('E2EE OTR (Off-The-Record)', () => {
	let poHomeChannel: HomeChannel;

	test.use({ storageState: Users.userE2EE.state });

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true });
		await api.post('/settings/E2E_Enabled_Default_DirectRooms', { value: false });
		await api.post('/settings/E2E_Enabled_Default_PrivateRooms', { value: false });
		await api.post('/im.delete', { roomId: `user2${Users.userE2EE.data.username}` });
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
	});

	test('expect create a Direct message, encrypt it and attempt to enable OTR', async ({ page }) => {
		await poHomeChannel.sidenav.openNewByLabel('Direct message');
		await poHomeChannel.sidenav.inputDirectUsername.click();
		await page.keyboard.type('user2');
		await page.waitForTimeout(1000);
		await page.keyboard.press('Enter');
		await poHomeChannel.sidenav.btnCreate.click();

		await expect(page).toHaveURL(`/direct/user2${Users.userE2EE.data.username}`);

		await poHomeChannel.tabs.kebab.click({ force: true });
		if (await poHomeChannel.tabs.btnDisableE2E.isVisible()) {
			await poHomeChannel.tabs.btnDisableE2E.click({ force: true });
			await expect(page.getByRole('dialog', { name: 'Disable encryption' })).toBeVisible();
			await page.getByRole('button', { name: 'Disable encryption' }).click();
			await poHomeChannel.dismissToast();
			await poHomeChannel.tabs.kebab.click({ force: true });
		}
		await expect(poHomeChannel.tabs.btnEnableE2E).toBeVisible();
		await poHomeChannel.tabs.btnEnableE2E.click({ force: true });
		await expect(page.getByRole('dialog', { name: 'Enable encryption' })).toBeVisible();
		await page.getByRole('button', { name: 'Enable encryption' }).click();
		await page.waitForTimeout(1000);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.dismissToast();

		await poHomeChannel.tabs.kebab.click({ force: true });
		await expect(poHomeChannel.tabs.btnEnableOTR).toBeVisible();
		await poHomeChannel.tabs.btnEnableOTR.click({ force: true });

		await expect(page.getByText('OTR not available')).toBeVisible();
	});
});
