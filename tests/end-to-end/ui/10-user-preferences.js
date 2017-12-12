/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import flexTab from '../../pageobjects/flex-tab.page';
import mainContent from '../../pageobjects/main-content.page';
import sideNav from '../../pageobjects/side-nav.page';
import preferencesMainContent from '../../pageobjects/preferences-main-content.page';

import {username, password, email} from '../../data/user.js';
// import {imgURL} from '../../data/interactions.js';

import {checkIfUserIsValid} from '../../data/checks';


describe('[User Preferences]', ()=> {
	before(() => {
		checkIfUserIsValid(username, email, password);
		sideNav.spotlightSearch.waitForVisible(10000);
		sideNav.searchChannel('general');

		sideNav.accountMenu.waitForVisible();
		sideNav.accountMenu.click();
		sideNav.account.waitForVisible();
		sideNav.account.click();
	});

	describe('render:', ()=> {
		it('it should show the preferences link', ()=> {
			sideNav.preferences.isVisible().should.be.true;
		});

		it('it should show the profile link', ()=> {
			sideNav.profile.isVisible().should.be.true;
		});

		it('it should click on the profile link', ()=> {
			sideNav.profile.click();
		});

		it('it should show the username input', ()=> {
			preferencesMainContent.userNameTextInput.isVisible().should.be.true;
		});

		it('it should show the real name input', ()=> {
			preferencesMainContent.realNameTextInput.isVisible().should.be.true;
		});

		it('it should show the email input', ()=> {
			preferencesMainContent.emailTextInput.isVisible().should.be.true;
		});

		it('it should show the password input', ()=> {
			preferencesMainContent.passwordTextInput.isVisible().should.be.true;
		});

		it('it should show the submit button', ()=> {
			preferencesMainContent.submitBtn.isVisible().should.be.true;
		});

	});

	describe('user info change:', ()=> {
		it('it should click on the profile link', ()=> {
			sideNav.profile.click();
		});

		it('it should change the name field', ()=> {
			preferencesMainContent.changeRealName(`EditedRealName${ username }`);
		});

		it('it should change the Username field', ()=> {
			preferencesMainContent.changeUsername(`EditedUserName${ username }`);
		});

		it.skip('it should change the email field', ()=> {
			preferencesMainContent.changeEmail(`EditedUserEmail${ username }@gmail.com`);
		});

		it('it should save the settings', ()=> {
			preferencesMainContent.saveChanges();
		});

		it.skip('it should put the password in the modal input', ()=> {
			preferencesMainContent.acceptPasswordOverlay(password);
		});

		it('it should close the preferences menu', () => {
			sideNav.preferencesClose.waitForVisible(5000);
			sideNav.preferencesClose.click();
			sideNav.getChannelFromList('general').waitForVisible(5000);
		});

		it('it should open GENERAL', () => {
			sideNav.searchChannel('general');
		});

		it('it should send a message to be tested', () => {
			mainContent.sendMessage('HI');
			mainContent.waitForLastMessageEqualsText('HI');
		});

		it.skip('it should be that the name on the last message is the edited one', () => {
			mainContent.waitForLastMessageUserEqualsText(`EditedUserName${ username }`);
			mainContent.lastMessageUser.getText().should.equal(`EditedUserName${ username }`);
		});

		it('it should be that the name on the nav bar is the edited one', () => {
			sideNav.accountBoxUserName.getText().should.equal(`@EditeduserName${ username }`.toLowerCase());
		});

		it.skip('it should be that the user name on the members flex tab is the edited one', () => {
			mainContent.lastMessageUser.click();
			flexTab.memberUserName.waitForVisible(5000);
			flexTab.memberUserName.getText().should.equal(`EditedUserName${ username }`);
		});

		it.skip('it should that the real name on the members flex tab is the edited one', () => {
			flexTab.memberRealName.waitForVisible(5000);
			flexTab.memberRealName.getText().should.equal(`EditedRealName${ username }`);
		});
	});
});
