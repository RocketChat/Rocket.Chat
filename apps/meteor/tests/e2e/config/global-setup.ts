/* eslint no-await-in-loop: 0 */

import { chromium, expect } from '@playwright/test';

import injectInitialData from '../fixtures/inject-initial-data';
import insertApp from '../fixtures/insert-apps';
import * as constants from './constants';

const loginProcedure = async (credentials: { name: string; username: string; password: string }) => {
	const browser = await chromium.launch();
	const page = await browser.newPage();

	await page.goto(constants.BASE_URL);

	await page.locator('[name=username]').type(credentials.username);
	await page.locator('[name=password]').type(credentials.password);
	await page.locator('role=button >> text="Login"').click();
	
	await expect(await page.locator('role=button >> text="Login"')).toHaveCount(0);

	await page.context().storageState({ path: `${credentials.name}-session.json` });

	await browser.close();
};

export default async function (): Promise<void> {
	const browser = await chromium.launch();
	const page = await browser.newPage();

	await page.goto(constants.BASE_URL);

	await loginProcedure({
		name: 'admin',
		username: constants.ADMIN_CREDENTIALS.email,
		password: constants.ADMIN_CREDENTIALS.password,
	});

	const { usersFixtures } = await injectInitialData();

	for (const user of usersFixtures) {
		await loginProcedure({
			username: user.username,
			password: 'any_password',
			name: user.username,
		});
	}

	await insertApp();
}
