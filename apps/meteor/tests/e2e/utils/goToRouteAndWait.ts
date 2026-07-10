import type { Locator, Page } from '@playwright/test';

// Use only for routes with one clear ready state.
// Do not use for routes that can validly render alternate outcomes.
export async function goToRouteAndWait(page: Page, path: string, readyLocator: Locator): Promise<void> {
	await page.goto(path);
	await readyLocator.waitFor({ state: 'visible' });
}
