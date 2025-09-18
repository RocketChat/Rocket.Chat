import { faker } from '@faker-js/faker';

import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { preserveSettings } from '../utils/preserveSettings';
import { test, expect } from '../utils/test';

const settingsList = ['E2E_Enable'];

preserveSettings(settingsList);

test.describe('E2EE Thread Messages', () => {
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

	test('expect create a private encrypted channel and send a encrypted thread message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await test.step('create encrypted channel', async () => {
			await poHomeChannel.sidenav.createEncryptedChannel(channelName);
			createdChannels.push(channelName);
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
});
