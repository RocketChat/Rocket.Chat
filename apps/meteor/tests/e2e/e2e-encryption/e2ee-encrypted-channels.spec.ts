import { faker } from '@faker-js/faker';

import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { ToastMessages } from '../page-objects/fragments';
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
	let toastMessages: ToastMessages;

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

	test('expect create a private channel encrypted and send an encrypted message', async ({ page }) => {
		toastMessages = new ToastMessages(page);

		const channelName = faker.string.uuid();

		await poHomeChannel.navbar.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
		await toastMessages.dismissToast();

		await poHomeChannel.tabs.kebab.click({ force: true });

		await expect(poHomeChannel.tabs.btnDisableE2E).toBeVisible();
		await poHomeChannel.tabs.btnDisableE2E.click({ force: true });
		await expect(page.getByRole('dialog', { name: 'Disable encryption' })).toBeVisible();
		await page.getByRole('button', { name: 'Disable encryption' }).click();
		await poHomeChannel.toastMessage.dismissToast();
		await page.waitForTimeout(1000);

		await poHomeChannel.content.sendMessage('hello world not encrypted');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world not encrypted');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).not.toBeVisible();

		await poHomeChannel.tabs.kebab.click({ force: true });
		await expect(poHomeChannel.tabs.btnEnableE2E).toBeVisible();
		await poHomeChannel.tabs.btnEnableE2E.click({ force: true });
		await expect(page.getByRole('dialog', { name: 'Enable encryption' })).toBeVisible();
		await page.getByRole('button', { name: 'Enable encryption' }).click();
		await poHomeChannel.toastMessage.dismissToast();
		await page.waitForTimeout(1000);

		await poHomeChannel.content.sendMessage('hello world encrypted again');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world encrypted again');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
	});

	test('expect create a private encrypted channel and send a encrypted thread message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.navbar.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('This is the thread main message.');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is the thread main message.');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await page.locator('[data-qa-type="message"]').last().hover();
		await page.locator('role=button[name="Reply in thread"]').click();

		await expect(page).toHaveURL(/.*thread/);

		await expect(poHomeChannel.content.mainThreadMessageText).toContainText('This is the thread main message.');
		await expect(poHomeChannel.content.mainThreadMessageText.locator('.rcx-icon--name-key')).toBeVisible();

		await poHomeChannel.content.toggleAlsoSendThreadToChannel(true);
		await page.getByRole('dialog').locator('[name="msg"]').last().fill('This is an encrypted thread message also sent in channel');
		await page.keyboard.press('Enter');
		await expect(poHomeChannel.content.lastThreadMessageText).toContainText('This is an encrypted thread message also sent in channel');
		await expect(poHomeChannel.content.lastThreadMessageText.locator('.rcx-icon--name-key')).toBeVisible();
		await expect(poHomeChannel.content.lastUserMessage).toContainText('This is an encrypted thread message also sent in channel');
		await expect(poHomeChannel.content.mainThreadMessageText).toContainText('This is the thread main message.');
		await expect(poHomeChannel.content.mainThreadMessageText.locator('.rcx-icon--name-key')).toBeVisible();
	});

	test('expect create a private encrypted channel and check disabled message menu actions on an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.navbar.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('This is an encrypted message.');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is an encrypted message.');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await page.locator('[data-qa-type="message"]').last().hover();
		await expect(page.locator('role=button[name="Forward message not available on encrypted content"]')).toBeDisabled();

		await poHomeChannel.content.openLastMessageMenu();

		await expect(page.locator('role=menuitem[name="Reply in direct message"]')).toHaveClass(/disabled/);
		await expect(page.locator('role=menuitem[name="Copy link"]')).toHaveClass(/disabled/);
	});

	test('expect create a private channel, encrypt it and send an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.navbar.createNew('Channel', channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await poHomeChannel.toastMessage.waitForDisplay();
		await poHomeChannel.toastMessage.dismissToast();

		await poHomeChannel.tabs.kebab.click();
		// TODO(@jessicaschelly/@dougfabris): fix this flaky behavior
		if (!(await poHomeChannel.tabs.btnEnableE2E.isVisible())) {
			await poHomeChannel.tabs.kebab.click();
		}
		await poHomeChannel.tabs.btnEnableE2E.click();
		await expect(page.getByRole('dialog', { name: 'Enable encryption' })).toBeVisible();
		await page.getByRole('button', { name: 'Enable encryption' }).click();
		await page.waitForTimeout(1000);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
	});

	test('expect create a encrypted private channel and mention user', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.navbar.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('hello @user1');

		const userMention = page.getByRole('button', {
			name: 'user1',
		});

		await expect(userMention).toBeVisible();
	});

	test('expect create a encrypted private channel, mention a channel and navigate to it', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.navbar.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('Are you in the #general channel?');

		const channelMention = page.getByRole('button', {
			name: 'general',
		});

		await expect(channelMention).toBeVisible();

		await channelMention.click();

		await expect(page).toHaveURL(`/channel/general`);
	});

	test('expect create a encrypted private channel, mention a channel and user', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.navbar.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('Are you in the #general channel, @user1 ?');

		const channelMention = page.getByRole('button', {
			name: 'general',
		});

		const userMention = page.getByRole('button', {
			name: 'user1',
		});

		await expect(userMention).toBeVisible();
		await expect(channelMention).toBeVisible();
	});

	test('expect create a private channel, send unecrypted messages, encrypt the channel and delete the last message and check the last message in the sidebar', async ({
		page,
	}) => {
		const channelName = faker.string.uuid();

		// Enable Sidebar Extended display mode
		await poHomeChannel.navbar.setDisplayMode('Extended');

		// Create private channel
		await poHomeChannel.navbar.createNew('Channel', channelName, { private: true });

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
		await expect(page.getByRole('dialog', { name: 'Enable encryption' })).toBeVisible();
		await page.getByRole('button', { name: 'Enable encryption' }).click();
		await page.waitForTimeout(1000);
		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		// Send Encrypted Messages
		const encriptedMessage1 = 'first ENCRYPTED message';
		const encriptedMessage2 = 'second ENCRYPTED message';
		await poHomeChannel.content.sendMessage(encriptedMessage1);
		await poHomeChannel.content.sendMessage(encriptedMessage2);

		//  Delete last message
		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText(encriptedMessage2);
		await poHomeChannel.content.openLastMessageMenu();
		// TODO(@jessicaschelly/@dougfabris): fix this flaky behavior
		if (!(await page.locator('role=menuitem[name="Delete"]').isVisible())) {
			await poHomeChannel.content.openLastMessageMenu();
		}
		await page.locator('role=menuitem[name="Delete"]').click();
		await page.locator('#modal-root .rcx-button-group--align-end .rcx-button--danger').click();

		// Check last message in the sidebar
		const sidebarChannel = poHomeChannel.sidebar.getSidebarItemByName(channelName);
		await expect(sidebarChannel).toBeVisible();
		await expect(sidebarChannel.getByText(`You: ${encriptedMessage2}`, { exact: true })).not.toBeVisible();
		await expect(sidebarChannel.getByText(`You: ${encriptedMessage1}`, { exact: true })).toBeVisible();
	});

	test('expect create a private encrypted channel and pin/star an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.navbar.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('This message should be pinned and stared.');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This message should be pinned and stared.');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('role=menuitem[name="Star"]').click();

		await poHomeChannel.toastMessage.waitForDisplay();
		await poHomeChannel.toastMessage.dismissToast();

		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('role=menuitem[name="Pin"]').click();
		await page.locator('#modal-root >> button:has-text("Yes, pin message")').click();

		await poHomeChannel.toastMessage.waitForDisplay();
		await poHomeChannel.toastMessage.dismissToast();

		await poHomeChannel.tabs.kebab.click();
		await poHomeChannel.tabs.btnPinnedMessagesList.click();

		await expect(page.getByRole('dialog', { name: 'Pinned Messages' })).toBeVisible();

		const lastPinnedMessage = page.getByRole('dialog', { name: 'Pinned Messages' }).locator('[data-qa-type="message"]').last();
		await expect(lastPinnedMessage).toContainText('This message should be pinned and stared.');
		await lastPinnedMessage.hover();
		await lastPinnedMessage.locator('role=button[name="More"]').waitFor();
		await lastPinnedMessage.locator('role=button[name="More"]').click();
		await expect(page.locator('role=menuitem[name="Copy link"]')).toHaveClass(/disabled/);

		await poHomeChannel.btnContextualbarClose.click();

		await poHomeChannel.tabs.kebab.click();
		await poHomeChannel.tabs.btnStarredMessageList.click();

		const lastStarredMessage = page.getByRole('dialog', { name: 'Starred Messages' }).locator('[data-qa-type="message"]').last();
		await expect(page.getByRole('dialog', { name: 'Starred Messages' })).toBeVisible();
		await expect(lastStarredMessage).toContainText('This message should be pinned and stared.');
		await lastStarredMessage.hover();
		await lastStarredMessage.locator('role=button[name="More"]').waitFor();
		await lastStarredMessage.locator('role=button[name="More"]').click();
		await expect(page.locator('role=menuitem[name="Copy link"]')).toHaveClass(/disabled/);
	});

	test('expect to edit encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();
		const originalMessage = 'This is the original encrypted message';
		const editedMessage = 'This is the edited encrypted message';

		await poHomeChannel.navbar.createEncryptedChannel(channelName);
		await expect(page).toHaveURL(`/group/${channelName}`);
		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage(originalMessage);

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText(originalMessage);
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await poHomeChannel.content.openLastMessageMenu();
		await poHomeChannel.content.btnOptionEditMessage.click();
		await poHomeChannel.content.inputMessage.fill(editedMessage);

		await page.keyboard.press('Enter');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText(editedMessage);
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
	});

	test('expect to edit encrypted message to include mention', async ({ page }) => {
		const channelName = faker.string.uuid();
		const originalMessage = 'This is the original encrypted message';
		const editedMessage = 'This is the edited encrypted message with a mention to @user1 and #general';
		const displayedMessage = 'This is the edited encrypted message with a mention to user1 and general';

		await poHomeChannel.navbar.createEncryptedChannel(channelName);
		await expect(page).toHaveURL(`/group/${channelName}`);
		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage(originalMessage);
		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText(originalMessage);
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await poHomeChannel.content.openLastMessageMenu();
		await poHomeChannel.content.btnOptionEditMessage.click();
		await poHomeChannel.content.inputMessage.fill(editedMessage);

		await page.keyboard.press('Enter');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText(displayedMessage);
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		const userMention = page.getByRole('button', {
			name: 'user1',
		});

		await expect(userMention).toBeVisible();

		const channelMention = page.getByRole('button', {
			name: 'general',
		});

		await expect(channelMention).toBeVisible();
	});
});
