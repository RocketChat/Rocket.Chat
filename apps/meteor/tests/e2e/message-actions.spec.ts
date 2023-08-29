import type { Page } from '@playwright/test';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });
test.describe.serial('message-actions', () => {
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
	test('expect reply the message in direct', async ({ page }) => {
		await poHomeChannel.content.sendMessage('this is a message for reply in direct');
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('li', { hasText: 'Reply in direct message' }).click();

		await expect(page).toHaveURL(/.*reply/);
	});

	test('expect reply the message', async ({ page }) => {
		await poHomeChannel.content.sendMessage('this is a message for reply');
		await page.locator('[data-qa-type="message"]').last().hover();
		await page.locator('role=button[name="Reply in thread"]').click();
		await page.locator('.rcx-vertical-bar').locator(`role=textbox[name="Message #${targetChannel}"]`).type('this is a reply message');
		await page.keyboard.press('Enter');

		await expect(poHomeChannel.tabs.flexTabViewThreadMessage).toHaveText('this is a reply message');
	});
	test('expect edit the message', async ({ page }) => {
		await poHomeChannel.content.sendMessage('This is a message to edit');
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('[data-qa-id="edit-message"]').click();
		await page.locator('[name="msg"]').fill('this message was edited');
		await page.keyboard.press('Enter');
	});

	test('expect message is deleted', async ({ page }) => {
		await poHomeChannel.content.sendMessage('Message to delete');
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('[data-qa-id="delete-message"]').click();
		await page.locator('#modal-root .rcx-button-group--align-end .rcx-button--danger').click();
	});

	test('expect quote the message', async ({ page }) => {
		const message = `Message for quote - ${Date.now()}`;

		await poHomeChannel.content.sendMessage(message);
		await page.locator('[data-qa-type="message"]').last().hover();
		await page.locator('role=button[name="Quote"]').click();
		await page.locator('[name="msg"]').fill('this is a quote message');
		await page.keyboard.press('Enter');

		await expect(poHomeChannel.content.lastMessageTextAttachmentEqualsText).toHaveText(message);
	});
	test('expect star the message', async ({ page }) => {
		await poHomeChannel.content.sendMessage('Message to star');
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('[data-qa-id="star-message"]').click();
	});

	test('expect copy the message', async ({ page }) => {
		await poHomeChannel.content.sendMessage('Message to copy');
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('[data-qa-id="copy"]').click();
	});

	test('expect permalink the message', async ({ page }) => {
		await poHomeChannel.content.sendMessage('Message to permalink');
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('[data-qa-id="permalink"]').click();
	});

	test.describe('Preference Hide Contextual Bar by clicking outside of it Enabled', () => {
		let adminPage: Page;
		test.beforeAll(async ({ browser }) => {
			adminPage = await browser.newPage({ storageState: Users.admin.state });
			await adminPage.goto('/account/preferences');
			await adminPage.locator('role=heading[name="Messages"]').click();
			await adminPage.locator('text="Hide Contextual Bar by clicking outside of it"').click();
		});
		test.afterAll(async () => {
			await adminPage.close();
		});
		test.afterAll(async ({ browser }) => {
			adminPage = await browser.newPage({ storageState: Users.admin.state });
			await adminPage.goto('/account/preferences');
			await adminPage.locator('role=heading[name="Messages"]').click();
			await adminPage.locator('text="Hide Contextual Bar by clicking outside of it"').click();
			await adminPage.close();
		});
		test.beforeEach(async ({ page }) => {
			poHomeChannel = new HomeChannel(page);
			await page.goto('/home');
			await poHomeChannel.sidenav.openChat(targetChannel);
		});
		test('expect reply the message in direct', async ({ page }) => {
			await poHomeChannel.content.sendMessage('this is a message for reply in direct');
			await poHomeChannel.content.openLastMessageMenu();
			await page.locator('li', { hasText: 'Reply in Direct Message' }).click();

			await expect(page).toHaveURL(/.*reply/);
		});
	});
});
