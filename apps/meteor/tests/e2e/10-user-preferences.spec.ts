import { test, expect } from '@playwright/test';

import MainContent from './utils/pageobjects/MainContent';
import SideNav from './utils/pageobjects/SideNav';
import LoginPage from './utils/pageobjects/LoginPage';
import FlexTab from './utils/pageobjects/FlexTab';
import PreferencesMainContent from './utils/pageobjects/PreferencesMainContent';
import { adminLogin, adminRegister } from './utils/mocks/userAndPasswordMock';

test.describe('[User Preferences]', function () {
	test.describe('default', () => {
		let flexTab: FlexTab;
		let loginPage: LoginPage;
		let mainContent: MainContent;
		let sideNav: SideNav;
		let preferencesMainContent: PreferencesMainContent;

		test.beforeAll(async ({ browser, baseURL }) => {
			const context = await browser.newContext();
			const page = await context.newPage();
			const URL = baseURL as string;
			loginPage = new LoginPage(page);
			await loginPage.goto(URL);

			await loginPage.login(adminLogin);
			sideNav = new SideNav(page);
			mainContent = new MainContent(page);
			preferencesMainContent = new PreferencesMainContent(page);

			await sideNav.sidebarUserMenu().click();
			await sideNav.account().click();
		});

		test.describe('render:', () => {
			test('expect show the preferences link', async () => {
				await expect(sideNav.preferences()).toBeVisible();
			});

			test('expect show the profile link', async () => {
				await expect(sideNav.profile()).toBeVisible();
			});

			test('expect click on the profile link', async () => {
				await sideNav.profile().click();
			});

			test('expect show the username input', async () => {
				await expect(preferencesMainContent.userNameTextInput()).toBeVisible();
			});

			test('expect show the real name input', async () => {
				await expect(preferencesMainContent.realNameTextInput()).toBeVisible();
			});

			test('expect show the email input', async () => {
				await expect(preferencesMainContent.emailTextInput()).toBeVisible(); // .scrollIntoView()
			});

			test('expect show the password input', async () => {
				await expect(preferencesMainContent.passwordTextInput()).toBeVisible(); // .scrollIntoView()
			});

			test('expect show the submit button', async () => {
				await expect(preferencesMainContent.submitBtn()).toBeVisible();
				await expect(preferencesMainContent.submitBtn()).toBeDisabled();
			});
		});

		test.describe('user info change:', () => {
			test('expect click on the profile link', async () => {
				await sideNav.profile().click();
			});

			test('expect change the name field', async () => {
				await preferencesMainContent.changeRealName(`Edited${adminRegister.name}${Date.now()}`);
			});

			test('expect change the Username field', async () => {
				await preferencesMainContent.changeUsername(`Edited${adminRegister.name}${Date.now()}`);
			});

			test('expect save the settings', async () => {
				await preferencesMainContent.saveChanges();
			});

			test('expect close the preferences menu', async () => {
				await sideNav.preferencesClose().click();
				await sideNav.getChannelFromList('general').scrollIntoViewIfNeeded();
				await sideNav.getChannelFromList('general').click();
			});
			// TODO: Verify why is intermitent
			test.skip('expect send a message to be tested', async () => {
				await mainContent.sendMessage('HI');
				await mainContent.waitForLastMessageEqualsText('HI');
			});
			// TODO: Verify why is intermitent
			test.skip('expect be that the name on the last message is the edited one', async () => {
				await expect(mainContent.lastMessageUser()).toContainText(`Edited${adminRegister.name}`);
			});
			// TODO: Verify why is intermitent
			test.skip('expect be that the user name on the members flex tab is the edited one', async () => {
				mainContent.lastMessageUser().click();
				await expect(flexTab.memberUserName()).toContainText(`Edited${adminRegister.name}`);
			});
			// TODO: Verify why is intermitent
			test.skip('expect that the real name on the members flex tab is the edited one', async () => {
				await expect(flexTab.memberRealName()).toContainText(`Edited${adminRegister.name}`);
			});
		});
	});
});
