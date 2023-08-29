import { expect } from '@playwright/test';

import { Users } from '../fixtures/userStates';
import createTeam from '../locators/createTeam.json';
import home from '../locators/home.json';
import { test } from '../utils/test';

test.use({ storageState: Users.admin.state });
test.describe('Create Teams', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(`/home`);
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

	test.afterEach(async ({ api }) => {
		await api.post(`/api/v1/channels.delete`, {
			teamName: `TeamTestAutomation`,
		});
	});
});
