import { expect, test } from '@playwright/test';
import fixtures from '../../../fixtures/marketplace.json';
import locator from '../../../locators/marketplace.json';
import { delay, fileUpload } from '../../../support/helpers';
import {
  goToMarketplace,
  installPrivateApp,
  searchAppPrivate,
  unistallApp,
} from '../../../support/marketplace/marketplace';
import { login } from '../../../support/users/user';
test.describe('Private Apps', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToMarketplace(page);
  });

  test('Upload two Private App', async ({ page }) => {
    await unistallApp(page, locator.text.dataLoss);
    await unistallApp(page, locator.text.facebook);
    await page.getByRole('link', { name: locator.link.privateApp }).click();
    await page
      .getByRole('button', { name: locator.button.uploadPrivateApp })
      .click();
    await fileUpload(locator.button.browseFiles, fixtures.pathDataloss, page);
    await page.getByRole('button', { name: locator.button.install }).click();
    await page.getByRole('button', { name: locator.button.agree }).click();

    await page.getByRole('link', { name: locator.link.privateApp }).click();
    await page
      .getByRole('button', { name: locator.button.uploadPrivateApp })
      .click();
    await fileUpload(locator.button.browseFiles, fixtures.pathFacebook, page);
    await page.getByRole('button', { name: locator.button.install }).click();
    await page.getByRole('button', { name: locator.button.agree }).click();
    await delay(3000);
    await searchAppPrivate(page, locator.text.dataLoss);
    expect(
      await page
        .getByRole('link', { name: locator.link.dataLossEnabled })
        .isVisible()
    );
    await searchAppPrivate(page, locator.text.facebook);
    expect(
      await page
        .getByRole('link', { name: locator.link.facebookEnabled })
        .isVisible()
    );
  });

  test('Uninstall a Private App - Outside Menu', async ({ page }) => {
    await installPrivateApp(page, locator.text.dataLoss, fixtures.pathDataloss);
    await searchAppPrivate(page, locator.text.dataLoss);
    await page.getByTestId(locator.testId.menuSingleApp).click();
    await page.getByText(locator.text.unistall).click();
    await page.getByRole('button', { name: locator.button.yes }).click();
    await expect(
      page
        .locator(locator.class.toast)
        .filter({ hasText: 'Data Loss Prevention uninstalled' })
    ).toBeVisible();
    await searchAppPrivate(page, locator.text.dataLoss);
    await expect(
      page.getByRole('link').filter({ hasText: locator.text.dataLoss })
    ).not.toBeVisible();
  });

  test('Uninstall Private App - Inside Menu', async ({ page }) => {
    await installPrivateApp(page, locator.text.facebook, fixtures.pathFacebook);
    await searchAppPrivate(page, locator.text.facebook);
    await page
      .getByRole('link')
      .filter({ hasText: locator.text.facebook })
      .click();
    await page.getByTestId(locator.testId.menuSingleApp).click();
    await page.getByText(locator.text.unistall).click();
    await page.getByRole('button', { name: locator.button.yes }).click();
    page.waitForSelector(locator.class.toast);
    await expect(
      page
        .locator(locator.class.toast)
        .filter({ hasText: 'Facebook Messenger uninstalled' })
    ).toBeVisible();
    await searchAppPrivate(page, locator.text.facebook);
    await expect(
      page.getByRole('link').filter({ hasText: locator.text.facebook })
    ).not.toBeVisible();
  });

  test('Enable and Disable two Private App - Outside Menu', async ({
    page,
  }) => {
    await installPrivateApp(page, locator.text.facebook, fixtures.pathFacebook);
    await installPrivateApp(page, locator.text.dataLoss, fixtures.pathDataloss);

    //Disable - Facebook
    await searchAppPrivate(page, locator.text.facebook);
    await page.getByTestId(locator.testId.menuSingleApp).click();
    await page.getByText(locator.text.disable).click();
    await page.getByRole('button', { name: locator.button.yes }).click();
    await expect(
      page
        .locator(locator.class.toast)
        .filter({ hasText: 'Facebook Messenger disabled' })
    ).toBeVisible();
    await searchAppPrivate(page, locator.text.facebook);
    expect(
      await page
        .getByRole('link', { name: locator.link.facebookDisabled })
        .isVisible()
    );

    //Disable - Data Loss
    await searchAppPrivate(page, locator.text.dataLoss);
    await page.getByTestId(locator.testId.menuSingleApp).click();
    await page.getByText(locator.text.disable).click();
    await page.getByRole('button', { name: locator.button.yes }).click();
    await expect(
      page
        .locator(locator.class.toast)
        .filter({ hasText: 'Data Loss Prevention disabled' })
    ).toBeVisible();
    await searchAppPrivate(page, locator.text.dataLoss);
    expect(
      await page
        .getByRole('link', { name: locator.link.dataLossDisabled })
        .isVisible()
    );

    //Enable - Facebook
    await searchAppPrivate(page, locator.text.facebook);
    await page.getByTestId(locator.testId.menuSingleApp).click();
    await page.getByText(locator.text.enable).click();
    await expect(
      page
        .locator(locator.class.toast)
        .filter({ hasText: 'Facebook Messenger enabled' })
    ).toBeVisible();
    await searchAppPrivate(page, locator.text.facebook);
    expect(
      await page
        .getByRole('link', { name: locator.link.facebookEnabled })
        .isVisible()
    );

    //Enable - Data Loss
    await searchAppPrivate(page, locator.text.dataLoss);
    await page.getByTestId(locator.testId.menuSingleApp).click();
    await page.getByText(locator.text.enable).click();
    await expect(
      page
        .locator(locator.class.toast)
        .filter({ hasText: 'Data Loss Prevention enabled' })
    ).toBeVisible();
    await searchAppPrivate(page, locator.text.dataLoss);
    expect(
      await page
        .getByRole('link', { name: locator.link.dataLossEnabled })
        .isVisible()
    );
  });

  test('Enable and Disable two Private App - Inside Menu', async ({ page }) => {
    await installPrivateApp(page, locator.text.facebook, fixtures.pathFacebook);
    await installPrivateApp(page, locator.text.dataLoss, fixtures.pathDataloss);

    //Disable - Facebook
    await searchAppPrivate(page, locator.text.facebook);
    await page
      .getByRole('link')
      .filter({ hasText: locator.text.facebook })
      .click();
    await page.getByTestId(locator.testId.menuSingleApp).click();
    await page.getByText(locator.text.disable).click();
    await page.getByRole('button', { name: locator.button.yes }).click();
    await expect(
      page
        .locator(locator.class.toast)
        .filter({ hasText: 'Facebook Messenger disabled' })
    ).toBeVisible();
    await searchAppPrivate(page, locator.text.facebook);
    expect(
      await page
        .getByRole('link', { name: locator.link.facebookDisabled })
        .isVisible()
    );

    //Disable - Data Loss
    await searchAppPrivate(page, locator.text.dataLoss);
    await page
      .getByRole('link')
      .filter({ hasText: locator.text.dataLoss })
      .click();
    await page.getByTestId(locator.testId.menuSingleApp).click();
    await page.getByText(locator.text.disable).click();
    await page.getByRole('button', { name: locator.button.yes }).click();
    await expect(
      page
        .locator(locator.class.toast)
        .filter({ hasText: 'Data Loss Prevention disabled' })
    ).toBeVisible();
    await searchAppPrivate(page, locator.text.dataLoss);
    expect(
      await page
        .getByRole('link', { name: locator.link.dataLossDisabled })
        .isVisible()
    );

    //Enable - Facebook
    await searchAppPrivate(page, locator.text.facebook);
    await page
      .getByRole('link')
      .filter({ hasText: locator.text.facebook })
      .click();
    await page.getByTestId(locator.testId.menuSingleApp).click();
    await page.getByText(locator.text.enable).click();
    await expect(
      page
        .locator(locator.class.toast)
        .filter({ hasText: 'Facebook Messenger enabled' })
    ).toBeVisible();
    await searchAppPrivate(page, locator.text.facebook);
    expect(
      await page
        .getByRole('link', { name: locator.link.facebookEnabled })
        .isVisible()
    );

    //Enable - Data Loss
    await searchAppPrivate(page, locator.text.dataLoss);
    await page
      .getByRole('link')
      .filter({ hasText: locator.text.dataLoss })
      .click();
    await page.getByTestId(locator.testId.menuSingleApp).click();
    await page.getByText(locator.text.enable).click();
    page.waitForSelector(locator.class.toast);
    await expect(
      page
        .locator(locator.class.toast)
        .filter({ hasText: 'Data Loss Prevention enabled' })
    ).toBeVisible();
    await searchAppPrivate(page, locator.text.dataLoss);
    expect(
      await page
        .getByRole('link', { name: locator.link.dataLossEnabled })
        .isVisible()
    );
  });

  test('Inside menu Private App @unstable', async ({ page }) => {
    await installPrivateApp(page, locator.text.dataLoss, fixtures.pathDataloss);
    await expect(page.getByRole('tab', { name: 'Details' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Security' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Logs' })).toBeVisible();
  });
});
