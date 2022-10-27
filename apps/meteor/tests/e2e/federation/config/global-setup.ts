import { chromium, Page } from '@playwright/test';

import * as constants from './constants';
require('util').inspect.defaultOptions.depth = null;

export const doLogin = async ({ page, server, storageNamePrefix, storeState }: {
	page: Page,
	server: {
		username: string;
		password: string;
		url: string;
	},
	storageNamePrefix?: string,
	storeState?: boolean,
}) => {
	await page.goto(`${ server.url }/login`);

	await page.locator('[name=emailOrUsername]').type(server.username);
	await page.locator('[name=pass]').type(server.password);
	await page.locator('.login').click();

	await page.waitForTimeout(1000);
	if (storeState) {
		await page.context().storageState({ path: `${ storageNamePrefix }-session.json` });
	}
};

export default async function (): Promise<void> {
	const browser = await chromium.launch();
	const page = await browser.newPage();
	const page2 = await browser.newPage();

	const requiredEnvVars = [
		'RC_SERVER_1',
		'RC_SERVER_2',
		'RC_SERVER_1_ADMIN_USER',
		'RC_SERVER_1_ADMIN_PASSWORD',
		'RC_SERVER_2_ADMIN_USER',
		'RC_SERVER_2_ADMIN_PASSWORD',
	];

	if (requiredEnvVars.some((envVar) => !process.env[envVar])) {
		throw new Error(`Missing required environment variables: ${ requiredEnvVars.filter((envVar) => !process.env[envVar]).join(', ') }`);
	}

	await doLogin({ page, server: constants.RC_SERVER_1, storeState: true, storageNamePrefix: 'admin-server-ee' });
	await doLogin({ page: page2, server: constants.RC_SERVER_2, storeState: true, storageNamePrefix: 'admin-server-ce' });

	await browser.close();
}
