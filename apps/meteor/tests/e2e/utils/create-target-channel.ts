import { Browser } from '@playwright/test';
import faker from '@faker-js/faker';

import { HomeChannel } from '../page-objects/home-channel';

/**
 * createTargetChannel:
 *  - Usefull to create a target channel for message related tests
 */
export async function createTargetChannel(browser: Browser): Promise<string> {
	const page = await browser.newPage({ storageState: 'session-admin.json' });
	const name = faker.datatype.uuid();

	await page.goto('/home');
	await new HomeChannel(page).sidenav.createPublicChannel(name);
	await page.close();

	return name;
}
