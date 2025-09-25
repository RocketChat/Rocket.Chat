import { faker } from '@faker-js/faker';

import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { EncryptedRoomPage } from '../page-objects/encrypted-room';
import { PinnedMessagesTab, StarredMessagesTab } from '../page-objects/fragments';
import { E2EEMessageActions } from '../page-objects/fragments/e2ee';
import { deleteRoom } from '../utils/create-target-channel';
import { preserveSettings } from '../utils/preserveSettings';
import { resolvePrivateRoomId } from '../utils/resolve-room-id';
import { test, expect } from '../utils/test';

const settingsList = ['E2E_Enable'];

preserveSettings(settingsList);

test.describe('E2EE Message Actions', () => {
	const createdChannels: { name: string; id?: string | null }[] = [];
	let poHomeChannel: HomeChannel;
	let pinnedMessagesTab: PinnedMessagesTab;
	let starredMessagesTab: StarredMessagesTab;
	let e2eeMessageActions: E2EEMessageActions;
	let encryptedRoomPage: EncryptedRoomPage;
	test.use({ storageState: Users.userE2EE.state });

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		pinnedMessagesTab = new PinnedMessagesTab(page);
		starredMessagesTab = new StarredMessagesTab(page);
		e2eeMessageActions = new E2EEMessageActions(page);
		encryptedRoomPage = new EncryptedRoomPage(page);
		await poHomeChannel.goto();
	});

	test.afterAll(async ({ api }) => {
		await Promise.all(createdChannels.map(({ id }) => (id ? deleteRoom(api, id) : Promise.resolve())));
	});

	test('expect create a private encrypted channel and check disabled message menu actions on an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await test.step('create encrypted channel', async () => {
			await poHomeChannel.sidenav.createEncryptedChannel(channelName);
			const roomId = await resolvePrivateRoomId(page, channelName);
			createdChannels.push({ name: channelName, id: roomId });
			await expect(page).toHaveURL(`/group/${channelName}`);
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
		});

		await test.step('send encrypted message', async () => {
			await poHomeChannel.content.sendMessage('This is an encrypted message.');
			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is an encrypted message.');
			await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();
		});

		await test.step('verify disabled message menu actions', async () => {
			await poHomeChannel.content.lastUserMessage.hover();
			await e2eeMessageActions.expectForwardMessageToBeDisabled();

			await poHomeChannel.content.openLastMessageMenu();

			await e2eeMessageActions.expectReplyInDirectMessageToBeDisabled();
			await e2eeMessageActions.expectCopyLinkToBeDisabled();
		});
	});

	test('expect create a private encrypted channel and pin/star an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await test.step('create encrypted channel and send message', async () => {
			await poHomeChannel.sidenav.createEncryptedChannel(channelName);
			const roomId = await resolvePrivateRoomId(page, channelName);
			createdChannels.push({ name: channelName, id: roomId });
			await expect(page).toHaveURL(`/group/${channelName}`);
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
			await poHomeChannel.content.sendMessage('This message should be pinned and starred.');
			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This message should be pinned and starred.');
			await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();
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
			await pinnedMessagesTab.openTab();
			await pinnedMessagesTab.expectLastMessageToContainText('This message should be pinned and starred.');
			await pinnedMessagesTab.openLastMessageMenu();
			await e2eeMessageActions.expectCopyLinkToBeDisabled();
			await poHomeChannel.btnContextualbarClose.click();
		});

		await test.step('verify starred message and disabled copy link', async () => {
			await starredMessagesTab.openTab();
			await starredMessagesTab.expectLastMessageToContainText('This message should be pinned and starred.');
			await starredMessagesTab.openLastMessageMenu();
			await e2eeMessageActions.expectCopyLinkToBeDisabled();
		});
	});
});
