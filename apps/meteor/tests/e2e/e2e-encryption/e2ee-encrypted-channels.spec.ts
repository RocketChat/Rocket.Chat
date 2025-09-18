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

		await test.step('create encrypted channel', async () => {
			await poHomeChannel.sidenav.createEncryptedChannel(channelName);
			await expect(page).toHaveURL(`/group/${channelName}`);
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
		});

		await test.step('send encrypted message and verify encryption', async () => {
			await poHomeChannel.content.sendMessage('hello world');
			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
			await expect(poHomeChannel.content.getMessageEncryptedIcon(poHomeChannel.content.lastUserMessage)).toBeVisible();
		});

		await test.step('disable encryption', async () => {
			await poHomeChannel.tabs.kebab.click({ force: true });
			await expect(poHomeChannel.tabs.btnDisableE2E).toBeVisible();
			await poHomeChannel.tabs.btnDisableE2E.click({ force: true });
			await disableEncryptionModal.disable();
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).not.toBeVisible();
		});

		await test.step('send unencrypted message and verify no encryption', async () => {
			await poHomeChannel.content.sendMessage('hello world not encrypted');
			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world not encrypted');
			await expect(poHomeChannel.content.getMessageEncryptedIcon(poHomeChannel.content.lastUserMessage)).not.toBeVisible();
		});

		await test.step('re-enable encryption', async () => {
			await poHomeChannel.tabs.kebab.click({ force: true });
			await expect(poHomeChannel.tabs.btnEnableE2E).toBeVisible();
			await poHomeChannel.tabs.btnEnableE2E.click({ force: true });
			await enableEncryptionModal.enable();
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
		});

		await test.step('send encrypted message again and verify encryption restored', async () => {
			await poHomeChannel.content.sendMessage('hello world encrypted again');
			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world encrypted again');
			await expect(poHomeChannel.content.getMessageEncryptedIcon(poHomeChannel.content.lastUserMessage)).toBeVisible();
		});
	});

	test('expect create a private encrypted channel and send a encrypted thread message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await test.step('create encrypted channel', async () => {
			await poHomeChannel.sidenav.createEncryptedChannel(channelName);
			await expect(page).toHaveURL(`/group/${channelName}`);
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
		});

		await test.step('send main thread message', async () => {
			await poHomeChannel.content.sendMessage('This is the thread main message.');
			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is the thread main message.');
			await expect(poHomeChannel.content.getMessageEncryptedIcon(poHomeChannel.content.lastUserMessage)).toBeVisible();
		});

		await test.step('open reply in thread', async () => {
			await poHomeChannel.content.openReplyInThread();
			await expect(page).toHaveURL(/.*thread/);
		});

		await test.step('verify main thread message is encrypted', async () => {
			await expect(poHomeChannel.content.mainThreadMessageText).toContainText('This is the thread main message.');
			await expect(poHomeChannel.content.getMessageEncryptedIcon(poHomeChannel.content.mainThreadMessageText)).toBeVisible();
		});

		await test.step('send encrypted reply on thread message', async () => {
			await poHomeChannel.content.toggleAlsoSendThreadToChannel(true);
			await poHomeChannel.content.inputThreadMessage.fill('This is an encrypted thread message also sent in channel');
			await page.keyboard.press('Enter');
		});

		await test.step('verify all thread messages are encrypted', async () => {
			await expect(poHomeChannel.content.lastThreadMessageText).toContainText('This is an encrypted thread message also sent in channel');
			await expect(poHomeChannel.content.getMessageEncryptedIcon(poHomeChannel.content.lastThreadMessageText)).toBeVisible();
			await expect(poHomeChannel.content.lastUserMessage).toContainText('This is an encrypted thread message also sent in channel');
			await expect(poHomeChannel.content.mainThreadMessageText).toContainText('This is the thread main message.');
			await expect(poHomeChannel.content.getMessageEncryptedIcon(poHomeChannel.content.mainThreadMessageText)).toBeVisible();
		});
	});

	test('expect create a private encrypted channel and check disabled message menu actions on an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await test.step('create encrypted channel', async () => {
			await poHomeChannel.sidenav.createEncryptedChannel(channelName);
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

	test('expect create a private channel, encrypt it and send an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await test.step('create private channel', async () => {
			await poHomeChannel.sidenav.openNewByLabel('Channel');
			await poHomeChannel.sidenav.inputChannelName.fill(channelName);
			await poHomeChannel.sidenav.btnCreate.click();
			await expect(page).toHaveURL(`/group/${channelName}`);
			await expect(poHomeChannel.toastSuccess).toBeVisible();
			await poHomeChannel.dismissToast();
		});

		await test.step('enable encryption', async () => {
			await poHomeChannel.tabs.kebab.click();
			await expect(poHomeChannel.tabs.btnEnableE2E).toBeVisible();
			await poHomeChannel.tabs.btnEnableE2E.click();
			await enableEncryptionModal.enable();
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
		});

		await test.step('send encrypted message and verify', async () => {
			await poHomeChannel.content.sendMessage('hello world');
			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
			await expect(poHomeChannel.content.getMessageEncryptedIcon(poHomeChannel.content.lastUserMessage)).toBeVisible();
		});
	});

	test('expect create a encrypted private channel and mention user', async ({ page }) => {
		const channelName = faker.string.uuid();

		await test.step('create encrypted channel', async () => {
			await poHomeChannel.sidenav.createEncryptedChannel(channelName);
			await expect(page).toHaveURL(`/group/${channelName}`);
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
		});

		await test.step('mention user', async () => {
			await poHomeChannel.content.sendMessage('hello @user1');
			await expect(poHomeChannel.content.getUserMention('user1')).toBeVisible();
		});
	});

	test('expect create a encrypted private channel, mention a channel and navigate to it', async ({ page }) => {
		const channelName = faker.string.uuid();

		await test.step('create encrypted channel', async () => {
			await poHomeChannel.sidenav.createEncryptedChannel(channelName);
			await expect(page).toHaveURL(`/group/${channelName}`);
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
		});

		await test.step('mention channel', async () => {
			await poHomeChannel.content.sendMessage('Are you in the #general channel?');
			await expect(poHomeChannel.content.getChannelMention('general')).toBeVisible();
		});

		await test.step('navigate to channel', async () => {
			await poHomeChannel.content.getChannelMention('general').click();
			await expect(page).toHaveURL(`/channel/general`);
		});
	});

	test('expect create a encrypted private channel, mention a channel and user', async ({ page }) => {
		const channelName = faker.string.uuid();

		await test.step('create encrypted channel', async () => {
			await poHomeChannel.sidenav.createEncryptedChannel(channelName);
			await expect(page).toHaveURL(`/group/${channelName}`);
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
		});

		await test.step('mention channel and user', async () => {
			await poHomeChannel.content.sendMessage('Are you in the #general channel, @user1 ?');
			await expect(poHomeChannel.content.getUserMention('user1')).toBeVisible();
			await expect(poHomeChannel.content.getChannelMention('general')).toBeVisible();
		});
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

	test('expect create a private encrypted channel and pin/star an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await test.step('create encrypted channel and send message', async () => {
			await poHomeChannel.sidenav.createEncryptedChannel(channelName);
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
