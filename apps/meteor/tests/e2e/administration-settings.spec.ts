import { Users } from './fixtures/userStates';
import { AdminSettings, AdminSectionsHref } from './page-objects';
import { Navbar } from './page-objects/fragments';
import { LoginPage } from './page-objects/login';
import { getSettingValueById, setSettingValueById } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.parallel('administration-settings', () => {
	let poAdminSettings: AdminSettings;
	let navbar: Navbar;
	let poLoginPage: LoginPage;

	test.beforeEach(async ({ page }) => {
		poAdminSettings = new AdminSettings(page);
		navbar = new Navbar(page);
		poLoginPage = new LoginPage(page);
	});

	test.describe('Settings Page', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/admin/settings');
		});

		test('should display settings list', async ({ page }) => {
			await test.step('should list settings on load', async () => {
				await expect(page.getByText('No results found')).not.toBeVisible();
			});

			await test.step('should list settings after logout and login', async () => {
				await poAdminSettings.sidebar.close();
				await navbar.logout();

				await poLoginPage.loginByUserState(Users.admin);

				await navbar.openAdminPanel();
				const settingsButton = await poAdminSettings.adminSectionButton(AdminSectionsHref.Settings);
				await settingsButton.click();

				await expect(page.getByText('No results found')).not.toBeVisible();
			});
		});
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
			await poAdminSettings.inputSiteURL.fill('any_text');
			await poAdminSettings.btnResetSiteURL.click();

			await expect(poAdminSettings.inputSiteURL).toHaveValue(inputSiteURLSetting);
		});

		test('should be able to go back to the settings page', async ({ page }) => {
			await poAdminSettings.btnBack.click();

			await expect(page).toHaveURL('/admin/settings');
		});
	});

	test.describe('Layout', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/admin/settings/Layout');
		});

		test.afterAll(async ({ api }) => setSettingValueById(api, 'theme-custom-css', ''));

		test('should display the code mirror correctly', async ({ page, api }) => {
			await poAdminSettings.getAccordionBtnByName('Custom CSS').click();

			await test.step('should render only one code mirror element', async () => {
				const codeMirrorParent = page.getByRole('code');
				await expect(codeMirrorParent.locator('.CodeMirror')).toHaveCount(1);
			});

			await test.step('should display full screen properly', async () => {
				await poAdminSettings.btnFullScreen.click();
				await expect(page.getByRole('code')).toHaveCSS('width', '920px');
				await poAdminSettings.btnExitFullScreen.click();
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
