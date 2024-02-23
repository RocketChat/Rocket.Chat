import { createAuxContext } from './fixtures/createAuxContext';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe.serial('Messaging', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('should navigate on messages using keyboard', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('msg1');
		await poHomeChannel.content.sendMessage('msg2');

		// move focus to the second message
		await page.keyboard.press('Shift+Tab');
		await expect(page.locator('[data-qa-type="message"]').last()).toBeFocused();

		// move focus to the first system message
		await page.keyboard.press('ArrowUp');
		await page.keyboard.press('ArrowUp');
		await expect(page.locator('[data-qa="system-message"]').first()).toBeFocused();

		// move focus to the first typed message
		await page.keyboard.press('ArrowDown');
		await expect(page.locator('[data-qa-type="message"]:has-text("msg1")')).toBeFocused();

		// move focus to the favorite icon
		await page.keyboard.press('Shift+Tab');
		await expect(poHomeChannel.roomHeaderFavoriteBtn).toBeFocused();

		// refocus on the first typed message
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');
		await expect(page.locator('[data-qa-type="message"]:has-text("msg1")')).toBeFocused();

		// move focus to the message toolbar
		await page.locator('[data-qa-type="message"]:has-text("msg1")').locator('[role=toolbar][aria-label="Message actions"]').getByRole('button', { name: 'Add reaction' }).waitFor();
		
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');
		await expect(page.locator('[data-qa-type="message"]:has-text("msg1")').locator('[role=toolbar][aria-label="Message actions"]').getByRole('button', { name: 'Add reaction' })).toBeFocused();
		
		// move focus to the composer
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');
		await expect(poHomeChannel.composer).toBeFocused();
	});

	test('should not restore focus on the last focused if it was triggered by click', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await page.locator('[data-qa-type="message"]:has-text("msg1")').click();	
		await poHomeChannel.composer.click();
		await page.locator('[data-qa-type="message"]:has-text("msg2")').click();

		await expect(page.locator('[data-qa-type="message"]:has-text("msg2")')).toBeFocused();
	});

	test('expect show "hello word" in both contexts (targetChannel)', async ({ browser }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		const { page } = await createAuxContext(browser, Users.user2);
		const auxContext = { page, poHomeChannel: new HomeChannel(page) };

		await auxContext.poHomeChannel.sidenav.openChat(targetChannel);

		await poHomeChannel.content.sendMessage('hello world');

		await expect(async () => {
			await expect(auxContext.poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		}).toPass();

		await auxContext.page.close();
	});

	test('expect show "hello word" in both contexts (direct)', async ({ browser }) => {
		await poHomeChannel.sidenav.openChat('user2');
		const { page } = await createAuxContext(browser, Users.user2);
		const auxContext = { page, poHomeChannel: new HomeChannel(page) };
		await auxContext.poHomeChannel.sidenav.openChat('user1');

		await poHomeChannel.content.sendMessage('hello world');

		await expect(async () => {
			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
			await expect(auxContext.poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
		}).toPass();

		await auxContext.page.close();
	});
});
