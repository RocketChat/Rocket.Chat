import flexTab from '../pageobjects/flex-tab.page';
import mainContent from '../pageobjects/main-content.page';
import sideNav from '../pageobjects/side-nav.page';
import preferencesMainContent from '../pageobjects/preferences-main-content.page';
import admin from '../pageobjects/administration.page';
import { username, password, email, adminUsername, adminEmail, adminPassword } from '../../data/user.js';
import { checkIfUserIsValid } from '../../data/checks';

describe('[User Preferences]', () => {
	describe('default', () => {
		before(() => {
			checkIfUserIsValid(username, email, password);
			sideNav.sidebarUserMenu.click();
			sideNav.account.click();
		});

		describe('render:', () => {
			it('it should show the preferences link', () => {
				sideNav.preferences.should('be.visible');
			});

			it('it should show the profile link', () => {
				sideNav.profile.should('be.visible');
			});

			it('it should click on the profile link', () => {
				sideNav.profile.click();
			});

			it('it should show the username input', () => {
				preferencesMainContent.userNameTextInput.should('be.visible');
			});

			it('it should show the real name input', () => {
				preferencesMainContent.realNameTextInput.should('be.visible');
			});

			it('it should show the email input', () => {
				preferencesMainContent.emailTextInput.scrollIntoView().should('be.visible');
			});

			it('it should show the password input', () => {
				preferencesMainContent.passwordTextInput.scrollIntoView().should('be.visible');
			});

			it('it should show the submit button', () => {
				preferencesMainContent.submitBtn.should('be.visible').should('be.disabled');
			});
		});

		describe('user info change:', () => {
			it('it should click on the profile link', () => {
				sideNav.profile.click();
			});

			it('it should change the name field', () => {
				preferencesMainContent.changeRealName(`EditedRealName${username}`);
			});

			it('it should change the Username field', () => {
				preferencesMainContent.changeUsername(`EditedUserName${username}`);
			});

			it.skip('it should change the email field', () => {
				preferencesMainContent.changeEmail(`EditedUserEmail${username}@gmail.com`);
			});

			it.skip('it should put the password in the modal input', () => {
				preferencesMainContent.acceptPasswordOverlay(password);
			});

			it('it should save the settings', () => {
				preferencesMainContent.saveChanges();
			});

			it.skip('it should put the password in the modal input', () => {
				preferencesMainContent.acceptPasswordOverlay(password);
			});

			it('it should close the preferences menu', () => {
				sideNav.preferencesClose.click();
				sideNav.getChannelFromList('general').scrollIntoView().click();
			});

			it('it should send a message to be tested', () => {
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

	describe('admin', () => {
		describe.skip('user info change forbidden:', () => {
			before(() => {
				checkIfUserIsValid(adminUsername, adminEmail, adminPassword);
				admin.open('admin/Accounts');
				admin.accountsRealNameChangeFalse.click();
				admin.adminSaveChanges();
				admin.accountsUsernameChangeFalse.click();
				admin.adminSaveChanges();
				admin.settingsSearch.type('');
				sideNav.preferencesClose.click();
			});

			after(() => {
				admin.open('admin/Accounts');
				admin.accountsRealNameChangeTrue.click();
				admin.adminSaveChanges();
				admin.accountsUsernameChangeTrue.click();
				admin.adminSaveChanges();
				admin.settingsSearch.type('');
				sideNav.preferencesClose.click();
			});

			it('it should open profile', () => {
				sideNav.accountMenu.click();
				sideNav.account.click();
				sideNav.profile.click();
			});

			it('it should be that the name field is disabled', () => {
				preferencesMainContent.realNameTextInputEnabled().should.be.false;
			});

			it('it should be that the Username field is disabled', () => {
				preferencesMainContent.userNameTextInputEnabled().should.be.false;
			});

			it('it should close profile', () => {
				sideNav.preferencesClose.click();
			});
		});
	});
});
