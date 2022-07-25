import { chromium } from '@playwright/test';

import { ADMIN_CREDENTIALS, BASE_URL } from '../utils/constants';
import populateDatabase from '../utils/fixtures/populate-database';

export default async (): Promise<void> => {
	await populateDatabase.up();

	const browser = await chromium.launch();
	const page = await browser.newPage();

	await page.goto(BASE_URL);

	await page.locator('[name=emailOrUsername]').type(ADMIN_CREDENTIALS.email);
	await page.locator('[name=pass]').type(ADMIN_CREDENTIALS.password);
	await page.locator('.login').click();

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

	await page.waitForURL('http://localhost:3000/home');
	await browser.close();
};
