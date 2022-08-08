/* eslint no-await-in-loop: 0 */

import { chromium } from '@playwright/test';

import * as constants from './constants';
import injectInitialData from '../fixtures/inject-initial-data';

export default async function (): Promise<void> {
	const browser = await chromium.launch();
	const page = await browser.newPage();

	await page.goto(constants.BASE_URL);

	await page.locator('[name=emailOrUsername]').type(constants.ADMIN_CREDENTIALS.email);
	await page.locator('[name=pass]').type(constants.ADMIN_CREDENTIALS.password);
	await page.locator('.login').click();

	await page.waitForTimeout(1000);

	if (page.url().includes('setup-wizard')) {
		await page.locator('[name="organizationName"]').type('any_name');
		await page.locator('[name="organizationType"]').click();
		await page.locator('.rcx-options .rcx-option:first-child >> text="Community"').click();
		await page.locator('[name="organizationIndustry"]').click();
		await page.locator('.rcx-options .rcx-option:first-child >> text="Aerospace & Defense"').click();
		await page.locator('[name="organizationSize"]').click();
		await page.locator('.rcx-options .rcx-option:first-child >> text="1-10 people"').click();
		await page.locator('[name="country"]').click();
		await page.locator('.rcx-options .rcx-option:first-child >> text="Afghanistan"').click();
		await page.locator('.rcx-button--primary.rcx-button >> text="Next"').click();
		await page.locator('a.rcx-box.rcx-box--full >> text="Continue as standalone"').click();
		await page.locator('.rcx-button--primary.rcx-button >> text="Confirm"').click();
	}

	await page.waitForSelector('[data-qa-id="home-header"]');
	await page.context().storageState({ path: 'admin-session.json' });
	await browser.close();

	const { usersFixtures } = await injectInitialData();

	for (const user of usersFixtures) {
		const browser = await chromium.launch();
		const page = await browser.newPage();

		await page.goto(constants.BASE_URL);

		await page.locator('[name=emailOrUsername]').type(user.username);
		await page.locator('[name=pass]').type('any_password');
		await page.locator('.login').click();

		await page.waitForSelector('[data-qa-id="home-header"]');
		await page.context().storageState({ path: `${user.username}-session.json` });
		await browser.close();
	}
}
