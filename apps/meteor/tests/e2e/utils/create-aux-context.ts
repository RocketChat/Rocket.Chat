import type { Browser, Page } from '@playwright/test';

import { HomeChannel } from '../page-objects';

/**
 * createAuxContext:
 *  - Usefull to create a aux context for test will need many contexts
 */

export const createAuxContext = async (browser: Browser, storageState: string): Promise<{ page: Page; poHomeChannel: HomeChannel }> => {
	const page = await browser.newPage({ storageState });
	const poHomeChannel = new HomeChannel(page);
	await page.goto('/');
	return { page, poHomeChannel };
};
