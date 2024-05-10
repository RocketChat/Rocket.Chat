import type { Page } from '@playwright/test';

export const doLogin = async ({
	page,
	server,
	storageNamePrefix,
	storeState,
}: {
	page: Page;
	server: {
		username: string;
		password: string;
		url: string;
	};
	storageNamePrefix?: string;
	storeState?: boolean;
}) => {
	await page.goto(`${server.url}/login`);

	await page.locator('role=textbox[name=/username/i]').type(server.username);
	await page.locator('[name=password]').type(server.password);
	await page.locator('role=button[name="Login"]').click();

	await page.waitForTimeout(1000);
	if (storeState) {
		await page.context().storageState({ path: `${storageNamePrefix}-session.json` });
	}
};
