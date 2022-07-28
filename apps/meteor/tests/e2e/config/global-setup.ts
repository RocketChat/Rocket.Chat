import { chromium } from '@playwright/test';

import * as constants from './constants'
import populateDatabase from '../fixtures/populate-database';

export default async function(): Promise<void> {
    await populateDatabase();

    const browser1 = await chromium.launch();
    const page1 = await browser1.newPage();

    await page1.goto(constants.BASE_URL);

    await page1.locator('[name=emailOrUsername]').type(constants.ADMIN_CREDENTIALS.email);
    await page1.locator('[name=pass]').type(constants.ADMIN_CREDENTIALS.password);
    await page1.locator('.login').click();

    await page1.waitForTimeout(1000);

    if(page1.url().includes('setup-wizard')) {
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

    await page1.context().storageState({ path: 'session-admin.json' });
    await browser1.close();
}