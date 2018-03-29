/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import sideNav from '../../pageobjects/side-nav.page';
import flexTab from '../../pageobjects/flex-tab.page';
import admin from '../../pageobjects/administration.page';
import mainContent from '../../pageobjects/main-content.page';
import {checkIfUserIsValid} from '../../data/checks';

//test data imports
import {checkIfUserIsAdmin} from '../../data/checks';
import {username, email, password, adminUsername, adminEmail, adminPassword} from '../../data/user.js';

describe.skip('[Permissions]', () => {
	before(() => {
		checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
		sideNav.spotlightSearch.waitForVisible(10000);
		sideNav.general.waitForVisible(5000);
		sideNav.general.click();
		sideNav.accountMenu.waitForVisible(5000);
		sideNav.accountMenu.click();
		sideNav.admin.waitForVisible(5000);
		sideNav.admin.click();
		admin.infoRocketChatTable.waitForVisible(10000);
	});

	after(() => {
		checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
		sideNav.spotlightSearch.waitForVisible(10000);
		sideNav.general.waitForVisible(5000);
		sideNav.general.click();
		sideNav.accountMenu.waitForVisible(5000);
		sideNav.accountMenu.click();
		sideNav.admin.waitForVisible(5000);
		sideNav.admin.click();
		admin.permissionsLink.waitForVisible(5000);
		admin.permissionsLink.click();
		admin.rolesPermissionGrid.waitForVisible(5000);

		if (!admin.rolesUserCreateC.isSelected()) {
			admin.rolesUserCreateC.waitForVisible(5000);
			admin.rolesUserCreateC.scroll();
			admin.rolesUserCreateC.click();
		}

		if (!admin.rolesUserCreateD.isSelected()) {
			admin.rolesUserCreateD.waitForVisible(5000);
			admin.rolesUserCreateD.scroll();
			admin.rolesUserCreateD.click();
		}

		if (!admin.rolesUserCreateP.isSelected()) {
			admin.rolesUserCreateP.waitForVisible(5000);
			admin.rolesUserCreateP.scroll();
			admin.rolesUserCreateP.click();
		}

		if (!admin.rolesUserMentionAll.isSelected()) {
			admin.rolesUserMentionAll.waitForVisible(5000);
			admin.rolesUserMentionAll.scroll();
			admin.rolesUserMentionAll.click();
		}


		if (!admin.rolesOwnerDeleteMessage.isSelected()) {
			admin.rolesOwnerDeleteMessage.waitForVisible(5000);
			admin.rolesOwnerDeleteMessage.scroll();
			admin.rolesOwnerDeleteMessage.click();
		}

		if (!admin.rolesOwnerEditMessage.isSelected()) {
			admin.rolesOwnerEditMessage.waitForVisible(5000);
			admin.rolesOwnerEditMessage.scroll();
			admin.rolesOwnerEditMessage.click();
		}
	});

	describe('user creation via admin view:', () => {
		before(() => {
			admin.usersLink.waitForVisible(5000);
			admin.usersLink.click();
			admin.usersFilter.waitForVisible(5000);
			flexTab.usersAddUserTab.waitForVisible(5000);
			flexTab.usersAddUserTab.click();
			flexTab.usersAddUserName.waitForVisible(5000);
		});

		after(() => {
			admin.infoLink.waitForVisible(5000);
			admin.infoLink.click();
		});

		it('it should create a user', () => {
			flexTab.usersAddUserName.setValue(`adminCreated${ username }`);
			flexTab.usersAddUserUsername.setValue(`adminCreated${ username }`);
			flexTab.usersAddUserEmail.setValue(`adminCreated${ email }`);
			flexTab.usersAddUserVerifiedCheckbox.click();
			flexTab.usersAddUserPassword.setValue(password);
			flexTab.usersAddUserChangePasswordCheckbox.click();
			flexTab.addRole('user');
			flexTab.usersButtonSave.click();
		});

		it('it should show the user in the list', () => {
			admin.checkUserList(username).should.be.true;
		});
	});

	describe('change the permissions:', () => {
		before(() => {
			admin.permissionsLink.waitForVisible(5000);
			admin.permissionsLink.click();
			admin.rolesPermissionGrid.waitForVisible(5000);
		});

		it('it should change the create c room permission', () => {
			if (admin.rolesUserCreateC.isSelected()) {
				admin.rolesUserCreateC.waitForVisible(5000);
				admin.rolesUserCreateC.scroll();
				admin.rolesUserCreateC.click();
			}
		});

		it('it should change the create d room permission', () => {
			if (admin.rolesUserCreateD.isSelected()) {
				admin.rolesUserCreateD.waitForVisible(5000);
				admin.rolesUserCreateD.scroll();
				admin.rolesUserCreateD.click();
			}
		});

		it('it should change the create p room permission', () => {
			if (admin.rolesUserCreateP.isSelected()) {
				admin.rolesUserCreateP.waitForVisible(5000);
				admin.rolesUserCreateP.scroll();
				admin.rolesUserCreateP.click();
			}
		});

		it('it should change the mention all permission', () => {
			if (admin.rolesUserMentionAll.isSelected()) {
				admin.rolesUserMentionAll.waitForVisible(5000);
				admin.rolesUserMentionAll.scroll();
				admin.rolesUserMentionAll.click();
			}
		});

		it('it should change the delete message all permission for owners', () => {
			if (admin.rolesOwnerDeleteMessage.isSelected()) {
				admin.rolesOwnerDeleteMessage.waitForVisible(5000);
				admin.rolesOwnerDeleteMessage.scroll();
				admin.rolesOwnerDeleteMessage.click();
			}
		});

		it('it should change the edit message all permission for owners', () => {
			if (admin.rolesOwnerEditMessage.isSelected()) {
				admin.rolesOwnerEditMessage.waitForVisible(5000);
				admin.rolesOwnerEditMessage.scroll();
				admin.rolesOwnerEditMessage.click();
			}
		});
	});

	describe('test the permissions:', () => {
		before(() => {
			sideNav.preferencesClose.waitForVisible(5000);
			sideNav.preferencesClose.click();

			checkIfUserIsValid(`adminCreated${ username }`, `adminCreated${ email }`, password);
		});

		it('it should not show the plus icon on toolbar ', () => {
			sideNav.newChannelIcon.isVisible().should.be.false;
		});

		it('it should go to general', () => {
			sideNav.spotlightSearch.waitForVisible(10000);
			sideNav.searchChannel('general');
			mainContent.messageInput.waitForVisible(5000);
		});

		it('it should try to use @all and should be warned by rocket.cat ', () => {
			mainContent.tryToMentionAll();
		});

		it.skip('it should not be able to delete own message ', () => {
			//waiting for changes in the delete-message permission
		});

		it.skip('it should not be able to edit own message ', () => {
			//waiting for changes in the edit-message permission
		});
	});
});
