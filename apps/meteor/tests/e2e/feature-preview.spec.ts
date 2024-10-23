import { Users } from './fixtures/userStates';
import { AccountProfile, HomeChannel } from './page-objects';
import { setUserPreferences } from './utils/setUserPreferences';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('feature preview', () => {
	let poHomeChannel: HomeChannel;
	let poAccountProfile: AccountProfile;

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		poAccountProfile = new AccountProfile(page);

		await page.goto('/account/feature-preview');
	});

	test('should show "Message" and "Navigation" feature sections', async ({ page }) => {
		await expect(page.getByRole('button', { name: 'Message' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Navigation' })).toBeVisible();
	});

	test.describe('Enhanced navigation', () => {
		test.beforeAll(async ({ api }) => {
			await setUserPreferences(api, {
				featuresPreview: [
					{
						name: 'newNavigation',
						value: true,
					},
				],
			});
		});

		test.afterAll(async ({ api }) => {
			await setUserPreferences(api, {
				featuresPreview: [
					{
						name: 'newNavigation',
						value: false,
					},
				],
			});
		});

		test('should be able to toggle "Enhanced navigation" feature', async ({ page }) => {
			await page.getByRole('button', { name: 'Navigation' }).click();
			const checkbox = poAccountProfile.checkboxByLabelText('Enhanced navigation');
			await expect(checkbox).toBeChecked();
			await checkbox.click();
			await expect(checkbox).not.toBeChecked();
		});

		test('should be rendering new UI with "Enhanced navigation"', async () => {
			await expect(poHomeChannel.navbar.navbar).toBeVisible();
		});

		test('should be displaying "Recent" button on sidebar search section, and display recent chats when clicked', async ({ page }) => {
			await page.goto('/home');

			await poHomeChannel.sidenav.btnRecent.click();
			await expect(poHomeChannel.sidenav.sidebar.getByRole('heading', { name: 'Recent' })).toBeVisible();
		});
	});
});
