import { test, expect } from './utils/test';
import { Admin } from './page-objects';

test.use({ storageState: 'admin-session.json' });

test.describe.parallel('administration', () => {
	let poAdmin: Admin;

	test.beforeEach(async ({ page }) => {
		poAdmin = new Admin(page);

		await page.goto('/admin');
	});

	test.describe.only('Info', () => {
		test.beforeEach(async () => {
			await poAdmin.sidenav.linkInfo.click();
		});

		test('expect download info as JSON', async ({ page }) => {
			const [download] = await Promise.all([
				page.waitForEvent('download'),
				page.locator('button:has-text("Download Info")').click(),
			]);

			expect(download.suggestedFilename()).toBe('statistics.json')
		})
	})

	test.describe('Import', () => {})

	test.describe('Users', () => {
		test.beforeEach(async () => {
			await poAdmin.sidenav.linkUsers.click();
		});

		test('expect find "user1" user', async ({ page }) => {
			await poAdmin.inputSearchUsers.type('user1');

			expect(page.locator('table tr[qa-user-id="user1"]')).toBeVisible();
		});
	});

	test.describe('Rooms', () => {
		test.beforeEach(async () => {
			await poAdmin.sidenav.linkRooms.click();
		});

		test('expect find "general" channel', async ({ page }) => {
			await poAdmin.inputSearchRooms.type('general');

			expect(page.locator('table tr[qa-room-id="GENERAL"]')).toBeVisible();
		});
	});

	test.describe('Invites', () => {})

	test.describe('Connectivity Services', () => {})

	test.describe('View Logs', () => {})

	test.describe('Custom Sounds', () => {})

	test.describe('Federation Dashboard', () => {})

	test.describe('Apps', () => {})

	test.describe('Email Inboxes', () => {})

	test.describe('Custom Emoji', () => {})

	test.describe('Integrations', () => {})

	test.describe('OAuth Applications', () => {})

	test.describe('Mailer', () => {})

	test.describe('Custom User Status', () => {})

	test.describe('Permissions', () => {})
});
