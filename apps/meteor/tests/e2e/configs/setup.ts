import { chromium } from '@playwright/test';

import { pageAuth } from '..';
import * as constants from '../utils/constants';

export default async (): Promise<void> => {
	const browser = await chromium.launch();
	const page = await browser.newPage();

	const pageAuth = new PageAuth(page);
	await pageAuth.doLogin(constants.ADMIN_CREDENTIALS, false);

	await page.locator('[name="organizationName"]').type('');
	await page.locator('[name="organizationType"]').click();
	await page.locator('.rcx-options .rcx-option:first-child').click();
	await page.locator('[name="organizationIndustry"]').click();
	await page.locator('.rcx-options .rcx-option:first-child').click();
	await page.locator('[name="organizationSize"]').click();
	await page.locator('.rcx-options .rcx-option:first-child').click();
	await page.locator('[name="country"]').click();
	await page.locator('.rcx-options .rcx-option:first-child').click();
	await page.locator('.rcx-button--primary .rcx-button >> text="Next"').click();

	await page.locator('a.rcx-box.rcx-box--full >> text="Continue as standalone"').click();

	await page.locator('rcx-button--primary rcx-button >> text="Confirm"').click();

	await browser.close();
};
