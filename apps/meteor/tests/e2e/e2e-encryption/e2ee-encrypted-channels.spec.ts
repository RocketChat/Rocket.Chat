import { faker } from '@faker-js/faker';

import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { EncryptedRoomPage } from '../page-objects/encrypted-room';
import { DisableRoomEncryptionModal, E2EEMessageActions, EnableRoomEncryptionModal } from '../page-objects/fragments/e2ee';
import { PinnedMessagesTab } from '../page-objects/fragments/pinned-messages-tab';
import { StarredMessagesTab } from '../page-objects/fragments/starred-messages-tab';
import { preserveSettings } from '../utils/preserveSettings';
import { test, expect } from '../utils/test';

const settingsList = [
	'E2E_Enable',
	'E2E_Allow_Unencrypted_Messages',
	'E2E_Enabled_Default_DirectRooms',
	'E2E_Enabled_Default_PrivateRooms',
];

preserveSettings(settingsList);

test.describe('E2EE Encrypted Channels', () => {
	let poHomeChannel: HomeChannel;
	let encryptedRoomPage: EncryptedRoomPage;
	let e2eeMessageActions: E2EEMessageActions;
	let enableEncryptionModal: EnableRoomEncryptionModal;
	let disableEncryptionModal: DisableRoomEncryptionModal;
	let pinnedMessagesTab: PinnedMessagesTab;
	let starredMessagesTab: StarredMessagesTab;

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
		encryptedRoomPage = new EncryptedRoomPage(page);
		e2eeMessageActions = new E2EEMessageActions(page);
		enableEncryptionModal = new EnableRoomEncryptionModal(page);
		disableEncryptionModal = new DisableRoomEncryptionModal(page);
		pinnedMessagesTab = new PinnedMessagesTab(page);
		starredMessagesTab = new StarredMessagesTab(page);
		await page.goto('/home');
	});

	test('expect create a private channel encrypted and send an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();

		await poHomeChannel.tabs.kebab.click({ force: true });

		await expect(poHomeChannel.tabs.btnDisableE2E).toBeVisible();
		await poHomeChannel.tabs.btnDisableE2E.click({ force: true });
		await disableEncryptionModal.disable();
		await page.waitForTimeout(1000);

		await poHomeChannel.content.sendMessage('hello world not encrypted');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world not encrypted');
		await expect(encryptedRoomPage.lastMessage.encryptedIcon).not.toBeVisible();

		await poHomeChannel.tabs.kebab.click({ force: true });
		await expect(poHomeChannel.tabs.btnEnableE2E).toBeVisible();
		await poHomeChannel.tabs.btnEnableE2E.click({ force: true });
		await enableEncryptionModal.enable();
		await page.waitForTimeout(1000);

		await poHomeChannel.content.sendMessage('hello world encrypted again');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world encrypted again');
		await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();
	});

	test('expect create a private encrypted channel and send a encrypted thread message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('This is the thread main message.');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is the thread main message.');
		await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();

		await poHomeChannel.content.openReplyInThread();

		await expect(page).toHaveURL(/.*thread/);

		await expect(poHomeChannel.content.mainThreadMessageText).toContainText('This is the thread main message.');
		await expect(poHomeChannel.content.mainThreadMessageText.locator('.rcx-icon--name-key')).toBeVisible();

		await poHomeChannel.content.toggleAlsoSendThreadToChannel(true);
		await poHomeChannel.content.sendMessageInThread('This is an encrypted thread message also sent in channel');
		await expect(poHomeChannel.content.lastThreadMessageText).toContainText('This is an encrypted thread message also sent in channel');
		await expect(poHomeChannel.content.lastThreadMessageText.locator('.rcx-icon--name-key')).toBeVisible();
		await expect(poHomeChannel.content.lastUserMessage).toContainText('This is an encrypted thread message also sent in channel');
		await expect(poHomeChannel.content.mainThreadMessageText).toContainText('This is the thread main message.');
		await expect(poHomeChannel.content.mainThreadMessageText.locator('.rcx-icon--name-key')).toBeVisible();
	});

	test('expect create a private encrypted channel and check disabled message menu actions on an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('This is an encrypted message.');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is an encrypted message.');
		await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();

		await poHomeChannel.content.lastUserMessage.hover();
		await e2eeMessageActions.expectForwardMessageToBeDisabled();

		await poHomeChannel.content.openLastMessageMenu();

		await e2eeMessageActions.expectReplyInDirectMessageToBeDisabled();
		await e2eeMessageActions.expectCopyLinkToBeDisabled();
	});

	test('expect create a private channel, encrypt it and send an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.fill(channelName);
		await poHomeChannel.sidenav.btnCreate.click();

		await expect(page).toHaveURL(`/group/${channelName}`);

		await poHomeChannel.toastMessage.waitForDisplay();
		await poHomeChannel.toastMessage.dismissToast();

		await poHomeChannel.tabs.kebab.click();
		await expect(poHomeChannel.tabs.btnEnableE2E).toBeVisible();
		await poHomeChannel.tabs.btnEnableE2E.click();
		await enableEncryptionModal.enable();
		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();
	});

	test('expect create a encrypted private channel and mention user', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('hello @user1');

		await expect(poHomeChannel.content.getUserMention('user1')).toBeVisible();
	});

	test('expect create a encrypted private channel, mention a channel and navigate to it', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('Are you in the #general channel?');

		await expect(poHomeChannel.content.getChannelMention('general')).toBeVisible();

		await poHomeChannel.content.getChannelMention('general').click();

		await expect(page).toHaveURL(`/channel/general`);
	});

	test('expect create a encrypted private channel, mention a channel and user', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('Are you in the #general channel, @user1 ?');

		await expect(poHomeChannel.content.getUserMention('user1')).toBeVisible();
		await expect(poHomeChannel.content.getChannelMention('general')).toBeVisible();
	});

	test('expect create a private channel, send unecrypted messages, encrypt the channel and delete the last message and check the last message in the sidebar', async ({
		page,
	}) => {
		const channelName = faker.string.uuid();

		// Enable Sidebar Extended display mode
		await poHomeChannel.sidenav.setDisplayMode('Extended');

		// Create private channel
		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.fill(channelName);
		await poHomeChannel.sidenav.btnCreate.click();
		await expect(page).toHaveURL(`/group/${channelName}`);
		await poHomeChannel.toastMessage.waitForDisplay();
		await poHomeChannel.toastMessage.dismissToast();

		// Send Unencrypted Messages
		await poHomeChannel.content.sendMessage('first unencrypted message');
		await poHomeChannel.content.sendMessage('second unencrypted message');

		// Encrypt channel
		await poHomeChannel.tabs.kebab.click({ force: true });
		await expect(poHomeChannel.tabs.btnEnableE2E).toBeVisible();
		await poHomeChannel.tabs.btnEnableE2E.click({ force: true });
		await enableEncryptionModal.enable();
		await page.waitForTimeout(1000);
		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		// Send Encrypted Messages
		const encriptedMessage1 = 'first ENCRYPTED message';
		const encriptedMessage2 = 'second ENCRYPTED message';
		await poHomeChannel.content.sendMessage(encriptedMessage1);
		await poHomeChannel.content.sendMessage(encriptedMessage2);

		//  Delete last message
		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText(encriptedMessage2);
		await poHomeChannel.content.deleteLastMessage();

		// Check last message in the sidebar
		const sidebarChannel = poHomeChannel.sidenav.getSidebarItemByName(channelName);
		await expect(sidebarChannel).toBeVisible();
		await expect(sidebarChannel.locator('span')).toContainText(encriptedMessage1);
	});

	test('expect create a private encrypted channel and pin/star an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('This message should be pinned and starred.');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This message should be pinned and starred.');
		await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();

		await poHomeChannel.content.openLastMessageMenu();
		await poHomeChannel.content.btnOptionStarMessage.click();

		await poHomeChannel.toastMessage.waitForDisplay();
		await poHomeChannel.toastMessage.dismissToast();

		await poHomeChannel.content.openLastMessageMenu();
		await poHomeChannel.content.btnOptionPinMessage.click();
		await poHomeChannel.content.btnModalConfirm.click();

		await poHomeChannel.toastMessage.waitForDisplay();
		await poHomeChannel.toastMessage.dismissToast();

		await pinnedMessagesTab.openTab();
		await pinnedMessagesTab.expectLastMessageToContainText('This message should be pinned and starred.');
		await pinnedMessagesTab.openLastMessageMenu();
		await e2eeMessageActions.expectCopyLinkToBeDisabled();

		await poHomeChannel.btnContextualbarClose.click();

		await starredMessagesTab.openTab();
		await starredMessagesTab.expectLastMessageToContainText('This message should be pinned and starred.');
		await starredMessagesTab.openLastMessageMenu();
		await e2eeMessageActions.expectCopyLinkToBeDisabled();
	});

	test('expect to edit encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();
		const originalMessage = 'This is the original encrypted message';
		const editedMessage = 'This is the edited encrypted message';

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);
		await expect(page).toHaveURL(`/group/${channelName}`);
		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage(originalMessage);

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText(originalMessage);
		await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();

		await poHomeChannel.content.openLastMessageMenu();
		await poHomeChannel.content.btnOptionEditMessage.click();
		await poHomeChannel.content.inputMessage.fill(editedMessage);

		await page.keyboard.press('Enter');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText(editedMessage);
		await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();
	});

	test('expect to edit encrypted message to include mention', async ({ page }) => {
		const channelName = faker.string.uuid();
		const originalMessage = 'This is the original encrypted message';
		const editedMessage = 'This is the edited encrypted message with a mention to @user1 and #general';
		const displayedMessage = 'This is the edited encrypted message with a mention to user1 and general';

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);
		await expect(page).toHaveURL(`/group/${channelName}`);
		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage(originalMessage);
		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText(originalMessage);
		await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();

		await poHomeChannel.content.openLastMessageMenu();
		await poHomeChannel.content.btnOptionEditMessage.click();
		await poHomeChannel.content.inputMessage.fill(editedMessage);

		await page.keyboard.press('Enter');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText(displayedMessage);
		await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();

		await expect(poHomeChannel.content.getUserMention('user1')).toBeVisible();
		await expect(poHomeChannel.content.getChannelMention('general')).toBeVisible();
	});
});
