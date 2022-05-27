import { Page, test, expect } from '@playwright/test';
import { v4 as uuid } from 'uuid';

import { Login, FlexTab, Administration, MainContent, SideNav } from './page-objects';
import { adminLogin, createRegisterUser } from './utils/mocks/userAndPasswordMock';
import { BACKSPACE } from './utils/mocks/keyboardKeyMock';

test.describe('Permissions', () => {
	let page: Page;
	let login: Login;
	let admin: Administration;
	let flexTab: FlexTab;
	let sideNav: SideNav;
	let mainContent: MainContent;

	const userToBeCreated = createRegisterUser();

	test.beforeAll(async ({ browser }) => {
		const context = await browser.newContext();

		page = await context.newPage();
		login = new Login(page);

		admin = new Administration(page);
		flexTab = new FlexTab(page);
		sideNav = new SideNav(page);
		mainContent = new MainContent(page);

		await page.goto('/');
		await login.doLogin(adminLogin);
		await sideNav.general.click();
		await page.goto('/admin/users');
	});

	test('expect create a user via admin view', async () => {
		await flexTab.usersAddUserTab.click();
		await flexTab.inputUserName.type(userToBeCreated.name);
		await flexTab.inputUserUsername.type(userToBeCreated.username ?? '');
		await flexTab.inputUserEmail.type(userToBeCreated.email);
		await flexTab.checkboxUserVerified.click();
		await flexTab.inputUserPassword.type(userToBeCreated.password);
		await flexTab.doAddRole('user');
		await flexTab.btnUsersSave.click();
	});

	test('expect user be show on list', async () => {
		await admin.inputSearchUsers.type(userToBeCreated.email, { delay: 200 });
		expect(await admin.getUserInTable(userToBeCreated.email).isVisible()).toBeTruthy();
	});

	test.describe('disable "userToBeCreated" permissions', () => {
		test('expect open permissions table', async () => {
			await admin.linkPermissions.click();
		});

		test('expect remove "mention all" permission from user', async () => {
			await admin.inputPermissionsSearch.type('all');

			if (await admin.getCheckboxPermission('Mention All').locator('input').isChecked()) {
				await admin.getCheckboxPermission('Mention All').click();
			}
		});

		test('expect remove "delete message" permission from user', async () => {
			await admin.inputPermissionsSearch.click({ clickCount: 3 });
			await page.keyboard.press(BACKSPACE);
			await admin.inputPermissionsSearch.type('delete');

			if (await admin.getCheckboxPermission('Delete Own Message').locator('input').isChecked()) {
				await admin.getCheckboxPermission('Delete Own Message').click();
			}
		});
	});

	test.describe('assert "userToBeCreated" permissions', () => {
		test.beforeAll(async () => {
			await sideNav.doLogout();
			await page.goto('/');
			await login.doLogin(userToBeCreated);
			await sideNav.general.click();
		});

		test('expect not be abble to "mention all"', async () => {
			await mainContent.doSendMessage('@all any_message');

			expect(mainContent.lastMessage).toContainText('not allowed');
		});

		test('expect not be abble to "delete own message"', async () => {
			await mainContent.doReload();
			await mainContent.doSendMessage(`any_message_${uuid()}`);
			await mainContent.doOpenMessageActionMenu();

			expect(await page.isVisible('data-qa-id="delete-message"')).toBeFalsy();
		});
	});
});
