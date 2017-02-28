/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import flexTab from '../../pageobjects/flex-tab.page';
import mainContent from '../../pageobjects/main-content.page';
import sideNav from '../../pageobjects/side-nav.page';
import preferencesMainContent from '../../pageobjects/preferences-main-content.page';

import {username, password, email} from '../../data/user.js';
import {imgURL} from '../../data/interactions.js';

import {checkIfUserIsValid} from '../../data/checks';


describe('user preferences', ()=> {
	before(() => {
		checkIfUserIsValid(username, email, password);
		sideNav.spotlightSearch.waitForVisible(10000);
		sideNav.searchChannel('general');

		sideNav.accountBoxUserName.waitForVisible();
		sideNav.accountBoxUserName.click();
		sideNav.account.waitForVisible();
		sideNav.account.click();
	});

	describe('render', ()=> {
		it('should show the preferences link', ()=> {
			sideNav.preferences.isVisible().should.be.true;
		});

		it('should show the profile link', ()=> {
			sideNav.profile.isVisible().should.be.true;
		});

		it('should show the avatar link', ()=> {
			sideNav.avatar.isVisible().should.be.true;
		});

		it('click on the profile link', ()=> {
			sideNav.profile.click();
		});

		it('should show the username input', ()=> {
			preferencesMainContent.userNameTextInput.isVisible().should.be.true;
		});

		it('should show the real name input', ()=> {
			preferencesMainContent.realNameTextInput.isVisible().should.be.true;
		});

		it('should show the email input', ()=> {
			preferencesMainContent.emailTextInput.isVisible().should.be.true;
		});

		it('should show the password input', ()=> {
			preferencesMainContent.passwordTextInput.isVisible().should.be.true;
		});

		it('should show the submit button', ()=> {
			preferencesMainContent.submitBtn.isVisible().should.be.true;
		});

	});
	//it gives off a "Too Many Requests Error" due the 60 seconds username change restriction
	describe('user info change', ()=> {
		it('click on the profile link', ()=> {
			sideNav.profile.click();
		});

		it('change the name field', ()=> {
			preferencesMainContent.changeRealName('EditedRealName'+username);
		});

		it('change the Username field', ()=> {
			preferencesMainContent.changeUsername('EditedUserName'+username);
		});

		it.skip('change the email field', ()=> {
			preferencesMainContent.changeEmail('EditedUserEmail'+username+'@gmail.com');
		});

		it('save the settings', ()=> {
			preferencesMainContent.saveChanges();
		});

		it.skip('put the password in the sweet alert input', ()=> {
			preferencesMainContent.acceptPasswordOverlay(password);
		});

		it('click on the avatar link', ()=> {
			sideNav.avatar.click();
		});

		it('upload a avatar', ()=> {
			preferencesMainContent.changeAvatarUpload(imgURL);
		});

		it('close the preferences menu', () => {
			sideNav.preferencesClose.waitForVisible(5000);
			sideNav.preferencesClose.click();
			sideNav.getChannelFromList('general').waitForVisible(5000);
		});

		it('open GENERAL', () => {
			sideNav.searchChannel('general');
		});

		it('send a message to be tested', () => {
			mainContent.sendMessage('HI');
			mainContent.waitForLastMessageEqualsText('HI');
		});

		it.skip('the name on the last message should be the edited one', () => {
			mainContent.waitForLastMessageUserEqualsText('EditedUserName'+username);
			mainContent.lastMessageUser.getText().should.equal('EditedUserName'+username);
		});

		it('the name on the nav bar should be the edited one', () => {
			sideNav.accountBoxUserName.getText().should.equal('EditedUserName'+username);
		});

		it.skip('the user name on the members flex tab should be the edited one', () => {
			mainContent.lastMessageUser.click();
			flexTab.memberUserName.waitForVisible(5000);
			flexTab.memberUserName.getText().should.equal('EditedUserName'+username);
		});

		it.skip('the real name on the members flex tab should be the edited one', () => {
			flexTab.memberRealName.waitForVisible(5000);
			flexTab.memberRealName.getText().should.equal('EditedRealName'+username);
		});
	});
});
