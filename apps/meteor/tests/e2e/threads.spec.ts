import type { Page } from '@playwright/test';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('Threads', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
		await poHomeChannel.sidenav.openChat(targetChannel);
	});

	test('expect thread message preview if alsoSendToChannel checkbox is checked', async ({ page }) => {
		await poHomeChannel.content.sendMessage('this is a message for reply');
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('[data-qa-id="reply-in-thread"]').click();

		await expect(page).toHaveURL(/.*thread/);

		await poHomeChannel.content.toggleAlsoSendThreadToChannel(true);

		await page.locator('//main//aside >> [name="msg"]').last().fill('This is a thread message also sent in channel')
		await page.keyboard.press('Enter');

		await expect(poHomeChannel.content.lastThreadMessageText).toContainText('This is a thread message also sent in channel');
		await expect(poHomeChannel.content.lastUserMessage).toContainText('This is a thread message also sent in channel');
	});


	test('expect open threads contextual bar when clicked on thread preview', async ({ page }) => {
		await poHomeChannel.content.lastThreadMessagePreviewText.click();

		await expect(page).toHaveURL(/.*thread/);
		await expect(poHomeChannel.content.lastThreadMessageText).toContainText('This is a thread message also sent in channel');
	});

	test.describe('hideFlexTab Preference enabled for threads', () => {
		let accountPage: Page;

		test.beforeAll(async ({ browser }) => {
			accountPage = await browser.newPage({ storageState: Users.admin.state });

			await accountPage.goto('/account/preferences');
			await accountPage.locator('role=heading[name="Messages"]').click();
			await accountPage.locator('role=checkbox >> [name="hideFlexTab"]').setChecked(true, { force: true });
			await accountPage.locator('role=button[name="Save changes"]').click();
		});

		test.afterAll(async ({ browser }) => {
			accountPage = await browser.newPage({ storageState: Users.admin.state });

			await accountPage.goto('/account/preferences');
			await accountPage.locator('role=heading[name="Messages"]').click();
			await accountPage.locator('role=checkbox >> [name="hideFlexTab"]').setChecked(false, { force: true });
			await accountPage.locator('role=button[name="Save changes"]').click();
			await accountPage.close();
		});

		test('expect to close thread contextual bar on clicking outside', async ({ page }) => {
			await poHomeChannel.content.lastThreadMessagePreviewText.click();

			await expect(page).toHaveURL(/.*thread/);
			await poHomeChannel.content.lastUserMessageNotThread.click();
			await expect(page).not.toHaveURL(/.*thread/);
		});

		test('expect open threads contextual bar when clicked on thread preview', async ({ page }) => {
			await poHomeChannel.content.lastThreadMessagePreviewText.click();

			await expect(page).toHaveURL(/.*thread/);
			await expect(poHomeChannel.content.lastThreadMessageText).toContainText('This is a thread message also sent in channel');
		});

		test('expect not to close thread contextual bar when performing some action', async ({ page }) => {
			await poHomeChannel.content.lastThreadMessagePreviewText.click();

			await expect(page).toHaveURL(/.*thread/);
			await expect(poHomeChannel.content.lastThreadMessageText).toContainText('This is a thread message also sent in channel');

			await poHomeChannel.content.openLastMessageMenu();
			await page.locator('[data-qa-id="copy"]').click();

			await expect(page).toHaveURL(/.*thread/);
			await expect(poHomeChannel.content.lastThreadMessageText).toContainText('This is a thread message also sent in channel');
		});
	});
});
