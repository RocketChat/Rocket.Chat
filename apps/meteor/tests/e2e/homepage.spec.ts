import type { Page } from '@playwright/test';

import { IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { expect, test } from './utils/test';

const CardIds = {
	Users: 'homepage-add-users-card',
	Chan: 'homepage-create-channels-card',
	Rooms: 'homepage-join-rooms-card',
	Mobile: 'homepage-mobile-apps-card',
	Desktop: 'homepage-desktop-apps-card',
	Docs: 'homepage-documentation-card',
	Custom: 'homepage-custom-card',
};
test.use({ storageState: Users.admin.state });

test.describe.serial('homepage', () => {
	let regularUserPage: Page;
	let adminPage: Page;

	test.describe('layout for admins', () => {
		test.beforeAll(async ({ browser }) => {
			adminPage = await browser.newPage({ storageState: Users.admin.state });
			await adminPage.goto('/home');
			await adminPage.waitForSelector('[data-qa-id="home-header"]');
		});
		test('expect show customize button', async () => {
			await expect(adminPage.locator('role=button[name="Customize"]')).toBeVisible();
		});

		test.describe('cards', () => {
			for (const id of Object.values(CardIds)) {
				// eslint-disable-next-line no-loop-func
				test(`expect ${id} card to be visible`, async () => {
					await expect(adminPage.locator(`[data-qa-id="${id}"]`)).toBeVisible();
				});
			}
		});

		test.describe('custom body with empty custom content', () => {
			test.beforeAll(async ({ api }) => {
				await expect((await api.post('/settings/Layout_Home_Body', { value: '' })).status()).toBe(200);
			});

			test('expect default value in custom body', async () => {
				await expect(
					adminPage.locator('role=status[name="Admins may insert content html to be rendered in this white space."]'),
				).toBeVisible();
			});

			test('expect both change visibility and show only custom content buttons to be disabled', async () => {
				await expect(adminPage.locator('role=button[name="Show to workspace"]')).toBeDisabled();
				await expect(adminPage.locator('role=button[name="Show only this content"]')).toBeDisabled();
			});

			test('expect visibility tag to show "not visible"', async () => {
				await expect(adminPage.locator('role=status[name="Not visible to workspace"]')).toBeVisible();
			});
		});

		test.describe('custom body with custom content', () => {
			test.beforeAll(async ({ api }) => {
				await expect((await api.post('/settings/Layout_Home_Body', { value: 'Hello admin' })).status()).toBe(200);
			});

			test('expect custom body to be visible', async () => {
				await expect(adminPage.locator('role=status[name="Hello admin"]')).toBeVisible();
			});

			test('expect correct state for card buttons', async () => {
				await expect(adminPage.locator('role=button[name="Show to workspace"]')).not.toBeDisabled();
				await expect(adminPage.locator('role=button[name="Show only this content"]')).toBeDisabled();
			});

			test.describe('enterprise edition', () => {
				test.skip(!IS_EE, 'Enterprise Only');

				test.describe('display custom content only', () => {
					test.beforeAll(async ({ api }) => {
						await expect((await api.post('/settings/Layout_Home_Body', { value: 'Hello admin' })).status()).toBe(200);
						await expect((await api.post('/settings/Layout_Home_Custom_Block_Visible', { value: true })).status()).toBe(200);
						await expect((await api.post('/settings/Layout_Custom_Body_Only', { value: true })).status()).toBe(200);
					});

					test('expect default layout to not be visible (show only custom content card)', async () => {
						await expect(adminPage.locator('role=heading[name="Welcome to Rocket.Chat"]')).not.toBeVisible();
					});

					test('expect correct state for card buttons', async () => {
						await expect(adminPage.locator('role=button[name="Hide on workspace"]')).toBeDisabled();
						await expect(adminPage.locator('role=button[name="Show default content"]')).not.toBeDisabled();
					});

					test('expect visibility tag to show "visible to workspace"', async () => {
						await expect(adminPage.locator('role=status[name="Visible to workspace"]')).toBeVisible();
					});
				});
			});
		});

		test.afterAll(async ({ api }) => {
			await expect((await api.post('/settings/Layout_Home_Custom_Block_Visible', { value: false })).status()).toBe(200);
			await expect((await api.post('/settings/Layout_Custom_Body_Only', { value: false })).status()).toBe(200);
			await adminPage.close();
		});
	});

	test.describe('layout for regular users', () => {
		test.beforeAll(async ({ api }) => {
			await expect((await api.post('/settings/Layout_Home_Body', { value: '' })).status()).toBe(200);
		});

		test.beforeAll(async ({ browser }) => {
			regularUserPage = await browser.newPage({ storageState: Users.user2.state });
			await regularUserPage.goto('/home');
			await regularUserPage.waitForSelector('[data-qa-id="home-header"]');
		});

		test('expect to not show customize button', async () => {
			await expect(regularUserPage.locator('role=button[name="Customize"]')).not.toBeVisible();
		});

		test.describe('cards', () => {
			for (const id of Object.values(CardIds)) {
				if (id === CardIds.Users || id === CardIds.Custom) {
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
				await expect(regularUserPage.locator('role=heading[name="Welcome to Rocket.Chat"]')).toBeVisible();
			});

			test('expect header text to use Layout_Home_Title default setting', async () => {
				await expect(regularUserPage.locator('[data-qa-type="PageHeader-title"]')).toContainText('Home');
			});
		});

		test.describe('custom values', () => {
			test.beforeAll(async ({ api }) => {
				await expect((await api.post('/settings/Site_Name', { value: 'NewSiteName' })).status()).toBe(200);
				await expect((await api.post('/settings/Layout_Home_Title', { value: 'NewTitle' })).status()).toBe(200);
			});

			test.beforeAll(async ({ browser }) => {
				regularUserPage = await browser.newPage({ storageState: Users.user2.state });
				await regularUserPage.goto('/home');
				await regularUserPage.waitForSelector('[data-qa-id="home-header"]');
			});

			test('expect welcome text to be NewSiteName', async () => {
				await expect(regularUserPage.locator('role=heading[name="Welcome to NewSiteName"]')).toBeVisible();
			});

			test('expect header text to be Layout_Home_Title setting', async () => {
				await expect(regularUserPage.locator('[data-qa-type="PageHeader-title"]')).toContainText('NewTitle');
			});

			test.afterAll(async ({ api }) => {
				await expect((await api.post('/settings/Site_Name', { value: 'Rocket.Chat' })).status()).toBe(200);
				await expect((await api.post('/settings/Layout_Home_Title', { value: 'Home' })).status()).toBe(200);
			});
		});

		test.describe('custom body with empty content', () => {
			test('expect to not show custom content card', async () => {
				await expect(regularUserPage.locator('role=status')).not.toBeVisible();
			});
		});

		test.describe('custom body with content', () => {
			test.beforeAll(async ({ api }) => {
				await expect((await api.post('/settings/Layout_Home_Body', { value: 'Hello' })).status()).toBe(200);
				await expect((await api.post('/settings/Layout_Home_Custom_Block_Visible', { value: true })).status()).toBe(200);
			});

			test.beforeAll(async ({ browser }) => {
				regularUserPage = await browser.newPage({ storageState: Users.user2.state });
				await regularUserPage.goto('/home');
				await regularUserPage.waitForSelector('[data-qa-id="home-header"]');
			});

			test('expect custom body to be visible', async () => {
				await expect(regularUserPage.locator('role=status[name="Hello"]')).toBeVisible();
			});

			test.describe('enterprise edition', () => {
				test.skip(!IS_EE, 'Enterprise Only');

				test.beforeAll(async ({ api }) => {
					await expect((await api.post('/settings/Layout_Custom_Body_Only', { value: true })).status()).toBe(200);
				});

				test('expect default layout to not be visible', async () => {
					await expect(regularUserPage.locator('[data-qa-id="homepage-welcome-text"]')).not.toBeVisible();
				});

				test('expect custom body to be visible', async () => {
					await expect(regularUserPage.locator('role=status[name="Hello"]')).toBeVisible();
				});

				test.afterAll(async ({ api }) => {
					await expect((await api.post('/settings/Layout_Custom_Body_Only', { value: false })).status()).toBe(200);
				});
			});

			test.afterAll(async ({ api }) => {
				await expect((await api.post('/settings/Layout_Home_Body', { value: '' })).status()).toBe(200);
				await expect((await api.post('/settings/Layout_Home_Custom_Block_Visible', { value: false })).status()).toBe(200);
			});
		});
	});
});
