/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import sideNav from '../pageobjects/side-nav.page';
import flexTab from '../pageobjects/flex-tab.page';
import admin from '../pageobjects/administration.page';

//test data imports
import {checkIfUserIsAdmin} from '../data/checks';
import {username, email, password, adminUsername, adminEmail, adminPassword} from '../data/user.js';

describe('Admin settings', () => {
	before(() => {
		checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
		sideNav.getChannelFromList('general').waitForExist(5000);
		sideNav.openChannel('general');
		sideNav.accountBoxUserName.waitForVisible(5000);
		sideNav.accountBoxUserName.click();
		sideNav.admin.waitForVisible(5000);
		sideNav.admin.click();
	});

	describe('user creation via admin view', () => {
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

		it('create a user', () => {
			flexTab.usersAddUserName.setValue('adminCreated'+username);
			flexTab.usersAddUserUsername.setValue('adminCreated'+username);
			flexTab.usersAddUserEmail.setValue('adminCreated'+email);
			flexTab.usersAddUserVerifiedCheckbox.click();
			flexTab.usersAddUserPassword.setValue(password);
			flexTab.usersAddUserChangePasswordCheckbox.click();
			flexTab.usersButtonSave.click();
		});

		it('should show the user in the list', () => {
			browser.pause(200);
			var element = browser.element('td=adminCreated'+username);
			element.isVisible().should.be.visible;
		});
	});

	describe('permissions?', () => {
		before(() => {
			admin.permissionsLink.waitForVisible(5000);
			admin.permissionsLink.click();
			admin.rolesPermissionGrid.waitForVisible(5000);
		});

		after(() => {
			admin.infoLink.waitForVisible(5000);
			admin.infoLink.click();
		});

		describe('changing the permissions', () => {
			it('should change the create c room permission', () => {
				if (admin.rolesUserCreateC.isSelected()) {
					admin.rolesUserCreateC.waitForVisible(5000);
					admin.rolesUserCreateC.scroll();
					admin.rolesUserCreateC.click();
				}
			});

			it('should change the create d room permission', () => {
				if (admin.rolesUserCreateD.isSelected()) {
					admin.rolesUserCreateD.waitForVisible(5000);
					admin.rolesUserCreateD.scroll();
					admin.rolesUserCreateD.click();
				}
			});

			it('should change the create p room permission', () => {
				if (admin.rolesUserCreateP.isSelected()) {
					admin.rolesUserCreateP.waitForVisible(5000);
					admin.rolesUserCreateP.scroll();
					admin.rolesUserCreateP.click();
				}
			});

			it('should change the mention all permission', () => {
				if (admin.rolesUserCreateC.isSelected()) {
					admin.rolesUserMentionAll.waitForVisible(5000);
					admin.rolesUserMentionAll.scroll();
					admin.rolesUserMentionAll.click();
				}
			});

			it('should change the delete message all permission for owners', () => {
				if (admin.rolesOwnerDeleteMessage.isSelected()) {
					admin.rolesOwnerDeleteMessage.waitForVisible(5000);
					admin.rolesOwnerDeleteMessage.scroll();
					admin.rolesOwnerDeleteMessage.click();
				}
			});

			it('should change the edit message all permission for owners', () => {
				if (admin.rolesOwnerEditMessage.isSelected()) {
					admin.rolesOwnerEditMessage.waitForVisible(5000);
					admin.rolesOwnerEditMessage.scroll();
					admin.rolesOwnerEditMessage.click();
				}
			});



		});

	});
});