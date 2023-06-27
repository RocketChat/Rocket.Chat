import { Page } from '@playwright/test';

export async function deleteTeam(page: Page, teamName: string) {
  await page.getByRole('link', { name: `${teamName}` }).click();
  await page.getByRole('button', { name: 'Team Information' }).click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Remove' }).click();
}
