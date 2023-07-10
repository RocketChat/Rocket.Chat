import { expect, test } from '@playwright/test';

import createTeam from '../locators/createTeam.json';
import home from '../locators/home.json';
import { deleteTeam } from '../support/teams/team';

test.describe('Create Teams', () => {
	test.use({ storageState: 'playwright/.auth/admin.json' });
	test.beforeEach(async ({ page }) => {
		await page.goto(`${process.env.URL}`);
	});

	test('Create a Team Private', async ({ page }) => {
		await page.locator(home.button.createNew).click();
		await page.getByTestId(home.dropdown.createNew).getByText(home.text.team).click();
		await page.getByPlaceholder(createTeam.placeholder.teamName).fill('TeamTestAutomation');
		await page.getByRole('button', { name: createTeam.button.create }).click();

		expect(await page.getByRole('link', { name: 'TeamTestAutomation' }).isVisible());
	});

	test('Create a Team Public', async ({ page }) => {
		await page.locator(home.button.createNew).click();
		await page.getByTestId(home.dropdown.createNew).getByText(home.text.team).click();
		await page.getByPlaceholder(createTeam.placeholder.teamName).fill('TeamTestAutomation');
		await page.locator(createTeam.toggle.private).first().click();
		await page.getByRole('button', { name: createTeam.button.create }).click();

		expect(await page.getByRole('link', { name: 'TeamTestAutomation' }).isVisible());
	});

	test.afterEach(async ({ page }) => {
		await deleteTeam(page, 'TeamTestAutomation');
	});
});
