/* eslint-env mocha */
import { adminUsername, adminEmail, adminPassword, username, email, password } from '../../data/user.js';
import admin from '../../pageobjects/administration.page';
import { checkIfUserIsValid, checkIfUserIsAdmin } from '../../data/checks';
import sideNav from '../../pageobjects/side-nav.page';
import { assert } from 'chai';

function openAdminView() {
	sideNav.sidebarMenu.click();
	sideNav.admin.waitForVisible(5000);
	sideNav.admin.click();
	admin.flexNavContent.waitForVisible(5000);
}

function logoutRocketchat() {
	sideNav.sidebarUserMenu.waitForVisible(5000);
	sideNav.sidebarUserMenu.click();
	sideNav.logout.waitForVisible(5000);
	sideNav.logout.click();
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
			admin.permissionsLink.waitForVisible(10000);
			admin.permissionsLink.click();
			admin.rolesSettingPermissionsButton.waitForVisible(10000);
			admin.rolesSettingPermissionsButton.click();
		});

		it('Set permission for user to manage settings', function(done) {
			admin.rolesPermissionGrid.waitForVisible(10000);

			if (!admin.rolesManageSettingsPermissions.isSelected()) {
				admin.rolesManageSettingsPermissions.click();
			}
			admin.rolesManageSettingsPermissions.isSelected().should.equal(true);
			done();
		});

		it('Set Permission for user to change titlepage title', function(done) {
			admin.rolesPermissionGrid.waitForVisible(5000);
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
	});

	describe('Verify settings change and cleanup', function() {

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

		before(() => {
			sideNav.preferencesClose.waitForVisible(5000);
			sideNav.preferencesClose.click();
			checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
			openAdminView();
		});

		it('Cleanup permissions', function(done) {
			admin.permissionsLink.waitForVisible(10000);
			admin.permissionsLink.click();
			admin.rolesPermissionGrid.waitForVisible(10000);

			admin.rolesManageSettingsPermissions.click();
			admin.rolesManageSettingsPermissions.isSelected().should.equal(false);

			admin.rolesSettingPermissionsButton.click();

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
