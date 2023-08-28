import type { Page } from '@playwright/test';

import loginPage from '../../locators/loginPage.json';

export async function login(page: Page) {
	await page.goto(`${process.env.URL}`);
	await page.getByPlaceholder(loginPage.fields.email).fill(`${process.env.USER_ADMIN}`);
	await page.getByLabel(loginPage.fields.password).fill(`${process.env.PASSWORD_ADMIN}`);
	await page.getByRole('button', { name: loginPage.button.login }).first().click();
}
