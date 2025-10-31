import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe('broadcast-reacting', () => {
	let homeChannel: HomeChannel;
	
	test.beforeEach(async ({ page }) => {
		homeChannel = new HomeChannel(page);
		await page.goto('/home');
	});

	test('normal channel test', async ({ page }) => {
		await page.getByRole('button', { name: 'Create new' }).click();
		await page.getByTestId('dropdown').getByText('Channel').click();
		await page.getByRole('textbox', { name: 'Name' }).fill('normalchannel');
		await page.getByRole('button', { name: 'Advanced settings' }).click();
		await page.getByRole('button', { name: 'Create', exact: true }).click();
		await page.getByRole('button', { name: 'Dismiss alert' }).click();
		await page.getByRole('button', { name: 'Room Information' }).click();
		await page.getByRole('button', { name: 'Edit' }).click();
		await homeChannel.sidenav.advancedSettingsAccordion.click();

		/* eslint-disable no-await-in-loop */
		for (let i = 0; i < 8; i++) {
			await page.locator('body').press('ArrowDown');
			await page.waitForTimeout(100);
		}
		/* eslint-enable no-await-in-loop */

		const allowReactingToggle = page.getByRole('checkbox', { name: 'Allow Reacting' });
		await expect(allowReactingToggle).not.toBeVisible();
	});

	test('read-only channel', async ({ page }) => {
		await page.getByRole('button', { name: 'Create new' }).click();
		await page.getByTestId('dropdown').getByText('Channel').click();
		await page.getByRole('textbox', { name: 'Name' }).fill('readonlychannel');
		await homeChannel.sidenav.advancedSettingsAccordion.click();
		await page.locator('span').filter({ hasText: 'Read-only' }).locator('i').click();
		await page.getByRole('button', { name: 'Create', exact: true }).click();
		await page.getByRole('button', { name: 'Dismiss alert' }).click();
		await page.getByRole('button', { name: 'Room Information' }).click();
		await page.getByRole('button', { name: 'Edit' }).click();
		await homeChannel.sidenav.advancedSettingsAccordion.click();

		/* eslint-disable no-await-in-loop */
		for (let i = 0; i < 8; i++) {
			await page.locator('body').press('ArrowDown');
			await page.waitForTimeout(100);
		}
		/* eslint-enable no-await-in-loop */

		const allowReactingToggle = page.getByRole('checkbox', { name: 'Allow Reacting' });
		await expect(allowReactingToggle).toBeVisible();
	});

	test('broadcast channel', async ({ page }) => {
		await page.getByRole('button', { name: 'Create new' }).click();
		await page.getByTestId('dropdown').getByText('Channel').click();
		await page.getByRole('textbox', { name: 'Name' }).fill('broadcastchannel');
		await homeChannel.sidenav.advancedSettingsAccordion.click();
		await page.locator('span').filter({ hasText: 'Broadcast' }).locator('i').click();
		await page.getByRole('button', { name: 'Create', exact: true }).click();
		await page.getByRole('button', { name: 'Dismiss alert' }).click();
		await page.getByRole('button', { name: 'Room Information' }).click();
		await page.getByRole('button', { name: 'Edit' }).click();
		await homeChannel.sidenav.advancedSettingsAccordion.click();

		/* eslint-disable no-await-in-loop */
		for (let i = 0; i < 8; i++) {
			await page.locator('body').press('ArrowDown');
			await page.waitForTimeout(100);
		}
		/* eslint-enable no-await-in-loop */

		const allowReactingToggle = page.getByRole('checkbox', { name: 'Allow Reacting' });
		await expect(allowReactingToggle).not.toBeVisible();
	});
});
