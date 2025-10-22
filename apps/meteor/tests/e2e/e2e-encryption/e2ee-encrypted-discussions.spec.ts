import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeChannel, HomeDiscussion } from '../page-objects';
import { preserveSettings } from '../utils/preserveSettings';
import { test, expect } from '../utils/test';

const settingsList = ['E2E_Enable'];

preserveSettings(settingsList);

test.describe('E2EE Encrypted Discussions', () => {
	let poHomeChannel: HomeChannel;
	let poHomeDiscussion: HomeDiscussion;
	let userE2EE2Page: Page;
	let poHomeChannelUserE2EE2: HomeChannel;
	let poHomeDiscussionUserE2EE2: HomeDiscussion;

	test.use({ storageState: Users.userE2EE.state });

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
	});

	test.beforeEach(async ({ browser, page }) => {
		poHomeChannel = new HomeChannel(page);
		poHomeDiscussion = new HomeDiscussion(page);
		userE2EE2Page = (await createAuxContext(browser, Users.userE2EE2)).page;
		poHomeChannelUserE2EE2 = new HomeChannel(userE2EE2Page);
		poHomeDiscussionUserE2EE2 = new HomeDiscussion(userE2EE2Page);
		await page.goto('/home');
	});

	test.afterEach(async () => {
		await userE2EE2Page.close();
	});

	test('expect to create an encrypted discussion from a message and verify E2EE functionality', async ({ page }) => {
		const channelName = faker.string.uuid();
		const originalMessage = `This message will be used to create a discussion ${Date.now()}`;
		const discussionMessage = 'This is an encrypted message in the discussion';

		await test.step('create an encrypted channel and send a message', async () => {
			await poHomeChannel.sidenav.createEncryptedChannel(channelName);
			await expect(page).toHaveURL(`/group/${channelName}`);
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();

			await poHomeChannel.content.sendMessage(originalMessage);
			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText(originalMessage);
			await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
		});

		await test.step('create encrypted discussion from message and add secondary user', async () => {
			await poHomeChannel.content.openLastMessageMenu();
			await poHomeChannel.content.btnOptionStartDiscussion.click();

			await expect(poHomeDiscussion.btnCreate).not.toBeDisabled();

			await poHomeDiscussion.addMember('userE2EE2');

			await poHomeDiscussion.btnCreate.click();

			await expect(poHomeDiscussion.content.channelHeader).toContainText(originalMessage);
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
		});

		await test.step('send encrypted message in discussion', async () => {
			// Reload to ensure E2EE keys are synced
			await page.reload();

			await poHomeChannel.content.sendMessage(discussionMessage);
			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText(discussionMessage);
			await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
		});

		await test.step('verify secondary user can decrypt the message', async () => {
			await poHomeChannelUserE2EE2.sidenav.openChat(originalMessage);
			await expect(poHomeDiscussionUserE2EE2.content.channelHeader).toContainText(originalMessage);
			await expect(poHomeChannelUserE2EE2.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
			await expect(poHomeChannelUserE2EE2.content.lastUserMessageBody).toHaveText(discussionMessage);
		});
	});
});
