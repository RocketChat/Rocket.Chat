import { APIRequestContext, Page } from '@playwright/test';
import home from '../../locators/home.json';
import locator from '../../locators/marketplace.json';
import { fileUpload } from '../helpers';
export async function searchAppInstalled(page: Page, appName: String) {
  await page.getByRole('link', { name: locator.link.appInstalled }).click();
  await page
    .getByPlaceholder(locator.placeholder.searchInstalledApp)
    .fill(`${appName}`);
  await page.waitForLoadState('load');
  await page.waitForLoadState('networkidle');
  if (
    await page
      .getByRole('link')
      .filter({ hasText: `${appName}` })
      .isVisible()
  ) {
    return true;
  } else return false;
}

export async function searchAppPrivate(page: Page, appName: any) {
  await page.getByRole('link', { name: locator.link.privateApp }).click();
  await page
    .getByPlaceholder(locator.placeholder.searchPrivateApp)
    .fill(`${appName}`);
    await page.waitForLoadState('load');
    await page.waitForLoadState('networkidle');
  if (
    await page
      .getByRole('link')
      .filter({ hasText: `${appName}` })
      .isVisible()
  ) {
    return true;
  } else return false;
}

export async function unistallAppAPI(request: APIRequestContext, app: string) {
  await request.delete(`/api/apps/${app}`, {
    headers: {
      'X-Auth-Token': `${process.env.API_TOKEN}`,
      'X-User-Id': `${process.env.USERID}`,
    },
  });
}
export async function unistallApp(page: Page, appName: String) {
  let appisntalledPrivate = await searchAppPrivate(page, appName);
  if (appisntalledPrivate) {
    await page.getByTestId(locator.testId.menuSingleApp).click();
    await page.getByText(locator.text.unistall).click();
    await page.getByRole('button', { name: locator.button.yes }).click();
    await page.waitForEvent('response');
  }
  let appinstalled = await searchAppInstalled(page, appName);
  if (appinstalled) {
    await page.getByTestId(locator.testId.menuSingleApp).click();
    await page.getByText(locator.text.unistall).click();
    await page.getByRole('button', { name: locator.button.yes }).click();
    await page.waitForEvent('response');

  }
}
export async function installPrivateApp(
  page: Page,
  appPath: string
) {
  await page.getByRole('link', { name: locator.link.privateApp }).click();
  await page
    .getByRole('button', { name: locator.button.uploadPrivateApp })
    .click();
  await fileUpload(locator.button.browseFiles, appPath, page);
  await page.getByRole('button', { name: locator.button.install }).click();
  const responsePromise = page.waitForResponse(response => response.url() === `${process.env.URL}/api/apps` && response.status() === 200);
  await page.getByRole('button', { name: locator.button.agree }).click();
  let response = await responsePromise;

}

export async function goToMarketplace(page: Page) {
  await page.getByRole('button', { name: home.button.administration }).click();
  await page
    .getByTestId(home.dropdown.createNew)
    .getByText(home.text.marketplace)
    .click();
}
