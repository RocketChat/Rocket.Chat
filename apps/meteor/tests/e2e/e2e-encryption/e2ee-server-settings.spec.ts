import { faker } from '@faker-js/faker';

import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { preserveSettings } from '../utils/preserveSettings';
import { test, expect } from '../utils/test';

const settingsList = [
	'E2E_Enable',
	'E2E_Allow_Unencrypted_Messages',
	'E2E_Enabled_Default_DirectRooms',
	'E2E_Enabled_Default_PrivateRooms',
];

preserveSettings(settingsList);

test.describe('E2EE Server Settings', () => {
	let poHomeChannel: HomeChannel;

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
		await page.goto('/home');
	});

	test('expect slash commands to be enabled in an e2ee room', async ({ page }) => {
		test.skip(!IS_EE, 'Premium Only');
		const channelName = faker.string.uuid();

		await poHomeChannel.navbar.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('This is an encrypted message.');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is an encrypted message.');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await page.locator('[name="msg"]').type('/');
		await expect(page.locator('#popup-item-contextualbar')).not.toHaveClass(/disabled/);
		await page.locator('[name="msg"]').clear();

		await poHomeChannel.content.dispatchSlashCommand('/contextualbar');
		await expect(poHomeChannel.btnContextualbarClose).toBeVisible();

		await poHomeChannel.btnContextualbarClose.click();
		await expect(poHomeChannel.btnContextualbarClose).toBeHidden();
	});

	test.describe('un-encrypted messages not allowed in e2ee rooms', () => {
		test.skip(!IS_EE, 'Premium Only');
		let poHomeChannel: HomeChannel;

		test.beforeEach(async ({ page }) => {
			poHomeChannel = new HomeChannel(page);
			await page.goto('/home');
		});

		test.beforeAll(async ({ api }) => {
			await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: false });
		});

		test.afterAll(async ({ api }) => {
			await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true });
		});

		test('expect slash commands to be disabled in an e2ee room', async ({ page }) => {
			const channelName = faker.string.uuid();

			await poHomeChannel.navbar.createEncryptedChannel(channelName);

			await expect(page).toHaveURL(`/group/${channelName}`);

			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

			await poHomeChannel.content.sendMessage('This is an encrypted message.');

			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is an encrypted message.');
			await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

			await page.locator('[name="msg"]').pressSequentially('/');
			await expect(page.locator('#popup-item-contextualbar')).toHaveClass(/disabled/);
		});
	});
});
