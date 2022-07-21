import { Page, test, expect } from '@playwright/test';
import { v4 as uuid } from 'uuid';
import faker from '@faker-js/faker';

import { Auth, Administration, HomeChannel } from './page-objects';

test.describe('Permissions', () => {
	let page: Page;
	let pageAuth: Auth;
	let pageAdmin: Administration;
	let pageHomeChannel: HomeChannel;

	const anyUser = {
		email: faker.internet.email(),
		password: 'any_password',
		name: faker.name.findName(),
		username: faker.internet.userName(),
	};

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
		pageAuth = new Auth(page);
		pageAdmin = new Administration(page);
		pageHomeChannel = new HomeChannel(page);

		await pageAuth.doLogin();
		await pageHomeChannel.sidenav.btnAvatar.click();
		await pageHomeChannel.sidenav.linkAdmin.click();
		await pageAdmin.sidenav.linkUsers.click();
	});

	test('expect create a user via admin view', async () => {
		await pageAdmin.tabs.usersAddUserTab.click();
		await pageAdmin.tabs.usersAddUserName.type(anyUser.name);
		await pageAdmin.tabs.usersAddUserUsername.type(anyUser.username);
		await pageAdmin.tabs.usersAddUserEmail.type(anyUser.email);
		await pageAdmin.tabs.usersAddUserVerifiedCheckbox.click();
		await pageAdmin.tabs.usersAddUserPassword.type(anyUser.password);
		await pageAdmin.tabs.doAddRole('user');
		await pageAdmin.tabs.usersButtonSave.click();
	});

	test('expect user be show on list', async () => {
		await pageAdmin.usersFilter.type(anyUser.email, { delay: 200 });
		await expect(pageAdmin.userInTable(anyUser.email)).toBeVisible();
	});

	test.describe('disable "anyUser" permissions', () => {
		test('expect open permissions table', async () => {
			await pageAdmin.permissionsLink.click();
		});

		test('expect remove "mention all" permission from user', async () => {
			await pageAdmin.inputPermissionsSearch.type('all');

			if (await pageAdmin.getCheckboxPermission('Mention All').locator('input').isChecked()) {
				await pageAdmin.getCheckboxPermission('Mention All').click();
			}
		});

		test('expect remove "delete message" permission from user', async () => {
			await pageAdmin.inputPermissionsSearch.click({ clickCount: 3 });
			await page.keyboard.press('Backspace');
			await pageAdmin.inputPermissionsSearch.type('delete');

			if (await pageAdmin.getCheckboxPermission('Delete Own Message').locator('input').isChecked()) {
				await pageAdmin.getCheckboxPermission('Delete Own Message').click();
			}
		});
	});

	test.describe('assert "anyUser" permissions', () => {
		test.beforeAll(async () => {
			await pageHomeChannel.sidenav.doLogout();

			await page.goto('/');
			await pageAuth.doLogin(anyUser);
			await pageHomeChannel.sidenav.doOpenChat('general');
		});

		test('expect not be abble to "mention all"', async () => {
			await pageHomeChannel.content.doSendMessage('@all any_message');

			await expect(pageHomeChannel.content.lastMessageForMessageTest).toContainText('not allowed');
		});

		test('expect not be able to "delete own message"', async () => {
			await pageHomeChannel.content.doReload();
			await pageHomeChannel.content.doSendMessage(`any_message_${uuid()}`);
			await pageHomeChannel.content.doOpenMessageActionMenu();

			expect(await page.isVisible('[data-qa-id="delete-message"]')).toBeFalsy();
		});
	});
});
