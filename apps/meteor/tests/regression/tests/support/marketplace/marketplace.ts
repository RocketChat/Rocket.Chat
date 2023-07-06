import { APIRequestContext, Page } from '@playwright/test';
import home from '../../locators/home.json';
import locator from '../../locators/marketplace.json';
import { fileUpload } from '../helpers';
export async function searchAppInstalled(page: Page, appName: String) {
	await page.getByRole('link', { name: locator.link.appInstalled }).click();
	await page.getByPlaceholder(locator.placeholder.searchInstalledApp).fill(`${appName}`);
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
	await page.getByPlaceholder(locator.placeholder.searchPrivateApp).fill(`${appName}`);
	const app = page.getByRole('link', { name: `${appName}` });
	await app.waitFor();
}

export async function unistallAppAPI(request: APIRequestContext, app: string) {
	await request.delete(`/api/apps/${app}`, {
		headers: {
			'X-Auth-Token': `${process.env.API_TOKEN}`,
			'X-User-Id': `${process.env.USERID}`,
		},
	});
}

export async function installPrivateApp(page: Page, appPath: string) {
	await page.getByRole('link', { name: locator.link.privateApp }).click();
	await page.getByRole('button', { name: locator.button.uploadPrivateApp }).click();
	await fileUpload(locator.button.browseFiles, appPath, page);
	await page.getByRole('button', { name: locator.button.install }).click();
	const responsePromise = page.waitForResponse((response) => response.url() === `${process.env.URL}/api/apps` && response.status() === 200);
	await page.getByRole('button', { name: locator.button.agree }).click();
	let response = await responsePromise;
}

export async function goToMarketplace(page: Page) {
	await page.getByRole('button', { name: home.button.administration }).click();
	await page.getByTestId(home.dropdown.createNew).getByText(home.text.marketplace).click();
}
