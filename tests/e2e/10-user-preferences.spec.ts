import { test, expect } from '@playwright/test';

import MainContent from './utils/pageobjects/main-content.page';
import SideNav from './utils/pageobjects/side-nav.page';
import LoginPage from './utils/pageobjects/login.page';
import PreferencesMainContent from './utils/pageobjects/preferences-main-content.page';
import { adminLogin, adminRegister } from './utils/mocks/userAndPasswordMock';
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

			// test.skip('expect change the email field', async () => {
			// 	preferencesMainContent.changeEmail(`EditedUserEmail${adminRegister.name}@gmail.com`);
			// });
			//
			// test.skip('expect put the password in the modal input', async () => {
			// 	preferencesMainContent.acceptPasswordOverlay(adminLogin.password);
			// });

			test('expect save the settings', async () => {
				await preferencesMainContent.saveChanges();
			});

			// test.skip('expect put the password in the modal input', async () => {
			// 	preferencesMainContent.acceptPasswordOverlay(adminLogin.password);
			// });

			test('expect close the preferences menu', async () => {
				await sideNav.preferencesClose().click();
				await sideNav.getChannelFromList('general').scrollIntoViewIfNeeded();
				await sideNav.getChannelFromList('general').click();
			});

			test('expect send a message to be tested', async () => {
				await mainContent.sendMessage('HI');
				await mainContent.waitForLastMessageEqualsText('HI');
			});

			// test.skip('expect be that the name on the last message is the edited one', async () => {
			// 	mainContent.waitForLastMessageUserEqualsText(`EditedUserName${adminRegister.name}`);
			// 	mainContent.lastMessageUser().getText().should.equal(`EditedUserName${adminRegister.name}`);
			// });
			//
			// test.skip('expect be that the user name on the members flex tab is the edited one', async () => {
			// 	mainContent.lastMessageUser().click();
			// 	flexTab.memberUserName.getText().should.equal(`EditedUserName${adminRegister.name}`);
			// });
			//
			// test.skip('expect that the real name on the members flex tab is the edited one', async () => {
			// 	flexTab.memberRealName.getText().should.equal(`EditedRealName${adminRegister.name}`);
			// });
		});
	});

	// test.describe('admin', () => {
	// 	test.describe.skip('user info change forbidden:', () => {
	// 		test.beforeAll(() => {
	// 			checkIfUserIsValid(adminUsername, adminEmail, adminPassword);
	// 			admin.open('admin/Accounts');
	// 			admin.accountsRealNameChangeFalse.click();
	// 			admin.adminSaveChanges();
	// 			admin.accountsUsernameChangeFalse.click();
	// 			admin.adminSaveChanges();
	// 			admin.settingsSearch.type('');
	// 			sideNav.preferencesClose.click();
	// 		});
	//
	// 		test.afterAll(() => {
	// 			admin.open('admin/Accounts');
	// 			admin.accountsRealNameChangeTrue.click();
	// 			admin.adminSaveChanges();
	// 			admin.accountsUsernameChangeTrue.click();
	// 			admin.adminSaveChanges();
	// 			admin.settingsSearch.type('');
	// 			sideNav.preferencesClose.click();
	// 		});
	//
	// 		test('expect open profile', () => {
	// 			sideNav.accountMenu.click();
	// 			sideNav.account.click();
	// 			sideNav.profile.click();
	// 		});
	//
	// 		test('expect be that the name field is disabled', () => {
	// 			preferencesMainContent.realNameTextInputEnabled().should.be.false;
	// 		});
	//
	// 		test('expect be that the Username field is disabled', () => {
	// 			preferencesMainContent.userNameTextInputEnabled().should.be.false;
	// 		});
	//
	// 		test('expect close profile', () => {
	// 			sideNav.preferencesClose.click();
	// 		});
	// 	});
	// });
});
