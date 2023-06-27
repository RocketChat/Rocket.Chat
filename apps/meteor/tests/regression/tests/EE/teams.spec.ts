import { test, expect } from '@playwright/test';
import { login } from '../support/users/user';
import { deleteTeam } from '../support/teams/team';
import home from '../locators/home.json'
import createTeam from '../locators/createTeam.json';
test.describe('Create Teams', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Create a Team Private', async ({ page }) => {
    await page.locator(home.button.createNew).click();
    await page
      .getByTestId(home.dropdown.createNew)
      .getByText(home.text.team)
      .click();
    await page
      .getByPlaceholder(createTeam.placeholder.teamName)
      .fill('TeamTestAutomation');
    await page.getByRole('button', { name: createTeam.button.create }).click();

    expect(
      await page.getByRole('link', { name: 'TeamTestAutomation' }).isVisible()
    );
  });

  test('Create a Team Public', async ({ page }) => {
    await page.locator(home.button.createNew).click();
    await page
      .getByTestId(home.dropdown.createNew)
      .getByText(home.text.team)
      .click();
    await page
      .getByPlaceholder(createTeam.placeholder.teamName)
      .fill('TeamTestAutomation');
    await page.locator(createTeam.toggle.private).first().click();
    await page.getByRole('button', { name: createTeam.button.create }).click();

    expect(
      await page.getByRole('link', { name: 'TeamTestAutomation' }).isVisible()
    );
  });

  test.afterEach(async ({ page }) => {
    await deleteTeam(page, 'TeamTestAutomation');
  });
});
