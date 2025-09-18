import { faker } from '@faker-js/faker';

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

test.describe('E2EE Encrypted Channels', () => {
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

	test('expect create a private channel encrypted and send an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		await expect(poHomeChannel.content.getMessageEncryptedIcon(poHomeChannel.content.lastUserMessage)).toBeVisible();

		await poHomeChannel.tabs.kebab.click({ force: true });

		await expect(poHomeChannel.tabs.btnDisableE2E).toBeVisible();
		await poHomeChannel.tabs.btnDisableE2E.click({ force: true });

		await disableEncryptionModal.disable();

		// Wait for encryption to be disabled instead of hardcoded timeout
		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).not.toBeVisible();

		await poHomeChannel.content.sendMessage('hello world not encrypted');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world not encrypted');
		await expect(poHomeChannel.content.getMessageEncryptedIcon(poHomeChannel.content.lastUserMessage)).not.toBeVisible();

		await poHomeChannel.tabs.kebab.click({ force: true });
		await expect(poHomeChannel.tabs.btnEnableE2E).toBeVisible();
		await poHomeChannel.tabs.btnEnableE2E.click({ force: true });

		await enableEncryptionModal.enable();

		// Wait for encryption to be enabled instead of hardcoded timeout
		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('hello world encrypted again');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world encrypted again');
		await expect(poHomeChannel.content.getMessageEncryptedIcon(poHomeChannel.content.lastUserMessage)).toBeVisible();
	});

	test('expect create a private encrypted channel and send a encrypted thread message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('This is the thread main message.');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is the thread main message.');
		await expect(poHomeChannel.content.getMessageEncryptedIcon(poHomeChannel.content.lastUserMessage)).toBeVisible();

		await poHomeChannel.content.openReplyInThread();

		await expect(page).toHaveURL(/.*thread/);

		await expect(poHomeChannel.content.mainThreadMessageText).toContainText('This is the thread main message.');
		await expect(poHomeChannel.content.getMessageEncryptedIcon(poHomeChannel.content.mainThreadMessageText)).toBeVisible();

		await poHomeChannel.content.toggleAlsoSendThreadToChannel(true);
		await poHomeChannel.content.inputThreadMessage.fill('This is an encrypted thread message also sent in channel');
		await page.keyboard.press('Enter');
		await expect(poHomeChannel.content.lastThreadMessageText).toContainText('This is an encrypted thread message also sent in channel');
		await expect(poHomeChannel.content.getMessageEncryptedIcon(poHomeChannel.content.lastThreadMessageText)).toBeVisible();
		await expect(poHomeChannel.content.lastUserMessage).toContainText('This is an encrypted thread message also sent in channel');
		await expect(poHomeChannel.content.mainThreadMessageText).toContainText('This is the thread main message.');
		await expect(poHomeChannel.content.getMessageEncryptedIcon(poHomeChannel.content.mainThreadMessageText)).toBeVisible();
	});

	test('expect create a private encrypted channel and check disabled message menu actions on an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('This is an encrypted message.');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is an encrypted message.');
		await expect(poHomeChannel.content.getMessageEncryptedIcon(poHomeChannel.content.lastUserMessage)).toBeVisible();

		await poHomeChannel.content.lastUserMessage.hover();
		await expect(poHomeChannel.content.btnForwardMessageDisabled).toBeDisabled();

		await poHomeChannel.content.openLastMessageMenu();

		await expect(poHomeChannel.content.btnOptionReplyInDirectMessage).toHaveClass(/disabled/);
		await expect(poHomeChannel.content.btnOptionCopyLink).toHaveClass(/disabled/);
	});

	test('expect create a private channel, encrypt it and send an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.fill(channelName);
		await poHomeChannel.sidenav.btnCreate.click();

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.toastSuccess).toBeVisible();

		await poHomeChannel.dismissToast();

		await poHomeChannel.tabs.kebab.click();
		await expect(poHomeChannel.tabs.btnEnableE2E).toBeVisible();
		await poHomeChannel.tabs.btnEnableE2E.click();

		await enableEncryptionModal.enable();

		// Wait for encryption to be enabled instead of hardcoded timeout
		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		await expect(poHomeChannel.content.getMessageEncryptedIcon(poHomeChannel.content.lastUserMessage)).toBeVisible();
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
		await expect(poHomeChannel.toastSuccess).toBeVisible();
		await poHomeChannel.dismissToast();

		// Send Unencrypted Messages
		await poHomeChannel.content.sendMessage('first unencrypted message');
		await poHomeChannel.content.sendMessage('second unencrypted message');

		// Encrypt channel
		await poHomeChannel.tabs.kebab.click({ force: true });
		await expect(poHomeChannel.tabs.btnEnableE2E).toBeVisible();
		await poHomeChannel.tabs.btnEnableE2E.click({ force: true });

		await enableEncryptionModal.enable();

		// Wait for encryption to be enabled instead of hardcoded timeout
		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		// Send Encrypted Messages
		const encryptedMessage1 = 'first ENCRYPTED message';
		const encryptedMessage2 = 'second ENCRYPTED message';
		await poHomeChannel.content.sendMessage(encryptedMessage1);
		await poHomeChannel.content.sendMessage(encryptedMessage2);

		//  Delete last message
		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText(encryptedMessage2);
		await poHomeChannel.content.openLastMessageMenu();
		await poHomeChannel.content.btnOptionDeleteMessage.click();
		await page.locator('#modal-root .rcx-button-group--align-end .rcx-button--danger').click();

		// Check last message in the sidebar
		const sidebarChannel = poHomeChannel.sidenav.getSidebarItemByName(channelName);
		await expect(sidebarChannel).toBeVisible();
		await expect(sidebarChannel.locator('span')).toContainText(encryptedMessage1);
	});

	test('expect create a private encrypted channel and pin/star an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('This message should be pinned and stared.');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This message should be pinned and stared.');
		await expect(poHomeChannel.content.getMessageEncryptedIcon(poHomeChannel.content.lastUserMessage)).toBeVisible();

		await poHomeChannel.content.openLastMessageMenu();
		await poHomeChannel.content.btnOptionStarMessage.click();

		await expect(poHomeChannel.toastSuccess).toBeVisible();
		await poHomeChannel.dismissToast();

		await poHomeChannel.content.openLastMessageMenu();
		await poHomeChannel.content.btnOptionPinMessage.click();
		await poHomeChannel.content.btnModalConfirm.click();

		await expect(poHomeChannel.toastSuccess).toBeVisible();
		await poHomeChannel.dismissToast();

		await poHomeChannel.tabs.kebab.click();
		await poHomeChannel.tabs.btnPinnedMessagesList.click();

		await expect(poHomeChannel.content.pinnedMessagesDialog).toBeVisible();

		await expect(poHomeChannel.content.lastPinnedMessage).toContainText('This message should be pinned and stared.');
		await poHomeChannel.content.lastPinnedMessage.hover();
		await poHomeChannel.content.getMessageMoreButton(poHomeChannel.content.lastPinnedMessage).waitFor();
		await poHomeChannel.content.getMessageMoreButton(poHomeChannel.content.lastPinnedMessage).click();
		await expect(poHomeChannel.content.btnOptionCopyLink).toHaveClass(/disabled/);

		await poHomeChannel.btnContextualbarClose.click();

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
