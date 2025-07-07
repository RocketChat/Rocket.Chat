import type { Page } from '@playwright/test';

export default async function waitForMediaResponse(page: Page) {
	let responsePromise;
	try {
		responsePromise = page.waitForResponse(
			(response) => /api\/v1\/rooms.media/.test(response.url()) && response.request().method() === 'POST',
		);
	} catch (error) {
		console.error(error);
	}

	return responsePromise;
}
