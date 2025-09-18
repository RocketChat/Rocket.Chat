import { faker } from '@faker-js/faker';

import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { preserveSettings } from '../utils/preserveSettings';
import { test, expect } from '../utils/test';

const settingsList = ['E2E_Enable'];

preserveSettings(settingsList);

test.describe('E2EE Message Actions', () => {
	const createdChannels: string[] = [];
	let poHomeChannel: HomeChannel;

	test.use({ storageState: Users.userE2EE.state });

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
	});

	test.afterAll(async ({ api }) => {
		await Promise.all(createdChannels.map((channelName) => api.post('/groups.delete', { roomName: channelName })));
	});

	test('expect create a private encrypted channel and check disabled message menu actions on an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await test.step('create encrypted channel', async () => {
			await poHomeChannel.sidenav.createEncryptedChannel(channelName);
			createdChannels.push(channelName);
			await expect(page).toHaveURL(`/group/${channelName}`);
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
		});

		await test.step('send encrypted message', async () => {
			await poHomeChannel.content.sendMessage('This is an encrypted message.');
			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is an encrypted message.');
			await expect(poHomeChannel.content.getMessageEncryptedIcon(poHomeChannel.content.lastUserMessage)).toBeVisible();
		});

		await test.step('verify disabled message menu actions', async () => {
			await poHomeChannel.content.lastUserMessage.hover();
			await expect(poHomeChannel.content.btnForwardMessageDisabled).toBeDisabled();

			await poHomeChannel.content.openLastMessageMenu();

			await expect(poHomeChannel.content.btnOptionReplyInDirectMessage).toHaveClass(/disabled/);
			await expect(poHomeChannel.content.btnOptionCopyLink).toHaveClass(/disabled/);
		});
	});

	test('expect create a private encrypted channel and pin/star an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await test.step('create encrypted channel and send message', async () => {
			await poHomeChannel.sidenav.createEncryptedChannel(channelName);
			createdChannels.push(channelName);
			await expect(page).toHaveURL(`/group/${channelName}`);
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
			await poHomeChannel.content.sendMessage('This message should be pinned and stared.');
			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This message should be pinned and stared.');
			await expect(poHomeChannel.content.getMessageEncryptedIcon(poHomeChannel.content.lastUserMessage)).toBeVisible();
		});

		await test.step('star the message', async () => {
			await poHomeChannel.content.openLastMessageMenu();
			await poHomeChannel.content.btnOptionStarMessage.click();
			await expect(poHomeChannel.toastSuccess).toBeVisible();
			await poHomeChannel.dismissToast();
		});

		await test.step('pin the message', async () => {
			await poHomeChannel.content.openLastMessageMenu();
			await poHomeChannel.content.btnOptionPinMessage.click();
			await poHomeChannel.content.btnModalConfirm.click();
			await expect(poHomeChannel.toastSuccess).toBeVisible();
			await poHomeChannel.dismissToast();
		});

		await test.step('verify pinned message and disabled copy link', async () => {
			await poHomeChannel.tabs.kebab.click();
			await poHomeChannel.tabs.btnPinnedMessagesList.click();
			await expect(poHomeChannel.content.pinnedMessagesDialog).toBeVisible();
			await expect(poHomeChannel.content.lastPinnedMessage).toContainText('This message should be pinned and stared.');
			await poHomeChannel.content.lastPinnedMessage.hover();
			await poHomeChannel.content.getMessageMoreButton(poHomeChannel.content.lastPinnedMessage).waitFor();
			await poHomeChannel.content.getMessageMoreButton(poHomeChannel.content.lastPinnedMessage).click();
			await expect(poHomeChannel.content.btnOptionCopyLink).toHaveClass(/disabled/);
			await poHomeChannel.btnContextualbarClose.click();
		});

		await test.step('verify starred message and disabled copy link', async () => {
			await poHomeChannel.tabs.kebab.click();
			await poHomeChannel.tabs.btnStarredMessageList.click();
			await expect(poHomeChannel.content.starredMessagesDialog).toBeVisible();
			await expect(poHomeChannel.content.lastStarredMessage).toContainText('This message should be pinned and stared.');
			await poHomeChannel.content.lastStarredMessage.hover();
			await poHomeChannel.content.getMessageMoreButton(poHomeChannel.content.lastStarredMessage).waitFor();
			await poHomeChannel.content.getMessageMoreButton(poHomeChannel.content.lastStarredMessage).click();
			await expect(poHomeChannel.content.btnOptionCopyLink).toHaveClass(/disabled/);
		});
	});
});
