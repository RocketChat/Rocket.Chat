import { Page, test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

import { HomeChannel, Auth } from './page-objects';

test.describe('Messaging', () => {
	let newChannel: string;

	let page1: Page;
	let pageAuth1: Auth;
	let pageHomeChannel1: HomeChannel;

	let page2: Page;
	let pageAuth2: Auth;
	let pageHomeChannel2: HomeChannel;

	test.beforeAll(async ({ browser }) => {
		// Setup page1
		page1 = await browser.newPage();
		pageAuth1 = new Auth(page1);
		pageHomeChannel1 = new HomeChannel(page1);
		newChannel = `NEWCHANNEL${Date.now()}`;

		await pageAuth1.doLogin();
		await pageHomeChannel1.sidebar.doCreateChannel(newChannel, false);

		// Setup page2
		page2 = await browser.newPage();
		pageAuth2 = new Auth(page2);
		pageHomeChannel2 = new HomeChannel(page2);

		const newUser = {
			name: faker.name.firstName(),
			email: faker.internet.email(),
			password: 'any_password',
		};

		await pageAuth2.doRegister(newUser);
		await pageHomeChannel2.sidebar.doOpenChat(newChannel);
	});

	test('expect start chat', async () => {
		await pageHomeChannel1.content.doSendMessage('HI');
		await pageHomeChannel2.content.doSendMessage('HI');

		await expect(pageHomeChannel1.content.lastUserMessage).toBeVisible();
		await expect(pageHomeChannel2.content.lastUserMessage).toBeVisible();
	});

	test('expect send file to user', async () => {
		await pageHomeChannel1.content.doDropFileInChat();
		await pageHomeChannel1.btnModalConfirm.click();

		await expect(pageHomeChannel2.content.lastUserMessage).toBeVisible();
	});

	test('expect send file with description', async () => {
		await pageHomeChannel1.content.doDropFileInChat();
		await pageHomeChannel1.inputFileDescription.type('any_description');
		await pageHomeChannel1.btnModalConfirm.click();

		await expect(pageHomeChannel2.content.lastUserMessage).toBeVisible();
	});

	test('expect send file with different file name', async () => {
		await pageHomeChannel1.content.doDropFileInChat();
		await pageHomeChannel1.inputFileName.fill('new_file-name.txt');
		await pageHomeChannel1.btnModalConfirm.click();

		await expect(pageHomeChannel2.content.lastUserMessage).toBeVisible();
	});

	test('expect send file with different file name and description', async () => {
		await pageHomeChannel1.content.doDropFileInChat();
		await pageHomeChannel1.inputFileName.fill('new_file-name.txt');
		await pageHomeChannel1.inputFileDescription.type('any_description');
		await pageHomeChannel1.btnModalConfirm.click();

		await expect(pageHomeChannel2.content.lastUserMessage).toBeVisible();
	});

	test('expect message is starred', async () => {
		await pageHomeChannel1.content.doSendMessage('TEST_MESSAGE');
		await pageHomeChannel1.content.doMessageActionMenu();
		await pageHomeChannel1.content.btnStarMessage.click();
	});
});
