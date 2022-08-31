import type { Page } from '@playwright/test';

import { IS_EE } from './config/constants';
import { expect, test } from './utils/test';

const CardIds = {
	Users: 'homepage-add-users-card',
	Chan: 'homepage-create-channels-card',
	Rooms: 'homepage-join-rooms-card',
	Mobile: 'homepage-mobile-apps-card',
	Desktop: 'homepage-desktop-apps-card',
	Docs: 'homepage-documentation-card',
};
test.use({ storageState: 'admin-session.json' });

test.describe.serial('homepage', () => {
	let regularUserPage: Page;
	let adminPage: Page;

	test.describe('layout for admins', () => {
		test.beforeAll(async ({ browser }) => {
			adminPage = await browser.newPage({ storageState: 'admin-session.json' });
			await adminPage.goto('/home');
			await adminPage.waitForSelector('[data-qa-id="home-header"]');
		});
		test('expect show customize button', async () => {
			await expect(adminPage.locator('[data-qa-id="home-header-customize-button"]')).toBeVisible();
		});

		test.describe('cards', () => {
			for (const id of Object.values(CardIds)) {
				// eslint-disable-next-line no-loop-func
				test(`expect ${id} card to be visible`, async () => {
					await expect(adminPage.locator(`[data-qa-id="${id}"]`)).toBeVisible();
				});
			}
		});

		test.afterAll(async () => {
			await adminPage.close();
		});
	});

	test.describe('layout for regular users', () => {
		test.beforeAll(async ({ browser }) => {
			regularUserPage = await browser.newPage({ storageState: 'user2-session.json' });
			await regularUserPage.goto('/home');
			await regularUserPage.waitForSelector('[data-qa-id="home-header"]');
		});

		test('expect to not show customize button', async () => {
			await expect(regularUserPage.locator('[data-qa-id="home-header-customize-button"]')).not.toBeVisible();
		});

		test.describe('cards', () => {
			for (const id of Object.values(CardIds)) {
				if (id === CardIds.Users) {
					// eslint-disable-next-line no-loop-func
					test(`expect ${id} card to not be visible`, async () => {
						await expect(regularUserPage.locator(`[data-qa-id="${id}"]`)).not.toBeVisible();
					});
				} else {
					// eslint-disable-next-line no-loop-func
					test(`expect ${id} card to be visible`, async () => {
						await expect(regularUserPage.locator(`[data-qa-id="${id}"]`)).toBeVisible();
					});
				}
			}
		});

		test.describe('default values', () => {
			test('expect welcome text to use Site_Name default setting', async () => {
				await expect(regularUserPage.locator('[data-qa-id="homepage-welcome-text"]')).toContainText('Rocket.Chat');
			});

			test('expect header text to use Layout_Home_Title default setting', async () => {
				await expect(regularUserPage.locator('[data-qa-type="PageHeader-title"]')).toContainText('Home');
			});
		});

		test.describe('custom values', () => {
			test.beforeAll(async ({ api }) => {
				expect((await api.post('/settings/Site_Name', { value: 'NewSiteName' })).status()).toBe(200);
				expect((await api.post('/settings/Layout_Home_Title', { value: 'NewTitle' })).status()).toBe(200);
			});

			test.beforeAll(async ({ browser }) => {
				regularUserPage = await browser.newPage({ storageState: 'user2-session.json' });
				await regularUserPage.goto('/home');
				await regularUserPage.waitForSelector('[data-qa-id="home-header"]');
			});

			test('expect welcome text to be NewSiteName', async () => {
				await expect(regularUserPage.locator('[data-qa-id="homepage-welcome-text"]')).toContainText('NewSiteName');
			});

			test('expect header text to be Layout_Home_Title setting', async () => {
				await expect(regularUserPage.locator('[data-qa-type="PageHeader-title"]')).toContainText('NewTitle');
			});

			test.afterAll(async ({ api }) => {
				expect((await api.post('/settings/Site_Name', { value: 'Rocket.Chat' })).status()).toBe(200);
				expect((await api.post('/settings/Layout_Home_Title', { value: 'Home' })).status()).toBe(200);
			});
		});

		test.describe('custom body', () => {
			test.beforeAll(async ({ api }) => {
				expect((await api.post('/settings/Layout_Home_Body', { value: '<span data-qa-id="custom-body-span">Hello</span>' })).status()).toBe(
					200,
				);
			});

			test.beforeAll(async ({ browser }) => {
				regularUserPage = await browser.newPage({ storageState: 'user2-session.json' });
				await regularUserPage.goto('/home');
				await regularUserPage.waitForSelector('[data-qa-id="home-header"]');
			});

			test('expect custom body to be visible', async () => {
				await expect(regularUserPage.locator('[data-qa-id="custom-body-span"]')).toContainText('Hello');
			});

			test.describe('enterprise edition', () => {
				test.skip(!IS_EE, 'Enterprise Only');

				test.beforeAll(async ({ api }) => {
					expect((await api.post('/settings/Layout_Custom_Body_Only', { value: true })).status()).toBe(200);
				});

				test('expect default layout to not be visible', async () => {
					await expect(regularUserPage.locator('[data-qa-id="homepage-welcome-text"]')).not.toBeVisible();
				});

				test.afterAll(async ({ api }) => {
					expect((await api.post('/settings/Layout_Custom_Body_Only', { value: false })).status()).toBe(200);
				});
			});

			test.afterAll(async ({ api }) => {
				expect((await api.post('/settings/Layout_Home_Body', { value: '' })).status()).toBe(200);
			});
		});
	});
});
