import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { DisableRoomEncryptionModal, EnableRoomEncryptionModal } from '../page-objects/fragments/e2ee';
import { preserveSettings } from '../utils/preserveSettings';
import { test, expect } from '../utils/test';

const settingsList = [
	'E2E_Enable',
	'E2E_Allow_Unencrypted_Messages',
	'E2E_Enabled_Default_DirectRooms',
	'E2E_Enabled_Default_PrivateRooms',
];

preserveSettings(settingsList);

test.describe('E2EE OTR (Off-The-Record)', () => {
	let poHomeChannel: HomeChannel;
	let enableEncryptionModal: EnableRoomEncryptionModal;
	let disableEncryptionModal: DisableRoomEncryptionModal;

	test.use({ storageState: Users.userE2EE.state });

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true });
		await api.post('/settings/E2E_Enabled_Default_DirectRooms', { value: false });
		await api.post('/settings/E2E_Enabled_Default_PrivateRooms', { value: false });
		await api.post('/im.delete', { username: 'user2' });
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		enableEncryptionModal = new EnableRoomEncryptionModal(page);
		disableEncryptionModal = new DisableRoomEncryptionModal(page);
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
			await disableEncryptionModal.disable();
			await poHomeChannel.tabs.kebab.click({ force: true });
		}
		await expect(poHomeChannel.tabs.btnEnableE2E).toBeVisible();
		await poHomeChannel.tabs.btnEnableE2E.click({ force: true });
		await enableEncryptionModal.enable();
		await page.waitForTimeout(1000);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.tabs.kebab.click({ force: true });
		await expect(poHomeChannel.tabs.btnEnableOTR).toBeVisible();
		await poHomeChannel.tabs.btnEnableOTR.click({ force: true });

		await expect(page.getByText('OTR not available')).toBeVisible();
	});
});
