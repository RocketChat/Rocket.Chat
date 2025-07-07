import type { Page, Response } from '@playwright/test';

const isMediaResponse = (response: Response) => /api\/v1\/rooms.media/.test(response.url()) && response.request().method() === 'POST';

export default async function waitForMediaResponse(page: Page) {
	let responsePromise;
	try {
		responsePromise = page.waitForResponse((response) => isMediaResponse(response));
	} catch (error) {
		console.error(error);
	}

	return responsePromise;
}
