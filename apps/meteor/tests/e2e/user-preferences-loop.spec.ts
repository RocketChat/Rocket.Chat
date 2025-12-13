import type { BrowserContext, Page, Request } from '@playwright/test';
import type { useEndpoint } from '@rocket.chat/ui-contexts';

import { Users } from './fixtures/userStates';
import { setUserPreferences } from './utils';
import { test, expect } from './utils/test';

class RequestTracker {
	private _method: Parameters<typeof useEndpoint>[0];

	private _pathPattern: Parameters<typeof useEndpoint>[1];

	private _count: number;

	constructor(method: Parameters<typeof useEndpoint>[0], pathPattern: Parameters<typeof useEndpoint>[1]) {
		this._method = method;
		this._pathPattern = pathPattern;
		this._count = 0;
	}

	public track(page: Page): void {
		page.on('request', (request) => this.onRequest(request));
	}

	public get count(): number {
		return this._count;
	}

	private onRequest(request: Request): void {
		const url = new URL(request.url());
		if (request.method() === this._method && url.pathname.endsWith(this._pathPattern)) {
			this._count += 1;
		}
	}
}

test.describe('User preferences language propagation', () => {
	test.use({ storageState: Users.user1.state, locale: 'en' });

	test.beforeAll(async ({ api }) => {
		await setUserPreferences(api, { language: 'en' });
	});

	test.afterAll(async ({ api }) => {
		await setUserPreferences(api, { language: '' });
	});

	test('should keep calling users.setPreferences once a third tab opens', async ({ context }) => {
		const requestTracker = new RequestTracker('POST', '/v1/users.setPreferences');

		await test.step('load the first tab', async () => {
			const page = await navigateToHomePage(context, 'de');
			requestTracker.track(page);
			return page;
		});

		await test.step('load a second tab to ensure the baseline stays stable', async () => {
			const page = await navigateToHomePage(context, 'pt');
			requestTracker.track(page);
			return page;
		});

		await test.step('opening a third tab should trigger the cascading loop', async () => {
			const page = await navigateToHomePage(context, 'fr');
			requestTracker.track(page);
			return page;
		});

		await Promise.all(context.pages().map((page) => page.reload()));

		await test.step('assert no further calls were made', async () => {
			expect(requestTracker.count).toBe(0);
		});
	});
});

async function navigateToHomePage(context: BrowserContext, language: 'en' | 'de' | 'pt' | 'fr'): Promise<Page> {
	const page = await context.newPage();
	await page.goto('/home');
	await page.evaluate((language) => {
		localStorage.setItem('fuselage-localStorage-userLanguage', `"${language}"`);
		localStorage.setItem('fuselage-localStorage-preferedLanguage', `"${language}"`);
	}, language);
	await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
	return page;
}
