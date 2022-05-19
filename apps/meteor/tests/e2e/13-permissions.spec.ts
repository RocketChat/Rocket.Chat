import { Page, test, expect } from '@playwright/test';
import { v4 as uuid } from 'uuid';

import { LoginPage, FlexTab, Administration, MainContent, SideNav } from './utils/pageobjects';
import { adminLogin, createRegisterUser } from './utils/mocks/userAndPasswordMock';
import { BACKSPACE } from './utils/mocks/keyboardKeyMock';

test.describe('[Permissions]', () => {
	let page: Page;

	let loginPage: LoginPage;
	let admin: Administration;
	let flexTab: FlexTab;
	let sideNav: SideNav;
	let mainContent: MainContent;

	const userToBeCreated = createRegisterUser();

	test.beforeAll(async ({ browser }) => {
		const context = await browser.newContext();
		page = await context.newPage();

		loginPage = new LoginPage(page);
		admin = new Administration(page);
		flexTab = new FlexTab(page);
		sideNav = new SideNav(page);
		mainContent = new MainContent(page);

		await page.goto('/');
		await loginPage.login(adminLogin);
		await sideNav.general().click();
		await page.goto('/admin/users');
	});

	test('expect create a user via admin view', async () => {
		await flexTab.usersAddUserTab().click();
		await flexTab.usersAddUserName().type(userToBeCreated.name);
		await flexTab.usersAddUserUsername().type(userToBeCreated.username ?? '');
		await flexTab.usersAddUserEmail().type(userToBeCreated.email);
		await flexTab.usersAddUserVerifiedCheckbox().click();
		await flexTab.usersAddUserPassword().type(userToBeCreated.password);
		await flexTab.doAddRole('user');
		await flexTab.usersButtonSave().click();
	});

	test('expect user be show on list', async () => {
		await admin.usersFilter().type(userToBeCreated.email, { delay: 200 });
		expect(await admin.userInTable(userToBeCreated.email).isVisible()).toBeTruthy();
	});

	test.describe('disable "userToBeCreated" permissions', () => {
		test('expect open permissions table', async () => {
			await admin.permissionsLink().click();
		});

		test('expect remove "mention all" permission from user', async () => {
			await admin.inputPermissionsSearch().type('all');

			if (await admin.getCheckboxPermission('Mention All').locator('input').isChecked()) {
				await admin.getCheckboxPermission('Mention All').click();
			}
		});

		test('expect remove "delete message" permission from user', async () => {
			await admin.inputPermissionsSearch().click({ clickCount: 3 });
			await page.keyboard.press(BACKSPACE);
			await admin.inputPermissionsSearch().type('delete');

			if (await admin.getCheckboxPermission('Delete Own Message').locator('input').isChecked()) {
				await admin.getCheckboxPermission('Delete Own Message').click();
			}
		});
	});

	test.describe('assert "userToBeCreated" permissions', () => {
		test.beforeAll(async () => {
			await sideNav.doLogout();
			await loginPage.goto('/');
			await loginPage.login(userToBeCreated);
			await sideNav.general().click();
		});

		test('expect not be abble to "mention all"', async () => {
			await mainContent.sendMessage('@all any_message');

			expect(mainContent.lastMessage()).toContainText('not allowed');
		});

		test('expect not be abble to "delete own message"', async () => {
			await mainContent.doReload();
			await mainContent.sendMessage(`any_message_${uuid()}`);
			await mainContent.openMessageActionMenu();

			expect(await page.isVisible('[data-qa-id="delete-message"]')).toBeFalsy();
		});
	});
});
