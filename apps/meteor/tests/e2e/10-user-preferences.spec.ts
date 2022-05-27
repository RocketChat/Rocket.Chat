import { test, expect, Page } from '@playwright/test';
import faker from '@faker-js/faker';

import { adminLogin } from './utils/mocks/userAndPasswordMock';
import { clearMessages } from './utils/helpers/clearMessages';
import { Login, MainContent, SideNav, FlexTab, PreferencesMainContent } from './page-objects';

test.describe('[User Preferences]', () => {
	test.beforeAll(async () => {
		await clearMessages(['GENERAL']);
	});

	test.describe('default', () => {
		let page: Page;
		let login: Login;
		let flexTab: FlexTab;
		let mainContent: MainContent;
		let sideNav: SideNav;
		let preferencesMainContent: PreferencesMainContent;

		test.beforeAll(async ({ browser }) => {
			const context = await browser.newContext();

			page = await context.newPage();
			login = new Login(page);
			sideNav = new SideNav(page);
			mainContent = new MainContent(page);
			preferencesMainContent = new PreferencesMainContent(page);
			flexTab = new FlexTab(page);

			await page.goto('/');
			await login.doLogin(adminLogin);

			await sideNav.sidebarUserMenu.click();
			await sideNav.account.click();
		});

		test.describe('render:', () => {
			test('expect show the preferences link', async () => {
				await expect(sideNav.preferences).toBeVisible();
			});

			test('expect show the profile link', async () => {
				await expect(sideNav.profile).toBeVisible();
			});

			test('expect click on the profile link', async () => {
				await sideNav.profile.click();
			});

			test('expect show the username input', async () => {
				await expect(preferencesMainContent.inputUserNameText).toBeVisible();
			});

			test('expect show the real name input', async () => {
				await expect(preferencesMainContent.inputRealNameText).toBeVisible();
			});

			test('expect show the email input', async () => {
				await expect(preferencesMainContent.inputEmailText).toBeVisible(); // .scrollIntoView()
			});

			test('expect show the password input', async () => {
				await expect(preferencesMainContent.inputPasswordText).toBeVisible(); // .scrollIntoView()
			});

			test('expect show the submit button', async () => {
				await expect(preferencesMainContent.btnSubmit).toBeVisible();
				await expect(preferencesMainContent.btnSubmit).toBeDisabled();
			});
		});

		test.describe('[User Info Change]', () => {
			const newName = faker.name.findName();
			const newUserName = `${faker.name.lastName()}${faker.name.firstName()}`;

			test('expect click on the profile link', async () => {
				await sideNav.profile.click();
			});

			test('expect change the name field', async () => {
				await preferencesMainContent.inputRealNameText.fill(newName);
			});

			test('expect change the Username field', async () => {
				await preferencesMainContent.inputUserNameText.fill(newUserName);
			});

			test('expect save the settings', async () => {
				await preferencesMainContent.btnSubmit.click();
			});

			test('expect close the preferences menu', async () => {
				await sideNav.preferencesClose.click();
				await sideNav.getChannelFromList('general').scrollIntoViewIfNeeded();
				await sideNav.getChannelFromList('general').click();
			});

			test('send message with different user name', async () => {
				await mainContent.doSendMessage('HI');
			});

			test('expect be that the name on the last message is the edited one', async () => {
				await expect(mainContent.btnUserLastMessage).toContainText(newUserName);
			});

			test('expect be that the user name on the members flex tab is the edited one', async () => {
				await mainContent.btnUserLastMessage.click();
				await expect(mainContent.userCard).toBeVisible();
			});

			test('expect that the real name on the members flex tab is the edited one', async () => {
				await mainContent.linkUserProfile.click();
				await expect(flexTab.memberRealName).toHaveText(newUserName);
			});
		});
	});
});
