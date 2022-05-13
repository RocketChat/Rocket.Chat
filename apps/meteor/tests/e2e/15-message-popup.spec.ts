import { Page, test, expect } from '@playwright/test';

import { adminLogin } from './utils/mocks/userAndPasswordMock';
import { userMock } from './utils/mocks/userMock';
import LoginPage from './utils/pageobjects/LoginPage';
import MainContent from './utils/pageobjects/MainContent';
import SideNav from './utils/pageobjects/SideNav';

test.describe('[Message Popup]', () => {
	let page: Page;
	let loginPage: LoginPage;
	let mainContent: MainContent;
	let sideNav: SideNav;

	test.beforeAll(async ({ browser }) => {
		const context = await browser.newContext();
		page = await context.newPage();

		loginPage = new LoginPage(page);
		mainContent = new MainContent(page);
		sideNav = new SideNav(page);

		await loginPage.goto('/');
		await loginPage.login(adminLogin);
		await sideNav.openChannel('public channel');
	});

	test.describe('User mentions', () => {
		test('expect show message popup', async () => {
			await mainContent.setTextToInput('@');
			expect(await mainContent.messagePopUp().isVisible()).toBeTruthy();
		});

		test('expect popup title to be people', async () => {
			await mainContent.setTextToInput('@');
			expect(await mainContent.messagePopUpTitle().locator('text=People').isVisible()).toBeTruthy();
		});

		test('expect show "userMock.username" in options', async () => {
			await mainContent.setTextToInput('@');
			expect(await mainContent.messagePopUpItems().locator(`text=${userMock.username}`).isVisible()).toBeTruthy();
		});

		test('expect show "all" option', async () => {
			await mainContent.setTextToInput('@');
			expect(await mainContent.messagePopUpItems().locator('text=all').isVisible()).toBeTruthy();
		});

		test('expect show "here" option', async () => {
			await mainContent.setTextToInput('@');
			expect(await mainContent.messagePopUpItems().locator('text=here').isVisible()).toBeTruthy();
		});
	});
});
