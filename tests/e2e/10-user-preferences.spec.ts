import { test, expect } from '@playwright/test';

import MainContent from './utils/pageobjects/main-content.page';
import SideNav from './utils/pageobjects/side-nav.page';
import LoginPage from './utils/pageobjects/login.page';
import PreferencesMainContent from './utils/pageobjects/preferences-main-content.page';
import { adminLogin } from './utils/mocks/userAndPasswordMock';
import { LOCALHOST } from './utils/mocks/urlMock';

test.describe('[User Preferences]', function () {
	test.describe('default', () => {
		let loginPage: LoginPage;
		let mainContent: MainContent;
		let sideNav: SideNav;
		let preferencesMainContent: PreferencesMainContent;

		test.beforeAll(async ({ browser, baseURL }) => {
			const context = await browser.newContext();
			const page = await context.newPage();
			const URL = baseURL || LOCALHOST;
			loginPage = new LoginPage(page);
			await loginPage.goto(URL);

			await loginPage.login(adminLogin);
			sideNav = new SideNav(page);
			mainContent = new MainContent(page);
			preferencesMainContent = new PreferencesMainContent(page);

			await sideNav.openChannel('general');
		});

		test.describe('render:', () => {
			test('it should show the preferences link', () => {
				sideNav.preferences.should('be.visible');
			});

			test('it should show the profile link', () => {
				sideNav.profile.should('be.visible');
			});

			test('it should click on the profile link', () => {
				sideNav.profile.click();
			});

			test('it should show the username input', () => {
				preferencesMainContent.userNameTextInput.should('be.visible');
			});

			test('it should show the real name input', () => {
				preferencesMainContent.realNameTextInput.should('be.visible');
			});

			test('it should show the email input', () => {
				preferencesMainContent.emailTextInput.scrollIntoView().should('be.visible');
			});

			test('it should show the password input', () => {
				preferencesMainContent.passwordTextInput.scrollIntoView().should('be.visible');
			});

			test('it should show the submit button', () => {
				preferencesMainContent.submitBtn.should('be.visible').should('be.disabled');
			});
		});

		test.describe('user info change:', () => {
			test('it should click on the profile link', () => {
				sideNav.profile.click();
			});

			test('it should change the name field', () => {
				preferencesMainContent.changeRealName(`EditedRealName${username}`);
			});

			test('it should change the Username field', () => {
				preferencesMainContent.changeUsername(`EditedUserName${username}`);
			});

			it.skip('it should change the email field', () => {
				preferencesMainContent.changeEmail(`EditedUserEmail${username}@gmail.com`);
			});

			it.skip('it should put the password in the modal input', () => {
				preferencesMainContent.acceptPasswordOverlay(password);
			});

			test('it should save the settings', () => {
				preferencesMainContent.saveChanges();
			});

			it.skip('it should put the password in the modal input', () => {
				preferencesMainContent.acceptPasswordOverlay(password);
			});

			test('it should close the preferences menu', () => {
				sideNav.preferencesClose.click();
				sideNav.getChannelFromList('general').scrollIntoView().click();
			});

			test('it should send a message to be tested', () => {
				mainContent.sendMessage('HI');
				mainContent.waitForLastMessageEqualsText('HI');
			});

			it.skip('it should be that the name on the last message is the edited one', () => {
				mainContent.waitForLastMessageUserEqualsText(`EditedUserName${username}`);
				mainContent.lastMessageUser.getText().should.equal(`EditedUserName${username}`);
			});

			it.skip('it should be that the user name on the members flex tab is the edited one', () => {
				mainContent.lastMessageUser.click();
				flexTab.memberUserName.getText().should.equal(`EditedUserName${username}`);
			});

			it.skip('it should that the real name on the members flex tab is the edited one', () => {
				flexTab.memberRealName.getText().should.equal(`EditedRealName${username}`);
			});
		});
	});

	test.describe('admin', () => {
		test.describe.skip('user info change forbidden:', () => {
			test.beforeAll(() => {
				checkIfUserIsValid(adminUsername, adminEmail, adminPassword);
				admin.open('admin/Accounts');
				admin.accountsRealNameChangeFalse.click();
				admin.adminSaveChanges();
				admin.accountsUsernameChangeFalse.click();
				admin.adminSaveChanges();
				admin.settingsSearch.type('');
				sideNav.preferencesClose.click();
			});

			test.afterAll(() => {
				admin.open('admin/Accounts');
				admin.accountsRealNameChangeTrue.click();
				admin.adminSaveChanges();
				admin.accountsUsernameChangeTrue.click();
				admin.adminSaveChanges();
				admin.settingsSearch.type('');
				sideNav.preferencesClose.click();
			});

			test('it should open profile', () => {
				sideNav.accountMenu.click();
				sideNav.account.click();
				sideNav.profile.click();
			});

			test('it should be that the name field is disabled', () => {
				preferencesMainContent.realNameTextInputEnabled().should.be.false;
			});

			test('it should be that the Username field is disabled', () => {
				preferencesMainContent.userNameTextInputEnabled().should.be.false;
			});

			test('it should close profile', () => {
				sideNav.preferencesClose.click();
			});
		});
	});
});
