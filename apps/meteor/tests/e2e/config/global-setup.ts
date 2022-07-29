import { chromium } from '@playwright/test';

import * as constants from './constants';
import injectInitialData from '../fixtures/inject-initial-data';

export default async function (): Promise<void> {
	await injectInitialData();

	/** ------------------------------------------------------------------------------------/
	 *  Create "admin" session
	 -------------------------------------------------------------------------------------*/
	const browser1 = await chromium.launch();
	const page1 = await browser1.newPage();

	await page1.goto(constants.BASE_URL);

	await page1.locator('[name=emailOrUsername]').type(constants.ADMIN_CREDENTIALS.email);
	await page1.locator('[name=pass]').type(constants.ADMIN_CREDENTIALS.password);
	await page1.locator('.login').click();

	await page1.waitForTimeout(1000);

	if (page1.url().includes('setup-wizard')) {
		await page1.locator('[name="organizationName"]').type('any_name');
		await page1.locator('[name="organizationType"]').click();
		await page1.locator('.rcx-options .rcx-option:first-child >> text="Community"').click();
		await page1.locator('[name="organizationIndustry"]').click();
		await page1.locator('.rcx-options .rcx-option:first-child >> text="Aerospace & Defense"').click();
		await page1.locator('[name="organizationSize"]').click();
		await page1.locator('.rcx-options .rcx-option:first-child >> text="1-10 people"').click();
		await page1.locator('[name="country"]').click();
		await page1.locator('.rcx-options .rcx-option:first-child >> text="Afghanistan"').click();
		await page1.locator('.rcx-button--primary.rcx-button >> text="Next"').click();
		await page1.locator('a.rcx-box.rcx-box--full >> text="Continue as standalone"').click();
		await page1.locator('.rcx-button--primary.rcx-button >> text="Confirm"').click();
	}

	await page1.waitForSelector('text="Welcome to Rocket.Chat!"');
	await page1.context().storageState({ path: 'admin-session.json' });
	await browser1.close();

	/** ------------------------------------------------------------------------------------/
	 *  Create "user1" session
	 -------------------------------------------------------------------------------------*/
	const browser2 = await chromium.launch();
	const page2 = await browser2.newPage();

	await page2.goto(constants.BASE_URL);

	await page2.locator('[name=emailOrUsername]').type('user1');
	await page2.locator('[name=pass]').type('any_password');
	await page2.locator('.login').click();

	await page2.waitForSelector('text="Welcome to Rocket.Chat!"');
	await page2.context().storageState({ path: 'user1-session.json' });
	await browser2.close();

	/** ------------------------------------------------------------------------------------/
	 *  Create "user2" session
	 -------------------------------------------------------------------------------------*/
	const browser3 = await chromium.launch();
	const page3 = await browser3.newPage();

	await page3.goto(constants.BASE_URL);

	await page3.locator('[name=emailOrUsername]').type('user2');
	await page3.locator('[name=pass]').type('any_password');
	await page3.locator('.login').click();

	await page3.waitForSelector('text="Welcome to Rocket.Chat!"');
	await page3.context().storageState({ path: 'user2-session.json' });
	await browser3.close();
}
