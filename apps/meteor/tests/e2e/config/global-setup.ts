/* eslint no-await-in-loop: 0 */

import { chromium } from '@playwright/test';

import * as constants from './constants';
import injectInitialData from '../fixtures/inject-initial-data';
import insertApp from '../fixtures/insert-apps';

const loginProcedure = async (credentials: { username: string; password: string }) => {
	const browser = await chromium.launch();
	const page = await browser.newPage();

	await page.goto(constants.BASE_URL);

	await page.locator('[name=username]').type(credentials.username);
	await page.locator('[name=password]').type(credentials.password);
	await page.locator('role=button >> text="Login"').click();

	await page.waitForSelector('[data-qa-id="home-header"]');
	await page.context().storageState({ path: `${credentials.username}-session.json` });

	await browser.close();
};

export default async function (): Promise<void> {
	const browser = await chromium.launch();
	const page = await browser.newPage();

	await page.goto(constants.BASE_URL);

	await page.locator('[name=username]').type(constants.ADMIN_CREDENTIALS.email);
	await page.locator('[name=password]').type(constants.ADMIN_CREDENTIALS.password);
	await page.locator('role=button >> text="Login"').click();

	await page.waitForTimeout(1000);

	await page.context().storageState({ path: `admin-session.json` });

	await browser.close();

	const { usersFixtures } = await injectInitialData();

	for (const user of usersFixtures) {
		await loginProcedure({
			username: user.username,
			password: 'any_password',
		});
	}

	await insertApp();
}
