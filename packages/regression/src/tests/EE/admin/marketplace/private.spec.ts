import { expect, test } from '@playwright/test';

import fixtures from '../../../fixtures/marketplace.json';
import locator from '../../../locators/marketplace.json';
import { goToMarketplace, installPrivateApp, searchAppPrivate, unistallAppAPI } from '../../../support/marketplace/marketplace';

test.describe('Private Apps', () => {
	test.use({ storageState: 'playwright/.auth/admin.json' });
	test.beforeEach(async ({ page, request }) => {
		await page.goto(`${process.env.URL}`);
		await goToMarketplace(page);
		await unistallAppAPI(request, fixtures.appIdDataLoss);
		await unistallAppAPI(request, fixtures.appIdFacebook);
	});

	test('Upload two Private App', async ({ page }) => {
		await installPrivateApp(page, fixtures.pathDataloss);
		await installPrivateApp(page, fixtures.pathFacebook);
		await searchAppPrivate(page, locator.text.dataLoss);
		expect(await page.getByRole('link', { name: locator.link.dataLossEnabled }).isVisible());
		await searchAppPrivate(page, locator.text.facebook);
		expect(await page.getByRole('link', { name: locator.link.facebookEnabled }).isVisible());
	});

	test('Uninstall a Private App - Outside Menu', async ({ page }) => {
		await installPrivateApp(page, fixtures.pathDataloss);
		await searchAppPrivate(page, locator.text.dataLoss);
		await page.getByTestId(locator.testId.menuSingleApp).click();
		await page.getByText(locator.text.unistall).click();
		await page.getByRole('button', { name: locator.button.yes }).click();
		await expect(page.locator(locator.class.toast).filter({ hasText: 'Data Loss Prevention uninstalled' })).toBeVisible();
		await page.getByRole('link', { name: locator.link.privateApp }).click();
		await page.getByPlaceholder(locator.placeholder.searchPrivateApp).fill(locator.text.dataLoss);
		await expect(page.getByRole('link').filter({ hasText: locator.text.dataLoss })).not.toBeVisible();
	});

	test('Uninstall Private App - Inside Menu', async ({ page }) => {
		await installPrivateApp(page, fixtures.pathFacebook);
		await searchAppPrivate(page, locator.text.facebook);
		await page.getByRole('link').filter({ hasText: locator.text.facebook }).click();
		await page.getByTestId(locator.testId.menuSingleApp).click();
		await page.getByText(locator.text.unistall).click();
		await page.getByRole('button', { name: locator.button.yes }).click();
		page.waitForSelector(locator.class.toast);
		await expect(page.locator(locator.class.toast).filter({ hasText: 'Facebook Messenger uninstalled' })).toBeVisible();
		await page.getByRole('link', { name: locator.link.privateApp }).click();
		await page.getByPlaceholder(locator.placeholder.searchPrivateApp).fill(locator.text.facebook);
		await expect(page.getByRole('link').filter({ hasText: locator.text.facebook })).not.toBeVisible();
	});

	test('Enable and Disable two Private App - Outside Menu', async ({ page }) => {
		await installPrivateApp(page, fixtures.pathFacebook);
		await installPrivateApp(page, fixtures.pathDataloss);

		// Disable - Facebook
		await searchAppPrivate(page, locator.text.facebook);
		await page
			.getByRole('link', { name: `${locator.text.facebook}` })
			.getByTestId(locator.testId.menuSingleApp)
			.click();
		await page.locator(locator.button.menu).locator(locator.button.disable).click();
		await page.getByRole('button', { name: locator.button.yes }).click();
		await expect(page.locator(locator.class.toast).filter({ hasText: 'Facebook Messenger disabled' })).toBeVisible();
		await searchAppPrivate(page, locator.text.facebook);
		expect(await page.getByRole('link', { name: locator.link.facebookDisabled }).isVisible());

		// Disable - Data Loss
		await searchAppPrivate(page, locator.text.dataLoss);
		await page
			.getByRole('link', { name: `${locator.text.dataLoss}` })
			.getByTestId(locator.testId.menuSingleApp)
			.click();
		await page.locator(locator.button.menu).locator(locator.button.disable).click();
		await page.getByRole('button', { name: locator.button.yes }).click();
		await expect(page.locator(locator.class.toast).filter({ hasText: 'Data Loss Prevention disabled' })).toBeVisible();
		await searchAppPrivate(page, locator.text.dataLoss);
		expect(await page.getByRole('link', { name: locator.link.dataLossDisabled }).isVisible());

		// Enable - Facebook
		await searchAppPrivate(page, locator.text.facebook);
		await page
			.getByRole('link', { name: `${locator.text.facebook}` })
			.getByTestId(locator.testId.menuSingleApp)
			.click();
		await page.locator(locator.button.menu).locator(locator.button.enable).click();
		await expect(page.locator(locator.class.toast).filter({ hasText: 'Facebook Messenger enabled' })).toBeVisible();
		await searchAppPrivate(page, locator.text.facebook);
		expect(await page.getByRole('link', { name: locator.link.facebookEnabled }).isVisible());

		// Enable - Data Loss
		await searchAppPrivate(page, locator.text.dataLoss);
		await page
			.getByRole('link', { name: `${locator.text.dataLoss}` })
			.getByTestId(locator.testId.menuSingleApp)
			.click();
		await page.locator(locator.button.menu).locator(locator.button.enable).click();
		await expect(page.locator(locator.class.toast).filter({ hasText: 'Data Loss Prevention enabled' })).toBeVisible();
		await searchAppPrivate(page, locator.text.dataLoss);
		expect(await page.getByRole('link', { name: locator.link.dataLossEnabled }).isVisible());
	});

	test('Enable and Disable two Private App - Inside Menu', async ({ page }) => {
		await installPrivateApp(page, fixtures.pathFacebook);
		await installPrivateApp(page, fixtures.pathDataloss);

		// Disable - Facebook
		await searchAppPrivate(page, locator.text.facebook);
		await page
			.getByRole('link', { name: `${locator.text.facebook}` })
			.getByTestId(locator.testId.menuSingleApp)
			.click();
		await page.locator(locator.button.menu).locator(locator.button.disable).click();
		await page.getByRole('button', { name: locator.button.yes }).click();
		await expect(page.locator(locator.class.toast).filter({ hasText: 'Facebook Messenger disabled' })).toBeVisible();
		await searchAppPrivate(page, locator.text.facebook);
		expect(await page.getByRole('link', { name: locator.link.facebookDisabled }).isVisible());

		// Disable - Data Loss
		await searchAppPrivate(page, locator.text.dataLoss);
		await page
			.getByRole('link', { name: `${locator.text.dataLoss}` })
			.getByTestId(locator.testId.menuSingleApp)
			.click();
		await page.locator(locator.button.menu).locator(locator.button.disable).click();
		await page.getByRole('button', { name: locator.button.yes }).click();
		await expect(page.locator(locator.class.toast).filter({ hasText: 'Data Loss Prevention disabled' })).toBeVisible();
		await searchAppPrivate(page, locator.text.dataLoss);
		expect(await page.getByRole('link', { name: locator.link.dataLossDisabled }).isVisible());

		// Enable - Facebook
		await searchAppPrivate(page, locator.text.facebook);
		await page
			.getByRole('link', { name: `${locator.text.facebook}` })
			.getByTestId(locator.testId.menuSingleApp)
			.click();
		await page.locator(locator.button.menu).locator(locator.button.enable).click();
		await expect(page.locator(locator.class.toast).filter({ hasText: 'Facebook Messenger enabled' })).toBeVisible();
		await searchAppPrivate(page, locator.text.facebook);
		expect(await page.getByRole('link', { name: locator.link.facebookEnabled }).isVisible());

		// Enable - Data Loss
		await searchAppPrivate(page, locator.text.dataLoss);
		await page
			.getByRole('link', { name: `${locator.text.dataLoss}` })
			.getByTestId(locator.testId.menuSingleApp)
			.click();
		await page.locator(locator.button.menu).locator(locator.button.enable).click();
		page.waitForSelector(locator.class.toast);
		await expect(page.locator(locator.class.toast).filter({ hasText: 'Data Loss Prevention enabled' })).toBeVisible();
		await searchAppPrivate(page, locator.text.dataLoss);
		expect(await page.getByRole('link', { name: locator.link.dataLossEnabled }).isVisible());
	});

	test('Inside menu Private App @unstable', async ({ page }) => {
		await installPrivateApp(page, fixtures.pathDataloss);
		await expect(page.getByRole('tab', { name: 'Details' })).toBeVisible();
		await expect(page.getByRole('tab', { name: 'Security' })).toBeVisible();
		await expect(page.getByRole('tab', { name: 'Settings' })).toBeVisible();
		await expect(page.getByRole('tab', { name: 'Logs' })).toBeVisible();
	});
});
