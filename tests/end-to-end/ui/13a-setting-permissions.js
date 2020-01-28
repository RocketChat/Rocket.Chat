/* eslint-env mocha */
import { assert } from 'chai';

import { adminUsername, adminEmail, adminPassword, username, email, password } from '../../data/user.js';
import admin from '../../pageobjects/administration.page';
import { checkIfUserIsValid, checkIfUserIsAdmin } from '../../data/checks';
import sideNav from '../../pageobjects/side-nav.page';

function openAdminView() {
	admin.open('admin/info');
	admin.infoRocketChatTable.waitForVisible(5000);
}

function logoutRocketchat() {
	sideNav.sidebarUserMenu.waitForVisible(5000);
	sideNav.sidebarUserMenu.click();
	sideNav.logout.waitForVisible(5000);
	sideNav.logout.click();
	browser.pause(2000); // figured that subsequent actions (new clicks) seem to prevent the logout
}

describe('[Rocket.Chat Settings based permissions]', function() {
	const newTitle = 'Testtitle';

	describe('Give User Permissions', function() {
		before(() => {
			try {
				// If the tests run as a suite,a user may already be logged-in
				logoutRocketchat();
			} catch (e) {
				// most possibly already logged off since started seperately => try to continue
			}
			checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
			openAdminView();
			admin.permissionsLink.waitForVisible(5000);
			admin.permissionsLink.click();
		});

		it('Set permission for user to manage settings', function(done) {
			admin.rolesSettingsFindInput.waitForVisible(5000);
			admin.rolesSettingsFindInput.setValue('manage-selected-settings');
			admin.rolesPermissionGrid.waitForVisible(5000);
			admin.rolesManageSettingsPermissions.waitForVisible(5000);
			if (!admin.rolesManageSettingsPermissions.isSelected()) {
				admin.rolesManageSettingsPermissions.click();
			}
			admin.rolesManageSettingsPermissions.isSelected().should.equal(true);
			done();
		});

		it('Set Permission for user to change titlepage title', function(done) {
			admin.rolesSettingsTab.click();
			admin.rolesSettingsFindInput.setValue('Layout');
			if (!admin.rolesSettingLayoutTitle.isSelected()) {
				admin.rolesSettingLayoutTitle.click();
			}
			admin.rolesSettingLayoutTitle.isSelected().should.equal(true);
			done();
		});

		after(() => {
			sideNav.preferencesClose.waitForVisible(5000);
			sideNav.preferencesClose.click();
			logoutRocketchat();
		});
	});

	describe('Test new user setting permissions', function() {
		before(() => {
			try {
				checkIfUserIsValid(username, email, password);
			} catch (e) {
				console.log('		User could not be logged in - trying again');
				checkIfUserIsValid(username, email, password);
			}
			openAdminView();
		});

		it('Change titlepage title is allowed', function(done) {
			admin.layoutLink.waitForVisible(10000);
			admin.layoutLink.click();
			admin.generalLayoutTitle.waitForVisible(5000);
			admin.generalLayoutTitle.setValue(newTitle);
			browser.pause(2000);
			admin.buttonSave.click();
			done();
		});

		after(() => {
			sideNav.preferencesClose.waitForVisible(5000);
			sideNav.preferencesClose.click();
			logoutRocketchat();
		});
	});

	describe('Verify settings change and cleanup', function() {
		before(() => {
			console.log('Switching back to Admin');
			checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
			openAdminView();
		});

		it('New settings value visible for admin as well', function(done) {
			admin.layoutLink.waitForVisible(10000);
			admin.layoutLink.click();
			admin.layoutButtonExpandContent.waitForVisible(5000);
			admin.layoutButtonExpandContent.click();
			admin.generalLayoutTitle.waitForVisible(5000);
			assert(admin.generalLayoutTitle.getValue() === newTitle, 'Title setting value not changed properly');
			browser.pause(2000);
			admin.buttonSave.click();
			done();
		});

		it('Cleanup permissions', function(done) {
			admin.permissionsLink.waitForVisible(5000);
			admin.permissionsLink.click();

			admin.rolesSettingsFindInput.waitForVisible(5000);
			admin.rolesSettingsFindInput.setValue('manage-selected-settings');

			admin.rolesPermissionGrid.waitForVisible(5000);

			admin.rolesManageSettingsPermissions.click();
			admin.rolesManageSettingsPermissions.isSelected().should.equal(false);

			admin.rolesSettingsTab.click();
			admin.rolesSettingsFindInput.setValue('Layout');
			admin.rolesSettingLayoutTitle.click();
			admin.rolesSettingLayoutTitle.isSelected().should.equal(false);
			done();
		});

		after(() => {
			sideNav.preferencesClose.waitForVisible(5000);
			sideNav.preferencesClose.click();
			logoutRocketchat();
		});
	});
});
