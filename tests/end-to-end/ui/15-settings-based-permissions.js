import { adminUsername, adminEmail, adminPassword, username, email, password } from '../../data/user.js';
import admin from '../../pageobjects/administration.page';
import { checkIfUserIsValid, checkIfUserIsAdmin } from '../../data/checks';
import sideNav from '../../pageobjects/side-nav.page';
import { manageSettingsPerm, expandSBP, layoutTitelPerm, layoutTitelSetting, contentExpand, saveSettings } from '../../pageobjects/main-content.page';

describe('[Rocket.Chat Settings based permissions]', function () {

	const newTitle = 'Testtitle';

	describe('Give User Permissions', function () {
		before(() => {
			checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
			sideNav.spotlightSearch.waitForVisible(10000);
			sideNav.accountMenu.waitForVisible(5000);
			sideNav.accountMenu.click();
			sideNav.admin.waitForVisible(5000);
			sideNav.admin.click();
			admin.permissionsLink.waitForVisible(5000);
			admin.permissionsLink.click();
			expandSBP.click();
		});

		it('Set Permission for User to manage settings', function (done) {
			admin.rolesPermissionGrid.waitForVisible(5000);

			if (manageSettingsPerm.isSelected()) {
				console.log('Value is checked', manageSettingsPerm.isSelected());
			}
			else {
				manageSettingsPerm.click();
				console.log('Value was unchecked', manageSettingsPerm.isSelected());
			}
			expect(manageSettingsPerm.isSelected()).to.equal(true);
			done()
		});

		it('Set Permission for User to change titelpage titel', function (done) {
			admin.rolesPermissionGrid.waitForVisible(5000);
			if (layoutTitelPerm.isSelected()) {
				console.log('Value is checked:', layoutTitelPerm.isSelected());
			}
			else {
				layoutTitelPerm.click();
				console.log('Value was unchecked, now:', layoutTitelPerm.isSelected());
			}
			expect(layoutTitelPerm.isSelected()).to.equal(true);
			done()
		});

		after(() => {
			sideNav.preferencesClose.waitForVisible(5000);
			sideNav.preferencesClose.click();
		});
	});

	describe('Test new User settings', function () {

		before(() => {
			checkIfUserIsValid(username, email, password);
			sideNav.accountMenu.waitForVisible(5000);
			sideNav.accountMenu.click();
			sideNav.admin.waitForVisible(5000);
			sideNav.admin.click();
		});

		it('Change Titelpage title is allowed', function (done) {
			admin.layoutLink.waitForVisible(5000);
			admin.layoutLink.click();
			contentExpand.waitForVisible(5000);
			contentExpand.click();
			layoutTitelSetting.waitForVisible(5000);
			layoutTitelSetting.setValue(newTitle);
			browser.pause(2000);
			console.log('New Titel value:', layoutTitelSetting.getValue());
			saveSettings.click();

			// layoutTitelSetting.setValue('');
			// browser.pause(2000);
			// console.log('New Titel value:', layoutTitelSetting.getValue() );
			// saveSettings.click();
			//
			// layoutTitelSetting.setValue(newTitle);
			// browser.pause(2000);
			// console.log('New Titel value:', layoutTitelSetting.getValue() );
			// saveSettings.click();
			done()
		});
	});

	describe('Cleanup', function () {

		before(() => {
			sideNav.preferencesClose.waitForVisible(5000);
			sideNav.preferencesClose.click();
			checkIfUserIsValid(username, email, password);
			sideNav.spotlightSearch.waitForVisible(10000);
			sideNav.accountMenu.waitForVisible(5000);
			sideNav.accountMenu.click();
			sideNav.admin.waitForVisible(5000);
			sideNav.admin.click();
		});

		it('Cleanup permissions', function (done) {
			checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
			sideNav.spotlightSearch.waitForVisible(10000);
			sideNav.accountMenu.waitForVisible(5000);
			sideNav.accountMenu.click();
			sideNav.admin.waitForVisible(5000);
			sideNav.admin.click();
			admin.permissionsLink.waitForVisible(5000);
			admin.permissionsLink.click();
			admin.rolesPermissionGrid.waitForVisible(5000);

			manageSettingsPerm.click();
			expect(manageSettingsPerm.isSelected()).to.equal(false);

			expandSBP.click();

			layoutTitelPerm.click();
			expect(layoutTitelPerm.isSelected()).to.equal(false);
			done()
		});

		after(() => {
			sideNav.preferencesClose.waitForVisible(5000);
			sideNav.preferencesClose.click();
			sideNav.logoutRocketchat();
		});
	});
});
