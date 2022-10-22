import { chromium, Page } from '@playwright/test';

import * as constants from './constants';
require('util').inspect.defaultOptions.depth = null;

const doLogin = async (page: Page, server: Record<string, any>, storageNamePrefix: string) => {
	await page.goto(server.url);

	await page.locator('[name=emailOrUsername]').type(server.user);
	await page.locator('[name=pass]').type(server.password);
	await page.locator('.login').click();

	await page.waitForTimeout(1000);
	await page.context().storageState({ path: `${storageNamePrefix}-session.json` });
};

export default async function (): Promise<void> {
	const browser = await chromium.launch();
	const page = await browser.newPage();
	const page2 = await browser.newPage();

	const requiredEnvVars = [
		'RC_SERVER_1',
		'RC_SERVER_2',
		'RC_SERVER_1_USER',
		'RC_SERVER_1_PASSWORD',
		'RC_SERVER_2_USER',
		'RC_SERVER_2_PASSWORD',
	];

	if (requiredEnvVars.some((envVar) => !process.env[envVar])) {
		throw new Error(`Missing required environment variables: ${ requiredEnvVars.filter((envVar) => !process.env[envVar]).join(', ') }`);
	}

	await doLogin(page, constants.RC_SERVER_1, 'server-1');
	await doLogin(page2, constants.RC_SERVER_2, 'server-2');
	
	await browser.close();
}
