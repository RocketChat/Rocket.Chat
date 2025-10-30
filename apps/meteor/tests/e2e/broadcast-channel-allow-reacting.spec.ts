import { test, expect } from './utils/test';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';

test.use({ storageState: Users.admin.state });

test.describe('broadcast-reacting', () => {
	test.beforeEach(async ({ page }) => {
		new HomeChannel(page);
		await page.goto('/home');
	});

	test('normal channel', async ({ page }) => {
		await page.getByRole('button', { name: 'Create new' }).click();
		await page.getByTestId('dropdown').getByText('Channel').click();
		await page.getByRole('textbox', { name: 'Name' }).fill('normalchannel');
		await page.getByRole('button', { name: 'Advanced settings' }).click();
		await page.getByRole('button', { name: 'Create', exact: true }).click();
		await page.getByRole('button', { name: 'Dismiss alert' }).click();
		await page.getByRole('button', { name: 'Room Information' }).click();
		await page.getByRole('button', { name: 'Edit' }).click();
		await page.getByRole('button', { name: 'Advanced settings' }).click();

		for (let i = 0; i < 8; i++) {
			await page.locator('body').press('ArrowDown');
			await page.waitForTimeout(100);
		}

		const allowReactingToggle = page.getByRole('checkbox', { name: 'Allow Reacting' });
		const isVisible = await allowReactingToggle.isVisible();
		console.log('Normal Channel - Allow Reacting is visible?', isVisible);
		await expect(allowReactingToggle).not.toBeVisible();
	});

	test('read-only channel', async ({ page }) => {
		await page.getByRole('button', { name: 'Create new' }).click();
		await page.getByTestId('dropdown').getByText('Channel').click();
		await page.getByRole('textbox', { name: 'Name' }).fill('readonlychannel');
		await page.getByRole('button', { name: 'Advanced settings' }).click();
		await page.locator('span').filter({ hasText: 'Read-only' }).locator('i').click();
		await page.getByRole('button', { name: 'Create', exact: true }).click();
		await page.getByRole('button', { name: 'Dismiss alert' }).click();
		await page.getByRole('button', { name: 'Room Information' }).click();
		await page.getByRole('button', { name: 'Edit' }).click();
		await page.getByRole('button', { name: 'Advanced settings' }).click();

		for (let i = 0; i < 8; i++) {
			await page.locator('body').press('ArrowDown');
			await page.waitForTimeout(100);
		}

		const allowReactingToggle = page.getByRole('checkbox', { name: 'Allow Reacting' });
		const isVisible = await allowReactingToggle.isVisible();
		console.log('Read-Only Channel - Allow Reacting is visible?', isVisible);
		await expect(allowReactingToggle).toBeVisible();
	});

	test('broadcast channel', async ({ page }) => {
		await page.getByRole('button', { name: 'Create new' }).click();
		await page.getByTestId('dropdown').getByText('Channel').click();
		await page.getByRole('textbox', { name: 'Name' }).fill('broadcastchannel');
		await page.getByRole('button', { name: 'Advanced settings' }).click();
		await page.locator('span').filter({ hasText: 'Broadcast' }).locator('i').click();
		await page.getByRole('button', { name: 'Create', exact: true }).click();
		await page.getByRole('button', { name: 'Dismiss alert' }).click();
		await page.getByRole('button', { name: 'Room Information' }).click();
		await page.getByRole('button', { name: 'Edit' }).click();
		await page.getByRole('button', { name: 'Advanced settings' }).click();

		for (let i = 0; i < 8; i++) {
			await page.locator('body').press('ArrowDown');
			await page.waitForTimeout(100);
		}

		const allowReactingToggle = page.getByRole('checkbox', { name: 'Allow Reacting' });
		const isVisible = await allowReactingToggle.isVisible();
		console.log('Broadcast Channel - Allow Reacting is visible?', isVisible);
		await expect(allowReactingToggle).not.toBeVisible();
	});
});
