import { expect } from '@playwright/test';

import { IS_EE } from '../../../config/constants';
import fixtures from '../../../fixtures/marketplace.json';
import { Users } from '../../../fixtures/userStates';
import locator from '../../../locators/marketplace.json';
import { goToMarketplace, installPrivateApp, searchAppPrivate } from '../../../support/marketplace/marketplace';
import { test } from '../../../utils/test';

test.describe('Private Apps', () => {
	test.skip(!IS_EE, 'Enterprise Only');
	test.use({ storageState: Users.admin.state });

	test.beforeEach(async ({ page }) => {
		await page.goto(`/home`);
		const req = page.waitForResponse(/api\/apps\/marketplace/);
		await goToMarketplace(page);
		await req;
	});

	test.afterEach(async ({ api }) => {
		const statusCode = (await api.delete(`/api/apps/${fixtures.appIdregression}`, undefined, '')).status();
		await expect(statusCode).toBe(200);
	});

	test('Upload a Private App', async ({ page }) => {
		await installPrivateApp(page, fixtures.pathregression);
		await searchAppPrivate(page, locator.text.regression);
		expect(await page.getByRole('link', { name: locator.link.regressionEnabled }).isVisible());
	});

	test('Uninstall a Private App - Outside Menu', async ({ page }) => {
		await installPrivateApp(page, fixtures.pathregression);
		await searchAppPrivate(page, locator.text.regression);

		await page
			.getByRole('link', { name: `${locator.text.regression}` })
			.getByTestId(locator.testId.menuSingleApp)
			.click();

		await page.getByText(locator.text.uninstall).click();
		await page.getByRole('button', { name: locator.button.yes }).click();
		await expect(page.locator(locator.class.toast).filter({ hasText: 'regression uninstalled' })).toBeVisible();
		await page.getByRole('link', { name: locator.link.privateApp }).click();
		await page.getByPlaceholder(locator.placeholder.searchPrivateApp).fill(locator.text.regression);
		await expect(
			page.getByRole('link', {
				name: locator.text.regression,
			}),
		).not.toBeVisible();
	});

	test('Uninstall Private App - Inside Menu', async ({ page }) => {
		await installPrivateApp(page, fixtures.pathregression);
		await searchAppPrivate(page, locator.text.regression);
		await page.getByRole('link').filter({ hasText: locator.text.regression }).click();

		await page
			.getByRole('link', { name: `${locator.text.regression}` })
			.getByTestId(locator.testId.menuSingleApp)
			.click();

		await page.getByText(locator.text.uninstall).click();
		await page.getByRole('button', { name: locator.button.yes }).click();
		await page.waitForSelector(locator.class.toast);
		await expect(page.locator(locator.class.toast).filter({ hasText: 'regression uninstalled' })).toBeVisible();
		await page.getByRole('link', { name: locator.link.privateApp }).click();
		await page.getByPlaceholder(locator.placeholder.searchPrivateApp).fill(locator.text.regression);
		await expect(
			page.getByRole('link', {
				name: locator.text.regression,
			}),
		).not.toBeVisible();
	});
	/**
	 * for case
	 * @jira AECO-260
	 */
	test('Enable and Disable a Private App - Outside Menu @critical', async ({ page }) => {
		await installPrivateApp(page, fixtures.pathregression);

		// Disable
		await searchAppPrivate(page, locator.text.regression);
		await page
			.getByRole('link', { name: `${locator.text.regression}` })
			.getByTestId(locator.testId.menuSingleApp)
			.click();

		await page.locator(locator.button.menu).locator(locator.button.disable).click();
		await page.getByRole('button', { name: locator.button.yes }).click();
		await expect(page.locator(locator.class.toast).filter({ hasText: 'regression disabled' })).toBeVisible();
		await searchAppPrivate(page, locator.text.regression);
		expect(await page.getByRole('link', { name: locator.link.regressionDisabled }).isVisible());

		// Enable
		await searchAppPrivate(page, locator.text.regression);
		await page
			.getByRole('link', { name: `${locator.text.regression}` })
			.getByTestId(locator.testId.menuSingleApp)
			.click();
		await page.locator(locator.button.menu).locator(locator.button.enable).click();
		await expect(page.locator(locator.class.toast).filter({ hasText: 'regression enabled' })).toBeVisible();
		await searchAppPrivate(page, locator.text.regression);
		expect(await page.getByRole('link', { name: locator.link.regressionEnabled }).isVisible());
	});
	/**
	 * for case
	 * @jira AECO-260
	 */
	test('Enable and Disable a Private App - Inside Menu @critical', async ({ page }) => {
		await installPrivateApp(page, fixtures.pathregression);

		// Disable
		await searchAppPrivate(page, locator.text.regression);
		await page
			.getByRole('link', { name: `${locator.text.regression}` })
			.getByTestId(locator.testId.menuSingleApp)
			.click();

		await page.locator(locator.button.menu).locator(locator.button.disable).click();
		await page.getByRole('button', { name: locator.button.yes }).click();
		await expect(page.locator(locator.class.toast).filter({ hasText: 'regression disabled' })).toBeVisible();
		await searchAppPrivate(page, locator.text.regression);
		expect(await page.getByRole('link', { name: locator.link.regressionDisabled }).isVisible());

		// Enable
		await searchAppPrivate(page, locator.text.regression);
		await page
			.getByRole('link', { name: `${locator.text.regression}` })
			.getByTestId(locator.testId.menuSingleApp)
			.click();
		await page.locator(locator.button.menu).locator(locator.button.enable).click();
		await expect(page.locator(locator.class.toast).filter({ hasText: 'regression enabled' })).toBeVisible();
		await searchAppPrivate(page, locator.text.regression);
		expect(await page.getByRole('link', { name: locator.link.regressionEnabled }).isVisible());
	});

	test('Inside menu Private App', async ({ page }) => {
		await installPrivateApp(page, fixtures.pathregression);
		await expect(page.getByRole('tab', { name: 'Details' })).toBeVisible();
		await expect(page.getByRole('tab', { name: 'Security' })).toBeVisible();
		await expect(page.getByRole('tab', { name: 'Settings' })).toBeVisible();
		await expect(page.getByRole('tab', { name: 'Logs' })).toBeVisible();
	});
});
