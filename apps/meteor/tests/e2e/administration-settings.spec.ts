import { Users } from './fixtures/userStates';
import { Admin } from './page-objects';
import { getSettingValueById, setSettingValueById } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.parallel('administration-settings', () => {
	let poAdmin: Admin;

	test.beforeEach(async ({ page }) => {
		poAdmin = new Admin(page);
	});

	test.describe('General', () => {
		let inputSiteURLSetting: string;

		test.beforeAll(async ({ api }) => {
			inputSiteURLSetting = (await getSettingValueById(api, 'Site_Url')) as string;
		});

		test.beforeEach(async ({ page }) => {
			await page.goto('/admin/settings/General');
		});

		test('should be able to reset a setting after a change', async () => {
			await poAdmin.inputSiteURL.fill('any_text');
			await poAdmin.btnResetSiteURL.click();

			await expect(poAdmin.inputSiteURL).toHaveValue(inputSiteURLSetting);
		});

		test('should be able to go back to the settings page', async ({ page }) => {
			await poAdmin.btnBack.click();

			await expect(page).toHaveURL('/admin/settings');
		});
	});

	test.describe('Layout', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/admin/settings/Layout');
		});

		test.afterAll(async ({ api }) => setSettingValueById(api, 'theme-custom-css', ''));

		test('should display the code mirror correctly', async ({ page, api }) => {
			await poAdmin.getAccordionBtnByName('Custom CSS').click();

			await test.step('should render only one code mirror element', async () => {
				const codeMirrorParent = page.getByRole('code');
				await expect(codeMirrorParent.locator('.CodeMirror')).toHaveCount(1);
			});

			await test.step('should display full screen properly', async () => {
				await poAdmin.btnFullScreen.click();
				await expect(page.getByRole('code')).toHaveCSS('width', '920px');
				await poAdmin.btnExitFullScreen.click();
			});

			await test.step('should reflect updated value when valueProp changes after server update', async () => {
				const codeValue = `.test-class-${Date.now()} { background-color: red; }`;
				await setSettingValueById(api, 'theme-custom-css', codeValue);

				const codeMirrorParent = page.getByRole('code');
				await expect(codeMirrorParent.locator('.CodeMirror-line')).toHaveText(codeValue);
			});
		});
	});
});
