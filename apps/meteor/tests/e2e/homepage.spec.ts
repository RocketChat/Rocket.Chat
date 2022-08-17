import type { Page } from '@playwright/test';

import { expect, test } from './utils/test';

const CardIds = {
	Users: 'homepage-add-users-card',
	Chan: 'homepage-create-channels-card',
	Rooms: 'homepage-join-rooms-card',
	Mobile: 'homepage-mobile-apps-card',
	Desktop: 'homepage-desktop-apps-card',
	Docs: 'homepage-documentation-card',
};

test.describe('Homepage', () => {
	test.describe('Admin visualization', () => {
		test.use({ storageState: 'admin-session.json' });
		test.beforeEach(async ({ page }) => {
			await page.goto('/home');
		});

		test('expect show customize button if permission granted', async ({ page }) => {
			expect(page.locator('[data-qa-id="home-header-customize-button"]')).toBeVisible();
		});
		test('expect show Cards all the cards for admins', async ({ page }) => {
			Object.values(CardIds).forEach((id) => {
				expect(page.locator(`[data-qa-id="${id}"]`)).toBeVisible();
			});
		});
	});

	test.describe('Regular visualization', () => {
		test.use({ storageState: 'user2-session.json' });
		test.beforeEach(async ({ page }) => {
			await page.goto('/home');
		});

		test('expect to not be able to customize ', async ({ page }) => {
			expect(page.locator('[data-qa-id="home-header-customize-button"]')).not.toBeVisible();
		});

		test('expect to not be able to add users', async ({ page }) => {
			expect(page.locator(`[data-qa-id=homepage-add-users-card]`)).toBeVisible();
		});

		Object.values(CardIds)
			.filter((id) => id !== CardIds.Users)
			.forEach((id) => {
				test(`expect to not be able to see ${id} card`, async ({ page }) => {
					expect(page.locator(`[data-qa-id="${id}"]`)).toBeVisible();
				});
			});

		test('expect header text to have title', async ({ page }) => {
			expect(page.locator('[data-qa-type="PageHeader-title"]')).toBeVisible();
		});

		test('expect header text to have welcome text', async ({ page }) => {
			expect(page.locator('[data-qa-id="homepage-welcome-text"]')).toBeVisible();
		});
	});

	test.describe('Default Values', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/home');
			await page.waitForSelector('data-qa="page-home"');
		});

		test('expect welcome text to be Rocket.Chat', async ({ page }) => {
			expect(page.locator('[data-qa-id="homepage-welcome-text"]')).toContainText('Rocket.Chat');
		});

		test('expect header text to be Home', async ({ page }) => {
			expect(page.locator('[data-qa-type="PageHeader-title"]')).toContainText('Home');
		});
	});

	test.describe('Customization', () => {
		let regularUserPage: Page;
		test.beforeAll(async ({ api }) => {
			expect((await api.post('/settings/Site_Name', { value: 'NewSiteName' })).status()).toBe(200);
			expect((await api.post('/settings/Layout_Home_Title', { value: 'NewTitle' })).status()).toBe(200);
		});

		test.beforeAll(async ({ browser }) => {
			regularUserPage = await browser.newPage({ storageState: 'user2-session.json' });
			await regularUserPage.goto('/home');
			await regularUserPage.waitForSelector('[data-qa-id="home-header"]');
		});

		test('expect welcome text to use Site Name setting', async () => {
			expect(regularUserPage.locator('[data-qa-id="homepage-welcome-text"]')).toContainText('NewSiteName');
		});

		test('expect header text to use Layout Home Title setting', async () => {
			expect(regularUserPage.locator('[data-qa-type="PageHeader-title"]')).toContainText('NewTitle');
		});
	});

	test.describe('Custom Body', () => {
		let regularUserPage: Page;
		test.beforeAll(async ({ api }) => {
			expect((await api.post('/settings/Layout_Custom_Body', { value: true })).status()).toBe(200);
			expect((await api.post('/settings/Layout_Home_Body', { value: '<span data-qa-id="custom-body-span">Hello</span>' })).status()).toBe(
				200,
			);
		});

		test.beforeAll(async ({ browser }) => {
			regularUserPage = await browser.newPage({ storageState: 'user2-session.json' });
			await regularUserPage.goto('/home');
			await regularUserPage.waitForSelector('[data-qa-id="home-header"]');
		});

		test('expect switch to custom homepage and display custom text', async () => {
			expect(regularUserPage.locator('[data-qa-id="custom-body-span"]')).toContainText('Hello');
		});
	});
});
