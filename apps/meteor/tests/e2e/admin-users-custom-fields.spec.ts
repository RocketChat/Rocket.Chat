import { Users } from './fixtures/userStates';
import { AdminUsers, HomeChannel } from './page-objects';
import { test, expect } from './utils/test';
import { createTestUser, type ITestUser } from './utils/user-helpers';

const customFieldInitial1 = 'initial1';
const adminCustomFieldValue1 = 'admin_value1';
const adminCustomFieldValue2 = 'admin_value2';
const adminCustomFieldUpdated1 = 'updated_admin1';

test.describe('Admin users custom fields', () => {
	let poHomeChannel: HomeChannel;
	let poAdmin: AdminUsers;
	let addTestUser: ITestUser;
	let updateTestUser: ITestUser;

	test.use({ storageState: Users.admin.state });

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/Accounts_CustomFields', {
			value: JSON.stringify({
				customFieldText1: {
					type: 'text',
					required: false,
				},
				customFieldText2: {
					type: 'text',
					required: false,
				},
			}),
		});

		[addTestUser, updateTestUser] = await Promise.all([
			createTestUser(api),
			createTestUser(api, {
				data: {
					customFields: {
						customFieldText1: customFieldInitial1,
						customFieldText2: adminCustomFieldValue2,
					},
				},
			}),
		]);
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			api.post('/settings/Accounts_CustomFields', {
				value: '',
			}),
			addTestUser.delete(),
			updateTestUser.delete(),
		]);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		poAdmin = new AdminUsers(page);
		await page.goto('/admin/users');
	});

	test('should allow admin to add user custom fields', async () => {
		await test.step('should find and click on add test user', async () => {
			await poAdmin.searchUser(addTestUser.data.username);
			await poAdmin.getUserRowByUsername(addTestUser.data.username).click();
		});

		await test.step('should navigate to edit user form', async () => {
			await poAdmin.userInfo.btnEdit.click();
		});

		await test.step('should fill custom fields for user', async () => {
			await poAdmin.editUser.getCustomField('customFieldText1').fill(adminCustomFieldValue1);
			await poAdmin.editUser.getCustomField('customFieldText2').fill(adminCustomFieldValue2);
		});

		await test.step('should save user custom fields', async () => {
			await poAdmin.editUser.btnSaveUser.click();
			await poHomeChannel.toastMessage.dismissToast();
			await poAdmin.editUser.close();
		});

		await test.step('should verify custom fields were saved', async () => {
			await poAdmin.getUserRowByUsername(addTestUser.data.username).click();
			await poAdmin.userInfo.btnEdit.click();

			await expect(poAdmin.editUser.getCustomField('customFieldText1')).toHaveValue(adminCustomFieldValue1);
			await expect(poAdmin.editUser.getCustomField('customFieldText2')).toHaveValue(adminCustomFieldValue2);
		});
	});

	test('should allow admin to update existing user custom fields', async () => {
		await test.step('should find and click on update test user', async () => {
			await poAdmin.searchUser(updateTestUser.data.username);
			await poAdmin.getUserRowByUsername(updateTestUser.data.username).click();
		});

		await test.step('should navigate to edit user form', async () => {
			await poAdmin.userInfo.btnEdit.click();
		});

		await test.step('should verify existing values and update one custom field', async () => {
			await poAdmin.editUser.inputName.waitFor();

			await expect(poAdmin.editUser.getCustomField('customFieldText1')).toHaveValue(customFieldInitial1);
			await expect(poAdmin.editUser.getCustomField('customFieldText2')).toHaveValue(adminCustomFieldValue2);

			await poAdmin.editUser.getCustomField('customFieldText1').clear();
			await poAdmin.editUser.getCustomField('customFieldText1').fill(adminCustomFieldUpdated1);
		});

		await test.step('should save and verify partial update', async () => {
			await poAdmin.editUser.btnSaveUser.click();
			await poHomeChannel.toastMessage.dismissToast();

			await poAdmin.editUser.close();
			await poAdmin.getUserRowByUsername(updateTestUser.data.username).click();
			await poAdmin.userInfo.btnEdit.click();

			await expect(poAdmin.editUser.getCustomField('customFieldText1')).toHaveValue(adminCustomFieldUpdated1);
			await expect(poAdmin.editUser.getCustomField('customFieldText2')).toHaveValue(adminCustomFieldValue2);
		});
	});

	test.describe('with invalid custom field type', () => {
		test.beforeAll(async ({ api }) => {
			await api.post('/settings/Accounts_CustomFields', {
				value: JSON.stringify({
					customFieldText1: {
						type: 'invalid_type',
						required: false,
					},
					customFieldText2: {
						type: 'text',
						required: false,
					},
				}),
			});
		});

		test('should not render fields with invalid custom field type', async () => {
			await test.step('should find and click on add test user', async () => {
				await poAdmin.searchUser(addTestUser.data.username);
				await poAdmin.getUserRowByUsername(addTestUser.data.username).click();
			});

			await test.step('should navigate to edit user form', async () => {
				await poAdmin.userInfo.btnEdit.click();
			});

			await test.step('should verify custom field is not rendered', async () => {
				await expect(poAdmin.editUser.getCustomField('customFieldText1')).not.toBeVisible();
				await expect(poAdmin.editUser.getCustomField('customFieldText2')).toBeVisible();
			});
		});
	});
});
