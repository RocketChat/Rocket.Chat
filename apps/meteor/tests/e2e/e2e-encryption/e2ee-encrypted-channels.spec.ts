import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';
import type { IRoom } from '@rocket.chat/core-typings';
import type { APIRequestContext } from 'playwright-core';

import { BASE_API_URL, DEFAULT_USER_CREDENTIALS } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { ToastMessages } from '../page-objects/fragments';
import { CreateE2EEChannel } from '../page-objects/fragments/e2ee';
import { deletePrivateRoomsByName, setUserPreferences } from '../utils';
import { preserveSettings } from '../utils/preserveSettings';
import { sendMessageFromUser } from '../utils/sendMessage';
import { test, expect } from '../utils/test';

const settingsList = [
	'E2E_Enable',
	'E2E_Allow_Unencrypted_Messages',
	'E2E_Enabled_Default_DirectRooms',
	'E2E_Enabled_Default_PrivateRooms',
];

preserveSettings(settingsList);

test.describe('E2EE Encrypted Channels', () => {
	const createdChannels: string[] = [];
	let poHomeChannel: HomeChannel;
	let toastMessages: ToastMessages;
	let createE2EEChannel: CreateE2EEChannel;

	test.use({ storageState: Users.userE2EE.state });

	const createGroupAsE2EEUser = async (request: APIRequestContext, extraData?: { encrypted: boolean }): Promise<IRoom> => {
		const name = faker.string.uuid();
		const response = await request.post(`${BASE_API_URL}/groups.create`, {
			headers: { 'X-Auth-Token': Users.userE2EE.data.loginToken, 'X-User-Id': Users.userE2EE.data._id },
			data: { name, extraData },
		});
		expect(response.status()).toBe(200);
		createdChannels.push(name);
		return (await response.json()).group;
	};

	const openEncryptedGroup = async (request: APIRequestContext, page: Page): Promise<IRoom> => {
		const group = await createGroupAsE2EEUser(request, { encrypted: true });

		await poHomeChannel.gotoGroup(group.name as string);
		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
		await expect
			.poll(
				() =>
					page.evaluate(async (rid) => {
						// eslint-disable-next-line import-x/no-absolute-path
						const { e2e } = require('/client/lib/e2ee/rocketchat.e2e.ts') as typeof import('../../../client/lib/e2ee/rocketchat.e2e');
						const room = await e2e.getInstanceByRoomId(rid);
						return room?.getState();
					}, group._id),
				{ message: 'expect room encryption key to be ready before sending messages' },
			)
			.toBe('READY');

		return group;
	};

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true });
		await api.post('/settings/E2E_Enabled_Default_DirectRooms', { value: false });
		await api.post('/settings/E2E_Enabled_Default_PrivateRooms', { value: false });
		await api.post('/im.delete', { username: 'user2' });
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		createE2EEChannel = new CreateE2EEChannel(page);
	});

	test.afterAll(async () => {
		await deletePrivateRoomsByName(
			{ username: Users.userE2EE.data.username, password: DEFAULT_USER_CREDENTIALS.password },
			createdChannels,
		);
	});

	test('expect create a private channel encrypted and send an encrypted message', async ({ page }) => {
		toastMessages = new ToastMessages(page);

		const channelName = faker.string.uuid();

		await poHomeChannel.goto();
		await createE2EEChannel.createAndStore(channelName, createdChannels);

		await expect(page).toHaveURL(`/group/${channelName}`);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
		await toastMessages.dismissToast();

		await poHomeChannel.roomToolbar.openMoreOptions();
		await poHomeChannel.roomToolbar.menuItemDisableE2EEncryption.click();
		await expect(page.getByRole('dialog', { name: 'Disable encryption' })).toBeVisible();
		await page.getByRole('button', { name: 'Disable encryption' }).click();
		await poHomeChannel.toastMessage.dismissToast();
		await page.waitForTimeout(1000);

		await poHomeChannel.content.sendMessage('hello world not encrypted');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world not encrypted');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).not.toBeVisible();

		await poHomeChannel.roomToolbar.openMoreOptions();
		await expect(poHomeChannel.roomToolbar.menuItemEnableE2EEncryption).toBeVisible();
		await poHomeChannel.roomToolbar.menuItemEnableE2EEncryption.click();
		await expect(page.getByRole('dialog', { name: 'Enable encryption' })).toBeVisible();
		await page.getByRole('button', { name: 'Enable encryption' }).click();
		await poHomeChannel.toastMessage.dismissToast();
		await page.waitForTimeout(1000);

		await poHomeChannel.content.sendMessage('hello world encrypted again');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world encrypted again');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
	});

	test('expect create a private encrypted channel and send a encrypted thread message', async ({ page, request }) => {
		await openEncryptedGroup(request, page);

		await poHomeChannel.content.sendMessage('This is the thread main message.');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is the thread main message.');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
		await poHomeChannel.content.openReplyInThread();

		await expect(page).toHaveURL(/.*thread/);

		await expect(poHomeChannel.content.mainThreadMessageText).toContainText('This is the thread main message.');
		await expect(poHomeChannel.content.mainThreadMessageText.locator('.rcx-icon--name-key')).toBeVisible();

		await poHomeChannel.content.toggleAlsoSendThreadToChannel(true);
		await page.getByRole('dialog').locator('[name="msg"]').last().fill('This is an encrypted thread message also sent in channel');
		await page.keyboard.press('Enter');
		await expect(poHomeChannel.content.lastUserThreadMessage).toContainText('This is an encrypted thread message also sent in channel');
		await expect(poHomeChannel.content.lastUserThreadMessage.locator('.rcx-icon--name-key')).toBeVisible();
		await expect(poHomeChannel.content.lastThreadMessagePreview).toContainText('This is an encrypted thread message also sent in channel');
		await expect(poHomeChannel.content.mainThreadMessageText).toContainText('This is the thread main message.');
		await expect(poHomeChannel.content.mainThreadMessageText.locator('.rcx-icon--name-key')).toBeVisible();
	});

	test('expect create a private encrypted channel and check disabled message menu actions on an encrypted message', async ({
		page,
		request,
	}) => {
		await openEncryptedGroup(request, page);

		await poHomeChannel.content.sendMessage('This is an encrypted message.');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is an encrypted message.');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await poHomeChannel.content.lastUserMessage.hover();
		await expect(page.locator('role=button[name="Forward message not available on encrypted content"]')).toBeDisabled();

		await poHomeChannel.content.openLastMessageMenu();

		await expect(page.locator('role=menuitem[name="Reply in direct message"]')).toHaveClass(/disabled/);
		await expect(page.locator('role=menuitem[name="Copy link"]')).toHaveClass(/disabled/);
	});

	test('expect create a private channel, encrypt it and send an encrypted message', async ({ page, request }) => {
		const group = await createGroupAsE2EEUser(request);
		await poHomeChannel.gotoGroup(group.name as string);

		await poHomeChannel.roomToolbar.openMoreOptions();
		// TODO(@jessicaschelly/@dougfabris): fix this flaky behavior
		if (!(await poHomeChannel.roomToolbar.menuItemEnableE2EEncryption.isVisible())) {
			await poHomeChannel.roomToolbar.openMoreOptions();
		}
		await poHomeChannel.roomToolbar.menuItemEnableE2EEncryption.click();
		await expect(page.getByRole('dialog', { name: 'Enable encryption' })).toBeVisible();
		await page.getByRole('button', { name: 'Enable encryption' }).click();
		await page.waitForTimeout(1000);

		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

		await poHomeChannel.content.sendMessage('hello world');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
	});

	test('expect create a encrypted private channel and mention user', async ({ page, request }) => {
		await openEncryptedGroup(request, page);

		await poHomeChannel.content.sendMessage('hello @user1');

		const userMention = page.getByRole('button', {
			name: 'user1',
		});

		await expect(userMention).toBeVisible();
	});

	test('expect create a encrypted private channel, mention a channel and navigate to it', async ({ page, request }) => {
		await openEncryptedGroup(request, page);

		await poHomeChannel.content.sendMessage('Are you in the #general channel?');

		const channelMention = page.getByRole('button', {
			name: 'general',
		});

		await expect(channelMention).toBeVisible();

		await channelMention.click();

		await expect(page).toHaveURL(`/channel/general`);
	});

	test('expect create a encrypted private channel, mention a channel and user', async ({ page, request }) => {
		await openEncryptedGroup(request, page);

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
		api,
		request,
	}) => {
		await setUserPreferences(api, { sidebarViewMode: 'extended' }, Users.userE2EE.data._id);

		const group = await createGroupAsE2EEUser(request);
		const channelName = group.name as string;
		await sendMessageFromUser(request, Users.userE2EE, group._id, 'first unencrypted message');
		await sendMessageFromUser(request, Users.userE2EE, group._id, 'second unencrypted message');

		await poHomeChannel.gotoGroup(channelName);

		// Encrypt channel
		await poHomeChannel.roomToolbar.openMoreOptions();
		await expect(poHomeChannel.roomToolbar.menuItemEnableE2EEncryption).toBeVisible();
		await poHomeChannel.roomToolbar.menuItemEnableE2EEncryption.click();
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

	test('expect create a private encrypted channel and pin/star an encrypted message', async ({ page, request }) => {
		await openEncryptedGroup(request, page);

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

		await poHomeChannel.roomToolbar.openMoreOptions();
		await poHomeChannel.roomToolbar.menuItemPinnedMessages.click();

		await expect(page.getByRole('dialog', { name: 'Pinned messages' })).toBeVisible();

		const lastPinnedMessage = page
			.getByRole('dialog', { name: 'Pinned messages' })
			.locator('[role="listitem"][aria-roledescription="message"]')
			.last();
		await expect(lastPinnedMessage).toContainText('This message should be pinned and stared.');
		await lastPinnedMessage.hover();
		await lastPinnedMessage.locator('role=button[name="More"]').waitFor();
		await lastPinnedMessage.locator('role=button[name="More"]').click();
		await expect(page.locator('role=menuitem[name="Copy link"]')).toHaveClass(/disabled/);

		await poHomeChannel.btnContextualbarClose.click();
		await poHomeChannel.roomToolbar.openMoreOptions();
		await poHomeChannel.roomToolbar.menuItemStarredMessages.click();

		const lastStarredMessage = page
			.getByRole('dialog', { name: 'Starred messages' })
			.locator('[role="listitem"][aria-roledescription="message"]')
			.last();
		await expect(page.getByRole('dialog', { name: 'Starred messages' })).toBeVisible();
		await expect(lastStarredMessage).toContainText('This message should be pinned and stared.');
		await lastStarredMessage.hover();
		await lastStarredMessage.locator('role=button[name="More"]').waitFor();
		await lastStarredMessage.locator('role=button[name="More"]').click();
		await expect(page.locator('role=menuitem[name="Copy link"]')).toHaveClass(/disabled/);
	});

	test('expect to edit encrypted message', async ({ page, request }) => {
		const originalMessage = 'This is the original encrypted message';
		const editedMessage = 'This is the edited encrypted message';

		await openEncryptedGroup(request, page);

		await poHomeChannel.content.sendMessage(originalMessage);

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText(originalMessage);
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await poHomeChannel.content.openLastMessageMenu();
		await poHomeChannel.content.btnOptionEditMessage.click();
		await poHomeChannel.composer.inputMessage.fill(editedMessage);

		await page.keyboard.press('Enter');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText(editedMessage);
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
	});

	test('expect to edit encrypted message to include mention', async ({ page, request }) => {
		const originalMessage = 'This is the original encrypted message';
		const editedMessage = 'This is the edited encrypted message with a mention to @user1 and #general';
		const displayedMessage = 'This is the edited encrypted message with a mention to user1 and general';

		await openEncryptedGroup(request, page);

		await poHomeChannel.content.sendMessage(originalMessage);
		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText(originalMessage);
		await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();

		await poHomeChannel.content.openLastMessageMenu();
		await poHomeChannel.content.btnOptionEditMessage.click();
		await poHomeChannel.composer.inputMessage.fill(editedMessage);

		await poHomeChannel.composer.btnSend.click();

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
