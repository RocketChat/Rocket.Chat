import { Page, test, expect } from '@playwright/test';

import { adminLogin } from './utils/mocks/userAndPasswordMock';
import { userMock } from './utils/mocks/userMock';
import { Login, MainContent, SideNav } from './page-objects';

test.describe('[Message Popup]', () => {
	let page: Page;
	let login: Login;
	let mainContent: MainContent;
	let sideNav: SideNav;

	test.beforeAll(async ({ browser }) => {
		const context = await browser.newContext();

		page = await context.newPage();
		login = new Login(page);

		mainContent = new MainContent(page);
		sideNav = new SideNav(page);

		await page.goto('/');
		await login.doLogin(adminLogin);
		await sideNav.doOpenChannel('public channel');
	});

	test.describe('User mentions', () => {
		test('expect show message popup', async () => {
			await mainContent.setTextToInput('@');
			expect(await mainContent.messagePopUp.isVisible()).toBeTruthy();
		});

		test('expect popup title to be people', async () => {
			await mainContent.setTextToInput('@');
			expect(await mainContent.messagePopUpTitle.locator('text=People').isVisible()).toBeTruthy();
		});

		test('expect show "userMock.username" in options', async () => {
			await mainContent.setTextToInput('@');
			expect(await mainContent.messagePopUpItems.locator(`text=${userMock.username}`).isVisible()).toBeTruthy();
		});

		test('expect show "all" option', async () => {
			await mainContent.setTextToInput('@');
			expect(await mainContent.messagePopUpItems.locator('text=all').isVisible()).toBeTruthy();
		});

		test('expect show "here" option', async () => {
			await mainContent.setTextToInput('@');
			expect(await mainContent.messagePopUpItems.locator('text=here').isVisible()).toBeTruthy();
		});
	});
});
