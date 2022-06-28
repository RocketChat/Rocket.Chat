import { test, expect } from '@playwright/test';
import faker from '@faker-js/faker';

import { PreferencesMainContent, MainContent, SideNav, LoginPage, FlexTab } from './pageobjects';
import { adminLogin } from './utils/mocks/userAndPasswordMock';

test.describe('[User Preferences]', () => {
	let flexTab: FlexTab;
	let loginPage: LoginPage;
	let mainContent: MainContent;
	let sideNav: SideNav;
	let preferencesMainContent: PreferencesMainContent;

	test.beforeAll(async ({ browser }) => {
		const page = await browser.newPage();
		loginPage = new LoginPage(page);
		sideNav = new SideNav(page);
		mainContent = new MainContent(page);
		preferencesMainContent = new PreferencesMainContent(page);
		flexTab = new FlexTab(page);

		await page.goto('/');
		await loginPage.doLogin(adminLogin);
		await sideNav.sidebarUserMenu.click();
		await sideNav.account.click();
	});

	test.describe('[Update UserInfo]', () => {
		const newName = faker.name.findName();
		const newUserName = faker.internet.userName(newName);

		test('expect update profile with new name/username', async () => {
			await sideNav.profile.click();
			await preferencesMainContent.inputName.fill(newName);
			await preferencesMainContent.inputUsername.fill(newUserName);
			await preferencesMainContent.submitBtn.click();
		});

		test('expect show new username in the last message', async () => {
			await sideNav.preferencesClose.click();
			await sideNav.doOpenChat('general');
			await mainContent.sendMessage('HI');

			await expect(mainContent.lastUserMessage).toContainText(newUserName);
		});

		test('expect show new username in card and profile', async () => {
			await mainContent.sendMessage('HI');
			await mainContent.btnLastUserMessage.click();
			await expect(mainContent.userCard).toBeVisible();

			await mainContent.viewUserProfile.click();
			await expect(flexTab.userUsername).toHaveText(newUserName);
		});
	});
});
