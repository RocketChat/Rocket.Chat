import { Users } from './fixtures/userStates';
import { HomeChannel, Admin } from './page-objects';
import { test, expect } from './utils/test';
import { createTestUser, type ITestUser } from './utils/user-helpers';

const customFieldInitial1 = 'initial1';
const adminCustomFieldValue1 = 'admin_value1';
const adminCustomFieldValue2 = 'admin_value2';
const adminCustomFieldUpdated1 = 'updated_admin1';

test.describe('Admin users custom fields', () => {
	let poHomeChannel: HomeChannel;
	let poAdmin: Admin;
	let addTestUser: ITestUser;
	let updateTestUser: ITestUser;

	test.use({ storageState: Users.admin.state });

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/Accounts_CustomFields', {
			value: JSON.stringify({
				customFieldText1: {
					type: 'text',
					required: false,
					minLength: 2,
					maxLength: 20,
				},
				customFieldText2: {
					type: 'text',
					required: false,
					minLength: 2,
					maxLength: 20,
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
		poAdmin = new Admin(page);
		await page.goto('/admin/users');
	});

	test('should allow admin to add user custom fields', async () => {
		await test.step('should find and click on add test user', async () => {
			await poAdmin.inputSearchUsers.fill(addTestUser.data.username);

			await expect(poAdmin.getUserRowByUsername(addTestUser.data.username)).toBeVisible();
			await poAdmin.getUserRowByUsername(addTestUser.data.username).click();
		});

		await test.step('should navigate to edit user form', async () => {
			await poAdmin.btnEdit.waitFor();
			await poAdmin.btnEdit.click();
		});

		await test.step('should fill custom fields for user', async () => {
			await poAdmin.tabs.users.inputName.waitFor();

			await expect(poAdmin.tabs.users.customFieldText1).toBeVisible();
			await expect(poAdmin.tabs.users.customFieldText2).toBeVisible();

			await poAdmin.tabs.users.customFieldText1.fill(adminCustomFieldValue1);
			await poAdmin.tabs.users.customFieldText2.fill(adminCustomFieldValue2);
		});

		await test.step('should save user custom fields', async () => {
			await poAdmin.tabs.users.btnSaveUser.click();
			await expect(poHomeChannel.toastSuccess).toBeVisible();
			await poHomeChannel.dismissToast();
		});

		await test.step('should verify custom fields were saved', async () => {
			await poAdmin.tabs.users.btnContextualbarClose.click();
			await poAdmin.getUserRowByUsername(addTestUser.data.username).click();
			await poAdmin.btnEdit.click();

			await expect(poAdmin.tabs.users.customFieldText1).toHaveValue(adminCustomFieldValue1);
			await expect(poAdmin.tabs.users.customFieldText2).toHaveValue(adminCustomFieldValue2);
		});
	});

	test('should allow admin to update existing user custom fields', async () => {
		await test.step('should find and click on update test user', async () => {
			await poAdmin.inputSearchUsers.fill(updateTestUser.data.username);

			await expect(poAdmin.getUserRowByUsername(updateTestUser.data.username)).toBeVisible();
			await poAdmin.getUserRowByUsername(updateTestUser.data.username).click();
		});

		await test.step('should navigate to edit user form', async () => {
			await poAdmin.btnEdit.waitFor();
			await poAdmin.btnEdit.click();
		});

		await test.step('should verify existing values and update one custom field', async () => {
			await poAdmin.tabs.users.inputName.waitFor();

			await expect(poAdmin.tabs.users.customFieldText1).toHaveValue(customFieldInitial1);
			await expect(poAdmin.tabs.users.customFieldText2).toHaveValue(adminCustomFieldValue2);

			await poAdmin.tabs.users.customFieldText1.clear();
			await poAdmin.tabs.users.customFieldText1.fill(adminCustomFieldUpdated1);
		});

		await test.step('should save and verify partial update', async () => {
			await poAdmin.tabs.users.btnSaveUser.click();
			await expect(poHomeChannel.toastSuccess).toBeVisible();
			await poHomeChannel.dismissToast();

			await poAdmin.tabs.users.btnContextualbarClose.click();
			await poAdmin.getUserRowByUsername(updateTestUser.data.username).click();
			await poAdmin.btnEdit.click();

			await expect(poAdmin.tabs.users.customFieldText1).toHaveValue(adminCustomFieldUpdated1);
			await expect(poAdmin.tabs.users.customFieldText2).toHaveValue(adminCustomFieldValue2);
		});
	});
});
