import { faker } from '@faker-js/faker';

import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { EnableRoomEncryptionModal } from '../page-objects/fragments/e2ee';
import { preserveSettings } from '../utils/preserveSettings';
import { test, expect } from '../utils/test';

const settingsList = ['E2E_Enable', 'E2E_Allow_Unencrypted_Messages'];

preserveSettings(settingsList);

test.describe('E2EE Channel Sidebar Integration', () => {
	const createdChannels: string[] = [];
	let poHomeChannel: HomeChannel;
	let enableEncryptionModal: EnableRoomEncryptionModal;

	test.use({ storageState: Users.userE2EE.state });

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true });
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		enableEncryptionModal = new EnableRoomEncryptionModal(page);
		await page.goto('/home');
	});

	test.afterAll(async ({ api }) => {
		await Promise.all(createdChannels.map((channelName) => api.post('/groups.delete', { roomName: channelName })));
	});

	test('expect create a private channel, send unecrypted messages, encrypt the channel and delete the last message and check the last message in the sidebar', async ({
		page,
	}) => {
		const channelName = faker.string.uuid();
		const encryptedMessage1 = 'first ENCRYPTED message';
		const encryptedMessage2 = 'second ENCRYPTED message';

		await test.step('enable sidebar Extended display mode', async () => {
			await poHomeChannel.sidenav.setDisplayMode('Extended');
		});

		await test.step('create private channel', async () => {
			await poHomeChannel.sidenav.openNewByLabel('Channel');
			await poHomeChannel.sidenav.inputChannelName.fill(channelName);
			await poHomeChannel.sidenav.btnCreate.click();
			await poHomeChannel.content.waitForChannel();
			createdChannels.push(channelName);
			await expect(page).toHaveURL(`/group/${channelName}`);
			await expect(poHomeChannel.toastSuccess).toBeVisible();
			await poHomeChannel.dismissToast();
		});

		await test.step('send unencrypted messages', async () => {
			await poHomeChannel.content.sendMessage('first unencrypted message');
			await poHomeChannel.content.sendMessage('second unencrypted message');
		});

		await test.step('enable encryption', async () => {
			await poHomeChannel.tabs.kebab.click({ force: true });
			await expect(poHomeChannel.tabs.btnEnableE2E).toBeVisible();
			await poHomeChannel.tabs.btnEnableE2E.click({ force: true });
			await enableEncryptionModal.enable();
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
		});

		await test.step('send encrypted messages', async () => {
			await poHomeChannel.content.sendMessage(encryptedMessage1);
			await poHomeChannel.content.sendMessage(encryptedMessage2);
		});

		await test.step('delete last message', async () => {
			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText(encryptedMessage2);
			await poHomeChannel.content.deleteLastMessage();
		});

		await test.step('check last message in the sidebar', async () => {
			const sidebarChannel = poHomeChannel.sidenav.getSidebarItemByName(channelName);
			await expect(sidebarChannel).toBeVisible();
			await expect(sidebarChannel.locator('span')).toContainText(encryptedMessage1);
		});
	});
});
