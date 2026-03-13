import type { Page, Response } from '@playwright/test';

const isMediaResponse = (response: Response) =>
	/api\/v1\/rooms\.media(?:\/|\?|$)/.test(response.url()) && response.request().method() === 'POST';

export const createMediaResponsePromise = (page: Page) => {
	return page.waitForResponse((response) => isMediaResponse(response));
};
