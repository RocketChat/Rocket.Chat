import { Page, test, expect } from '@playwright/test';

import { Auth, HomeChannel } from './page-objects';

test.describe('Message Popup', () => {
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
		await pageHomeChannel.sidenav.doOpenChat('public channel');
	});

	test.describe('User mentions', () => {
		test('expect show message popup', async () => {
			await pageHomeChannel.content.setTextToInput('@');
			expect(await pageHomeChannel.content.messagePopUp.isVisible()).toBeTruthy();
		});

		test('expect popup title to be people', async () => {
			await pageHomeChannel.content.setTextToInput('@');
			await expect(pageHomeChannel.content.messagePopUpTitle.locator('text=People')).toBeVisible();
		});

		test('expect show "all" option', async () => {
			await pageHomeChannel.content.setTextToInput('@');
			await expect(pageHomeChannel.content.messagePopUpItems.locator('text=all')).toBeVisible();
		});

		test('expect show "here" option', async () => {
			await pageHomeChannel.content.setTextToInput('@');
			await expect(pageHomeChannel.content.messagePopUpItems.locator('text=here')).toBeVisible();
		});
	});
});
