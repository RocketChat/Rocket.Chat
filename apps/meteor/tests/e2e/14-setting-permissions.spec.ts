import { test, expect } from '@playwright/test';

// import { adminUsername, adminEmail, adminPassword, username, email, password } from './utils/mocks/userAndPasswordMock';
import Administration from './utils/pageobjects/Administration';
// import SideNav from './utils/pageobjects/SideNav';
// import LoginPage from './utils/pageobjects/LoginPage';

test.describe('[Rocket.Chat Settings based permissions]', () => {
	let admin: Administration;
	// let sideNav: SideNav;
	// let loginPage: LoginPage;

	test.beforeAll(async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		// sideNav = new SideNav(page);
		admin = new Administration(page);
		// loginPage = new LoginPage(page);
	});

	test.describe('Give User Permissions', async () => {
		test.beforeAll(async () => {
			await admin.permissionsLink().click();
		});

		test('Set permission for user to manage settings', async () => {
			const isChecked = await admin.getPage().isChecked('table tbody tr td:nth-child(6)');
			if (!isChecked) {
				await admin.getPage().click('table tbody tr td:nth-child(6)');
			}
			expect(await admin.getPage().isChecked('table tbody tr td:nth-child(6)')).toBeTruthy();
		});

		test('Set Permission for user to change titlepage title', async () => {
			await admin.rolesSettingsTab().click();
			await admin.rolesSettingsFindInput().type('Layout');
			const isChecked = await admin.getPage().isChecked('table tbody tr td:nth-child(6)');
			if (!isChecked) {
				await admin.rolesSettingLayoutTitle().click();
			}
			expect(await admin.getPage().isChecked('table tbody tr td:nth-child(6)')).toBeTruthy();
		});

		// 	it('Set Permission for user to change titlepage title', function (done) {
		// 		admin.rolesSettingsTab.click();
		// 		admin.rolesSettingsFindInput.type('Layout');
		// 		if (!admin.rolesSettingLayoutTitle.isSelected()) {
		// 			admin.rolesSettingLayoutTitle.click();
		// 		}
		// 		admin.rolesSettingLayoutTitle.isSelected().should.equal(true);
		// 		done();
		// 	});

		// 	after(() => {
		// 		sideNav.preferencesClose.click();
		// 		logoutRocketchat();
		// 	});
		// });

		// describe('Test new user setting permissions', function () {
		// 	before(() => {
		// 		try {
		// 			checkIfUserIsValid(username, email, password);
		// 		} catch (e) {
		// 			console.log('		User could not be logged in - trying again');
		// 			checkIfUserIsValid(username, email, password);
		// 		}
		// 		openAdminView();
		// 	});

		// 	it('Change titlepage title is allowed', function (done) {
		// 		admin.layoutLink.click();
		// 		admin.generalLayoutTitle.type(newTitle);
		// 		browser.pause(2000);
		// 		admin.buttonSave.click();
		// 		done();
		// 	});

		// 	after(() => {
		// 		sideNav.preferencesClose.click();
		// 		logoutRocketchat();
		// 	});
		// });

		// describe('Verify settings change and cleanup', function () {
		// 	before(() => {
		// 		console.log('Switching back to Admin');
		// 		checkIfUserIsValid(adminUsername, adminEmail, adminPassword);
		// 		openAdminView();
		// 	});

		// 	it('New settings value visible for admin as well', function (done) {
		// 		admin.layoutLink.click();
		// 		admin.layoutButtonExpandContent.click();
		// 		assert(admin.generalLayoutTitle.getValue() === newTitle, 'Title setting value not changed properly');
		// 		browser.pause(2000);
		// 		admin.buttonSave.click();
		// 		done();
		// 	});

		// 	it('Cleanup permissions', function (done) {
		// 		admin.permissionsLink.click();

		// 		admin.rolesManageSettingsPermissions.click();
		// 		admin.rolesManageSettingsPermissions.isSelected().should.equal(false);

		// 		admin.rolesSettingsTab.click();
		// 		admin.rolesSettingsFindInput.type('Layout');
		// 		admin.rolesSettingLayoutTitle.click();
		// 		admin.rolesSettingLayoutTitle.isSelected().should.equal(false);
		// 		done();
		// 	});

		// 	after(() => {
		// 		sideNav.preferencesClose.click();
		// 		logoutRocketchat();
		// 	});
	});
});
