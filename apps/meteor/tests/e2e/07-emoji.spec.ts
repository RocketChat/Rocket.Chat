import { test, expect } from './utils/test';
import { Auth, HomeChannel } from './page-objects';

test.describe('Emoji', () => {
	let pageAuth: Auth;
	let pageHomeChannel: HomeChannel;

	test.beforeEach(async ({ page }) => {
		pageAuth = new Auth(page);
		pageHomeChannel = new HomeChannel(page);
	});

	test.beforeEach(async () => {
		await pageAuth.doLogin();
		await pageHomeChannel.sidenav.doOpenChat('general');
	});

	test.describe('send emoji via screen:', () => {
		test('expect select a grinning emoji', async ({ page }) => {
			await pageHomeChannel.content.emojiBtn.click();
			await pageHomeChannel.content.emojiPickerPeopleIcon.click();

			await pageHomeChannel.content.emojiGrinning.first().click();
			await expect(pageHomeChannel.content.inputMain).toHaveValue(':grinning: ');
			await page.keyboard.press('Enter');
			await expect(pageHomeChannel.content.lastUserMessage).toContainText('😀');
		});
	});

	test.describe('send emoji via text:', () => {
		test('expect add emoji text to the message input', async () => {
			await pageHomeChannel.content.inputMain.type(':smiley');
			await expect(pageHomeChannel.content.messagePopUp).toBeVisible();

			await expect(pageHomeChannel.content.messagePopUpTitle).toContainText('Emoji');
			await expect(pageHomeChannel.content.messagePopUpItems).toBeVisible();
			await pageHomeChannel.content.messagePopUpFirstItem.click();
			await expect(pageHomeChannel.content.inputMain).toHaveValue(':smiley: ');
			await pageHomeChannel.content.btnSend.click();
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
