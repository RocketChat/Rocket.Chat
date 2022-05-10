import { Page, test, expect } from '@playwright/test';

import { adminLogin, registerUser } from './utils/mocks/userAndPasswordMock';
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
		await sideNav.general().click();
	});

	test.describe.serial('User mentions', () => {
		test('expect show message popup', async () => {
			await mainContent.setTextToInput('@');
			expect(await mainContent.messagePopUp().isVisible()).toBeTruthy();
		});

		test('expect popup title to be people', async () => {
			expect(await mainContent.messagePopUpTitle().locator('text=People').isVisible()).toBeTruthy();
		});

		test('expect show "registerUser" in options', async () => {
			expect(await mainContent.messagePopUpItems().locator(`text=${registerUser.name}`).isVisible()).toBeTruthy();
		});

		test('expect show "all" option', async () => {
			expect(await mainContent.messagePopUpItems().locator('text=all').isVisible()).toBeTruthy();
		});

		test('expect show "here" option', async () => {
			expect(await mainContent.messagePopUpItems().locator('text=here').isVisible()).toBeTruthy();
		});
	});
});
