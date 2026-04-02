import { Users } from './fixtures/userStates';
import { AdminSettings } from './page-objects';
import { setSettingValueById } from './utils';
import { test, expect } from './utils/test';

const SECRET_SETTING_ID = 'SMTP_Password';
const SECRET_VALUE = 'test-secret-value-e2e';

test.use({ storageState: Users.admin.state });

test.describe.serial('secret settings - read-none/write-many', () => {
	test.beforeAll(async ({ api }) => {
		await setSettingValueById(api, SECRET_SETTING_ID, SECRET_VALUE);
	});

	test.afterAll(async ({ api }) => {
		await setSettingValueById(api, SECRET_SETTING_ID, '');
	});

	test.describe('API masking', () => {
		test('GET /settings/:id returns empty value and hasValue:true for a password setting', async ({ api }) => {
			const response = await api.get(`/settings/${SECRET_SETTING_ID}`);
			const body = await response.json();

			expect(body.value).toBe('');
			expect(body.hasValue).toBe(true);
		});

		test('POST /settings/:id with empty value does not overwrite an existing secret', async ({ api }) => {
			await api.post(`/settings/${SECRET_SETTING_ID}`, { value: '' });

			const response = await api.get(`/settings/${SECRET_SETTING_ID}`);
			const body = await response.json();

			expect(body.hasValue).toBe(true);
		});
	});

	test.describe('UI masking', () => {
		let poAdminSettings: AdminSettings;

		test.beforeEach(async ({ page }) => {
			poAdminSettings = new AdminSettings(page);
			await page.goto('/admin/settings/Email');
			await page.getByRole('main').getByRole('heading', { level: 1, name: 'Email', exact: true }).waitFor();
		});

		test('password setting with a value shows masked state', async ({ page }) => {
			const smtpSection = page.getByRole('button', { name: /SMTP/i });
			await smtpSection.click();

			const maskedInput = page.locator(`#${SECRET_SETTING_ID}`);
			await expect(maskedInput).toBeVisible();
			await expect(maskedInput).toHaveValue('••••••••');
			await expect(maskedInput).toBeDisabled();

			await expect(page.getByRole('button', { name: 'Edit value' }).first()).toBeVisible();
		});

		test('clicking pencil switches to edit mode and cancel restores masked state', async ({ page }) => {
			const smtpSection = page.getByRole('button', { name: /SMTP/i });
			await smtpSection.click();

			await page.getByRole('button', { name: 'Edit value' }).first().click();

			const editInput = page.locator(`#${SECRET_SETTING_ID}`);
			await expect(editInput).toBeEnabled();
			await expect(editInput).toHaveValue('');

			await page.getByRole('button', { name: 'Cancel' }).first().click();

			await expect(editInput).toBeDisabled();
			await expect(editInput).toHaveValue('••••••••');
		});
	});
});
