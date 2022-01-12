import { assert } from 'chai';

import { adminUsername, adminEmail, adminPassword, username, email, password } from '../../data/user.js';
import admin from '../pageobjects/administration.page';
import { checkIfUserIsValid } from '../../data/checks';
import sideNav from '../pageobjects/side-nav.page';

function openAdminView() {
	admin.open('admin/Layout');
}

function logoutRocketchat() {
	// sideNav.sidebarUserMenu.waitForVisible(5000);
	sideNav.sidebarUserMenu.click();
	// sideNav.logout.waitForVisible(5000);
	sideNav.logout.click();
}

describe.skip('[Rocket.Chat Settings based permissions]', function () {
	const newTitle = 'Testtitle';

	describe('Give User Permissions', function () {
		before(() => {
			try {
				// If the tests run as a suite,a user may already be logged-in
				logoutRocketchat();
			} catch (e) {
				// most possibly already logged off since started seperately => try to continue
			}
			checkIfUserIsValid(adminUsername, adminEmail, adminPassword);
			openAdminView();
			admin.permissionsLink.click();
		});

		it('Set permission for user to manage settings', function (done) {
			if (!admin.rolesManageSettingsPermissions.isSelected()) {
				admin.rolesManageSettingsPermissions.click();
			}
			admin.rolesManageSettingsPermissions.isSelected().should.equal(true);
			done();
		});

		it('Set Permission for user to change titlepage title', function (done) {
			admin.rolesSettingsTab.click();
			admin.rolesSettingsFindInput.type('Layout');
			if (!admin.rolesSettingLayoutTitle.isSelected()) {
				admin.rolesSettingLayoutTitle.click();
			}
			admin.rolesSettingLayoutTitle.isSelected().should.equal(true);
			done();
		});

		after(() => {
			sideNav.preferencesClose.click();
			logoutRocketchat();
		});
	});

	describe('Test new user setting permissions', function () {
		before(() => {
			try {
				checkIfUserIsValid(username, email, password);
			} catch (e) {
				console.log('		User could not be logged in - trying again');
				checkIfUserIsValid(username, email, password);
			}
			openAdminView();
		});

		it('Change titlepage title is allowed', function (done) {
			admin.layoutLink.click();
			admin.generalLayoutTitle.type(newTitle);
			browser.pause(2000);
			admin.buttonSave.click();
			done();
		});

		after(() => {
			sideNav.preferencesClose.click();
			logoutRocketchat();
		});
	});

	describe('Verify settings change and cleanup', function () {
		before(() => {
			console.log('Switching back to Admin');
			checkIfUserIsValid(adminUsername, adminEmail, adminPassword);
			openAdminView();
		});

		it('New settings value visible for admin as well', function (done) {
			admin.layoutLink.click();
			admin.layoutButtonExpandContent.click();
			assert(admin.generalLayoutTitle.getValue() === newTitle, 'Title setting value not changed properly');
			browser.pause(2000);
			admin.buttonSave.click();
			done();
		});

		it('Cleanup permissions', function (done) {
			admin.permissionsLink.click();

			admin.rolesManageSettingsPermissions.click();
			admin.rolesManageSettingsPermissions.isSelected().should.equal(false);

			admin.rolesSettingsTab.click();
			admin.rolesSettingsFindInput.type('Layout');
			admin.rolesSettingLayoutTitle.click();
			admin.rolesSettingLayoutTitle.isSelected().should.equal(false);
			done();
		});

		after(() => {
			sideNav.preferencesClose.click();
			logoutRocketchat();
		});
	});
});
