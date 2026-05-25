import { Users } from './fixtures/userStates';
import { AdminUsers, HomeChannel } from './page-objects';
import { expect, test } from './utils/test';
import { createTestUser, type ITestUser } from './utils/user-helpers';

test.describe('Admin users phones', () => {
	let poHomeChannel: HomeChannel;
	let poAdmin: AdminUsers;
	let phoneTestUser: ITestUser;

	test.use({ storageState: Users.admin.state });

	test.beforeEach(async ({ api }) => {
		phoneTestUser = await createTestUser(api, {
			data: {
				phones: [{ number: '+15551110001', label: 'Initial', primary: true }],
			},
		});
	});

	test.afterEach(async () => {
		await phoneTestUser.delete();
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		poAdmin = new AdminUsers(page);
		await page.goto('/admin/users');
	});

	test('should allow admin to edit user phones', async () => {
		await test.step('open user info from admin users table', async () => {
			await poAdmin.searchUser(phoneTestUser.data.username);
			await poAdmin.getUserRowByUsername(phoneTestUser.data.username).click();
			await poAdmin.userInfo.waitForDisplay();
			await expect(poAdmin.userInfo.phoneLinkWithLabel('+15551110001', 'Initial')).toBeVisible();
		});

		await test.step('edit phones in contextual bar', async () => {
			await poAdmin.userInfo.btnEdit.click();
			await poAdmin.editUser.waitForDisplay();

			await poAdmin.editUser.phoneNumber.setPhone(0, '+15551110002', 'Work');

			await poAdmin.editUser.phoneNumber.addPhone('+15551110003', 'Home');

			await poAdmin.editUser.btnSaveUser.click();
			await poHomeChannel.toastMessage.dismissToast();
		});

		await test.step('show phone numbers in user info contextual bar', async () => {
			await expect(poAdmin.userInfo.phoneLinks).toHaveCount(2);
			await expect(poAdmin.userInfo.phoneLinkWithLabel('+15551110002', 'Work')).toBeVisible();
			await expect(poAdmin.userInfo.phoneLinkWithLabel('+15551110003', 'Home')).toBeVisible();
		});

		await test.step('re-open edit form and verify values persisted', async () => {
			await poAdmin.userInfo.btnEdit.click();
			await poAdmin.editUser.waitForDisplay();
			await expect(poAdmin.editUser.phoneNumber.getPhoneNumberInput(0)).toHaveValue('+15551110002');
			await expect(poAdmin.editUser.phoneNumber.getPhoneLabelInput(0)).toHaveValue('Work');
			await expect(poAdmin.editUser.phoneNumber.getPhoneNumberInput(1)).toHaveValue('+15551110003');
			await expect(poAdmin.editUser.phoneNumber.getPhoneLabelInput(1)).toHaveValue('Home');
		});
	});

	test('should allow admin to remove all user phones', async () => {
		await test.step('open user info from admin users table', async () => {
			await poAdmin.searchUser(phoneTestUser.data.username);
			await poAdmin.getUserRowByUsername(phoneTestUser.data.username).click();
			await poAdmin.userInfo.waitForDisplay();
			await expect(poAdmin.userInfo.phoneLinkWithLabel('+15551110001', 'Initial')).toBeVisible();
		});

		await test.step('remove all user phones', async () => {
			await poAdmin.userInfo.btnEdit.click();
			await poAdmin.editUser.waitForDisplay();

			await poAdmin.editUser.phoneNumber.removePhone(0);

			await poAdmin.editUser.btnSaveUser.click();
			await poHomeChannel.toastMessage.dismissToast();
		});

		await test.step('show no phone numbers in user info contextual bar', async () => {
			await expect(poAdmin.userInfo.phoneLinks).toHaveCount(0);
		});

		await test.step('re-open edit form and verify values persisted', async () => {
			await poAdmin.userInfo.btnEdit.click();
			await poAdmin.editUser.waitForDisplay();
			await expect(poAdmin.editUser.phoneNumber.inputPhoneNumber).toHaveCount(0);
		});
	});
});
