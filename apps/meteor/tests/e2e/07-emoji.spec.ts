import { test, expect, Page } from '@playwright/test';

import { Auth, HomeChannel } from './page-objects';

test.describe('Emoji', () => {
	let page: Page;
	let pageAuth: Auth;
	let pageHomeChannel: HomeChannel;

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
		pageAuth = new Auth(page);
		pageHomeChannel = new HomeChannel(page);
	});

	test.beforeAll(async () => {
		await pageAuth.doLogin();
		await pageHomeChannel.sidenav.doOpenChat('general');
	});

	test.describe('send emoji via screen:', () => {
		test.beforeAll(async () => {
			await pageHomeChannel.content.emojiBtn.click();
			await pageHomeChannel.content.emojiPickerPeopleIcon.click();
		});

		test('expect select a grinning emoji', async () => {
			await pageHomeChannel.content.emojiGrinning.first().click();
		});

		test('expect be that the value on the message input is the same as the emoji clicked', async () => {
			await expect(pageHomeChannel.content.inputMain).toHaveValue(':grinning: ');
		});

		test('expect send the emoji', async () => {
			await pageHomeChannel.content.inputMain.type(' ');
			await page.keyboard.press('Enter');
		});

		test('expect be that the value on the message is the same as the emoji clicked', async () => {
			await expect(pageHomeChannel.content.lastUserMessage).toContainText('😀');
		});
	});

	test.describe('send emoji via text:', () => {
		test('expect add emoji text to the message input', async () => {
			await pageHomeChannel.content.inputMain.type(':smiley');
		});

		test('expect show the emoji popup bar', async () => {
			await expect(pageHomeChannel.content.messagePopUp).toBeVisible();
		});

		test('expect be that the emoji popup bar title is emoji', async () => {
			await expect(pageHomeChannel.content.messagePopUpTitle).toContainText('Emoji');
		});

		test('expect show the emoji popup bar items', async () => {
			await expect(pageHomeChannel.content.messagePopUpItems).toBeVisible();
		});

		test('expect click the first emoji on the popup list', async () => {
			await pageHomeChannel.content.messagePopUpFirstItem.click();
		});

		test('expect be that the value on the message input is the same as the emoji clicked', async () => {
			await expect(pageHomeChannel.content.inputMain).toHaveValue(':smiley: ');
		});

		test('expect send the emoji', async () => {
			await pageHomeChannel.content.btnSend.click();
		});

		test('expect be that the value on the message is the same as the emoji clicked', async () => {
			await expect(pageHomeChannel.content.lastUserMessage).toContainText('😃');
		});
	});

	test.describe("send texts and make sure they're not converted to emojis:", () => {
		test('should render numbers', async () => {
			await pageHomeChannel.content.doSendMessage('0 1 2 3 4 5 6 7 8 9');
			await expect(pageHomeChannel.content.lastUserMessage).toContainText('0 1 2 3 4 5 6 7 8 9');
		});

		test('should render special characters', async () => {
			await pageHomeChannel.content.doSendMessage('® © ™ # *');
			await expect(pageHomeChannel.content.lastUserMessage).toContainText('® © ™ # *');
		});
	});
});
